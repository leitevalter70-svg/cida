-- Seed catalogs for existing users (idempotent helpers)
-- Primary seeding happens in handle_new_user() on signup.
-- This migration documents default catalog content and can backfill if needed.

-- No-op placeholder for fresh projects: defaults are created per-user on signup.
-- Keep this file so `db push` has an explicit seed step in the migration chain.

do $$
begin
  -- Ensure any existing profiles without settings get defaults
  insert into public.financial_settings (user_id)
  select p.id from public.profiles p
  where not exists (
    select 1 from public.financial_settings fs where fs.user_id = p.id
  );

  insert into public.report_defaults (user_id)
  select p.id from public.profiles p
  where not exists (
    select 1 from public.report_defaults rd where rd.user_id = p.id
  );
end $$;
