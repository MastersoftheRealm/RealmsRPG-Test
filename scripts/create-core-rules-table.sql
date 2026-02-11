-- Create core_rules table in codex schema
CREATE TABLE IF NOT EXISTS codex.core_rules (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE codex.core_rules ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'core_rules' AND policyname = 'Anyone can read core rules'
  ) THEN
    CREATE POLICY "Anyone can read core rules"
    ON codex.core_rules FOR SELECT
    TO public
    USING (true);
  END IF;
END
$$;
