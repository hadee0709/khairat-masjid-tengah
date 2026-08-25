-- Allow only active Super Admin sessions to hard-delete operational records.
create policy members_super_admin_delete on public.members
for delete to authenticated using (public.current_role() = 'super_admin'::public.user_role);

create policy payments_super_admin_delete on public.payments
for delete to authenticated using (public.current_role() = 'super_admin'::public.user_role);

create policy dependents_super_admin_delete on public.dependents
for delete to authenticated using (public.current_role() = 'super_admin'::public.user_role);

create policy claims_super_admin_delete on public.claims
for delete to authenticated using (public.current_role() = 'super_admin'::public.user_role);

create policy feedback_super_admin_delete on public.feedback
for delete to authenticated using (public.current_role() = 'super_admin'::public.user_role);

create policy notifications_super_admin_delete on public.notifications
for delete to authenticated using (public.current_role() = 'super_admin'::public.user_role);
