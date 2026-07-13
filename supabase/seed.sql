-- ============================================================
-- SCHOOLOS LOCAL DEVELOPMENT SEED
-- ============================================================
--
-- Local-only credentials:
--   Email:    admin@test.com
--   Password: SchoolOS123!
--
-- Never reuse these credentials in staging or production.
-- ============================================================

begin;

create extension if not exists pgcrypto;

-- Stable local development identifiers.

do $$
declare
  local_user_id uuid :=
    '922e3774-428d-44ec-8381-021d820ffe7c';

  local_identity_id uuid :=
    'f4010d14-0953-4ebf-8579-4a59eb3e9234';

  local_organization_id uuid :=
    '11111111-1111-4111-8111-111111111111';

  local_school_id uuid :=
    '22222222-2222-4222-8222-222222222222';

  local_campus_id uuid :=
    '33333333-3333-4333-8333-333333333333';

  local_organization_membership_id uuid :=
    '44444444-4444-4444-8444-444444444444';

  local_school_membership_id uuid :=
    '55555555-5555-4555-8555-555555555555';

  local_campus_assignment_id uuid :=
    '66666666-6666-4666-8666-666666666666';

  local_school_admin_role_id uuid :=
    '77777777-7777-4777-8777-777777777777';
begin
  -- ==========================================================
  -- 1. LOCAL AUTH USER
  -- ==========================================================

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    is_sso_user,
    is_anonymous,
    created_at,
    updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    local_user_id,
    'authenticated',
    'authenticated',
    'admin@test.com',
    crypt(
      'SchoolOS123!',
      gen_salt('bf')
    ),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    jsonb_build_object(
      'provider',
      'email',
      'providers',
      jsonb_build_array('email')
    ),
    jsonb_build_object(
      'full_name',
      'SchoolOS Administrator',
      'preferred_name',
      'Administrator'
    ),
    false,
    false,
    false,
    now(),
    now()
  )
  on conflict (id)
  do update set
    email = excluded.email,
    encrypted_password =
      excluded.encrypted_password,
    email_confirmed_at =
      excluded.email_confirmed_at,
    raw_app_meta_data =
      excluded.raw_app_meta_data,
    raw_user_meta_data =
      excluded.raw_user_meta_data,
    updated_at = now(),
    deleted_at = null,
    banned_until = null;

  insert into auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    local_identity_id,
    local_user_id::text,
    local_user_id,
    jsonb_build_object(
      'sub',
      local_user_id::text,
      'email',
      'admin@test.com',
      'email_verified',
      true,
      'phone_verified',
      false
    ),
    'email',
    now(),
    now(),
    now()
  )
  on conflict (id)
  do update set
    provider_id = excluded.provider_id,
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    provider = excluded.provider,
    updated_at = now();

  -- The auth-user trigger normally creates this record.
  -- The upsert also makes the seed resilient if that trigger changes.

  insert into public.profiles (
    id,
    full_name,
    preferred_name,
    email,
    locale,
    timezone,
    account_status,
    created_at,
    updated_at
  )
  values (
    local_user_id,
    'SchoolOS Administrator',
    'Administrator',
    'admin@test.com',
    'en-US',
    'America/Chicago',
    'active',
    now(),
    now()
  )
  on conflict (id)
  do update set
    full_name = excluded.full_name,
    preferred_name =
      excluded.preferred_name,
    email = excluded.email,
    locale = excluded.locale,
    timezone = excluded.timezone,
    account_status = 'active',
    updated_at = now();

  -- ==========================================================
  -- 2. LOCAL ORGANIZATION
  -- ==========================================================

  insert into public.organizations (
    id,
    name,
    legal_name,
    country_code,
    default_currency,
    timezone,
    status,
    created_by,
    updated_by
  )
  values (
    local_organization_id,
    'SchoolOS Test Organization',
    'SchoolOS Test Organization',
    'US',
    'USD',
    'America/Chicago',
    'active',
    local_user_id,
    local_user_id
  )
  on conflict (id)
  do update set
    name = excluded.name,
    legal_name = excluded.legal_name,
    country_code = excluded.country_code,
    default_currency =
      excluded.default_currency,
    timezone = excluded.timezone,
    status = 'active',
    updated_by = local_user_id,
    updated_at = now(),
    deleted_at = null,
    archived_at = null;

  -- ==========================================================
  -- 3. LOCAL SCHOOL
  -- ==========================================================

  insert into public.schools (
    id,
    organization_id,
    name,
    legal_name,
    school_code,
    school_type,
    email,
    country_code,
    default_currency,
    timezone,
    status,
    created_by,
    updated_by
  )
  values (
    local_school_id,
    local_organization_id,
    'SchoolOS Test School',
    'SchoolOS Test School',
    'TEST-SCHOOL',
    'independent',
    'admin@test.com',
    'US',
    'USD',
    'America/Chicago',
    'active',
    local_user_id,
    local_user_id
  )
  on conflict (id)
  do update set
    organization_id =
      excluded.organization_id,
    name = excluded.name,
    legal_name = excluded.legal_name,
    school_code = excluded.school_code,
    school_type = excluded.school_type,
    email = excluded.email,
    country_code = excluded.country_code,
    default_currency =
      excluded.default_currency,
    timezone = excluded.timezone,
    status = 'active',
    updated_by = local_user_id,
    updated_at = now(),
    deleted_at = null,
    archived_at = null;

  -- ==========================================================
  -- 4. LOCAL CAMPUS
  -- ==========================================================

  insert into public.campuses (
    id,
    organization_id,
    school_id,
    name,
    campus_code,
    email,
    country_code,
    is_primary,
    status,
    created_by,
    updated_by
  )
  values (
    local_campus_id,
    local_organization_id,
    local_school_id,
    'Main Campus',
    'MAIN',
    'admin@test.com',
    'US',
    true,
    'active',
    local_user_id,
    local_user_id
  )
  on conflict (id)
  do update set
    organization_id =
      excluded.organization_id,
    school_id = excluded.school_id,
    name = excluded.name,
    campus_code = excluded.campus_code,
    email = excluded.email,
    country_code = excluded.country_code,
    is_primary = true,
    status = 'active',
    updated_by = local_user_id,
    updated_at = now(),
    deleted_at = null,
    archived_at = null;

  -- ==========================================================
  -- 5. ACTIVE MEMBERSHIPS
  -- ==========================================================

  insert into public.organization_memberships (
    id,
    organization_id,
    profile_id,
    membership_status,
    invited_at,
    invited_by,
    joined_at,
    created_at,
    updated_at
  )
  values (
    local_organization_membership_id,
    local_organization_id,
    local_user_id,
    'active',
    now(),
    local_user_id,
    now(),
    now(),
    now()
  )
  on conflict (
    organization_id,
    profile_id
  )
  do update set
    membership_status = 'active',
    invited_by = local_user_id,
    joined_at = coalesce(
      public.organization_memberships.joined_at,
      now()
    ),
    suspended_at = null,
    archived_at = null,
    updated_at = now();

  insert into public.school_memberships (
    id,
    organization_id,
    school_id,
    profile_id,
    membership_status,
    invited_at,
    invited_by,
    joined_at,
    created_at,
    updated_at
  )
  values (
    local_school_membership_id,
    local_organization_id,
    local_school_id,
    local_user_id,
    'active',
    now(),
    local_user_id,
    now(),
    now(),
    now()
  )
  on conflict (
    school_id,
    profile_id
  )
  do update set
    organization_id =
      excluded.organization_id,
    membership_status = 'active',
    invited_by = local_user_id,
    joined_at = coalesce(
      public.school_memberships.joined_at,
      now()
    ),
    suspended_at = null,
    archived_at = null,
    updated_at = now();

  insert into public.campus_assignments (
    id,
    organization_id,
    school_id,
    campus_id,
    profile_id,
    is_primary,
    assignment_status,
    start_date,
    created_by,
    updated_by
  )
  values (
    local_campus_assignment_id,
    local_organization_id,
    local_school_id,
    local_campus_id,
    local_user_id,
    true,
    'active',
    current_date,
    local_user_id,
    local_user_id
  )
  on conflict (
    campus_id,
    profile_id
  )
  do update set
    organization_id =
      excluded.organization_id,
    school_id = excluded.school_id,
    is_primary = true,
    assignment_status = 'active',
    start_date = excluded.start_date,
    end_date = null,
    updated_by = local_user_id,
    updated_at = now();

  -- ==========================================================
  -- 6. SCHOOL ADMINISTRATOR ROLE
  -- ==========================================================

  insert into public.roles (
    id,
    organization_id,
    school_id,
    name,
    code,
    description,
    scope_type,
    is_system_role,
    status,
    created_by,
    updated_by
  )
  values (
    local_school_admin_role_id,
    local_organization_id,
    local_school_id,
    'School Administrator',
    'school_administrator',
    'Full administrative access to the local SchoolOS test school.',
    'school',
    true,
    'active',
    local_user_id,
    local_user_id
  )
  on conflict (id)
  do update set
    organization_id =
      excluded.organization_id,
    school_id = excluded.school_id,
    name = excluded.name,
    code = excluded.code,
    description = excluded.description,
    scope_type = 'school',
    is_system_role = true,
    status = 'active',
    updated_by = local_user_id,
    updated_at = now(),
    archived_at = null;

  -- Grant every registered SchoolOS permission to the local
  -- School Administrator. This is deliberate for development.

  insert into public.role_permissions (
    role_id,
    permission_id,
    granted_at,
    granted_by
  )
  select
    local_school_admin_role_id,
    p.id,
    now(),
    local_user_id
  from public.permissions p
  on conflict (
    role_id,
    permission_id
  )
  do nothing;

  -- Assign the school role to the active school membership.

  insert into public.membership_roles (
    organization_id,
    school_id,
    membership_type,
    membership_id,
    role_id,
    assigned_at,
    assigned_by
  )
  values (
    local_organization_id,
    local_school_id,
    'school',
    local_school_membership_id,
    local_school_admin_role_id,
    now(),
    local_user_id
  )
  on conflict (
    membership_type,
    membership_id,
    role_id
  )
  where revoked_at is null
  do update set
    organization_id =
      excluded.organization_id,
    school_id = excluded.school_id,
    assigned_by = local_user_id,
    assigned_at = now();

  -- ==========================================================
  -- 7. LOCAL PLATFORM ADMINISTRATOR
  -- ==========================================================

  insert into public.platform_administrators (
    profile_id,
    administrator_status,
    granted_at,
    granted_by
  )
  values (
    local_user_id,
    'active',
    now(),
    local_user_id
  )
  on conflict (profile_id)
  do update set
    administrator_status = 'active',
    granted_by = local_user_id,
    granted_at = now(),
    suspended_at = null,
    suspended_by = null,
    revoked_at = null,
    revoked_by = null,
    updated_at = now();
end;
$$;

commit;