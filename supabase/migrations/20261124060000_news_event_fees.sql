-- Store the price on its owning post. NULL = undecided, 0 = free.
alter table public.news_posts add column price_krw integer check (price_krw between 0 and 10000000);
do $$
begin
 if exists(select news_post_id from public.calendar_event_news group by news_post_id having count(distinct price_krw)>1) then
  raise exception 'Conflicting legacy event fees';
 end if;
end $$;
update public.news_posts p set price_krw=s.price
from (select news_post_id,max(price_krw) price from public.calendar_event_news where price_krw is not null group by news_post_id) s
where p.id=s.news_post_id;
-- Keep the historic link and fee rows; only eligible linked posts are public.
alter policy calendar_event_news_public_read on public.calendar_event_news using (
 exists(select 1 from public.schedule_events e where e.id=event_id and e.category in ('meeting','custom'))
 and exists(select 1 from public.news_posts n where n.id=news_post_id and n.operator_type='studio' and n.status in ('ongoing','ended') and n.published_at is not null)
);
revoke execute on function public.public_calendar_event_memo(uuid) from public,anon,authenticated;
create function public.save_linked_schedule_event(p_id uuid,p_event_date date,p_category text,p_category_label text,p_title text,p_start_time time,p_end_time time,p_memo text,p_news_post_id uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare saved uuid;
begin
 if p_news_post_id is not null then
  perform 1 from public.news_posts where id=p_news_post_id and operator_type='studio' and published_at is not null and status in ('ongoing','ended') for share;
  if not found or p_category not in ('meeting','custom') then raise exception '작가작업실 JEJU 운영 게시물만 연결할 수 있습니다.' using errcode='22023'; end if;
 end if;
 saved:=public.save_schedule_event(p_id,p_event_date,p_category,p_category_label,p_title,p_start_time,p_end_time,p_memo);
 if p_news_post_id is null then
  delete from public.calendar_event_news where event_id=saved;
 else
  insert into public.calendar_event_news(event_id,news_post_id) values(saved,p_news_post_id)
  on conflict(event_id) do update set news_post_id=excluded.news_post_id,updated_at=now(),
    price_krw=case when calendar_event_news.news_post_id=excluded.news_post_id then calendar_event_news.price_krw end;
 end if;
 return saved;
end $$;
revoke all on function public.save_linked_schedule_event(uuid,date,text,text,text,time,time,text,uuid) from public,anon;
grant execute on function public.save_linked_schedule_event(uuid,date,text,text,text,time,time,text,uuid) to authenticated;
notify pgrst,'reload schema';
