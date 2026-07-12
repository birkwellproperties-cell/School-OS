-- SchoolOS / Tavaro Enterprise Platform
-- Controlled platform access and organization onboarding
-- Migration: 20260712092507_create_platform_access_control.sql

begin;

-- ============================================================
-- 1. REQUEST NUMBER SEQUENCE
-- ============================================================

create sequence public.platform_access_request_number_seq
  as bigint
  start with 1000
  increment by 1
  no minvalue
  no maxvalue
  cache 1;

comment on sequence public.platform_access_request_number_seq
is 'Generates non-secret human-readable SchoolOS access request numbers.';

-- ============================================================
-- 2. PLATFORM ADMINISTRATORS
-- ============================================================

create table public.platform_administrators (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid not null
    references public.profiles(id) on delete restrict,

  administrator_status text not null default 'active'
    check (
      administrator_status in (
        'active',
        'suspended',
        'revoked'
      )
    ),

  granted_at timestamptz not null default now(),
  granted_by uuid
    references public.profiles(id) on delete set null,

  suspended_at timestamptz,
  suspended_by uuid
    references public.profiles(id) on delete set null,

  revoked_at timestamptz,
  revoked_by uuid
    references public.profiles(id) on delete set null,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint platform_administrators_status_dates_check
    check (
      (
        administrator_status = 'active'
        and suspended_at is null
        and suspended_by is null
        and revoked_at is null
        and revoked_by is null
      )
      or
      (
        administrator_status = 'suspended'
        and suspended_at is not null
        and revoked_at is null
        and revoked_by is null
      )
      or
      (
        administrator_status = 'revoked'
        and revoked_at is not null
      )
    )
);

comment on table public.platform_administrators
is 'Tavaro platform operators authorized to review and approve SchoolOS tenant access.';

create unique index platform_administrators_profile_unique_idx
  on public.platform_administrators (profile_id);

create index platform_administrators_active_idx
  on public.platform_administrators (profile_id)
  where administrator_status = 'active';

create index platform_administrators_granted_by_idx
  on public.platform_administrators (granted_by);

create trigger platform_administrators_set_updated_at
before update on public.platform_administrators
for each row
execute function public.set_updated_at();

-- ============================================================
-- 3. PLATFORM ACCESS REQUESTS
-- ============================================================

create table public.platform_access_requests (
  id uuid primary key default gen_random_uuid(),

  request_number text not null,

  organization_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,

  country_code char(2) not null,

  estimated_student_count integer,
  campus_count integer not null default 1,

  requested_plan text,
  request_notes text,

  request_status text not null default 'submitted'
    check (
      request_status in (
        'submitted',
        'under_review',
        'approved',
        'rejected',
        'on_hold',
        'converted',
        'expired'
      )
    ),

  submitted_at timestamptz not null default now(),

  review_started_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid
    references public.profiles(id) on delete set null,

  review_notes text,

  approved_at timestamptz,
  approved_by uuid
    references public.profiles(id) on delete set null,

  rejected_at timestamptz,
  rejected_by uuid
    references public.profiles(id) on delete set null,

  converted_at timestamptz,
  converted_organization_id uuid
    references public.organizations(id) on delete restrict,

  source_ip_hash text,
  user_agent text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint platform_access_requests_request_number_not_blank
    check (length(trim(request_number)) > 0),

  constraint platform_access_requests_organization_name_not_blank
    check (length(trim(organization_name)) > 0),

  constraint platform_access_requests_contact_name_not_blank
    check (length(trim(contact_name)) > 0),

  constraint platform_access_requests_contact_email_not_blank
    check (length(trim(contact_email)) > 0),

  constraint platform_access_requests_contact_email_normalized
    check (contact_email = lower(trim(contact_email))),

  constraint platform_access_requests_country_code_uppercase
    check (country_code = upper(country_code)),

  constraint platform_access_requests_estimated_students_positive
    check (
      estimated_student_count is null
      or estimated_student_count > 0
    ),

  constraint platform_access_requests_campus_count_positive
    check (campus_count > 0),

  constraint platform_access_requests_review_consistency
    check (
      (
        request_status = 'submitted'
        and reviewed_at is null
        and reviewed_by is null
      )
      or request_status <> 'submitted'
    ),

  constraint platform_access_requests_approval_consistency
    check (
      (
        request_status in ('approved', 'converted')
        and approved_at is not null
        and approved_by is not null
      )
      or request_status not in ('approved', 'converted')
    ),

  constraint platform_access_requests_rejection_consistency
    check (
      (
        request_status = 'rejected'
        and rejected_at is not null
        and rejected_by is not null
      )
      or request_status <> 'rejected'
    ),

  constraint platform_access_requests_conversion_consistency
    check (
      (
        request_status = 'converted'
        and converted_at is not null
        and converted_organization_id is not null
      )
      or
      (
        request_status <> 'converted'
        and converted_at is null
        and converted_organization_id is null
      )
    )
);

comment on table public.platform_access_requests
is 'Prospective SchoolOS tenant access requests submitted for Tavaro review.';

create unique index platform_access_requests_number_unique_idx
  on public.platform_access_requests (request_number);

create index platform_access_requests_status_submitted_idx
  on public.platform_access_requests (
    request_status,
    submitted_at desc
  );

create index platform_access_requests_email_idx
  on public.platform_access_requests (lower(contact_email));

create index platform_access_requests_reviewed_by_idx
  on public.platform_access_requests (reviewed_by);

create index platform_access_requests_approved_by_idx
  on public.platform_access_requests (approved_by);

create unique index platform_access_requests_open_email_unique_idx
  on public.platform_access_requests (lower(contact_email))
  where request_status in (
    'submitted',
    'under_review',
    'approved',
    'on_hold'
  );

create trigger platform_access_requests_set_updated_at
before update on public.platform_access_requests
for each row
execute function public.set_updated_at();

-- ============================================================
-- 4. PLATFORM ADMINISTRATOR AUTHORIZATION
-- ============================================================

create or replace function private.is_platform_administrator(
  target_profile_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_administrators pa
    join public.profiles p
      on p.id = pa.profile_id
    where pa.profile_id = target_profile_id
      and pa.administrator_status = 'active'
      and p.account_status = 'active'
  );
$$;

comment on function private.is_platform_administrator(uuid)
is 'Returns true when the supplied profile is an active Tavaro platform administrator.';

revoke all
on function private.is_platform_administrator(uuid)
from public, anon, authenticated;

grant execute
on function private.is_platform_administrator(uuid)
to authenticated, service_role;

-- ============================================================
-- 5. REQUEST NUMBER GENERATION
-- ============================================================

create or replace function private.next_platform_access_request_number()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  next_value bigint;
begin
  next_value :=
    nextval('public.platform_access_request_number_seq');

  return
    'SOS-' ||
    to_char(current_date, 'YYYY') ||
    '-' ||
    lpad(next_value::text, 6, '0');
end;
$$;

comment on function private.next_platform_access_request_number()
is 'Generates a human-readable SchoolOS platform access request number.';

revoke all
on function private.next_platform_access_request_number()
from public, anon, authenticated;

grant execute
on function private.next_platform_access_request_number()
to service_role;

-- ============================================================
-- 6. PUBLIC ACCESS REQUEST SUBMISSION RPC
-- ============================================================

create or replace function public.submit_platform_access_request(
  organization_name text,
  contact_name text,
  contact_email text,
  contact_phone text default null,
  country_code text default null,
  estimated_student_count integer default null,
  campus_count integer default 1,
  requested_plan text default null,
  request_notes text default null,
  user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_organization_name text;
  normalized_contact_name text;
  normalized_email text;
  normalized_country_code text;
  normalized_phone text;
  normalized_plan text;
  normalized_notes text;

  existing_request public.platform_access_requests;
  created_request public.platform_access_requests;
begin
  normalized_organization_name :=
    nullif(trim(organization_name), '');

  normalized_contact_name :=
    nullif(trim(contact_name), '');

  normalized_email :=
    lower(nullif(trim(contact_email), ''));

  normalized_country_code :=
    upper(nullif(trim(country_code), ''));

  normalized_phone :=
    nullif(trim(contact_phone), '');

  normalized_plan :=
    nullif(trim(requested_plan), '');

  normalized_notes :=
    nullif(trim(request_notes), '');

  if normalized_organization_name is null then
    raise exception
      using
        errcode = '22023',
        message = 'Organization name is required.';
  end if;

  if normalized_contact_name is null then
    raise exception
      using
        errcode = '22023',
        message = 'Contact name is required.';
  end if;

  if normalized_email is null
     or normalized_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  then
    raise exception
      using
        errcode = '22023',
        message = 'A valid contact email address is required.';
  end if;

  if normalized_country_code is null
     or length(normalized_country_code) <> 2
     or normalized_country_code !~ '^[A-Z]{2}$'
  then
    raise exception
      using
        errcode = '22023',
        message = 'A valid two-letter country code is required.';
  end if;

  if estimated_student_count is not null
     and estimated_student_count <= 0
  then
    raise exception
      using
        errcode = '22023',
        message = 'Estimated student count must be greater than zero.';
  end if;

  if campus_count is null or campus_count <= 0 then
    raise exception
      using
        errcode = '22023',
        message = 'Campus count must be greater than zero.';
  end if;

  select par.*
  into existing_request
  from public.platform_access_requests par
  where lower(par.contact_email) = normalized_email
    and par.request_status in (
      'submitted',
      'under_review',
      'approved',
      'on_hold'
    )
  order by par.submitted_at desc
  limit 1;

  if existing_request.id is not null then
    return jsonb_build_object(
      'success', true,
      'request_id', existing_request.id,
      'request_number', existing_request.request_number,
      'status', existing_request.request_status,
      'already_exists', true,
      'message',
        'An active SchoolOS access request already exists for this email address.'
    );
  end if;

  insert into public.platform_access_requests (
    request_number,
    organization_name,
    contact_name,
    contact_email,
    contact_phone,
    country_code,
    estimated_student_count,
    campus_count,
    requested_plan,
    request_notes,
    request_status,
    submitted_at,
    user_agent
  )
  values (
    private.next_platform_access_request_number(),
    normalized_organization_name,
    normalized_contact_name,
    normalized_email,
    normalized_phone,
    normalized_country_code,
    estimated_student_count,
    campus_count,
    normalized_plan,
    normalized_notes,
    'submitted',
    now(),
    nullif(left(trim(user_agent), 1000), '')
  )
  returning *
  into created_request;

  return jsonb_build_object(
    'success', true,
    'request_id', created_request.id,
    'request_number', created_request.request_number,
    'status', created_request.request_status,
    'already_exists', false,
    'message',
      'Your SchoolOS access request has been submitted for review.'
  );
end;
$$;

comment on function public.submit_platform_access_request(
  text,
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  text,
  text
)
is 'Submits a prospective SchoolOS organization request without creating an Auth account or tenant.';

revoke all
on function public.submit_platform_access_request(
  text,
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  text,
  text
)
from public;

grant execute
on function public.submit_platform_access_request(
  text,
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  text,
  text
)
to anon, authenticated, service_role;

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

alter table public.platform_administrators
  enable row level security;

alter table public.platform_administrators
  force row level security;

alter table public.platform_access_requests
  enable row level security;

alter table public.platform_access_requests
  force row level security;

create policy platform_administrators_select_self_or_platform_admin
on public.platform_administrators
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or
  (select private.is_platform_administrator())
);

create policy platform_access_requests_select_platform_admin
on public.platform_access_requests
for select
to authenticated
using (
  (select private.is_platform_administrator())
);

create policy platform_access_requests_update_platform_admin
on public.platform_access_requests
for update
to authenticated
using (
  (select private.is_platform_administrator())
)
with check (
  (select private.is_platform_administrator())
);

-- No direct INSERT policy is created for access requests.
-- Public submission is available only through the dedicated RPC.

-- No direct INSERT or UPDATE policy is created for platform administrators.
-- Platform-administrator lifecycle operations require service-role execution.

-- ============================================================
-- 8. PRIVILEGE RESTRICTIONS
-- ============================================================

revoke all
on table public.platform_administrators
from public, anon, authenticated;

revoke all
on table public.platform_access_requests
from public, anon, authenticated;

grant select
on table public.platform_administrators
to authenticated;

grant select, update
on table public.platform_access_requests
to authenticated;

grant all privileges
on table public.platform_administrators
to service_role;

grant all privileges
on table public.platform_access_requests
to service_role;

revoke all
on sequence public.platform_access_request_number_seq
from public, anon, authenticated;

grant usage, select
on sequence public.platform_access_request_number_seq
to service_role;

-- ============================================================
-- 9. VALIDATION
-- ============================================================

do $$
declare
  missing_table text;
  rls_missing text;
begin
  select string_agg(expected.table_name, ', ')
  into missing_table
  from (
    values
      ('platform_administrators'),
      ('platform_access_requests')
  ) as expected(table_name)
  left join pg_catalog.pg_class c
    on c.relname = expected.table_name
  left join pg_catalog.pg_namespace n
    on n.oid = c.relnamespace
   and n.nspname = 'public'
  where c.oid is null;

  if missing_table is not null then
    raise exception
      using
        errcode = 'P0001',
        message =
          'Missing platform access tables: ' || missing_table;
  end if;

  select string_agg(c.relname, ', ')
  into rls_missing
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n
    on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in (
      'platform_administrators',
      'platform_access_requests'
    )
    and (
      c.relrowsecurity = false
      or c.relforcerowsecurity = false
    );

  if rls_missing is not null then
    raise exception
      using
        errcode = 'P0001',
        message =
          'RLS is not fully enforced on: ' || rls_missing;
  end if;
end;
$$;

commit;
