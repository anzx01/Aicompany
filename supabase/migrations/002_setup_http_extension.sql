-- Setup HTTP extension for making API calls from PostgreSQL
-- This is required for pg_cron to call the heartbeat API

-- Enable pg_net extension (Supabase's async HTTP client)
-- This is preferred over http extension as it's async and more reliable
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Alternative: Use http extension (synchronous)
-- CREATE EXTENSION IF NOT EXISTS http;

-- Grant permissions
GRANT USAGE ON SCHEMA net TO postgres;

-- Create an improved function using pg_net
CREATE OR REPLACE FUNCTION call_heartbeat_api_async()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_url TEXT;
  cron_secret TEXT;
  request_id BIGINT;
BEGIN
  -- Get configuration
  api_url := current_setting('app.heartbeat_api_url', true);
  cron_secret := current_setting('app.cron_secret', true);

  -- Use defaults if not configured
  IF api_url IS NULL THEN
    api_url := 'https://your-domain.com/api/cron/heartbeat';
  END IF;

  IF cron_secret IS NULL THEN
    RAISE EXCEPTION 'CRON_SECRET not configured';
  END IF;

  -- Make async HTTP request using pg_net
  SELECT net.http_post(
    url := api_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  RAISE NOTICE 'Heartbeat API request sent with ID: %', request_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to call heartbeat API: %', SQLERRM;
END;
$$;

-- Update the cron job to use the async function
SELECT cron.unschedule('heartbeat-execution');

SELECT cron.schedule(
  'heartbeat-execution',
  '0 */6 * * *',
  $$SELECT call_heartbeat_api_async()$$
);

-- View the updated job
SELECT * FROM cron.job WHERE jobname = 'heartbeat-execution';
