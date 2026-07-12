-- SchoolOS / Tavaro Enterprise Platform
-- Current-user authorization API
--
-- Exposes the existing private authorization engine through
-- narrowly scoped, authenticated public RPC functions.

begin;

-- ============================================================
-- 1. CURRENT USER HAS PERMISSION
-- ============================================================

create or replace function public.current_user_has_permission(
  target_permission_code text,
  target_organization_id uuid,
  target_school_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  normalized_permission_code text;
  permission_exists boolean;
  organization_is_accessible boolean;
  school_is_accessible boolean;
begin
  actor_id := auth.uid();

  if actor_id is null then
    return false;
  end if;

  normalized_permission_code :=
    lower(nullif(trim(target_permission_code), ''));

  if normalized_permission_code is null
     or target_organization_id is null
  then
    return false;
  end if;

  if not private.is_profile_active() then
    return false;
  end if;

  select exists (
    select 1
    from public.permissions p
    where lower(p.code) = normalized_permission_code
  )
  into permission_exists;

  if not permission_exists then
    return false;
  end if;

  select exists (
    select 1
    from public.organization_memberships om
    join public.organizations o
      on o.id = om.organization_id
    where om.profile_id = actor_id
      and om.organization_id = target_organization_id
      and om.membership_status = 'active'
      and o.status = 'active'
      and o.deleted_at is null
  )
  into organization_is_accessible;

  if not organization_is_accessible then
    return false;
  end if;

  if target_school_id is null then
    return private.has_organization_permission(
      target_organization_id,
      normalized_permission_code
    );
  end if;

  select exists (
    select 1
    from public.school_memberships sm
    join public.schools s
      on s.id = sm.school_id
    where sm.profile_id = actor_id
      and sm.organization_id = target_organization_id
      and sm.school_id = target_school_id
      and sm.membership_status = 'active'
      and s.organization_id = target_organization_id
      and s.status = 'active'
      and s.deleted_at is null
  )
  into school_is_accessible;

  if not school_is_accessible then
    return false;
  end if;

  return private.has_school_permission(
    target_school_id,
    normalized_permission_code
  );
end;
$$;

comment on function public.current_user_has_permission(
  text,
  uuid,
  uuid
)
is 'Returns whether the authenticated active user has the requested effective permission in the supplied organization or school context.';

revoke all
on function public.current_user_has_permission(
  text,
  uuid,
  uuid
)
from public, anon;

grant execute
on function public.current_user_has_permission(
  text,
  uuid,
  uuid
)
to authenticated, service_role;

-- ============================================================
-- 2. CURRENT EFFECTIVE PERMISSIONS
-- ============================================================

create or replace function public.get_current_effective_permissions(
  target_organization_id uuid,
  target_school_id uuid default null
)
returns table (
  permission_id uuid,
  permission_code text,
  permission_module text,
  permission_action text,
  permission_description text,
  risk_level text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  organization_is_accessible boolean;
  school_is_accessible boolean;
begin
  actor_id := auth.uid();

  if actor_id is null then
    raise exception
      using
        errcode = '42501',
        message = 'Authentication is required.';
  end if;

  if target_organization_id is null then
    raise exception
      using
        errcode = '22023',
        message = 'Organization context is required.';
  end if;

  if not private.is_profile_active() then
    raise exception
      using
        errcode = '42501',
        message = 'An active SchoolOS profile is required.';
  end if;

  select exists (
    select 1
    from public.organization_memberships om
    join public.organizations o
      on o.id = om.organization_id
    where om.profile_id = actor_id
      and om.organization_id = target_organization_id
      and om.membership_status = 'active'
      and o.status = 'active'
      and o.deleted_at is null
  )
  into organization_is_accessible;

  if not organization_is_accessible then
    raise exception
      using
        errcode = '42501',
        message =
          'The requested organization is not available to the current user.';
  end if;

  if target_school_id is not null then
    select exists (
      select 1
      from public.school_memberships sm
      join public.schools s
        on s.id = sm.school_id
      where sm.profile_id = actor_id
        and sm.organization_id = target_organization_id
        and sm.school_id = target_school_id
        and sm.membership_status = 'active'
        and s.organization_id = target_organization_id
        and s.status = 'active'
        and s.deleted_at is null
    )
    into school_is_accessible;

    if not school_is_accessible then
      raise exception
        using
          errcode = '42501',
          message =
            'The requested school is not available to the current user.';
    end if;
  end if;

  return query
  select
    p.id,
    p.code,
    p.module,
    p.action,
    p.description,
    p.risk_level
  from public.permissions p
  where
    case
      when target_school_id is null then
        private.has_organization_permission(
          target_organization_id,
          p.code
        )
      else
        private.has_school_permission(
          target_school_id,
          p.code
        )
    end
  order by
    p.module,
    p.action,
    p.code;
end;
$$;

comment on function public.get_current_effective_permissions(
  uuid,
  uuid
)
is 'Returns the authenticated user effective permission registry for an accessible organization or school context.';

revoke all
on function public.get_current_effective_permissions(
  uuid,
  uuid
)
from public, anon;

grant execute
on function public.get_current_effective_permissions(
  uuid,
  uuid
)
to authenticated, service_role;

-- ============================================================
-- 3. CURRENT AUTHORIZATION CONTEXT
-- ============================================================

create or replace function public.get_current_authorization_context(
  target_organization_id uuid,
  target_school_id uuid,
  target_campus_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  profile_record public.profiles;
  organization_record public.organizations;
  school_record public.schools;
  campus_record public.campuses;
  organization_membership_record public.organization_memberships;
  school_membership_record public.school_memberships;
  campus_assignment_record public.campus_assignments;
  resolved_roles jsonb;
  resolved_permissions jsonb;
begin
  actor_id := auth.uid();

  if actor_id is null then
    raise exception
      using
        errcode = '42501',
        message = 'Authentication is required.';
  end if;

  if target_organization_id is null then
    raise exception
      using
        errcode = '22023',
        message = 'Organization context is required.';
  end if;

  if target_school_id is null then
    raise exception
      using
        errcode = '22023',
        message = 'School context is required.';
  end if;

  select p.*
  into profile_record
  from public.profiles p
  where p.id = actor_id
    and p.account_status = 'active';

  if profile_record.id is null then
    raise exception
      using
        errcode = '42501',
        message = 'An active SchoolOS profile is required.';
  end if;

  select o.*
  into organization_record
  from public.organizations o
  where o.id = target_organization_id
    and o.status = 'active'
    and o.deleted_at is null;

  if organization_record.id is null then
    raise exception
      using
        errcode = '42501',
        message = 'The requested organization is unavailable.';
  end if;

  select om.*
  into organization_membership_record
  from public.organization_memberships om
  where om.organization_id = target_organization_id
    and om.profile_id = actor_id
    and om.membership_status = 'active';

  if organization_membership_record.id is null then
    raise exception
      using
        errcode = '42501',
        message =
          'An active organization membership is required.';
  end if;

  select s.*
  into school_record
  from public.schools s
  where s.id = target_school_id
    and s.organization_id = target_organization_id
    and s.status = 'active'
    and s.deleted_at is null;

  if school_record.id is null then
    raise exception
      using
        errcode = '42501',
        message =
          'The requested school is unavailable in this organization.';
  end if;

  select sm.*
  into school_membership_record
  from public.school_memberships sm
  where sm.organization_id = target_organization_id
    and sm.school_id = target_school_id
    and sm.profile_id = actor_id
    and sm.membership_status = 'active';

  if school_membership_record.id is null then
    raise exception
      using
        errcode = '42501',
        message = 'An active school membership is required.';
  end if;

  if target_campus_id is not null then
    select c.*
    into campus_record
    from public.campuses c
    where c.id = target_campus_id
      and c.organization_id = target_organization_id
      and c.school_id = target_school_id
      and c.status = 'active'
      and c.deleted_at is null;

    if campus_record.id is null then
      raise exception
        using
          errcode = '42501',
          message =
            'The requested campus is unavailable in this school.';
    end if;

    select ca.*
    into campus_assignment_record
    from public.campus_assignments ca
    where ca.organization_id = target_organization_id
      and ca.school_id = target_school_id
      and ca.campus_id = target_campus_id
      and ca.profile_id = actor_id
      and ca.assignment_status = 'active'
      and ca.start_date <= current_date
      and (
        ca.end_date is null
        or ca.end_date >= current_date
      );

    if campus_assignment_record.id is null then
      raise exception
        using
          errcode = '42501',
          message = 'An active campus assignment is required.';
    end if;
  else
    select ca.*
    into campus_assignment_record
    from public.campus_assignments ca
    where ca.organization_id = target_organization_id
      and ca.school_id = target_school_id
      and ca.profile_id = actor_id
      and ca.assignment_status = 'active'
      and ca.start_date <= current_date
      and (
        ca.end_date is null
        or ca.end_date >= current_date
      )
    order by
      ca.is_primary desc,
      ca.start_date asc,
      ca.created_at asc
    limit 1;

    if campus_assignment_record.id is not null then
      select c.*
      into campus_record
      from public.campuses c
      where c.id = campus_assignment_record.campus_id
        and c.status = 'active'
        and c.deleted_at is null;
    end if;
  end if;

  select coalesce(
    jsonb_agg(
      distinct jsonb_build_object(
        'id', r.id,
        'name', r.name,
        'code', r.code,
        'scope_type', r.scope_type,
        'organization_id', r.organization_id,
        'school_id', r.school_id,
        'is_system_role', r.is_system_role
      )
    ),
    '[]'::jsonb
  )
  into resolved_roles
  from public.membership_roles mr
  join public.roles r
    on r.id = mr.role_id
  where mr.revoked_at is null
    and r.status = 'active'
    and (
      (
        mr.membership_type = 'organization'
        and mr.membership_id =
          organization_membership_record.id
      )
      or
      (
        mr.membership_type = 'school'
        and mr.membership_id =
          school_membership_record.id
      )
    );

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', permission_rows.permission_id,
        'code', permission_rows.permission_code,
        'module', permission_rows.permission_module,
        'action', permission_rows.permission_action,
        'description',
          permission_rows.permission_description,
        'risk_level', permission_rows.risk_level
      )
      order by
        permission_rows.permission_module,
        permission_rows.permission_action,
        permission_rows.permission_code
    ),
    '[]'::jsonb
  )
  into resolved_permissions
  from public.get_current_effective_permissions(
    target_organization_id,
    target_school_id
  ) permission_rows;

  return jsonb_build_object(
    'authenticated', true,

    'profile',
      jsonb_build_object(
        'id', profile_record.id,
        'full_name', profile_record.full_name,
        'preferred_name', profile_record.preferred_name,
        'email', profile_record.email,
        'phone', profile_record.phone,
        'avatar_url', profile_record.avatar_url,
        'locale', profile_record.locale,
        'timezone', profile_record.timezone,
        'account_status', profile_record.account_status
      ),

    'organization',
      jsonb_build_object(
        'id', organization_record.id,
        'name', organization_record.name,
        'legal_name', organization_record.legal_name,
        'country_code', organization_record.country_code,
        'default_currency',
          organization_record.default_currency,
        'timezone', organization_record.timezone,
        'status', organization_record.status
      ),

    'school',
      jsonb_build_object(
        'id', school_record.id,
        'organization_id', school_record.organization_id,
        'name', school_record.name,
        'school_code', school_record.school_code,
        'school_type', school_record.school_type,
        'country_code', school_record.country_code,
        'default_currency', school_record.default_currency,
        'timezone', school_record.timezone,
        'logo_url', school_record.logo_url,
        'status', school_record.status
      ),

    'campus',
      case
        when campus_record.id is null then null
        else jsonb_build_object(
          'id', campus_record.id,
          'organization_id', campus_record.organization_id,
          'school_id', campus_record.school_id,
          'name', campus_record.name,
          'campus_code', campus_record.campus_code,
          'country_code', campus_record.country_code,
          'is_primary', campus_record.is_primary,
          'status', campus_record.status
        )
      end,

    'organization_membership',
      jsonb_build_object(
        'id', organization_membership_record.id,
        'organization_id',
          organization_membership_record.organization_id,
        'membership_status',
          organization_membership_record.membership_status,
        'joined_at', organization_membership_record.joined_at
      ),

    'school_membership',
      jsonb_build_object(
        'id', school_membership_record.id,
        'organization_id',
          school_membership_record.organization_id,
        'school_id', school_membership_record.school_id,
        'membership_status',
          school_membership_record.membership_status,
        'joined_at', school_membership_record.joined_at
      ),

    'campus_assignment',
      case
        when campus_assignment_record.id is null then null
        else jsonb_build_object(
          'id', campus_assignment_record.id,
          'organization_id',
            campus_assignment_record.organization_id,
          'school_id', campus_assignment_record.school_id,
          'campus_id', campus_assignment_record.campus_id,
          'is_primary', campus_assignment_record.is_primary,
          'assignment_status',
            campus_assignment_record.assignment_status,
          'start_date', campus_assignment_record.start_date,
          'end_date', campus_assignment_record.end_date
        )
      end,

    'roles', resolved_roles,
    'permissions', resolved_permissions,
    'resolved_at', now()
  );
end;
$$;

comment on function public.get_current_authorization_context(
  uuid,
  uuid,
  uuid
)
is 'Returns the authenticated user validated SchoolOS tenant context, active roles, and effective permissions.';

revoke all
on function public.get_current_authorization_context(
  uuid,
  uuid,
  uuid
)
from public, anon;

grant execute
on function public.get_current_authorization_context(
  uuid,
  uuid,
  uuid
)
to authenticated, service_role;

-- ============================================================
-- 4. AUTHORIZATION API VALIDATION
-- ============================================================

do $$
declare
  missing_functions text;
begin
  select string_agg(required_function, ', ')
  into missing_functions
  from (
    values
      (
        'public.current_user_has_permission(text,uuid,uuid)'
      ),
      (
        'public.get_current_effective_permissions(uuid,uuid)'
      ),
      (
        'public.get_current_authorization_context(uuid,uuid,uuid)'
      )
  ) required(required_function)
  where to_regprocedure(required_function) is null;

  if missing_functions is not null then
    raise exception
      using
        errcode = 'P0001',
        message =
          'Authorization API functions were not created: ' ||
          missing_functions;
  end if;
end;
$$;

commit;
