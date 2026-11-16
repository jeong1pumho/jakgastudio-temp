CREATE TABLE public.recommended_books (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"title" text NOT NULL,
"recommendation" text NOT NULL,
"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
"sort_order" integer DEFAULT 0 NOT NULL,
"published" boolean DEFAULT true NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
"photo_edits" jsonb DEFAULT '{}'::jsonb NOT NULL,
CONSTRAINT "recommended_books_images_check" CHECK (((jsonb_typeof(images) = 'array'::text) AND ((jsonb_array_length(images) >= 1) AND (jsonb_array_length(images) <= 20)))),
CONSTRAINT "recommended_books_photo_edits_check" CHECK ((jsonb_typeof(photo_edits) = 'object'::text)),
CONSTRAINT "recommended_books_pkey" PRIMARY KEY (id),
CONSTRAINT "recommended_books_recommendation_check" CHECK (((char_length(recommendation) >= 1) AND (char_length(recommendation) <= 5000))),
CONSTRAINT "recommended_books_title_check" CHECK (((char_length(title) >= 1) AND (char_length(title) <= 150)))
);
ALTER TABLE public.recommended_books ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recommended_books FROM anon, authenticated;
GRANT ALL ON public.recommended_books TO service_role;
CREATE TABLE public.key_visual (
"id" integer NOT NULL,
"slides" jsonb NOT NULL,
"revision" integer DEFAULT 1 NOT NULL,
"originals" jsonb DEFAULT '[]'::jsonb NOT NULL,
CONSTRAINT "key_visual_id_check" CHECK ((id = 1)),
CONSTRAINT "key_visual_originals_check" CHECK (((jsonb_typeof(originals) = 'array'::text) AND (jsonb_array_length(originals) <= 10))),
CONSTRAINT "key_visual_pkey" PRIMARY KEY (id),
CONSTRAINT "key_visual_revision_check" CHECK ((revision > 0)),
CONSTRAINT "key_visual_slides_check" CHECK (((jsonb_typeof(slides) = 'array'::text) AND ((jsonb_array_length(slides) >= 1) AND (jsonb_array_length(slides) <= 10))))
);
ALTER TABLE public.key_visual ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.key_visual FROM anon, authenticated;
GRANT ALL ON public.key_visual TO service_role;
GRANT SELECT ON public.recommended_books TO anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.recommended_books TO authenticated;
GRANT SELECT(id,slides,revision) ON public.key_visual TO anon;
GRANT SELECT,INSERT,UPDATE ON public.key_visual TO authenticated;
CREATE POLICY "Admins insert key visual" ON public.key_visual FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM news_admins a
  WHERE (a.user_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "Admins update key visual" ON public.key_visual FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM news_admins a
  WHERE (a.user_id = ( SELECT auth.uid() AS uid))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM news_admins a
  WHERE (a.user_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "Admins upload key visual" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'key-visual'::text) AND (EXISTS ( SELECT 1
   FROM news_admins a
  WHERE (a.user_id = ( SELECT auth.uid() AS uid))))));
CREATE POLICY "Visitors read published key visual" ON public.key_visual FOR SELECT TO anon USING (true);
CREATE POLICY "Admins read key visual originals" ON public.key_visual FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM news_admins a
  WHERE (a.user_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "Admins upload key visual originals" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'key-visual-originals'::text) AND (EXISTS ( SELECT 1
   FROM news_admins a
  WHERE (a.user_id = ( SELECT auth.uid() AS uid))))));
CREATE POLICY "Admins download key visual originals" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'key-visual-originals'::text) AND (EXISTS ( SELECT 1
   FROM news_admins a
  WHERE (a.user_id = ( SELECT auth.uid() AS uid))))));
CREATE POLICY "books_public_read" ON public.recommended_books FOR SELECT TO anon,authenticated USING (published);
CREATE POLICY "books_admin_all" ON public.recommended_books FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM news_admins
  WHERE (news_admins.user_id = ( SELECT auth.uid() AS uid))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM news_admins
  WHERE (news_admins.user_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "books_media_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'book-media'::text) AND ((storage.foldername(name))[1] = 'books'::text) AND (EXISTS ( SELECT 1
   FROM news_admins
  WHERE (news_admins.user_id = ( SELECT auth.uid() AS uid))))));
CREATE POLICY "books_media_select" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'book-media'::text) AND (EXISTS ( SELECT 1
   FROM news_admins
  WHERE (news_admins.user_id = ( SELECT auth.uid() AS uid))))));
CREATE POLICY "books_media_delete" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'book-media'::text) AND (EXISTS ( SELECT 1
   FROM news_admins
  WHERE (news_admins.user_id = ( SELECT auth.uid() AS uid))))));
CREATE POLICY "Admins upload book originals" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'book-originals'::text) AND (EXISTS ( SELECT 1
   FROM news_admins a
  WHERE (a.user_id = ( SELECT auth.uid() AS uid))))));
CREATE POLICY "Admins read book originals" ON storage.objects FOR SELECT TO authenticated USING (((bucket_id = 'book-originals'::text) AND (EXISTS ( SELECT 1
   FROM news_admins a
  WHERE (a.user_id = ( SELECT auth.uid() AS uid))))));
