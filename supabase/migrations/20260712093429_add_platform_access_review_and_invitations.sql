-- SchoolOS / Tavaro Enterprise Platform
-- Organization onboarding invitation storage foundation
-- Migration: 20260712093429_add_platform_access_review_and_invitations.sql

begin;

-- ============================================================
-- 1. ORGANIZATION ONBOARDING INVITATIONS
-- ============================================================

create table public.organization_onboarding_invitations (
  id uuid primary key default gen_random_uuid(),

  access_request_id uuid not null
    references public.platform_access_requests(id) on delete restrict,

  invitation_email text not null,
  token_hash text not null,

  invitation_status text not null default 'issued'
    check (
      invitation_status in (
        'issued',
        'consumed',
        'expired',
        'revoked'
      )
    ),

  issued_at timestamptz not null default now(),
  issued_by uuid not null
    references public.profiles(id) on delete restrict,

  expires_at timestamptz not null,

  consumed_at timestamptz,
  consumed_by uuid
    references public.profiles(id) on delete restrict,

  revoked_at timestamptz,
  revoked_by uuid
    references public.profiles(id) on delete restrict,

  revocation_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint organization_onboarding_invitations_email_normalized
    check (
      invitation_email = lower(trim(invitation_email))
    ),

  constraint organization_onboarding_invitations_email_not_blank
    check (
      length(trim(invitation_email)) > 0
    ),

  constraint organization_onboarding_invitations_token_hash_not_blank
    check (
      length(trim(token_hash)) > 0
    ),

  constraint organization_onboarding_invitations_expiry_after_issue
    check (
      expires_at > issued_at
    ),

  constraint organization_onboarding_invitations_consumption_consistency
    check (
      (
        invitation_status = 'consumed'
        and consumed_at is not null
        and consumed_by is not null
      )
      or
      (
        invitation_status <> 'consumed'
        and consumed_at is null
        and consumed_by is null
      )
    ),

  constraint organization_onboarding_invitations_revocation_consistency
    check (
      (
        invitation_status = 'revoked'
        and revoked_at is not null
        and revoked_by is not null
        and nullif(trim(revocation_reason), '') is not null
      )
      or
      (
        invitation_status <> 'revoked'
        and revoked_at is null
        and revoked_by is null
        and revocation_reason is null
      )
    )
);

comment on table public.organization_onboarding_invitations
is 'Single-use, time-limited invitations permitting an approved SchoolOS organization to complete tenant onboarding.';

comment on column public.organization_onboarding_invitations.token_hash
is 'SHA-256 hash of the secret onboarding token. The raw token must never be stored.';

-- ============================================================
-- 2. INDEXES
-- ============================================================

create unique index organization_onboarding_invitations_token_hash_unique_idx
  on public.organization_onboarding_invitations (token_hash);

create index organization_onboarding_invitations_request_status_idx
  on public.organization_onboarding_invitations (
    access_request_id,
    invitation_status
  );

create index organization_onboarding_invitations_email_idx
  on public.organization_onboarding_invitations (
    lower(invitation_email)
  );

create index organization_onboarding_invitations_expiry_idx
  on public.organization_onboarding_invitations (
    expires_at
  )
  where invitation_status = 'issued';

create index organization_onboarding_invitations_issued_by_idx
  on public.organization_onboarding_invitations (issued_by);

create index organization_onboarding_invitations_consumed_by_idx
  on public.organization_onboarding_invitations (consumed_by)
  where consumed_by is not null;

create index organization_onboarding_invitations_revoked_by_idx
  on public.organization_onboarding_invitations (revoked_by)
  where revoked_by is not null;

create unique index organization_onboarding_invitations_one_issued_request_idx
  on public.organization_onboarding_invitations (
    access_request_id
  )
  where invitation_status = 'issued';

create trigger organization_onboarding_invitations_set_updated_at
before update on public.organization_onboarding_invitations
for each row
execute function public.set_updated_at();

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

alter table public.organization_onboarding_invitations
  enable row level security;

alter table public.organization_onboarding_invitations
  force row level security;

create policy organization_onboarding_invitations_select_platform_admin
on public.organization_onboarding_invitations
for select
to authenticated
using (
  (select private.is_platform_administrator())
);

-- No INSERT, UPDATE, or DELETE policies are intentionally defined.
-- Invitation lifecycle changes must occur through secured functions.

-- ============================================================
-- 4. PRIVILEGES
-- ============================================================

revoke all
on table public.organization_onboarding_invitations
from public, anon, authenticated;

grant select
on table public.organization_onboarding_invitations
to authenticated;

grant all privileges
on table public.organization_onboarding_invitations
to service_role;

-- ============================================================
-- 5. VALIDATION
-- ============================================================

do $$
declare
  table_exists boolean;
  rls_enabled boolean;
  rls_forced boolean;
  policy_count integer;
  active_invitation_index_exists boolean;
begin
  select exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n
      on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'organization_onboarding_invitations'
      and c.relkind = 'r'
  )
  into table_exists;

  if not table_exists then
    raise exception
      using
        errcode = 'P0001',
        message =
          'organization_onboarding_invitations was not created.';
  end if;

  select
    c.relrowsecurity,
    c.relforcerowsecurity
  into
    rls_enabled,
    rls_forced
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n
    on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'organization_onboarding_invitations';

  if not rls_enabled or not rls_forced then
    raise exception
      using
        errcode = 'P0001',
        message =
          'RLS must be enabled and forced on organization_onboarding_invitations.';
  end if;

  select count(*)
  into policy_count
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and tablename = 'organization_onboarding_invitations';

  if policy_count <> 1 then
    raise exception
      using
        errcode = 'P0001',
        message =
          'Expected exactly one onboarding invitation policy.';
  end if;

  select exists (
    select 1
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'organization_onboarding_invitations'
      and indexname =
        'organization_onboarding_invitations_one_issued_request_idx'
  )
  into active_invitation_index_exists;

  if not active_invitation_index_exists then
    raise exception
      using
        errcode = 'P0001',
        message =
          'The one-issued-invitation-per-request index is missing.';
  end if;
end;
$$;

commit;
