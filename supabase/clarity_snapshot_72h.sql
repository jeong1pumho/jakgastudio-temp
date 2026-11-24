-- Store the requested export window alongside the original Microsoft response.
create or replace function public.store_clarity_snapshot_72h(p_secret text, p_dimension text, p_payload jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.store_clarity_snapshot(p_secret, p_dimension, p_payload);
  update public.visit_clarity_snapshots set window_days = 3
  where day_utc = (now() at time zone 'UTC')::date and dimension = p_dimension;
end;
$$;
revoke all on function public.store_clarity_snapshot_72h(text,text,jsonb) from public;
grant execute on function public.store_clarity_snapshot_72h(text,text,jsonb) to anon, authenticated, service_role;
