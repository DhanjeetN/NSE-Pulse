import { Agent } from "undici";

const NSE_BASE_URL = "https://www.nseindia.com";

const defaultHeaders: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nseindia.com/",
  Origin: "https://www.nseindia.com",
};

function isTlsInsecureEnabled() {
  return (
    process.env.NSE_TLS_INSECURE === "1" ||
    process.env.D1_TLS_INSECURE === "1" ||
    process.env.TLS_INSECURE === "1"
  );
}

const nseDispatcher = isTlsInsecureEnabled()
  ? new Agent({ connect: { rejectUnauthorized: false } })
  : undefined;

type NseFetchInit = RequestInit & { dispatcher?: unknown };

function nseFetch(url: string, init: NseFetchInit = {}) {
  return fetch(url, {
    ...init,
    cache: "no-store",
    // @ts-expect-error undici dispatcher for corporate TLS bypass
    dispatcher: nseDispatcher,
  });
}

let cachedCookies: string | null = null;
let lastCookieFetchTime = 0;
const COOKIE_CACHE_MS = 3 * 60 * 1000;

function parseSetCookieHeaders(response: Response): string[] {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const cookies: string[] = [];
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      cookies.push(value);
    }
  });
  return cookies;
}

export async function getNSECookies(): Promise<string> {
  const now = Date.now();
  if (cachedCookies && now - lastCookieFetchTime < COOKIE_CACHE_MS) {
    return cachedCookies;
  }

  const response = await nseFetch(NSE_BASE_URL, { headers: defaultHeaders });

  const cookieHeaders = parseSetCookieHeaders(response);
  if (cookieHeaders.length > 0) {
    cachedCookies = cookieHeaders.map((cookie) => cookie.split(";")[0]).join("; ");
    lastCookieFetchTime = now;
    return cachedCookies;
  }

  return cachedCookies ?? "";
}

export async function fetchFromNSE(path: string, searchParams?: string) {
  const cookies = await getNSECookies();
  const apiUrl = `${NSE_BASE_URL}/api/${path}${searchParams ? `?${searchParams}` : ""}`;

  const response = await nseFetch(apiUrl, {
    headers: {
      ...defaultHeaders,
      ...(cookies ? { Cookie: cookies } : {}),
    },
  });

  if (response.status === 401 || response.status === 403) {
    cachedCookies = null;
    lastCookieFetchTime = 0;
    const retryCookies = await getNSECookies();
    const retryResponse = await nseFetch(apiUrl, {
      headers: {
        ...defaultHeaders,
        ...(retryCookies ? { Cookie: retryCookies } : {}),
      },
    });
    return retryResponse;
  }

  return response;
}
