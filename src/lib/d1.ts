import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  hasCloudflareD1Rest,
  parseD1Rows,
  parseD1Scalar,
  runD1Query,
} from "@/lib/cloudflareD1";

export type ContactSubmission = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export async function getD1Binding(): Promise<D1Database | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = (env as CloudflareEnv).DB;
    return db ?? null;
  } catch {
    return null;
  }
}

export async function isD1Configured(): Promise<boolean> {
  return hasCloudflareD1Rest() || Boolean(await getD1Binding());
}

/**
 * Prefer remote D1 REST so data appears in the Cloudflare dashboard.
 * Worker binding (local in dev, remote in production) is the fallback.
 */
export async function saveContactSubmission(contact: ContactSubmission) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const sql =
    "INSERT INTO contact_submissions (id, name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)";
  const params = [id, contact.name, contact.email, contact.subject, contact.message, now];

  if (hasCloudflareD1Rest()) {
    await runD1Query(sql, params);
    return { id };
  }

  const db = await getD1Binding();
  if (db) {
    await db.prepare(sql).bind(...params).run();
    return { id };
  }

  throw new Error(
    "Cloudflare D1 is not configured. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN in .env"
  );
}

export async function listContactSubmissions(limit = 1000) {
  const sql =
    "SELECT id, name, email, subject, message, created_at FROM contact_submissions ORDER BY created_at DESC LIMIT ?";

  if (hasCloudflareD1Rest()) {
    const payload = await runD1Query(sql, [limit]);
    return parseD1Rows(payload);
  }

  const db = await getD1Binding();
  if (db) {
    const result = await db
      .prepare(sql)
      .bind(limit)
      .all<{
        id: string;
        name: string;
        email: string;
        subject: string;
        message: string;
        created_at: number;
      }>();

    return result.results ?? [];
  }

  return null;
}

export async function recordHeartbeat(visitorId: string) {
  const now = Date.now();
  const cutoff = now - 60_000;

  // Remote REST: same DB as Cloudflare dashboard (required in local dev).
  if (hasCloudflareD1Rest()) {
    await runD1Query(
      "INSERT INTO active_users (id, last_seen_at) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET last_seen_at = excluded.last_seen_at",
      [visitorId, now]
    );

    await runD1Query("DELETE FROM active_users WHERE last_seen_at <= ?", [cutoff]);

    const countPayload = await runD1Query(
      "SELECT COUNT(*) AS count FROM active_users WHERE last_seen_at > ?",
      [cutoff]
    );

    return parseD1Scalar(countPayload, "count");
  }

  const db = await getD1Binding();
  if (db) {
    await db
      .prepare(
        "INSERT INTO active_users (id, last_seen_at) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET last_seen_at = excluded.last_seen_at"
      )
      .bind(visitorId, now)
      .run();

    await db.prepare("DELETE FROM active_users WHERE last_seen_at <= ?").bind(cutoff).run();

    const countRow = await db
      .prepare("SELECT COUNT(*) AS count FROM active_users WHERE last_seen_at > ?")
      .bind(cutoff)
      .first<{ count: number }>();

    return countRow?.count ?? 0;
  }

  return null;
}
