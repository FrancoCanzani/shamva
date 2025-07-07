-- Create heartbeats table with better design
CREATE TABLE IF NOT EXISTS "public"."heartbeats" (
    "id" TEXT PRIMARY KEY,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "expected_lapse_ms" INTEGER NOT NULL CHECK (expected_lapse_ms >= 1000),
    "grace_period_ms" INTEGER NOT NULL CHECK (grace_period_ms >= 0),
    "status" TEXT DEFAULT 'active',
    "last_beat_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Create function to get heartbeats that have exceeded their grace period
CREATE OR REPLACE FUNCTION "public"."get_timed_out_heartbeats"() 
RETURNS SETOF "public"."heartbeats"
LANGUAGE "sql"
AS $$
  SELECT h.*
  FROM heartbeats h
  WHERE h.status = 'active'
    AND h.last_beat_at IS NOT NULL
    AND h.last_beat_at < NOW() - (h.expected_lapse_ms + h.grace_period_ms) * INTERVAL '1 millisecond';
$$;

-- Grant permissions
ALTER TABLE "public"."heartbeats" OWNER TO "postgres";
ALTER FUNCTION "public"."get_timed_out_heartbeats"() OWNER TO "postgres"; 