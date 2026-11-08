alter table public.key_visual add column originals jsonb not null default '[]'::jsonb
  check (jsonb_typeof(originals) = 'array' and jsonb_array_length(originals) <= 10);
revoke select on public.key_visual from anon;
grant select (id,slides,revision) on public.key_visual to anon;
drop policy "Read published key visual" on public.key_visual;
create policy "Visitors read published key visual" on public.key_visual
 for select to anon using (true);
create policy "Admins read key visual originals" on public.key_visual
 for select to authenticated using (exists (select 1 from public.news_admins a where a.user_id = (select auth.uid())));
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
 values ('key-visual-originals','key-visual-originals',false,31457280,array['image/jpeg','image/png','image/webp','image/avif']);
create policy "Admins upload key visual originals" on storage.objects
 for insert to authenticated with check (bucket_id = 'key-visual-originals'
 and exists (select 1 from public.news_admins a where a.user_id = (select auth.uid())));
create policy "Admins download key visual originals" on storage.objects
 for select to authenticated using (bucket_id = 'key-visual-originals'
 and exists (select 1 from public.news_admins a where a.user_id = (select auth.uid())));
