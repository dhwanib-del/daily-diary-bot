-- Run on the DEDICATED diary Supabase project AFTER deployment to Vercel.
-- Enable pg_net, pg_cron, and Supabase Vault via your project's integrations.
-- Replace the placeholders below, then execute each statement in Supabase SQL Editor.
-- Never commit real CRON_SECRET values.

-- select vault.create_secret('https://YOUR-VERCEL-APP.vercel.app/api/cron/diary','diary_cron_url');
-- select vault.create_secret('YOUR_LONG_RANDOM_CRON_SECRET','diary_cron_secret');

-- When both Vault secrets are stored, uncomment and execute:
/*
select cron.schedule('daily-diary-dispatch-every-15m','*/15 * * * *',$$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='diary_cron_url'),
    headers := jsonb_build_object('Content-Type','application/json',
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='diary_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
$$);
*/
-- Cron is every 15 minutes in UTC; the app converts to each participant's local time.
-- To stop scheduled requests: select cron.unschedule('daily-diary-dispatch-every-15m');
