-- cLog Blog D1 Database Schema

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tags (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  slug       TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  excerpt    TEXT DEFAULT '',
  category   TEXT REFERENCES categories(slug),
  status     TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_slug TEXT NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
  tag_slug  TEXT NOT NULL REFERENCES tags(slug) ON DELETE CASCADE,
  PRIMARY KEY (post_slug, tag_slug)
);

CREATE TABLE IF NOT EXISTS pages (
  slug       TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comments (
  id         TEXT PRIMARY KEY,
  post_slug  TEXT NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
  author     TEXT NOT NULL,
  email      TEXT DEFAULT '',
  body       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','spam')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS media (
  id           TEXT PRIMARY KEY,
  filename     TEXT NOT NULL,
  key          TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size         INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL
);

-- 滑动窗口限流计数 (登录失败 / 访客评论)
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);

-- 文章/页面版本历史 (仅在发布状态变更时生成快照)
CREATE TABLE IF NOT EXISTS revisions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,           -- 'post' | 'page'
  entity_slug TEXT NOT NULL,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  excerpt     TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'draft',
  note        TEXT NOT NULL DEFAULT '', -- 版本说明 (发布/编辑/恢复)
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_slug);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag_slug);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_revisions_entity ON revisions(entity_type, entity_slug, id DESC);
