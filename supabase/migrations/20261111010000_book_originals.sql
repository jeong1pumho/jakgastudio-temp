alter table public.recommended_books add column photo_edits jsonb not null default '{}'::jsonb check (jsonb_typeof(photo_edits)='object');
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('book-originals','book-originals',false,26214400,array['image/jpeg','image/png','image/webp']);
create policy "Admins upload book originals" on storage.objects for insert to authenticated with check (bucket_id='book-originals' and exists(select 1 from public.news_admins a where a.user_id=(select auth.uid())));
create policy "Admins read book originals" on storage.objects for select to authenticated using (bucket_id='book-originals' and exists(select 1 from public.news_admins a where a.user_id=(select auth.uid())));
