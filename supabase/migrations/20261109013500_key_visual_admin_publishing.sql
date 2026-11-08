create table public.key_visual (
 id integer primary key check (id = 1),
 slides jsonb not null check (jsonb_typeof(slides) = 'array' and jsonb_array_length(slides) between 1 and 10),
 revision integer not null default 1 check (revision > 0)
);
alter table public.key_visual enable row level security;
revoke all on public.key_visual from anon, authenticated;
grant select on public.key_visual to anon, authenticated;
grant insert, update on public.key_visual to authenticated;
create policy "Read published key visual" on public.key_visual for select to anon, authenticated using (true);
create policy "Admins insert key visual" on public.key_visual for insert to authenticated
 with check (exists (select 1 from public.news_admins a where a.user_id = (select auth.uid())));
create policy "Admins update key visual" on public.key_visual for update to authenticated
 using (exists (select 1 from public.news_admins a where a.user_id = (select auth.uid())))
 with check (exists (select 1 from public.news_admins a where a.user_id = (select auth.uid())));
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
 values ('key-visual', 'key-visual', true, 25165824, array['image/webp','image/png']);
create policy "Admins upload key visual" on storage.objects for insert to authenticated
 with check (bucket_id = 'key-visual' and exists (select 1 from public.news_admins a where a.user_id = (select auth.uid())));
