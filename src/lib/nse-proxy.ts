import { fetchWithOptionalTlsBypass } from "@/lib/node-insecure-fetch";

const NSE_BASE_URL = "https://www.nseindia.com";

const defaultHeaders: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nseindia.com/market-data/live-equity-market",
  Origin: "https://www.nseindia.com",
};

function nseFetch(url: string, init: RequestInit = {}) {
  return fetchWithOptionalTlsBypass(
    url,
    {
      ...init,
      cache: "no-store",
      headers: {
        ...defaultHeaders,
        ...(init.headers as Record<string, string> | undefined),
      },
    },
    "NSE_TLS_INSECURE"
  );
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

function cookiesFromResponse(response: Response): string {
  const cookieHeaders = parseSetCookieHeaders(response);
  if (cookieHeaders.length === 0) return "";
  return cookieHeaders.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function refreshNSECookies(): Promise<string> {
  const landing = await nseFetch(`${NSE_BASE_URL}/`, { method: "GET" });
  let combined = cookiesFromResponse(landing);

  if (!combined) {
    const market = await nseFetch(`${NSE_BASE_URL}/market-data/live-equity-market`, {
      method: "GET",
    });
    combined = cookiesFromResponse(market);
  }

  if (combined) {
    cachedCookies = combined;
    lastCookieFetchTime = Date.now();
  }

  return cachedCookies ?? "";
}

export async function getNSECookies(): Promise<string> {
  const now = Date.now();
  if (cachedCookies && now - lastCookieFetchTime < COOKIE_CACHE_MS) {
    return cachedCookies;
  }

  return refreshNSECookies();
}

export async function fetchFromNSE(path: string, searchParams?: string) {
  const cookies = await getNSECookies();
  const apiUrl = `${NSE_BASE_URL}/api/${path}${searchParams ? `?${searchParams}` : ""}`;

  const response = await nseFetch(apiUrl, {
    headers: cookies ? { Cookie: cookies } : {},
  });

  if (response.status === 401 || response.status === 403) {
    cachedCookies = null;
    lastCookieFetchTime = 0;
    const retryCookies = await refreshNSECookies();
    return nseFetch(apiUrl, {
      headers: retryCookies ? { Cookie: retryCookies } : {},
    });
  }

  return response;
}
