-- Setup pg_cron for heartbeat execution
-- This migration creates a cron job that calls the heartbeat API every 6 hours

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create a function to call the heartbeat API
CREATE OR REPLACE FUNCTION call_heartbeat_api()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_url TEXT;
  cron_secret TEXT;
  response TEXT;
BEGIN
  -- Get configuration from environment or settings table
  -- You need to replace these with your actual values
  api_url := current_setting('app.heartbeat_api_url', true);
  cron_secret := current_setting('app.cron_secret', true);

  -- If settings are not configured, use defaults
  IF api_url IS NULL THEN
    api_url := 'https://your-domain.com/api/cron/heartbeat';
  END IF;

  IF cron_secret IS NULL THEN
    RAISE EXCEPTION 'CRON_SECRET not configured';
  END IF;

  -- Call the API using http extension
  -- Note: You need to enable pg_net or http extension in Supabase
  SELECT content INTO response
  FROM http((
    'POST',
    api_url,
    ARRAY[http_header('Authorization', 'Bearer ' || cron_secret)],
    'application/json',
    '{}'
  )::http_request);

  -- Log the result
  RAISE NOTICE 'Heartbeat API called: %', response;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to call heartbeat API: %', SQLERRM;
END;
$$;

-- Schedule the cron job to run every 6 hours
-- This will execute at: 00:00, 06:00, 12:00, 18:00 UTC
SELECT cron.schedule(
  'heartbeat-execution',           -- Job name
  '0 */6 * * *',                   -- Cron expression: every 6 hours
  $$SELECT call_heartbeat_api()$$  -- SQL command to execute
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- To manually trigger the heartbeat (for testing):
-- SELECT call_heartbeat_api();

-- To unschedule the job (if needed):
-- SELECT cron.unschedule('heartbeat-execution');

-- To view job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
