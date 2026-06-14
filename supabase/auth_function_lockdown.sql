-- Prevent trigger-only auth helper functions from being callable through RPC.
-- Trigger execution is unaffected; this only removes direct Data API access.

revoke execute on function public.auto_confirm_auth_user() from anon;
revoke execute on function public.auto_confirm_auth_user() from authenticated;
revoke execute on function public.auto_confirm_auth_user() from public;

grant execute on function public.auto_confirm_auth_user() to service_role;
