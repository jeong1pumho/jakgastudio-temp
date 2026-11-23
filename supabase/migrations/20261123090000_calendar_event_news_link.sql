-- Optional one-to-one association between a public calendar event and a published NEWS post.
-- Prices are explicit KRW amounts; never infer them from rich-text descriptions.
create table if not exists public.calendar_event_news (
  event_id uuid primary key references public.schedule_events(id) on delete cascade,
  news_post_id uuid not null references public.news_posts(id) on delete cascade,
  price_krw integer check (price_krw >= 0 and price_krw <= 10000000),
  updated_at timestamptz not null default now()
);
create index if not exists calendar_event_news_post_idx on public.calendar_event_news(news_post_id);
alter table public.calendar_event_news enable row level security;
revoke all on table public.calendar_event_news from public;
grant select on table public.calendar_event_news to anon;
grant select, insert, update, delete on table public.calendar_event_news to authenticated;
create policy calendar_event_news_public_read on public.calendar_event_news
 for select to anon, authenticated using (
  exists (select 1 from public.schedule_events e where e.id=event_id and e.category in ('meeting','custom'))
  and exists (select 1 from public.news_posts n where n.id=news_post_id and n.status in ('ongoing','ended') and n.published_at is not null)
 );
create policy calendar_event_news_admin_all on public.calendar_event_news
 for all to authenticated
 using (exists (select 1 from public.news_admins a where a.user_id=(select auth.uid())))
 with check (exists (select 1 from public.news_admins a where a.user_id=(select auth.uid())));
