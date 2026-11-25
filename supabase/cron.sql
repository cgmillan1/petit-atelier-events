-- Runs the reminder function every day at 8:05 am Utah time (15:05 UTC in winter, adjust in summer if you like).
-- Enable the pg_cron and pg_net extensions first (Database > Extensions). Replace YOUR-PROJECT and YOUR-CRON-SECRET.
select cron.schedule('petit-daily-reminders', '5 15 * * *', $$
  select net.http_post(
    url := 'https://YOUR-PROJECT.supabase.co/functions/v1/daily-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'YOUR-CRON-SECRET'),
    body := '{}'::jsonb
  );
$$);
