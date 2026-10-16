-- 86e3jtcdk — profile picture DELETE storage policy (PROPOSED — do not apply from CI)
-- =============================================================================
-- Status: PROPOSED ONLY. Owner runs manually in Supabase after PR review.
--
-- Context: INSERT/UPDATE on profile-pictures gained auth_can_upload_profile_picture()
-- in sql/86e3jt562-profile-column-writes.sql. DELETE still allows any authenticated
-- user to remove {uid}.* objects, which is broader than upload/update.
--
-- My Account remove uses DELETE /api/upload/profile-picture, which clears photo_url
-- via the service role and uses the session client only for storage cleanup of
-- uploaded files. Tightening DELETE RLS blocks direct storage API abuse without
-- affecting the server route (service role bypasses RLS when needed).
-- =============================================================================

drop policy if exists "Users can delete own profile picture" on storage.objects;
create policy "Users can delete own profile picture"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-pictures'
  and name like ((select auth.uid())::text || '.%')
  and public.auth_can_upload_profile_picture()
);
