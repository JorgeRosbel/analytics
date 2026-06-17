CREATE TABLE sites (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),  
  domain      TEXT NOT NULL UNIQUE,                   
  name        TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id     INTEGER NOT NULL REFERENCES sites(id),   
  path        TEXT NOT NULL,
  referrer    TEXT,
  country     TEXT,
  user_agent  TEXT,
  ts          INTEGER NOT NULL
);

CREATE INDEX idx_events_site_ts ON events(site_id, ts);