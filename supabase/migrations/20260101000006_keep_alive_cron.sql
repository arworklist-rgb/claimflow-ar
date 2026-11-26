-- Enable pg_cron and pg_net extensions (Supabase Dashboard -> Database -> Extensions)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule daily at 12:00 AM UTC ('0 0 * * *')
-- Note: For 12:00 AM IST (UTC+5:30), use '30 18 * * *'
select cron.schedule(
  'claimflow-keep-alive-daily',
  '0 0 * * *',
  $$
  select net.http_post(
    url := 'https://iqgufoovwkibzgqcawqv.supabase.co/functions/v1/keep-alive',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'cfar_keepalive_9f3c7a1d8e2b4a60'
    ),
    body := '{}'::jsonb
  );
  $$
);
