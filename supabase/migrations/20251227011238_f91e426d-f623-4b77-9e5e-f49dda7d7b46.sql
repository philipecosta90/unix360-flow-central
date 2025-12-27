-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Agendar execução a cada 15 minutos
SELECT cron.schedule(
  'process-scheduled-checkins',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hfqzbljiwkrksmjyfdiy.supabase.co/functions/v1/process-scheduled-checkins',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmcXpibGppd2tya3NtanlmZGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzk5MDIsImV4cCI6MjA2NTc1NTkwMn0.7DpOfZVyLTSkuJ_ujXoFDdpz76cAKgEjoVyUwdp4jUw"}'::jsonb,
    body := concat('{"scheduled_at": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);