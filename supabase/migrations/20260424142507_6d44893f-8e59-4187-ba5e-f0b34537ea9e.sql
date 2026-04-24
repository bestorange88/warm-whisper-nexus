create or replace function public._call_send_push(_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _supabase_url constant text := 'https://ozkbiywqvbfqpjgqvkdq.supabase.co';
  _anon_key constant text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96a2JpeXdxdmJmcXBqZ3F2a2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzYyMzEsImV4cCI6MjA5MTMxMjIzMX0.a38le1TH5lccW-e7qEkb0XzGSZlf51l-x3gDjS7KlDA';
begin
  perform extensions.http_post(
    url := _supabase_url || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key,
      'apikey', _anon_key
    ),
    body := _payload
  );
exception
  when others then
    raise warning '_call_send_push failed: %', SQLERRM;
end;
$$;