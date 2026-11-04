# SPACE gallery CMS — test only

- Test repository: jeong1pumho/jakgastudio-temp
- Test Supabase project: qrbavxempotptnmflqoq (production database not modified).
- Migration: test_space_gallery_cms_20261104
- Seeded 22 existing SPACE photos, preserving image order and alt text.
- Visitor: GET /api/space, keeping original CSS grid and lightbox.
- Administrator: /admin/space.html; GET/PATCH /api/space-admin; POST cleanup endpoint.
- Bucket: space-media; RLS permits only authenticated news_admins to upload and delete.
- Up to 80 images (individual uploads max 10 MiB). Original repo assets remain untouched.
- Save publishes the entire ordered array, using version matching to prevent lost updates.
- Removed uploaded images are deleted through the Storage API only after successful publication.
- Test project Vercel environment variables are already isolated. Do not apply this migration to production without explicit instruction.
