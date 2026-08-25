create or replace function public.platform_usage_stats()
returns jsonb language sql security definer set search_path = ''
as $$
select jsonb_build_object(
'database_bytes',pg_database_size(current_database()),
'storage_bytes',coalesce((select sum(coalesce((metadata->>'size')::bigint,0)) from storage.objects where coalesce(is_delete_marker,false)=false),0),
'storage_files',(select count(*) from storage.objects where coalesce(is_delete_marker,false)=false),
'registered_users',(select count(*) from public.profiles),
'members',(select count(*) from public.members),
'payments',(select count(*) from public.payments where voided_at is null),
'claims',(select count(*) from public.claims),
'feedback',(select count(*) from public.feedback),
'audit_logs',(select count(*) from public.audit_logs),
'measured_at',now());
$$;
revoke all on function public.platform_usage_stats() from public,anon,authenticated;
grant execute on function public.platform_usage_stats() to service_role;