
REVOKE EXECUTE ON FUNCTION public.purchase_skin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_gems(uuid,int,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_order_status(uuid, order_status) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_grant_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_ban_user(uuid,text,int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_unban_user(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

CREATE POLICY "skins bucket admin upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'skins' AND public.is_admin(auth.uid()));
CREATE POLICY "skins bucket admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'skins' AND public.is_admin(auth.uid()));
CREATE POLICY "skins bucket admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'skins' AND public.is_admin(auth.uid()));
