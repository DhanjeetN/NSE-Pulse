/**
 * Quick NSE connectivity test (uses .env via --env-file)
 * Run: node --env-file=.env scripts/test-nse-fetch.mjs
 */
import { Agent, fetch as undiciFetch } from "undici";

const insecure = process.env.NSE_TLS_INSECURE === "1";
const dispatcher = insecure
  ? new Agent({ connect: { rejectUnauthorized: false } })
  : undefined;

async function nseFetch(url, init = {}) {
  if (dispatcher) {
    return undiciFetch(url, { ...init, dispatcher });
  }
  return fetch(url, init);
}

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Referer: "https://www.nseindia.com/",
};

const home = await nseFetch("https://www.nseindia.com/", { headers });
const cookies = home.headers.getSetCookie?.() ?? [];
const cookie = cookies.map((c) => c.split(";")[0]).join("; ");
console.log("home status:", home.status, "cookies:", cookie ? "yes" : "no");

const apiUrl = "https://www.nseindia.com/api/live-analysis-oi-spurts-underlyings";
const api = await nseFetch(apiUrl, {
  headers: { ...headers, ...(cookie ? { Cookie: cookie } : {}) },
});
console.log("api status:", api.status, "content-type:", api.headers.get("content-type"));
const body = await api.text();
console.log(body.slice(0, 300));
