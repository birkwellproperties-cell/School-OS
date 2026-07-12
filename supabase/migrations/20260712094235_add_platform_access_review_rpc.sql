-- SchoolOS / Tavaro Enterprise Platform
-- Platform access request review workflow

begin;

create or replace function public.review_platform_access_request(
  target_request_id uuid,
  decision text,
  review_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  normalized_decision text;
  normalized_notes text;
  target_request public.platform_access_requests;
begin
  actor_id := auth.uid();

  if actor_id is null then
    raise exception
      using
        errcode = '42501',
        message = 'Authentication is required.';
  end if;

  if not private.is_platform_administrator(actor_id) then
    raise exception
      using
        errcode = '42501',
        message = 'Platform administrator access is required.';
  end if;

  normalized_decision :=
    lower(nullif(trim(decision), ''));

  normalized_notes :=
    nullif(trim(review_notes), '');

  if normalized_decision not in (
    'under_review',
    'approved',
    'rejected',
    'on_hold'
  ) then
    raise exception
      using
        errcode = '22023',
        message =
          'Decision must be under_review, approved, rejected, or on_hold.';
  end if;

  select par.*
  into target_request
  from public.platform_access_requests par
  where par.id = target_request_id
  for update;

  if target_request.id is null then
    raise exception
      using
        errcode = 'P0002',
        message = 'Platform access request was not found.';
  end if;

  if target_request.request_status in (
    'converted',
    'expired'
  ) then
    raise exception
      using
        errcode = '22023',
        message =
          'Converted or expired requests cannot be reviewed.';
  end if;

  if target_request.request_status = 'approved'
     and normalized_decision <> 'approved'
  then
    raise exception
      using
        errcode = '22023',
        message =
          'Approved requests must be handled through the invitation revocation workflow.';
  end if;

  update public.platform_access_requests
  set
    request_status = normalized_decision,

    review_started_at =
      coalesce(review_started_at, now()),

    reviewed_at = now(),
    reviewed_by = actor_id,
    review_notes = normalized_notes,

    approved_at =
      case
        when normalized_decision = 'approved'
          then coalesce(approved_at, now())
        else approved_at
      end,

    approved_by =
      case
        when normalized_decision = 'approved'
          then coalesce(approved_by, actor_id)
        else approved_by
      end,

    rejected_at =
      case
        when normalized_decision = 'rejected'
          then now()
        else null
      end,

    rejected_by =
      case
        when normalized_decision = 'rejected'
          then actor_id
        else null
      end
  where id = target_request_id
  returning *
  into target_request;

  return jsonb_build_object(
    'success', true,
    'request_id', target_request.id,
    'request_number', target_request.request_number,
    'status', target_request.request_status,
    'review_notes', target_request.review_notes,
    'reviewed_at', target_request.reviewed_at,
    'reviewed_by', target_request.reviewed_by,
    'approved_at', target_request.approved_at,
    'approved_by', target_request.approved_by,
    'rejected_at', target_request.rejected_at,
    'rejected_by', target_request.rejected_by
  );
end;
$$;

comment on function public.review_platform_access_request(
  uuid,
  text,
  text
)
is 'Allows an active Tavaro platform administrator to review and decide a SchoolOS platform access request.';

revoke all
on function public.review_platform_access_request(
  uuid,
  text,
  text
)
from public, anon;

grant execute
on function public.review_platform_access_request(
  uuid,
  text,
  text
)
to authenticated, service_role;

do $$
declare
  function_exists boolean;
begin
  select exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'review_platform_access_request'
      and pg_catalog.pg_get_function_identity_arguments(p.oid)
        = 'target_request_id uuid, decision text, review_notes text'
  )
  into function_exists;

  if not function_exists then
    raise exception
      using
        errcode = 'P0001',
        message =
          'review_platform_access_request function was not created.';
  end if;
end;
$$;

commit;
