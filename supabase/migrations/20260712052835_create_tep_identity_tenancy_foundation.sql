-- SchoolOS / Tavaro Enterprise Platform
-- Identity and tenancy foundation
-- Migration: 20260712052835_create_tep_identity_tenancy_foundation.sql

begin;

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- ============================================================
-- 2. SHARED TIMESTAMP FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at()
is 'Sets updated_at to the current timestamp before a row is updated.';

-- ============================================================
-- 3. PROFILES
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  full_name text not null,
  preferred_name text,
  email text not null,
  phone text,
  avatar_url text,

  locale text not null default 'en-US',
  timezone text not null default 'UTC',

  account_status text not null default 'active'
    check (
      account_status in (
        'invited',
        'active',
        'suspended',
        'archived'
      )
    ),

  last_active_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles
is 'Application identity records extending Supabase Auth users.';

comment on column public.profiles.id
is 'Matches auth.users.id.';

create index profiles_email_lower_idx
  on public.profiles (lower(email));

create index profiles_account_status_idx
  on public.profiles (account_status);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- ============================================================
-- 4. ORGANIZATIONS
-- ============================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  legal_name text,
  registration_number text,

  country_code char(2) not null,
  default_currency char(3) not null,
  timezone text not null default 'UTC',

  status text not null default 'active'
    check (
      status in (
        'active',
        'suspended',
        'archived'
      )
    ),

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint organizations_name_not_blank
    check (length(trim(name)) > 0),

  constraint organizations_country_code_uppercase
    check (country_code = upper(country_code)),

  constraint organizations_currency_code_uppercase
    check (default_currency = upper(default_currency)),

  constraint organizations_archived_consistency
    check (
      (archived_at is null and archived_by is null)
      or archived_at is not null
    ),

  constraint organizations_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    )
);

comment on table public.organizations
is 'Top-level legal or operating tenant entities.';

create unique index organizations_registration_number_unique_idx
  on public.organizations (registration_number)
  where registration_number is not null
    and deleted_at is null;

create index organizations_status_idx
  on public.organizations (status)
  where deleted_at is null;

create index organizations_created_by_idx
  on public.organizations (created_by);

create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

-- ============================================================
-- 5. SCHOOLS
-- ============================================================

create table public.schools (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  name text not null,
  legal_name text,
  school_code text not null,
  registration_number text,
  school_type text,

  email text,
  phone text,
  website text,

  address_line_1 text,
  address_line_2 text,
  city text,
  region text,
  postal_code text,
  country_code char(2) not null,

  default_currency char(3) not null,
  timezone text not null default 'UTC',
  logo_url text,

  status text not null default 'active'
    check (
      status in (
        'active',
        'suspended',
        'archived'
      )
    ),

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint schools_name_not_blank
    check (length(trim(name)) > 0),

  constraint schools_code_not_blank
    check (length(trim(school_code)) > 0),

  constraint schools_country_code_uppercase
    check (country_code = upper(country_code)),

  constraint schools_currency_code_uppercase
    check (default_currency = upper(default_currency)),

  constraint schools_archived_consistency
    check (
      (archived_at is null and archived_by is null)
      or archived_at is not null
    ),

  constraint schools_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    )
);

comment on table public.schools
is 'Educational institutions belonging to an organization.';

create unique index schools_organization_code_unique_idx
  on public.schools (organization_id, lower(school_code))
  where deleted_at is null;

create unique index schools_registration_number_unique_idx
  on public.schools (organization_id, registration_number)
  where registration_number is not null
    and deleted_at is null;

create index schools_organization_status_idx
  on public.schools (organization_id, status)
  where deleted_at is null;

create index schools_created_by_idx
  on public.schools (created_by);

create trigger schools_set_updated_at
before update on public.schools
for each row
execute function public.set_updated_at();

-- ============================================================
-- 6. CAMPUSES
-- ============================================================

create table public.campuses (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  name text not null,
  campus_code text not null,

  email text,
  phone text,

  address_line_1 text,
  address_line_2 text,
  city text,
  region text,
  postal_code text,
  country_code char(2) not null,

  is_primary boolean not null default false,

  status text not null default 'active'
    check (
      status in (
        'active',
        'inactive',
        'archived'
      )
    ),

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint campuses_name_not_blank
    check (length(trim(name)) > 0),

  constraint campuses_code_not_blank
    check (length(trim(campus_code)) > 0),

  constraint campuses_country_code_uppercase
    check (country_code = upper(country_code)),

  constraint campuses_archived_consistency
    check (
      (archived_at is null and archived_by is null)
      or archived_at is not null
    ),

  constraint campuses_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    )
);

comment on table public.campuses
is 'Physical or operational campuses belonging to a school.';

create unique index campuses_school_code_unique_idx
  on public.campuses (school_id, lower(campus_code))
  where deleted_at is null;

create unique index campuses_one_primary_per_school_idx
  on public.campuses (school_id)
  where is_primary = true
    and deleted_at is null;

create index campuses_organization_idx
  on public.campuses (organization_id)
  where deleted_at is null;

create index campuses_school_status_idx
  on public.campuses (school_id, status)
  where deleted_at is null;

create index campuses_created_by_idx
  on public.campuses (created_by);

create trigger campuses_set_updated_at
before update on public.campuses
for each row
execute function public.set_updated_at();

-- RLS policies and transaction commit will be added after all
-- identity, membership, role, and permission tables are defined.

-- ============================================================
-- 7. ORGANIZATION MEMBERSHIPS
-- ============================================================

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  profile_id uuid not null
    references public.profiles(id) on delete restrict,

  membership_status text not null default 'invited'
    check (
      membership_status in (
        'invited',
        'active',
        'suspended',
        'archived'
      )
    ),

  invited_at timestamptz,
  invited_by uuid references public.profiles(id) on delete set null,

  joined_at timestamptz,
  suspended_at timestamptz,
  archived_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint organization_memberships_status_dates_check
    check (
      (membership_status <> 'active' or joined_at is not null)
      and
      (membership_status <> 'suspended' or suspended_at is not null)
      and
      (membership_status <> 'archived' or archived_at is not null)
    )
);

comment on table public.organization_memberships
is 'Connects application profiles to organizations.';

create unique index organization_memberships_org_profile_unique_idx
  on public.organization_memberships (organization_id, profile_id);

create index organization_memberships_profile_status_idx
  on public.organization_memberships (profile_id, membership_status);

create index organization_memberships_organization_status_idx
  on public.organization_memberships (
    organization_id,
    membership_status
  );

create index organization_memberships_invited_by_idx
  on public.organization_memberships (invited_by);

create trigger organization_memberships_set_updated_at
before update on public.organization_memberships
for each row
execute function public.set_updated_at();

-- ============================================================
-- 8. SCHOOL MEMBERSHIPS
-- ============================================================

create table public.school_memberships (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  profile_id uuid not null
    references public.profiles(id) on delete restrict,

  membership_status text not null default 'invited'
    check (
      membership_status in (
        'invited',
        'active',
        'suspended',
        'archived'
      )
    ),

  invited_at timestamptz,
  invited_by uuid references public.profiles(id) on delete set null,

  joined_at timestamptz,
  suspended_at timestamptz,
  archived_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint school_memberships_status_dates_check
    check (
      (membership_status <> 'active' or joined_at is not null)
      and
      (membership_status <> 'suspended' or suspended_at is not null)
      and
      (membership_status <> 'archived' or archived_at is not null)
    )
);

comment on table public.school_memberships
is 'Connects application profiles to schools.';

create unique index school_memberships_school_profile_unique_idx
  on public.school_memberships (school_id, profile_id);

create index school_memberships_profile_status_idx
  on public.school_memberships (profile_id, membership_status);

create index school_memberships_school_status_idx
  on public.school_memberships (school_id, membership_status);

create index school_memberships_organization_idx
  on public.school_memberships (organization_id);

create index school_memberships_invited_by_idx
  on public.school_memberships (invited_by);

create trigger school_memberships_set_updated_at
before update on public.school_memberships
for each row
execute function public.set_updated_at();

-- ============================================================
-- 9. CAMPUS ASSIGNMENTS
-- ============================================================

create table public.campus_assignments (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  campus_id uuid not null
    references public.campuses(id) on delete restrict,

  profile_id uuid not null
    references public.profiles(id) on delete restrict,

  is_primary boolean not null default false,

  assignment_status text not null default 'active'
    check (
      assignment_status in (
        'active',
        'inactive',
        'ended'
      )
    ),

  start_date date not null default current_date,
  end_date date,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  constraint campus_assignments_date_order_check
    check (
      end_date is null
      or end_date >= start_date
    )
);

comment on table public.campus_assignments
is 'Assigns user profiles to school campuses.';

create unique index campus_assignments_campus_profile_unique_idx
  on public.campus_assignments (campus_id, profile_id);

create unique index campus_assignments_one_primary_per_school_idx
  on public.campus_assignments (school_id, profile_id)
  where is_primary = true
    and assignment_status = 'active';

create index campus_assignments_profile_status_idx
  on public.campus_assignments (profile_id, assignment_status);

create index campus_assignments_school_status_idx
  on public.campus_assignments (school_id, assignment_status);

create index campus_assignments_organization_idx
  on public.campus_assignments (organization_id);

create trigger campus_assignments_set_updated_at
before update on public.campus_assignments
for each row
execute function public.set_updated_at();

-- ============================================================
-- 10. ROLES
-- ============================================================

create table public.roles (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid
    references public.organizations(id) on delete restrict,

  school_id uuid
    references public.schools(id) on delete restrict,

  name text not null,
  code text not null,
  description text,

  scope_type text not null
    check (
      scope_type in (
        'platform',
        'organization',
        'school',
        'campus'
      )
    ),

  is_system_role boolean not null default false,

  status text not null default 'active'
    check (
      status in (
        'active',
        'inactive',
        'archived'
      )
    ),

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,

  constraint roles_name_not_blank
    check (length(trim(name)) > 0),

  constraint roles_code_not_blank
    check (length(trim(code)) > 0),

  constraint roles_scope_ownership_check
    check (
      (scope_type = 'platform'
        and organization_id is null
        and school_id is null)
      or
      (scope_type = 'organization'
        and organization_id is not null
        and school_id is null)
      or
      (scope_type in ('school', 'campus')
        and organization_id is not null
        and school_id is not null)
    )
);

comment on table public.roles
is 'Reusable permission role definitions.';

create unique index roles_platform_code_unique_idx
  on public.roles (lower(code))
  where scope_type = 'platform';

create unique index roles_organization_code_unique_idx
  on public.roles (organization_id, lower(code))
  where scope_type = 'organization';

create unique index roles_school_code_unique_idx
  on public.roles (school_id, lower(code))
  where scope_type in ('school', 'campus');

create index roles_organization_status_idx
  on public.roles (organization_id, status);

create index roles_school_status_idx
  on public.roles (school_id, status);

create trigger roles_set_updated_at
before update on public.roles
for each row
execute function public.set_updated_at();

-- ============================================================
-- 11. PERMISSIONS
-- ============================================================

create table public.permissions (
  id uuid primary key default gen_random_uuid(),

  code text not null,
  module text not null,
  action text not null,
  description text,

  risk_level text not null default 'standard'
    check (
      risk_level in (
        'low',
        'standard',
        'elevated',
        'critical'
      )
    ),

  created_at timestamptz not null default now(),

  constraint permissions_code_not_blank
    check (length(trim(code)) > 0),

  constraint permissions_module_not_blank
    check (length(trim(module)) > 0),

  constraint permissions_action_not_blank
    check (length(trim(action)) > 0),

  constraint permissions_code_format_check
    check (code ~ '^[a-z0-9_]+\.[a-z0-9_]+$')
);

comment on table public.permissions
is 'Stable platform and SchoolOS permission definitions.';

create unique index permissions_code_unique_idx
  on public.permissions (lower(code));

create index permissions_module_idx
  on public.permissions (module);

create index permissions_risk_level_idx
  on public.permissions (risk_level);

-- ============================================================
-- 12. ROLE PERMISSIONS
-- ============================================================

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),

  role_id uuid not null
    references public.roles(id) on delete cascade,

  permission_id uuid not null
    references public.permissions(id) on delete cascade,

  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles(id) on delete set null
);

comment on table public.role_permissions
is 'Connects reusable roles to permission definitions.';

create unique index role_permissions_role_permission_unique_idx
  on public.role_permissions (role_id, permission_id);

create index role_permissions_permission_idx
  on public.role_permissions (permission_id);

create index role_permissions_granted_by_idx
  on public.role_permissions (granted_by);

-- ============================================================
-- 13. MEMBERSHIP ROLES
-- ============================================================

create table public.membership_roles (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid
    references public.schools(id) on delete restrict,

  membership_type text not null
    check (
      membership_type in (
        'organization',
        'school'
      )
    ),

  membership_id uuid not null,

  role_id uuid not null
    references public.roles(id) on delete restrict,

  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles(id) on delete set null,

  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,

  constraint membership_roles_scope_check
    check (
      (membership_type = 'organization' and school_id is null)
      or
      (membership_type = 'school' and school_id is not null)
    ),

  constraint membership_roles_revocation_check
    check (
      (revoked_at is null and revoked_by is null)
      or revoked_at is not null
    )
);

comment on table public.membership_roles
is 'Assigns reusable roles to organization or school memberships.';

create unique index membership_roles_active_unique_idx
  on public.membership_roles (
    membership_type,
    membership_id,
    role_id
  )
  where revoked_at is null;

create index membership_roles_role_idx
  on public.membership_roles (role_id)
  where revoked_at is null;

create index membership_roles_school_idx
  on public.membership_roles (school_id)
  where revoked_at is null;

create index membership_roles_assigned_by_idx
  on public.membership_roles (assigned_by);

-- ============================================================
-- 14. USER PERMISSION OVERRIDES
-- ============================================================

create table public.user_permission_overrides (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid
    references public.schools(id) on delete restrict,

  profile_id uuid not null
    references public.profiles(id) on delete restrict,

  permission_id uuid not null
    references public.permissions(id) on delete restrict,

  effect text not null
    check (effect in ('allow', 'deny')),

  reason text not null,
  expires_at timestamptz,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,

  constraint user_permission_overrides_reason_not_blank
    check (length(trim(reason)) > 0),

  constraint user_permission_overrides_revocation_check
    check (
      (revoked_at is null and revoked_by is null)
      or revoked_at is not null
    )
);

comment on table public.user_permission_overrides
is 'Explicit permission grants or denials applied to individual users.';

create unique index user_permission_overrides_active_unique_idx
  on public.user_permission_overrides (
    organization_id,
    coalesce(school_id, '00000000-0000-0000-0000-000000000000'::uuid),
    profile_id,
    permission_id
  )
  where revoked_at is null;

create index user_permission_overrides_profile_idx
  on public.user_permission_overrides (profile_id)
  where revoked_at is null;

create index user_permission_overrides_school_idx
  on public.user_permission_overrides (school_id)
  where revoked_at is null;

create index user_permission_overrides_permission_idx
  on public.user_permission_overrides (permission_id)
  where revoked_at is null;

-- RLS helper functions, validation triggers, seed permissions,
-- policies, grants, and commit are added in the next block.

-- ============================================================
-- 15. PRIVATE PLATFORM SCHEMA
-- ============================================================

create schema if not exists private;

comment on schema private
is 'Private TEP database functions not directly exposed through the Data API.';

-- ============================================================
-- 16. AUTH USER TO PROFILE SYNCHRONIZATION
-- ============================================================

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_name text;
begin
  if new.email is null then
    raise exception
      using
        errcode = '23502',
        message = 'SchoolOS Version 1 requires an email address for new users.';
  end if;

  resolved_name :=
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'full_name',
          new.raw_user_meta_data ->> 'name',
          split_part(new.email, '@', 1)
        )
      ),
      ''
    );

  insert into public.profiles (
    id,
    full_name,
    preferred_name,
    email,
    phone,
    avatar_url,
    locale,
    timezone,
    account_status
  )
  values (
    new.id,
    coalesce(resolved_name, 'SchoolOS User'),
    nullif(
      trim(new.raw_user_meta_data ->> 'preferred_name'),
      ''
    ),
    lower(new.email),
    new.phone,
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'avatar_url',
          new.raw_user_meta_data ->> 'picture'
        )
      ),
      ''
    ),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'locale'), ''),
      'en-US'
    ),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'timezone'), ''),
      'UTC'
    ),
    case
      when new.email_confirmed_at is not null then 'active'
      else 'invited'
    end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    phone = coalesce(excluded.phone, public.profiles.phone),
    avatar_url = coalesce(
      excluded.avatar_url,
      public.profiles.avatar_url
    ),
    updated_at = now();

  return new;
end;
$$;

comment on function private.handle_new_auth_user()
is 'Creates or synchronizes a SchoolOS application profile after an Auth user is created.';

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_new_auth_user();

-- ============================================================
-- 17. AUTH EMAIL SYNCHRONIZATION
-- ============================================================

create or replace function private.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null then
    raise exception
      using
        errcode = '23502',
        message = 'SchoolOS Version 1 requires an email address.';
  end if;

  update public.profiles
  set
    email = lower(new.email),
    phone = new.phone,
    account_status =
      case
        when public.profiles.account_status in (
          'suspended',
          'archived'
        )
          then public.profiles.account_status
        when new.email_confirmed_at is not null
          then 'active'
        else 'invited'
      end,
    updated_at = now()
  where id = new.id;

  return new;
end;
$$;

comment on function private.handle_auth_user_updated()
is 'Synchronizes authoritative Auth email and phone values into the application profile.';

drop trigger if exists on_auth_user_updated on auth.users;

create trigger on_auth_user_updated
after update of email, phone, email_confirmed_at on auth.users
for each row
when (
  old.email is distinct from new.email
  or old.phone is distinct from new.phone
  or old.email_confirmed_at is distinct from new.email_confirmed_at
)
execute function private.handle_auth_user_updated();

-- ============================================================
-- 18. SCHOOL TENANT CONSISTENCY
-- ============================================================

create or replace function private.validate_school_tenant()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  organization_exists boolean;
begin
  select exists (
    select 1
    from public.organizations o
    where o.id = new.organization_id
      and o.deleted_at is null
  )
  into organization_exists;

  if not organization_exists then
    raise exception
      using
        errcode = '23514',
        message = 'School organization_id must reference an active tenant record.';
  end if;

  return new;
end;
$$;

create trigger schools_validate_tenant
before insert or update of organization_id
on public.schools
for each row
execute function private.validate_school_tenant();

-- ============================================================
-- 19. CAMPUS TENANT CONSISTENCY
-- ============================================================

create or replace function private.validate_campus_tenant()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  expected_organization_id uuid;
begin
  select s.organization_id
  into expected_organization_id
  from public.schools s
  where s.id = new.school_id
    and s.deleted_at is null;

  if expected_organization_id is null then
    raise exception
      using
        errcode = '23514',
        message = 'Campus school_id must reference an active school.';
  end if;

  if new.organization_id <> expected_organization_id then
    raise exception
      using
        errcode = '23514',
        message = 'Campus organization_id must match the owning school organization.';
  end if;

  return new;
end;
$$;

create trigger campuses_validate_tenant
before insert or update of organization_id, school_id
on public.campuses
for each row
execute function private.validate_campus_tenant();

-- ============================================================
-- 20. SCHOOL MEMBERSHIP TENANT CONSISTENCY
-- ============================================================

create or replace function private.validate_school_membership_tenant()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  expected_organization_id uuid;
  active_org_membership_exists boolean;
begin
  select s.organization_id
  into expected_organization_id
  from public.schools s
  where s.id = new.school_id
    and s.deleted_at is null;

  if expected_organization_id is null then
    raise exception
      using
        errcode = '23514',
        message = 'School membership must reference an active school.';
  end if;

  if new.organization_id <> expected_organization_id then
    raise exception
      using
        errcode = '23514',
        message = 'School membership organization_id must match the school organization.';
  end if;

  if new.membership_status = 'active' then
    select exists (
      select 1
      from public.organization_memberships om
      where om.organization_id = new.organization_id
        and om.profile_id = new.profile_id
        and om.membership_status = 'active'
    )
    into active_org_membership_exists;

    if not active_org_membership_exists then
      raise exception
        using
          errcode = '23514',
          message = 'An active organization membership is required before activating a school membership.';
    end if;
  end if;

  return new;
end;
$$;

create trigger school_memberships_validate_tenant
before insert or update of
  organization_id,
  school_id,
  profile_id,
  membership_status
on public.school_memberships
for each row
execute function private.validate_school_membership_tenant();

-- ============================================================
-- 21. CAMPUS ASSIGNMENT TENANT CONSISTENCY
-- ============================================================

create or replace function private.validate_campus_assignment_tenant()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  expected_organization_id uuid;
  expected_school_id uuid;
  active_school_membership_exists boolean;
begin
  select
    c.organization_id,
    c.school_id
  into
    expected_organization_id,
    expected_school_id
  from public.campuses c
  where c.id = new.campus_id
    and c.deleted_at is null;

  if expected_school_id is null then
    raise exception
      using
        errcode = '23514',
        message = 'Campus assignment must reference an active campus.';
  end if;

  if new.organization_id <> expected_organization_id then
    raise exception
      using
        errcode = '23514',
        message = 'Campus assignment organization_id must match the campus organization.';
  end if;

  if new.school_id <> expected_school_id then
    raise exception
      using
        errcode = '23514',
        message = 'Campus assignment school_id must match the campus school.';
  end if;

  if new.assignment_status = 'active' then
    select exists (
      select 1
      from public.school_memberships sm
      where sm.school_id = new.school_id
        and sm.profile_id = new.profile_id
        and sm.membership_status = 'active'
    )
    into active_school_membership_exists;

    if not active_school_membership_exists then
      raise exception
        using
          errcode = '23514',
          message = 'An active school membership is required before activating a campus assignment.';
    end if;
  end if;

  return new;
end;
$$;

create trigger campus_assignments_validate_tenant
before insert or update of
  organization_id,
  school_id,
  campus_id,
  profile_id,
  assignment_status
on public.campus_assignments
for each row
execute function private.validate_campus_assignment_tenant();

-- ============================================================
-- 22. ROLE TENANT CONSISTENCY
-- ============================================================

create or replace function private.validate_role_tenant()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  expected_organization_id uuid;
begin
  if new.school_id is not null then
    select s.organization_id
    into expected_organization_id
    from public.schools s
    where s.id = new.school_id
      and s.deleted_at is null;

    if expected_organization_id is null then
      raise exception
        using
          errcode = '23514',
          message = 'Role school_id must reference an active school.';
    end if;

    if new.organization_id <> expected_organization_id then
      raise exception
        using
          errcode = '23514',
          message = 'Role organization_id must match the school organization.';
    end if;
  end if;

  return new;
end;
$$;

create trigger roles_validate_tenant
before insert or update of
  organization_id,
  school_id,
  scope_type
on public.roles
for each row
execute function private.validate_role_tenant();

-- ============================================================
-- 23. MEMBERSHIP ROLE VALIDATION
-- ============================================================

create or replace function private.validate_membership_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  membership_organization_id uuid;
  membership_school_id uuid;
  assigned_role public.roles%rowtype;
begin
  select *
  into assigned_role
  from public.roles r
  where r.id = new.role_id
    and r.status = 'active';

  if not found then
    raise exception
      using
        errcode = '23514',
        message = 'Membership role must reference an active role.';
  end if;

  if new.membership_type = 'organization' then
    select om.organization_id
    into membership_organization_id
    from public.organization_memberships om
    where om.id = new.membership_id;

    if membership_organization_id is null then
      raise exception
        using
          errcode = '23514',
          message = 'membership_id must reference an organization membership.';
    end if;

    if new.organization_id <> membership_organization_id then
      raise exception
        using
          errcode = '23514',
          message = 'Membership role organization_id does not match the organization membership.';
    end if;

    if assigned_role.scope_type not in (
      'platform',
      'organization'
    ) then
      raise exception
        using
          errcode = '23514',
          message = 'Organization memberships may receive only platform or organization roles.';
    end if;

    if assigned_role.organization_id is not null
       and assigned_role.organization_id <> new.organization_id then
      raise exception
        using
          errcode = '23514',
          message = 'Assigned role belongs to another organization.';
    end if;
  else
    select
      sm.organization_id,
      sm.school_id
    into
      membership_organization_id,
      membership_school_id
    from public.school_memberships sm
    where sm.id = new.membership_id;

    if membership_school_id is null then
      raise exception
        using
          errcode = '23514',
          message = 'membership_id must reference a school membership.';
    end if;

    if new.organization_id <> membership_organization_id
       or new.school_id <> membership_school_id then
      raise exception
        using
          errcode = '23514',
          message = 'Membership role tenant identifiers do not match the school membership.';
    end if;

    if assigned_role.scope_type not in (
      'platform',
      'organization',
      'school',
      'campus'
    ) then
      raise exception
        using
          errcode = '23514',
          message = 'Unsupported role scope.';
    end if;

    if assigned_role.organization_id is not null
       and assigned_role.organization_id <> new.organization_id then
      raise exception
        using
          errcode = '23514',
          message = 'Assigned role belongs to another organization.';
    end if;

    if assigned_role.school_id is not null
       and assigned_role.school_id <> new.school_id then
      raise exception
        using
          errcode = '23514',
          message = 'Assigned role belongs to another school.';
    end if;
  end if;

  return new;
end;
$$;

create trigger membership_roles_validate_assignment
before insert or update of
  organization_id,
  school_id,
  membership_type,
  membership_id,
  role_id
on public.membership_roles
for each row
execute function private.validate_membership_role();

-- ============================================================
-- 24. PERMISSION OVERRIDE TENANT CONSISTENCY
-- ============================================================

create or replace function private.validate_permission_override()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  expected_organization_id uuid;
  membership_exists boolean;
begin
  if new.school_id is not null then
    select s.organization_id
    into expected_organization_id
    from public.schools s
    where s.id = new.school_id
      and s.deleted_at is null;

    if expected_organization_id is null then
      raise exception
        using
          errcode = '23514',
          message = 'Permission override school_id must reference an active school.';
    end if;

    if new.organization_id <> expected_organization_id then
      raise exception
        using
          errcode = '23514',
          message = 'Permission override organization_id must match the school organization.';
    end if;

    select exists (
      select 1
      from public.school_memberships sm
      where sm.school_id = new.school_id
        and sm.profile_id = new.profile_id
        and sm.membership_status = 'active'
    )
    into membership_exists;
  else
    select exists (
      select 1
      from public.organization_memberships om
      where om.organization_id = new.organization_id
        and om.profile_id = new.profile_id
        and om.membership_status = 'active'
    )
    into membership_exists;
  end if;

  if not membership_exists then
    raise exception
      using
        errcode = '23514',
        message = 'Permission overrides require an active matching membership.';
  end if;

  return new;
end;
$$;

create trigger user_permission_overrides_validate_tenant
before insert or update of
  organization_id,
  school_id,
  profile_id,
  permission_id,
  effect
on public.user_permission_overrides
for each row
execute function private.validate_permission_override();

-- Authorization helpers, seed permissions, RLS policies,
-- grants, and the final transaction commit follow.

-- ============================================================
-- 25. CURRENT ACTOR HELPERS
-- ============================================================

create or replace function private.current_profile_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.uid();
$$;

comment on function private.current_profile_id()
is 'Returns the authenticated Supabase Auth user ID.';

create or replace function private.is_profile_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.account_status = 'active'
  );
$$;

comment on function private.is_profile_active()
is 'Returns true when the authenticated user has an active SchoolOS profile.';

-- ============================================================
-- 26. ORGANIZATION MEMBERSHIP HELPERS
-- ============================================================

create or replace function private.is_organization_member(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_organization_id is not null
    and exists (
      select 1
      from public.profiles p
      join public.organization_memberships om
        on om.profile_id = p.id
      where p.id = auth.uid()
        and p.account_status = 'active'
        and om.organization_id = target_organization_id
        and om.membership_status = 'active'
    );
$$;

comment on function private.is_organization_member(uuid)
is 'Returns true when the authenticated profile has an active membership in the supplied organization.';

create or replace function private.get_accessible_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select om.organization_id
  from public.organization_memberships om
  join public.profiles p
    on p.id = om.profile_id
  where om.profile_id = auth.uid()
    and om.membership_status = 'active'
    and p.account_status = 'active';
$$;

comment on function private.get_accessible_organization_ids()
is 'Returns organization IDs available to the authenticated profile.';

-- ============================================================
-- 27. SCHOOL MEMBERSHIP HELPERS
-- ============================================================

create or replace function private.is_school_member(
  target_school_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_school_id is not null
    and exists (
      select 1
      from public.profiles p
      join public.school_memberships sm
        on sm.profile_id = p.id
      join public.organization_memberships om
        on om.organization_id = sm.organization_id
       and om.profile_id = sm.profile_id
      where p.id = auth.uid()
        and p.account_status = 'active'
        and sm.school_id = target_school_id
        and sm.membership_status = 'active'
        and om.membership_status = 'active'
    );
$$;

comment on function private.is_school_member(uuid)
is 'Returns true when the authenticated profile has active organization and school memberships.';

create or replace function private.get_accessible_school_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select sm.school_id
  from public.school_memberships sm
  join public.organization_memberships om
    on om.organization_id = sm.organization_id
   and om.profile_id = sm.profile_id
  join public.profiles p
    on p.id = sm.profile_id
  where sm.profile_id = auth.uid()
    and sm.membership_status = 'active'
    and om.membership_status = 'active'
    and p.account_status = 'active';
$$;

comment on function private.get_accessible_school_ids()
is 'Returns school IDs available to the authenticated profile.';

-- ============================================================
-- 28. CAMPUS ACCESS HELPERS
-- ============================================================

create or replace function private.has_campus_access(
  target_campus_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_campus_id is not null
    and exists (
      select 1
      from public.campus_assignments ca
      join public.school_memberships sm
        on sm.school_id = ca.school_id
       and sm.profile_id = ca.profile_id
      join public.organization_memberships om
        on om.organization_id = ca.organization_id
       and om.profile_id = ca.profile_id
      join public.profiles p
        on p.id = ca.profile_id
      where ca.profile_id = auth.uid()
        and ca.campus_id = target_campus_id
        and ca.assignment_status = 'active'
        and ca.start_date <= current_date
        and (
          ca.end_date is null
          or ca.end_date >= current_date
        )
        and sm.membership_status = 'active'
        and om.membership_status = 'active'
        and p.account_status = 'active'
    );
$$;

comment on function private.has_campus_access(uuid)
is 'Returns true when the authenticated profile has an active assignment to the supplied campus.';

create or replace function private.get_accessible_campus_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select ca.campus_id
  from public.campus_assignments ca
  join public.school_memberships sm
    on sm.school_id = ca.school_id
   and sm.profile_id = ca.profile_id
  join public.organization_memberships om
    on om.organization_id = ca.organization_id
   and om.profile_id = ca.profile_id
  join public.profiles p
    on p.id = ca.profile_id
  where ca.profile_id = auth.uid()
    and ca.assignment_status = 'active'
    and ca.start_date <= current_date
    and (
      ca.end_date is null
      or ca.end_date >= current_date
    )
    and sm.membership_status = 'active'
    and om.membership_status = 'active'
    and p.account_status = 'active';
$$;

comment on function private.get_accessible_campus_ids()
is 'Returns campus IDs available to the authenticated profile.';

-- ============================================================
-- 29. ORGANIZATION PERMISSION RESOLUTION
-- ============================================================

create or replace function private.has_organization_permission(
  target_organization_id uuid,
  target_permission_code text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  denied boolean;
  explicitly_allowed boolean;
  role_allowed boolean;
begin
  if actor_id is null
     or target_organization_id is null
     or nullif(trim(target_permission_code), '') is null then
    return false;
  end if;

  if not private.is_organization_member(target_organization_id) then
    return false;
  end if;

  select exists (
    select 1
    from public.user_permission_overrides upo
    join public.permissions p
      on p.id = upo.permission_id
    where upo.organization_id = target_organization_id
      and upo.school_id is null
      and upo.profile_id = actor_id
      and lower(p.code) = lower(target_permission_code)
      and upo.effect = 'deny'
      and upo.revoked_at is null
      and (
        upo.expires_at is null
        or upo.expires_at > now()
      )
  )
  into denied;

  if denied then
    return false;
  end if;

  select exists (
    select 1
    from public.user_permission_overrides upo
    join public.permissions p
      on p.id = upo.permission_id
    where upo.organization_id = target_organization_id
      and upo.school_id is null
      and upo.profile_id = actor_id
      and lower(p.code) = lower(target_permission_code)
      and upo.effect = 'allow'
      and upo.revoked_at is null
      and (
        upo.expires_at is null
        or upo.expires_at > now()
      )
  )
  into explicitly_allowed;

  if explicitly_allowed then
    return true;
  end if;

  select exists (
    select 1
    from public.organization_memberships om
    join public.membership_roles mr
      on mr.membership_type = 'organization'
     and mr.membership_id = om.id
     and mr.organization_id = om.organization_id
     and mr.revoked_at is null
    join public.roles r
      on r.id = mr.role_id
     and r.status = 'active'
    join public.role_permissions rp
      on rp.role_id = r.id
    join public.permissions p
      on p.id = rp.permission_id
    where om.organization_id = target_organization_id
      and om.profile_id = actor_id
      and om.membership_status = 'active'
      and lower(p.code) = lower(target_permission_code)
      and (
        r.scope_type = 'platform'
        or (
          r.scope_type = 'organization'
          and r.organization_id = target_organization_id
        )
      )
  )
  into role_allowed;

  return role_allowed;
end;
$$;

comment on function private.has_organization_permission(uuid, text)
is 'Resolves an organization-scoped permission with deny overrides taking precedence.';

-- ============================================================
-- 30. SCHOOL PERMISSION RESOLUTION
-- ============================================================

create or replace function private.has_school_permission(
  target_school_id uuid,
  target_permission_code text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_organization_id uuid;
  denied boolean;
  explicitly_allowed boolean;
  school_role_allowed boolean;
  organization_role_allowed boolean;
begin
  if actor_id is null
     or target_school_id is null
     or nullif(trim(target_permission_code), '') is null then
    return false;
  end if;

  select s.organization_id
  into target_organization_id
  from public.schools s
  where s.id = target_school_id
    and s.deleted_at is null;

  if target_organization_id is null then
    return false;
  end if;

  if not private.is_school_member(target_school_id) then
    return false;
  end if;

  select exists (
    select 1
    from public.user_permission_overrides upo
    join public.permissions p
      on p.id = upo.permission_id
    where upo.organization_id = target_organization_id
      and upo.profile_id = actor_id
      and lower(p.code) = lower(target_permission_code)
      and upo.effect = 'deny'
      and upo.revoked_at is null
      and (
        upo.school_id is null
        or upo.school_id = target_school_id
      )
      and (
        upo.expires_at is null
        or upo.expires_at > now()
      )
  )
  into denied;

  if denied then
    return false;
  end if;

  select exists (
    select 1
    from public.user_permission_overrides upo
    join public.permissions p
      on p.id = upo.permission_id
    where upo.organization_id = target_organization_id
      and upo.profile_id = actor_id
      and lower(p.code) = lower(target_permission_code)
      and upo.effect = 'allow'
      and upo.revoked_at is null
      and (
        upo.school_id is null
        or upo.school_id = target_school_id
      )
      and (
        upo.expires_at is null
        or upo.expires_at > now()
      )
  )
  into explicitly_allowed;

  if explicitly_allowed then
    return true;
  end if;

  select exists (
    select 1
    from public.school_memberships sm
    join public.membership_roles mr
      on mr.membership_type = 'school'
     and mr.membership_id = sm.id
     and mr.school_id = sm.school_id
     and mr.revoked_at is null
    join public.roles r
      on r.id = mr.role_id
     and r.status = 'active'
    join public.role_permissions rp
      on rp.role_id = r.id
    join public.permissions p
      on p.id = rp.permission_id
    where sm.school_id = target_school_id
      and sm.profile_id = actor_id
      and sm.membership_status = 'active'
      and lower(p.code) = lower(target_permission_code)
      and (
        r.scope_type = 'platform'
        or (
          r.scope_type = 'organization'
          and r.organization_id = target_organization_id
        )
        or (
          r.scope_type in ('school', 'campus')
          and r.school_id = target_school_id
        )
      )
  )
  into school_role_allowed;

  if school_role_allowed then
    return true;
  end if;

  select exists (
    select 1
    from public.organization_memberships om
    join public.membership_roles mr
      on mr.membership_type = 'organization'
     and mr.membership_id = om.id
     and mr.organization_id = om.organization_id
     and mr.revoked_at is null
    join public.roles r
      on r.id = mr.role_id
     and r.status = 'active'
    join public.role_permissions rp
      on rp.role_id = r.id
    join public.permissions p
      on p.id = rp.permission_id
    where om.organization_id = target_organization_id
      and om.profile_id = actor_id
      and om.membership_status = 'active'
      and lower(p.code) = lower(target_permission_code)
      and (
        r.scope_type = 'platform'
        or (
          r.scope_type = 'organization'
          and r.organization_id = target_organization_id
        )
      )
  )
  into organization_role_allowed;

  return organization_role_allowed;
end;
$$;

comment on function private.has_school_permission(uuid, text)
is 'Resolves a school-scoped permission from overrides, school roles, and organization roles.';

-- ============================================================
-- 31. FUNCTION PRIVILEGES
-- ============================================================

revoke all on schema private from public;
revoke all on all functions in schema private from public;
revoke all on all functions in schema private from anon;

grant usage on schema private to authenticated;
grant usage on schema private to service_role;

grant execute on function private.current_profile_id()
  to authenticated, service_role;

grant execute on function private.is_profile_active()
  to authenticated, service_role;

grant execute on function private.is_organization_member(uuid)
  to authenticated, service_role;

grant execute on function private.get_accessible_organization_ids()
  to authenticated, service_role;

grant execute on function private.is_school_member(uuid)
  to authenticated, service_role;

grant execute on function private.get_accessible_school_ids()
  to authenticated, service_role;

grant execute on function private.has_campus_access(uuid)
  to authenticated, service_role;

grant execute on function private.get_accessible_campus_ids()
  to authenticated, service_role;

grant execute on function private.has_organization_permission(uuid, text)
  to authenticated, service_role;

grant execute on function private.has_school_permission(uuid, text)
  to authenticated, service_role;

-- Permission seeds, RLS policies, table grants,
-- and the final transaction commit follow.

-- ============================================================
-- 32. VERSION 1 PERMISSION REGISTRY
-- ============================================================

insert into public.permissions (
  code,
  module,
  action,
  description,
  risk_level
)
values
  -- Platform and tenant administration
  (
    'organizations.view',
    'organizations',
    'view',
    'View organization information.',
    'standard'
  ),
  (
    'organizations.manage',
    'organizations',
    'manage',
    'Create and modify organization information.',
    'critical'
  ),
  (
    'schools.view',
    'schools',
    'view',
    'View school information.',
    'standard'
  ),
  (
    'schools.manage',
    'schools',
    'manage',
    'Create and modify schools.',
    'critical'
  ),
  (
    'campuses.view',
    'campuses',
    'view',
    'View campus information.',
    'standard'
  ),
  (
    'campuses.manage',
    'campuses',
    'manage',
    'Create and modify campuses.',
    'elevated'
  ),
  (
    'users.view',
    'users',
    'view',
    'View tenant users and memberships.',
    'elevated'
  ),
  (
    'users.manage',
    'users',
    'manage',
    'Invite, activate, suspend, and archive tenant users.',
    'critical'
  ),
  (
    'roles.view',
    'roles',
    'view',
    'View roles and permission assignments.',
    'elevated'
  ),
  (
    'roles.manage',
    'roles',
    'manage',
    'Create and modify tenant roles.',
    'critical'
  ),
  (
    'permissions.view',
    'permissions',
    'view',
    'View the permission registry.',
    'elevated'
  ),
  (
    'permissions.manage',
    'permissions',
    'manage',
    'Assign roles, permissions, and user overrides.',
    'critical'
  ),
  (
    'settings.view',
    'settings',
    'view',
    'View SchoolOS settings.',
    'standard'
  ),
  (
    'settings.manage',
    'settings',
    'manage',
    'Modify SchoolOS tenant configuration.',
    'critical'
  ),
  (
    'diagnostics.view',
    'diagnostics',
    'view',
    'View platform and integration diagnostics.',
    'elevated'
  ),

  -- Command Center
  (
    'command_center.view',
    'command_center',
    'view',
    'View the SchoolOS executive command center.',
    'standard'
  ),

  -- Admissions
  (
    'applications.view',
    'applications',
    'view',
    'View admission inquiries and applications.',
    'standard'
  ),
  (
    'applications.create',
    'applications',
    'create',
    'Create admission inquiries and applications.',
    'standard'
  ),
  (
    'applications.edit',
    'applications',
    'edit',
    'Modify admission applications.',
    'standard'
  ),
  (
    'applications.review',
    'applications',
    'review',
    'Review admission applications and documents.',
    'elevated'
  ),
  (
    'applications.approve',
    'applications',
    'approve',
    'Approve, reject, or waitlist admission applications.',
    'critical'
  ),
  (
    'applications.enroll',
    'applications',
    'enroll',
    'Convert approved applications into enrolled students.',
    'critical'
  ),

  -- Students and guardians
  (
    'students.view',
    'students',
    'view',
    'View student records.',
    'standard'
  ),
  (
    'students.create',
    'students',
    'create',
    'Create permanent student records.',
    'elevated'
  ),
  (
    'students.edit',
    'students',
    'edit',
    'Modify student records.',
    'elevated'
  ),
  (
    'students.archive',
    'students',
    'archive',
    'Archive student records.',
    'critical'
  ),
  (
    'students.manage_guardians',
    'students',
    'manage_guardians',
    'Manage guardian and household relationships.',
    'elevated'
  ),
  (
    'students.view_medical_alerts',
    'students',
    'view_medical_alerts',
    'View restricted student medical alerts.',
    'critical'
  ),

  -- School configuration and academics
  (
    'academic_configuration.view',
    'academic_configuration',
    'view',
    'View academic years, terms, departments, grades, and sections.',
    'standard'
  ),
  (
    'academic_configuration.manage',
    'academic_configuration',
    'manage',
    'Manage academic years, terms, departments, grades, and sections.',
    'elevated'
  ),
  (
    'academics.view',
    'academics',
    'view',
    'View academic structures and records.',
    'standard'
  ),
  (
    'academics.manage',
    'academics',
    'manage',
    'Manage subjects, assignments, timetables, and academic configuration.',
    'elevated'
  ),
  (
    'grades.enter',
    'grades',
    'enter',
    'Enter student grades.',
    'elevated'
  ),
  (
    'grades.publish',
    'grades',
    'publish',
    'Publish approved grades and report cards.',
    'critical'
  ),

  -- Attendance
  (
    'attendance.view',
    'attendance',
    'view',
    'View attendance records.',
    'standard'
  ),
  (
    'attendance.record',
    'attendance',
    'record',
    'Record student attendance.',
    'standard'
  ),
  (
    'attendance.correct',
    'attendance',
    'correct',
    'Correct submitted attendance records.',
    'elevated'
  ),
  (
    'attendance.unlock',
    'attendance',
    'unlock',
    'Unlock finalized attendance registers.',
    'critical'
  ),

  -- Finance and payments
  (
    'finance.view',
    'finance',
    'view',
    'View authorized finance information.',
    'elevated'
  ),
  (
    'fees.manage',
    'fees',
    'manage',
    'Manage fee categories and structures.',
    'elevated'
  ),
  (
    'invoices.create',
    'invoices',
    'create',
    'Create student and supplier invoices.',
    'elevated'
  ),
  (
    'invoices.issue',
    'invoices',
    'issue',
    'Issue finalized invoices.',
    'critical'
  ),
  (
    'payments.view',
    'payments',
    'view',
    'View payment transactions and statuses.',
    'elevated'
  ),
  (
    'payments.initiate',
    'payments',
    'initiate',
    'Initiate provider-based payments.',
    'elevated'
  ),
  (
    'payments.record',
    'payments',
    'record',
    'Record verified payments.',
    'critical'
  ),
  (
    'payments.reverse',
    'payments',
    'reverse',
    'Reverse completed payments.',
    'critical'
  ),
  (
    'payments.refund',
    'payments',
    'refund',
    'Request or approve refunds.',
    'critical'
  ),
  (
    'payments.reconcile',
    'payments',
    'reconcile',
    'Reconcile provider and bank transactions.',
    'critical'
  ),
  (
    'receipts.issue',
    'receipts',
    'issue',
    'Issue official payment receipts.',
    'elevated'
  ),
  (
    'budgets.view',
    'budgets',
    'view',
    'View budgets and available balances.',
    'elevated'
  ),
  (
    'budgets.manage',
    'budgets',
    'manage',
    'Create and modify budgets.',
    'critical'
  ),

  -- Procurement
  (
    'procurement.view',
    'procurement',
    'view',
    'View procurement records.',
    'standard'
  ),
  (
    'procurement.request',
    'procurement',
    'request',
    'Create purchase requests.',
    'standard'
  ),
  (
    'procurement.review',
    'procurement',
    'review',
    'Review purchase requests and sourcing records.',
    'elevated'
  ),
  (
    'procurement.approve',
    'procurement',
    'approve',
    'Approve procurement transactions.',
    'critical'
  ),
  (
    'rfq.create',
    'rfq',
    'create',
    'Create requests for quotation.',
    'elevated'
  ),
  (
    'quotations.evaluate',
    'quotations',
    'evaluate',
    'Evaluate supplier quotations.',
    'elevated'
  ),
  (
    'purchase_orders.create',
    'purchase_orders',
    'create',
    'Create purchase orders.',
    'elevated'
  ),
  (
    'purchase_orders.approve',
    'purchase_orders',
    'approve',
    'Approve purchase orders.',
    'critical'
  ),
  (
    'goods_receipts.record',
    'goods_receipts',
    'record',
    'Record goods and service receipts.',
    'elevated'
  ),

  -- Inventory and assets
  (
    'inventory.view',
    'inventory',
    'view',
    'View inventory and stock balances.',
    'standard'
  ),
  (
    'inventory.receive',
    'inventory',
    'receive',
    'Receive items into inventory.',
    'elevated'
  ),
  (
    'inventory.issue',
    'inventory',
    'issue',
    'Issue items from inventory.',
    'elevated'
  ),
  (
    'inventory.transfer',
    'inventory',
    'transfer',
    'Transfer stock between locations.',
    'elevated'
  ),
  (
    'inventory.adjust',
    'inventory',
    'adjust',
    'Adjust inventory balances.',
    'critical'
  ),
  (
    'assets.view',
    'assets',
    'view',
    'View the school asset register.',
    'standard'
  ),
  (
    'assets.manage',
    'assets',
    'manage',
    'Create, assign, transfer, maintain, and dispose of assets.',
    'elevated'
  ),

  -- Staff and HR
  (
    'staff.view',
    'staff',
    'view',
    'View authorized staff information.',
    'standard'
  ),
  (
    'staff.manage',
    'staff',
    'manage',
    'Create and modify staff records.',
    'elevated'
  ),
  (
    'staff.assign',
    'staff',
    'assign',
    'Manage positions, departments, and campus assignments.',
    'elevated'
  ),
  (
    'payroll.view',
    'payroll',
    'view',
    'View restricted payroll information.',
    'critical'
  ),
  (
    'payroll.manage',
    'payroll',
    'manage',
    'Manage payroll processing.',
    'critical'
  ),

  -- Communications
  (
    'communications.view',
    'communications',
    'view',
    'View announcements and permitted communications.',
    'standard'
  ),
  (
    'announcements.create',
    'announcements',
    'create',
    'Create school announcements.',
    'standard'
  ),
  (
    'announcements.publish',
    'announcements',
    'publish',
    'Publish school announcements.',
    'elevated'
  ),
  (
    'messages.send',
    'messages',
    'send',
    'Send authorized messages.',
    'standard'
  ),
  (
    'broadcasts.create',
    'broadcasts',
    'create',
    'Create multi-recipient broadcasts.',
    'elevated'
  ),
  (
    'broadcasts.approve',
    'broadcasts',
    'approve',
    'Approve high-impact broadcasts.',
    'critical'
  ),

  -- Reports and exports
  (
    'reports.view',
    'reports',
    'view',
    'View authorized reports and dashboards.',
    'standard'
  ),
  (
    'reports.export',
    'reports',
    'export',
    'Export authorized reports.',
    'elevated'
  )
on conflict do nothing;

-- ============================================================
-- 33. PERMISSION REGISTRY VALIDATION
-- ============================================================

do $$
declare
  duplicate_count integer;
begin
  select count(*)
  into duplicate_count
  from (
    select lower(code)
    from public.permissions
    group by lower(code)
    having count(*) > 1
  ) duplicates;

  if duplicate_count > 0 then
    raise exception
      using
        errcode = '23505',
        message = 'Duplicate permission codes were detected.';
  end if;
end;
$$;

-- RLS policies, table privileges, and the final transaction
-- commit follow.

-- ============================================================
-- 34. PROFILE ACCESS HELPERS
-- ============================================================

create or replace function private.can_view_profile(
  target_profile_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  shared_organization_id uuid;
begin
  if auth.uid() is null or target_profile_id is null then
    return false;
  end if;

  if target_profile_id = auth.uid() then
    return true;
  end if;

  select om_actor.organization_id
  into shared_organization_id
  from public.organization_memberships om_actor
  join public.organization_memberships om_target
    on om_target.organization_id = om_actor.organization_id
  where om_actor.profile_id = auth.uid()
    and om_actor.membership_status = 'active'
    and om_target.profile_id = target_profile_id
    and om_target.membership_status = 'active'
    and private.has_organization_permission(
      om_actor.organization_id,
      'users.view'
    )
  limit 1;

  return shared_organization_id is not null;
end;
$$;

comment on function private.can_view_profile(uuid)
is 'Returns true when the actor may view the supplied profile through self-access or a shared organization with users.view.';

create or replace function private.can_manage_profile(
  target_profile_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  shared_organization_id uuid;
begin
  if auth.uid() is null or target_profile_id is null then
    return false;
  end if;

  select om_actor.organization_id
  into shared_organization_id
  from public.organization_memberships om_actor
  join public.organization_memberships om_target
    on om_target.organization_id = om_actor.organization_id
  where om_actor.profile_id = auth.uid()
    and om_actor.membership_status = 'active'
    and om_target.profile_id = target_profile_id
    and om_target.membership_status in (
      'invited',
      'active',
      'suspended',
      'archived'
    )
    and private.has_organization_permission(
      om_actor.organization_id,
      'users.manage'
    )
  limit 1;

  return shared_organization_id is not null;
end;
$$;

comment on function private.can_manage_profile(uuid)
is 'Returns true when the actor may administratively manage the supplied profile.';

grant execute on function private.can_view_profile(uuid)
  to authenticated, service_role;

grant execute on function private.can_manage_profile(uuid)
  to authenticated, service_role;

-- ============================================================
-- 35. ENABLE ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles
  enable row level security;

alter table public.organizations
  enable row level security;

alter table public.schools
  enable row level security;

alter table public.campuses
  enable row level security;

alter table public.organization_memberships
  enable row level security;

alter table public.school_memberships
  enable row level security;

alter table public.campus_assignments
  enable row level security;

alter table public.roles
  enable row level security;

alter table public.permissions
  enable row level security;

alter table public.role_permissions
  enable row level security;

alter table public.membership_roles
  enable row level security;

alter table public.user_permission_overrides
  enable row level security;

-- Force RLS for ordinary table owners where practical.
-- Supabase service-role operations retain their expected bypass.

alter table public.profiles
  force row level security;

alter table public.organizations
  force row level security;

alter table public.schools
  force row level security;

alter table public.campuses
  force row level security;

alter table public.organization_memberships
  force row level security;

alter table public.school_memberships
  force row level security;

alter table public.campus_assignments
  force row level security;

alter table public.roles
  force row level security;

alter table public.permissions
  force row level security;

alter table public.role_permissions
  force row level security;

alter table public.membership_roles
  force row level security;

alter table public.user_permission_overrides
  force row level security;

-- ============================================================
-- 36. PROFILE POLICIES
-- ============================================================

create policy profiles_select_authorized
on public.profiles
for select
to authenticated
using (
  (select private.can_view_profile(id))
);

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
  and account_status in ('invited', 'active')
)
with check (
  id = (select auth.uid())
  and account_status in ('invited', 'active')
);

-- Administrative profile lifecycle changes will be performed through
-- a restricted service function added in a later migration.

-- ============================================================
-- 37. ORGANIZATION POLICIES
-- ============================================================

create policy organizations_select_member
on public.organizations
for select
to authenticated
using (
  deleted_at is null
  and (
    (select private.is_organization_member(id))
    or
    (select private.has_organization_permission(
      id,
      'organizations.view'
    ))
  )
);

create policy organizations_update_manager
on public.organizations
for update
to authenticated
using (
  deleted_at is null
  and (
    private.has_organization_permission(
      id,
      'organizations.manage'
    )
  )
)
with check (
  deleted_at is null
  and (
    private.has_organization_permission(
      id,
      'organizations.manage'
    )
  )
);

-- Organization creation is intentionally excluded from direct table access.
-- A transactional organization-onboarding function will create the tenant,
-- initial membership, and owner role together.

-- ============================================================
-- 38. SCHOOL POLICIES
-- ============================================================

create policy schools_select_member
on public.schools
for select
to authenticated
using (
  deleted_at is null
  and (
    (select private.is_school_member(id))
    or
    (
      private.has_organization_permission(
        organization_id,
        'schools.view'
      )
    )
  )
);

create policy schools_insert_manager
on public.schools
for insert
to authenticated
with check (
  deleted_at is null
  and (
    private.has_organization_permission(
      organization_id,
      'schools.manage'
    )
  )
);

create policy schools_update_manager
on public.schools
for update
to authenticated
using (
  deleted_at is null
  and (
    (
      private.has_school_permission(
        id,
        'schools.manage'
      )
    )
    or
    (
      private.has_organization_permission(
        organization_id,
        'schools.manage'
      )
    )
  )
)
with check (
  deleted_at is null
  and (
    (
      private.has_school_permission(
        id,
        'schools.manage'
      )
    )
    or
    (
      private.has_organization_permission(
        organization_id,
        'schools.manage'
      )
    )
  )
);

-- ============================================================
-- 39. CAMPUS POLICIES
-- ============================================================

create policy campuses_select_authorized
on public.campuses
for select
to authenticated
using (
  deleted_at is null
  and (
    (select private.has_campus_access(id))
    or
    (
      private.has_school_permission(
        school_id,
        'campuses.view'
      )
    )
    or
    (
      private.has_organization_permission(
        organization_id,
        'campuses.view'
      )
    )
  )
);

create policy campuses_insert_manager
on public.campuses
for insert
to authenticated
with check (
  deleted_at is null
  and (
    (
      private.has_school_permission(
        school_id,
        'campuses.manage'
      )
    )
    or
    (
      private.has_organization_permission(
        organization_id,
        'campuses.manage'
      )
    )
  )
);

create policy campuses_update_manager
on public.campuses
for update
to authenticated
using (
  deleted_at is null
  and (
    (
      private.has_school_permission(
        school_id,
        'campuses.manage'
      )
    )
    or
    (
      private.has_organization_permission(
        organization_id,
        'campuses.manage'
      )
    )
  )
)
with check (
  deleted_at is null
  and (
    (
      private.has_school_permission(
        school_id,
        'campuses.manage'
      )
    )
    or
    (
      private.has_organization_permission(
        organization_id,
        'campuses.manage'
      )
    )
  )
);

-- ============================================================
-- 40. ORGANIZATION MEMBERSHIP POLICIES
-- ============================================================

create policy organization_memberships_select_authorized
on public.organization_memberships
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or
  (
    private.has_organization_permission(
      organization_id,
      'users.view'
    )
  )
);

create policy organization_memberships_insert_manager
on public.organization_memberships
for insert
to authenticated
with check (
  private.has_organization_permission(
    organization_id,
    'users.manage'
  )
);

create policy organization_memberships_update_manager
on public.organization_memberships
for update
to authenticated
using (
  private.has_organization_permission(
    organization_id,
    'users.manage'
  )
)
with check (
  private.has_organization_permission(
    organization_id,
    'users.manage'
  )
);

-- ============================================================
-- 41. SCHOOL MEMBERSHIP POLICIES
-- ============================================================

create policy school_memberships_select_authorized
on public.school_memberships
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or
  (
    private.has_school_permission(
      school_id,
      'users.view'
    )
  )
  or
  (
    private.has_organization_permission(
      organization_id,
      'users.view'
    )
  )
);

create policy school_memberships_insert_manager
on public.school_memberships
for insert
to authenticated
with check (
  (
    private.has_school_permission(
      school_id,
      'users.manage'
    )
  )
  or
  (
    private.has_organization_permission(
      organization_id,
      'users.manage'
    )
  )
);

create policy school_memberships_update_manager
on public.school_memberships
for update
to authenticated
using (
  (
    private.has_school_permission(
      school_id,
      'users.manage'
    )
  )
  or
  (
    private.has_organization_permission(
      organization_id,
      'users.manage'
    )
  )
)
with check (
  (
    private.has_school_permission(
      school_id,
      'users.manage'
    )
  )
  or
  (
    private.has_organization_permission(
      organization_id,
      'users.manage'
    )
  )
);

-- ============================================================
-- 42. CAMPUS ASSIGNMENT POLICIES
-- ============================================================

create policy campus_assignments_select_authorized
on public.campus_assignments
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or
  (
    private.has_school_permission(
      school_id,
      'users.view'
    )
  )
  or
  (
    private.has_organization_permission(
      organization_id,
      'users.view'
    )
  )
);

create policy campus_assignments_insert_manager
on public.campus_assignments
for insert
to authenticated
with check (
  (
    private.has_school_permission(
      school_id,
      'users.manage'
    )
  )
  or
  (
    private.has_organization_permission(
      organization_id,
      'users.manage'
    )
  )
);

create policy campus_assignments_update_manager
on public.campus_assignments
for update
to authenticated
using (
  (
    private.has_school_permission(
      school_id,
      'users.manage'
    )
  )
  or
  (
    private.has_organization_permission(
      organization_id,
      'users.manage'
    )
  )
)
with check (
  (
    private.has_school_permission(
      school_id,
      'users.manage'
    )
  )
  or
  (
    private.has_organization_permission(
      organization_id,
      'users.manage'
    )
  )
);

-- ============================================================
-- 43. ROLE POLICIES
-- ============================================================

create policy roles_select_authorized
on public.roles
for select
to authenticated
using (
  status <> 'archived'
  and (
    scope_type = 'platform'
    or (
      organization_id is not null
      and (
        private.has_organization_permission(
          organization_id,
          'roles.view'
        )
      )
    )
    or (
      school_id is not null
      and (
        private.has_school_permission(
          school_id,
          'roles.view'
        )
      )
    )
  )
);

create policy roles_insert_manager
on public.roles
for insert
to authenticated
with check (
  is_system_role = false
  and (
    (
      scope_type = 'organization'
      and (
        private.has_organization_permission(
          organization_id,
          'roles.manage'
        )
      )
    )
    or
    (
      scope_type in ('school', 'campus')
      and (
        private.has_school_permission(
          school_id,
          'roles.manage'
        )
      )
    )
  )
);

create policy roles_update_manager
on public.roles
for update
to authenticated
using (
  is_system_role = false
  and (
    (
      organization_id is not null
      and (
        private.has_organization_permission(
          organization_id,
          'roles.manage'
        )
      )
    )
    or
    (
      school_id is not null
      and (
        private.has_school_permission(
          school_id,
          'roles.manage'
        )
      )
    )
  )
)
with check (
  is_system_role = false
  and (
    (
      organization_id is not null
      and (
        private.has_organization_permission(
          organization_id,
          'roles.manage'
        )
      )
    )
    or
    (
      school_id is not null
      and (
        private.has_school_permission(
          school_id,
          'roles.manage'
        )
      )
    )
  )
);

-- ============================================================
-- 44. PERMISSION REGISTRY POLICIES
-- ============================================================

create policy permissions_select_authenticated
on public.permissions
for select
to authenticated
using (
  (select private.is_profile_active())
);

-- Permission definitions are platform-controlled and cannot be inserted,
-- modified, or deleted directly by authenticated application users.

-- ============================================================
-- 45. ROLE PERMISSION POLICIES
-- ============================================================

create policy role_permissions_select_authorized
on public.role_permissions
for select
to authenticated
using (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and (
        r.scope_type = 'platform'
        or (
          r.organization_id is not null
          and (
            private.has_organization_permission(
              r.organization_id,
              'roles.view'
            )
          )
        )
        or (
          r.school_id is not null
          and (
            private.has_school_permission(
              r.school_id,
              'roles.view'
            )
          )
        )
      )
  )
);

create policy role_permissions_insert_manager
on public.role_permissions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and r.is_system_role = false
      and (
        (
          r.organization_id is not null
          and (
            private.has_organization_permission(
              r.organization_id,
              'permissions.manage'
            )
          )
        )
        or
        (
          r.school_id is not null
          and (
            private.has_school_permission(
              r.school_id,
              'permissions.manage'
            )
          )
        )
      )
  )
);

create policy role_permissions_delete_manager
on public.role_permissions
for delete
to authenticated
using (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and r.is_system_role = false
      and (
        (
          r.organization_id is not null
          and (
            private.has_organization_permission(
              r.organization_id,
              'permissions.manage'
            )
          )
        )
        or
        (
          r.school_id is not null
          and (
            private.has_school_permission(
              r.school_id,
              'permissions.manage'
            )
          )
        )
      )
  )
);

-- ============================================================
-- 46. MEMBERSHIP ROLE POLICIES
-- ============================================================

create policy membership_roles_select_authorized
on public.membership_roles
for select
to authenticated
using (
  (
    private.has_organization_permission(
      organization_id,
      'roles.view'
    )
  )
  or
  (
    school_id is not null
    and (
      private.has_school_permission(
        school_id,
        'roles.view'
      )
    )
  )
);

create policy membership_roles_insert_manager
on public.membership_roles
for insert
to authenticated
with check (
  (
    private.has_organization_permission(
      organization_id,
      'permissions.manage'
    )
  )
  or
  (
    school_id is not null
    and (
      private.has_school_permission(
        school_id,
        'permissions.manage'
      )
    )
  )
);

create policy membership_roles_update_manager
on public.membership_roles
for update
to authenticated
using (
  (
    private.has_organization_permission(
      organization_id,
      'permissions.manage'
    )
  )
  or
  (
    school_id is not null
    and (
      private.has_school_permission(
        school_id,
        'permissions.manage'
      )
    )
  )
)
with check (
  (
    private.has_organization_permission(
      organization_id,
      'permissions.manage'
    )
  )
  or
  (
    school_id is not null
    and (
      private.has_school_permission(
        school_id,
        'permissions.manage'
      )
    )
  )
);

-- ============================================================
-- 47. USER PERMISSION OVERRIDE POLICIES
-- ============================================================

create policy user_permission_overrides_select_authorized
on public.user_permission_overrides
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or
  (
    private.has_organization_permission(
      organization_id,
      'permissions.view'
    )
  )
  or
  (
    school_id is not null
    and (
      private.has_school_permission(
        school_id,
        'permissions.view'
      )
    )
  )
);

create policy user_permission_overrides_insert_manager
on public.user_permission_overrides
for insert
to authenticated
with check (
  (
    private.has_organization_permission(
      organization_id,
      'permissions.manage'
    )
  )
  or
  (
    school_id is not null
    and (
      private.has_school_permission(
        school_id,
        'permissions.manage'
      )
    )
  )
);

create policy user_permission_overrides_update_manager
on public.user_permission_overrides
for update
to authenticated
using (
  (
    private.has_organization_permission(
      organization_id,
      'permissions.manage'
    )
  )
  or
  (
    school_id is not null
    and (
      private.has_school_permission(
        school_id,
        'permissions.manage'
      )
    )
  )
)
with check (
  (
    private.has_organization_permission(
      organization_id,
      'permissions.manage'
    )
  )
  or
  (
    school_id is not null
    and (
      private.has_school_permission(
        school_id,
        'permissions.manage'
      )
    )
  )
);

-- Table privileges and final transaction commit follow.

-- ============================================================
-- 48. RESTRICT DEFAULT ACCESS
-- ============================================================

revoke all on table public.profiles
  from public, anon, authenticated;

revoke all on table public.organizations
  from public, anon, authenticated;

revoke all on table public.schools
  from public, anon, authenticated;

revoke all on table public.campuses
  from public, anon, authenticated;

revoke all on table public.organization_memberships
  from public, anon, authenticated;

revoke all on table public.school_memberships
  from public, anon, authenticated;

revoke all on table public.campus_assignments
  from public, anon, authenticated;

revoke all on table public.roles
  from public, anon, authenticated;

revoke all on table public.permissions
  from public, anon, authenticated;

revoke all on table public.role_permissions
  from public, anon, authenticated;

revoke all on table public.membership_roles
  from public, anon, authenticated;

revoke all on table public.user_permission_overrides
  from public, anon, authenticated;

-- The timestamp helper is trigger-only and must not be callable
-- directly through an exposed API role.

revoke all on function public.set_updated_at()
  from public, anon, authenticated;

-- ============================================================
-- 49. AUTHENTICATED PROFILE PRIVILEGES
-- ============================================================

grant select
on table public.profiles
to authenticated;

grant update (
  full_name,
  preferred_name,
  phone,
  avatar_url,
  locale,
  timezone
)
on table public.profiles
to authenticated;

-- Authoritative fields such as id, email, account_status,
-- created_at, and updated_at are not directly writable by users.

-- ============================================================
-- 50. AUTHENTICATED TENANT PRIVILEGES
-- ============================================================

grant select
on table public.organizations
to authenticated;

grant update (
  name,
  legal_name,
  registration_number,
  country_code,
  default_currency,
  timezone,
  status,
  updated_by,
  archived_at,
  archived_by,
  deleted_at,
  deleted_by
)
on table public.organizations
to authenticated;

grant select, insert
on table public.schools
to authenticated;

grant update (
  name,
  legal_name,
  school_code,
  registration_number,
  school_type,
  email,
  phone,
  website,
  address_line_1,
  address_line_2,
  city,
  region,
  postal_code,
  country_code,
  default_currency,
  timezone,
  logo_url,
  status,
  updated_by,
  archived_at,
  archived_by,
  deleted_at,
  deleted_by
)
on table public.schools
to authenticated;

grant select, insert
on table public.campuses
to authenticated;

grant update (
  name,
  campus_code,
  email,
  phone,
  address_line_1,
  address_line_2,
  city,
  region,
  postal_code,
  country_code,
  is_primary,
  status,
  updated_by,
  archived_at,
  archived_by,
  deleted_at,
  deleted_by
)
on table public.campuses
to authenticated;

-- ============================================================
-- 51. AUTHENTICATED MEMBERSHIP PRIVILEGES
-- ============================================================

grant select, insert
on table public.organization_memberships
to authenticated;

grant update (
  membership_status,
  invited_at,
  invited_by,
  joined_at,
  suspended_at,
  archived_at
)
on table public.organization_memberships
to authenticated;

grant select, insert
on table public.school_memberships
to authenticated;

grant update (
  membership_status,
  invited_at,
  invited_by,
  joined_at,
  suspended_at,
  archived_at
)
on table public.school_memberships
to authenticated;

grant select, insert
on table public.campus_assignments
to authenticated;

grant update (
  is_primary,
  assignment_status,
  start_date,
  end_date,
  updated_by
)
on table public.campus_assignments
to authenticated;

-- Tenant and identity columns cannot be changed after membership
-- or assignment creation. Incorrect records must be closed and
-- recreated instead.

-- ============================================================
-- 52. AUTHENTICATED AUTHORIZATION PRIVILEGES
-- ============================================================

grant select, insert
on table public.roles
to authenticated;

grant update (
  name,
  code,
  description,
  status,
  updated_by,
  archived_at,
  archived_by
)
on table public.roles
to authenticated;

grant select
on table public.permissions
to authenticated;

grant select, insert, delete
on table public.role_permissions
to authenticated;

grant select, insert
on table public.membership_roles
to authenticated;

grant update (
  revoked_at,
  revoked_by
)
on table public.membership_roles
to authenticated;

grant select, insert
on table public.user_permission_overrides
to authenticated;

grant update (
  revoked_at,
  revoked_by
)
on table public.user_permission_overrides
to authenticated;

-- ============================================================
-- 53. SERVICE ROLE PRIVILEGES
-- ============================================================

grant all privileges
on table public.profiles
to service_role;

grant all privileges
on table public.organizations
to service_role;

grant all privileges
on table public.schools
to service_role;

grant all privileges
on table public.campuses
to service_role;

grant all privileges
on table public.organization_memberships
to service_role;

grant all privileges
on table public.school_memberships
to service_role;

grant all privileges
on table public.campus_assignments
to service_role;

grant all privileges
on table public.roles
to service_role;

grant all privileges
on table public.permissions
to service_role;

grant all privileges
on table public.role_permissions
to service_role;

grant all privileges
on table public.membership_roles
to service_role;

grant all privileges
on table public.user_permission_overrides
to service_role;

-- ============================================================
-- 54. RLS CONFIGURATION VALIDATION
-- ============================================================

do $$
declare
  missing_rls_tables text;
  missing_forced_rls_tables text;
begin
  select string_agg(expected.table_name, ', ' order by expected.table_name)
  into missing_rls_tables
  from (
    values
      ('profiles'),
      ('organizations'),
      ('schools'),
      ('campuses'),
      ('organization_memberships'),
      ('school_memberships'),
      ('campus_assignments'),
      ('roles'),
      ('permissions'),
      ('role_permissions'),
      ('membership_roles'),
      ('user_permission_overrides')
  ) as expected(table_name)
  left join pg_catalog.pg_class c
    on c.relname = expected.table_name
  left join pg_catalog.pg_namespace n
    on n.oid = c.relnamespace
   and n.nspname = 'public'
  where c.oid is null
     or c.relrowsecurity is not true;

  if missing_rls_tables is not null then
    raise exception
      using
        errcode = 'P0001',
        message =
          'RLS is not enabled for required tables: '
          || missing_rls_tables;
  end if;

  select string_agg(expected.table_name, ', ' order by expected.table_name)
  into missing_forced_rls_tables
  from (
    values
      ('profiles'),
      ('organizations'),
      ('schools'),
      ('campuses'),
      ('organization_memberships'),
      ('school_memberships'),
      ('campus_assignments'),
      ('roles'),
      ('permissions'),
      ('role_permissions'),
      ('membership_roles'),
      ('user_permission_overrides')
  ) as expected(table_name)
  left join pg_catalog.pg_class c
    on c.relname = expected.table_name
  left join pg_catalog.pg_namespace n
    on n.oid = c.relnamespace
   and n.nspname = 'public'
  where c.oid is null
     or c.relforcerowsecurity is not true;

  if missing_forced_rls_tables is not null then
    raise exception
      using
        errcode = 'P0001',
        message =
          'Forced RLS is not enabled for required tables: '
          || missing_forced_rls_tables;
  end if;
end;
$$;

-- ============================================================
-- 55. POLICY COUNT VALIDATION
-- ============================================================

do $$
declare
  policy_count integer;
begin
  select count(*)
  into policy_count
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and tablename in (
      'profiles',
      'organizations',
      'schools',
      'campuses',
      'organization_memberships',
      'school_memberships',
      'campus_assignments',
      'roles',
      'permissions',
      'role_permissions',
      'membership_roles',
      'user_permission_overrides'
    );

  if policy_count <> 32 then
    raise exception
      using
        errcode = 'P0001',
        message =
          'Expected 32 identity and tenancy RLS policies, found '
          || policy_count::text
          || '.';
  end if;
end;
$$;

-- ============================================================
-- 56. MIGRATION COMPLETION
-- ============================================================

comment on table public.profiles
is 'TEP application identities synchronized with Supabase Auth and protected by RLS.';

comment on table public.organization_memberships
is 'Organization membership records protected by tenant-aware RLS.';

comment on table public.school_memberships
is 'School membership records protected by tenant-aware RLS.';

comment on table public.campus_assignments
is 'Campus access assignments protected by tenant-aware RLS.';

comment on table public.roles
is 'Tenant-scoped authorization roles protected by permission-aware RLS.';

comment on table public.permissions
is 'Stable Version 1 permission registry controlled by TEP migrations.';

comment on table public.user_permission_overrides
is 'Auditable individual authorization overrides with deny precedence.';

commit;
