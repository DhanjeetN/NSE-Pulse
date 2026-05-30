CREATE TABLE IF NOT EXISTS active_users (
  id TEXT PRIMARY KEY,
  last_seen_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
