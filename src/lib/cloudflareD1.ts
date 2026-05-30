import { fetchWithOptionalTlsBypass } from "@/lib/node-insecure-fetch";

function isPlaceholder(value?: string | null) {
  if (!value) return true;
  const v = value.trim();
  if (!v) return true;
  if (/^your-/i.test(v)) return true;
  if (v.toLowerCase() === "placeholder" || v.toLowerCase() === "changeme") return true;
  return false;
}

/** Try multiple env keys; skip empty/placeholder values (e.g. CF_API_TOKEN=your-...) */
function pickEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value && !isPlaceholder(value)) return value;
  }
  return "";
}

function getD1RestConfig() {
  const accountId = pickEnv("CLOUDFLARE_ACCOUNT_ID", "CF_ACCOUNT_ID");
  const databaseId = pickEnv("CLOUDFLARE_D1_DATABASE_ID", "CF_D1_DATABASE_ID");
  const apiToken = pickEnv("CLOUDFLARE_API_TOKEN", "CF_API_TOKEN");

  const queryUrl =
    accountId && databaseId
      ? `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`
      : "";

  return { queryUrl, apiToken };
}

export function hasCloudflareD1Rest() {
  const { queryUrl, apiToken } = getD1RestConfig();
  return Boolean(queryUrl && apiToken);
}

export { isPlaceholder };

type D1RestPayload = {
  success?: boolean;
  result?: Array<{
    results?: unknown[];
    meta?: { last_row_id?: number; changes?: number };
  }>;
  errors?: Array<{ message?: string }>;
  error?: string;
};

async function cloudflareD1Request(body: Record<string, unknown>) {
  const { queryUrl, apiToken } = getD1RestConfig();
  if (!queryUrl || !apiToken) {
    throw new Error("Cloudflare D1 REST is not configured.");
  }

  const response = await fetchWithOptionalTlsBypass(
    queryUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(body),
    },
    "D1_TLS_INSECURE"
  );

  const payload = (await response.json()) as D1RestPayload;
  if (!response.ok || payload?.success !== true) {
    const errorMessage =
      payload?.errors?.[0]?.message ||
      payload?.error ||
      `Cloudflare D1 request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return payload;
}

export async function runD1Query(sql: string, params: unknown[] = []) {
  return cloudflareD1Request({ sql, params });
}

export function parseD1Rows<T extends Record<string, unknown> = Record<string, unknown>>(
  payload: D1RestPayload
): T[] {
  const batch = payload.result?.[0];
  return (batch?.results ?? []) as T[];
}

export function parseD1LastRowId(payload: D1RestPayload): number | null {
  const id = payload.result?.[0]?.meta?.last_row_id;
  return typeof id === "number" ? id : null;
}

export function parseD1Scalar(payload: D1RestPayload, field: string): number {
  const rows = parseD1Rows<Record<string, unknown>>(payload);
  return Number(rows[0]?.[field] ?? 0);
}
