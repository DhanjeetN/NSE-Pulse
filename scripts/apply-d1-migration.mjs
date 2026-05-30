/**
 * Apply migrations/0001_init.sql to remote D1 via REST API.
 * Use when `wrangler d1 execute --remote` fails due to corporate proxy / SSL.
 *
 * Usage:
 *   node --env-file=.env scripts/apply-d1-migration.mjs
 *   node --env-file=.env scripts/apply-d1-migration.mjs --insecure
 *
 * Preferred (secure): set your corporate root CA before running:
 *   $env:NODE_EXTRA_CA_CERTS = "C:\path\to\corporate-root-ca.pem"
 *   node --env-file=.env scripts/apply-d1-migration.mjs
 *
 * Or use Windows system certificate store (Node 22+):
 *   node --use-system-ca --env-file=.env scripts/apply-d1-migration.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const insecure = process.argv.includes("--insecure");
if (insecure) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.warn("⚠️  TLS verification disabled (--insecure). Use only on trusted networks.");
}

function pickEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value && !/^your-/i.test(value)) return value;
  }
  return "";
}

const accountId = pickEnv("CLOUDFLARE_ACCOUNT_ID", "CF_ACCOUNT_ID");
const databaseId = pickEnv("CLOUDFLARE_D1_DATABASE_ID", "CF_D1_DATABASE_ID");
const apiToken = pickEnv("CLOUDFLARE_API_TOKEN", "CF_API_TOKEN");

if (!accountId || !databaseId || !apiToken) {
  console.error(
    "Missing D1 credentials. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN in .env"
  );
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.join(__dirname, "..", "migrations", "0001_init.sql");
const sqlFile = fs.readFileSync(migrationPath, "utf8");

const statements = sqlFile
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

async function runStatement(sql) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ sql }),
  });

  const payload = await response.json();
  if (!response.ok || payload?.success !== true) {
    const message =
      payload?.errors?.[0]?.message ||
      payload?.error ||
      `HTTP ${response.status}: ${JSON.stringify(payload)}`;
    throw new Error(message);
  }

  return payload;
}

console.log(`Applying ${statements.length} statement(s) to remote D1 (${databaseId})...`);

for (let i = 0; i < statements.length; i++) {
  const sql = statements[i];
  const preview = sql.replace(/\s+/g, " ").slice(0, 80);
  console.log(`\n[${i + 1}/${statements.length}] ${preview}...`);
  const result = await runStatement(sql);
  const meta = result?.result?.[0]?.meta;
  console.log("   OK", meta ? `(changes: ${meta.changes ?? 0})` : "");
}

console.log("\n✅ Remote D1 migration applied successfully.");
