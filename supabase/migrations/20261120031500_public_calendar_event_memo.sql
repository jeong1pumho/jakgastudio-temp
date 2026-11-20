create function public.public_calendar_event_memo(p_event_id uuid)
returns text
language sql stable security definer
set search_path = ''
as $$
  select m.memo
  from public.schedule_events e
  join public.schedule_event_memos m on m.event_id = e.id
  where e.id = p_event_id
    and e.category in ('meeting', 'custom')
    and e.event_date >= date '2026-10-22'
    and e.event_date < (date_trunc('month', now() at time zone 'Asia/Seoul') + interval '2 months')::date
$$;
revoke all on function public.public_calendar_event_memo(uuid) from public;
grant execute on function public.public_calendar_event_memo(uuid) to anon, authenticated;
