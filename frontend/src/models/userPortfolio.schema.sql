-- CUTThecarbon — example relational schema for portfolio / gamification (Postgres-style).
-- Sync with frontend types in `userPortfolio.types.js`.

CREATE TABLE app_user (
  id              UUID PRIMARY KEY,
  display_name    TEXT NOT NULL,
  email           TEXT UNIQUE,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_xp        INT NOT NULL DEFAULT 0,
  level           SMALLINT NOT NULL DEFAULT 1,
  achievement_stars JSONB NOT NULL DEFAULT '{}', -- { "first_footprint": 2, ... }
  badges_earned   JSONB NOT NULL DEFAULT '[]',   -- ["pledge","hub_explorer", ...]
  gamify_updated_at TIMESTAMPTZ,
  max_streak_days INT NOT NULL DEFAULT 0,
  annual_kg_co2e  DOUBLE PRECISION,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE streak_record (
  id           UUID PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
  kind         TEXT NOT NULL, -- 'daily_visit' | 'weekly_activity'
  current_days INT NOT NULL DEFAULT 0,
  longest_days INT NOT NULL DEFAULT 0,
  last_event_at DATE,
  UNIQUE (user_id, kind)
);

CREATE TABLE achievement (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL,
  icon        TEXT,
  badge_id    TEXT
);

CREATE TABLE achievement_star_tier (
  achievement_id TEXT NOT NULL REFERENCES achievement (id) ON DELETE CASCADE,
  star_index     SMALLINT NOT NULL CHECK (star_index BETWEEN 1 AND 3),
  criteria_text  TEXT NOT NULL,
  xp_reward      INT NOT NULL,
  PRIMARY KEY (achievement_id, star_index)
);

CREATE TABLE user_achievement_progress (
  user_id         UUID NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
  achievement_id  TEXT NOT NULL REFERENCES achievement (id) ON DELETE CASCADE,
  stars_unlocked  SMALLINT NOT NULL DEFAULT 0 CHECK (stars_unlocked BETWEEN 0 AND 3),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE weekly_challenge (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT,
  co2_hint       TEXT,
  base_xp        INT NOT NULL
);

CREATE TABLE user_weekly_challenge (
  user_id       UUID NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
  iso_week      TEXT NOT NULL,
  challenge_id  TEXT NOT NULL REFERENCES weekly_challenge (id),
  slot_index    SMALLINT NOT NULL,
  completed_at  TIMESTAMPTZ,
  xp_awarded    INT,
  PRIMARY KEY (user_id, iso_week, slot_index)
);

CREATE TABLE badge (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  icon        TEXT,
  description TEXT,
  badge_type  TEXT NOT NULL
);

CREATE TABLE user_badge (
  user_id    UUID NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL REFERENCES badge (id),
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  source     TEXT,
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE leaderboard_entry (
  user_id       UUID PRIMARY KEY REFERENCES app_user (id) ON DELETE CASCADE,
  annual_kg     DOUBLE PRECISION NOT NULL,
  total_xp      INT NOT NULL DEFAULT 0,
  rank_footprint INT,
  rank_xp        INT,
  synced_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE xp_log (
  id         UUID PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
  delta_xp   INT NOT NULL,
  reason     TEXT NOT NULL,
  ref_type   TEXT,
  ref_id     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_xp_log_user ON xp_log (user_id, created_at DESC);
