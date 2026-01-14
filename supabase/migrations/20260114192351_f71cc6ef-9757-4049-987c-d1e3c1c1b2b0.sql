-- Remover o cron job existente
SELECT cron.unschedule('process-scheduled-checkins');

-- Criar novo cron job executando a cada minuto para maior precisão
SELECT cron.schedule(
  'process-scheduled-checkins',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hfqzbljiwkrksmjyfdiy.supabase.co/functions/v1/process-scheduled-checkins',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmcXpibGppd2tya3NtanlmZGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNzk5MDIsImV4cCI6MjA2NTc1NTkwMn0.7DpOfZVyLTSkuJ_ujXoFDdpz76cAKgEjoVyUwdp4jUw'
    ),
    body := jsonb_build_object('scheduled_at', now())
  ) AS request_id;
  $$
);