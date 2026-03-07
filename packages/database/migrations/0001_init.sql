CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('player', 'developer', 'moderator', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE game_visibility AS ENUM ('draft', 'public', 'unlisted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE game_status AS ENUM ('draft', 'active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE review_state AS ENUM ('draft', 'pending_review', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE publish_state AS ENUM ('unpublished', 'published', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE validation_status AS ENUM ('pending', 'passed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE smoke_test_status AS ENUM ('pending', 'passed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'player',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(120) NOT NULL,
  bio TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(120) NOT NULL,
  short_description VARCHAR(250) NOT NULL,
  description TEXT NOT NULL,
  genre VARCHAR(80) NOT NULL,
  visibility game_visibility NOT NULL DEFAULT 'draft',
  status game_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  version VARCHAR(64) NOT NULL,
  manifest_json JSONB NOT NULL,
  sdk_version VARCHAR(40) NOT NULL,
  runtime_version_range VARCHAR(80) NOT NULL,
  artifact_storage_key TEXT,
  artifact_hash VARCHAR(128),
  review_state review_state NOT NULL DEFAULT 'draft',
  publish_state publish_state NOT NULL DEFAULT 'unpublished',
  validation_status validation_status NOT NULL DEFAULT 'pending',
  smoke_test_status smoke_test_status NOT NULL DEFAULT 'pending',
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_version_id UUID NOT NULL REFERENCES game_versions(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
  source_archive_storage_key TEXT NOT NULL,
  validation_report_json JSONB,
  smoke_test_report_json JSONB,
  moderation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS play_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_version_id UUID NOT NULL REFERENCES game_versions(id) ON DELETE CASCADE,
  player_user_id UUID REFERENCES users(id),
  runtime_version VARCHAR(32) NOT NULL,
  session_token_hash TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  exit_reason VARCHAR(80),
  telemetry_summary_json JSONB
);

CREATE TABLE IF NOT EXISTS save_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  game_version_id UUID NOT NULL REFERENCES game_versions(id) ON DELETE CASCADE,
  slot_key VARCHAR(64) NOT NULL,
  state_json JSONB NOT NULL,
  state_size_bytes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS score_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  game_version_id UUID NOT NULL REFERENCES game_versions(id) ON DELETE CASCADE,
  player_user_id UUID REFERENCES users(id),
  score BIGINT NOT NULL,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS abuse_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES users(id),
  target_type VARCHAR(40) NOT NULL,
  target_id UUID NOT NULL,
  reason VARCHAR(120) NOT NULL,
  details TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
