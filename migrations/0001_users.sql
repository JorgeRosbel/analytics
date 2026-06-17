create table users(
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    email          TEXT NOT NUll UNIQUE,
    password_hash  TEXT NOT NULL,
    salt           TEXT NOT NULL,
    created_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);