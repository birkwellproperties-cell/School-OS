-- ============================================================
-- SchoolOS Enterprise
-- Automatic Admission Application Document Completion
-- ============================================================

begin;

-- ============================================================
-- 1. CALCULATE REQUIREMENT-AWARE DOCUMENT COMPLETION
-- ============================================================

create or replace function private.calculate_admission_application_document_progress(
  target_application_id uuid
)
returns table (
  required_count integer,
  completed_count integer,
  completion_percentage numeric,
  documents_complete boolean
)
language sql
security definer
stable
set search_path = ''
as $$
  with application_scope as (
    select
      aa.id,
      aa.admission_cycle_id
    from public.admission_applications aa
    where aa.id = target_application_id
      and aa.deleted_at is null
  ),
  active_requirements as (
    select
      adr.id,
      adr.review_required
    from public.admission_document_requirements adr
    join application_scope scope
      on scope.admission_cycle_id =
         adr.admission_cycle_id
    where adr.deleted_at is null
      and adr.archived_at is null
      and adr.is_active = true
      and adr.requirement_status in (
        'required',
        'conditionally_required'
      )
  ),
  requirement_results as (
    select
      requirement.id,
      exists (
        select 1
        from public.admission_application_documents document
        where document.application_id =
              target_application_id
          and document.requirement_id =
              requirement.id
          and document.deleted_at is null
          and (
            document.status = 'waived'
            or (
              requirement.review_required = true
              and document.status = 'verified'
            )
            or (
              requirement.review_required = false
              and document.status in (
                'uploaded',
                'under_review',
                'verified'
              )
            )
          )
      ) as completed
    from active_requirements requirement
  ),
  totals as (
    select
      count(*)::integer as required_count,
      count(*) filter (
        where completed
      )::integer as completed_count
    from requirement_results
  )
  select
    totals.required_count,
    totals.completed_count,
    case
      when totals.required_count = 0
        then 0::numeric
      else round(
        (
          totals.completed_count::numeric
          /
          totals.required_count::numeric
        ) * 100,
        2
      )
    end as completion_percentage,
    totals.required_count > 0
      and totals.completed_count =
          totals.required_count
      as documents_complete
  from totals;
$$;

revoke all
on function private.calculate_admission_application_document_progress(uuid)
from public, anon, authenticated;

-- ============================================================
-- 2. SYNCHRONIZE APPLICATION COMPLETION AND DOCUMENT STATUS
-- ============================================================

create or replace function private.synchronize_admission_application_document_progress(
  target_application_id uuid
)
returns public.admission_applications
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_application
    public.admission_applications%rowtype;

  progress record;

  next_status text;
begin
  select *
  into current_application
  from public.admission_applications
  where id = target_application_id
    and deleted_at is null
  for update;

  if not found then
    return null;
  end if;

  select *
  into progress
  from private.calculate_admission_application_document_progress(
    target_application_id
  );

  next_status :=
    current_application.status;

  -- Draft applications remain drafts until explicitly submitted.
  -- Later workflow statuses must never be overwritten by document sync.
  if current_application.status in (
    'submitted',
    'documents_pending',
    'under_review'
  ) then
    if progress.documents_complete then
      next_status := 'under_review';
    else
      next_status := 'documents_pending';
    end if;
  end if;

  update public.admission_applications
  set
    completion_percentage =
      progress.completion_percentage,

    status =
      next_status,

    review_started_at =
      case
        when next_status = 'under_review'
          and review_started_at is null
          then now()
        else review_started_at
      end,

    review_completed_at =
      case
        when next_status <> 'under_review'
          then null
        else review_completed_at
      end
  where id = target_application_id
  returning *
  into current_application;

  return current_application;
end;
$$;

revoke all
on function private.synchronize_admission_application_document_progress(uuid)
from public, anon, authenticated;

-- ============================================================
-- 3. DOCUMENT MUTATION TRIGGER
-- ============================================================

create or replace function private.sync_application_progress_from_document()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_application_id uuid;
begin
  affected_application_id :=
    case
      when tg_op = 'DELETE'
        then old.application_id
      else new.application_id
    end;

  perform private.synchronize_admission_application_document_progress(
    affected_application_id
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all
on function private.sync_application_progress_from_document()
from public, anon, authenticated;

drop trigger if exists
  admission_application_documents_sync_application_progress
on public.admission_application_documents;

create trigger
  admission_application_documents_sync_application_progress
after insert or update or delete
on public.admission_application_documents
for each row
execute function private.sync_application_progress_from_document();

-- ============================================================
-- 4. REQUIREMENT MUTATION TRIGGER
-- ============================================================

create or replace function private.sync_application_progress_from_requirement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_cycle_id uuid;
  application_record record;
begin
  affected_cycle_id :=
    case
      when tg_op = 'DELETE'
        then old.admission_cycle_id
      else new.admission_cycle_id
    end;

  for application_record in
    select aa.id
    from public.admission_applications aa
    where aa.admission_cycle_id =
          affected_cycle_id
      and aa.deleted_at is null
  loop
    perform private.synchronize_admission_application_document_progress(
      application_record.id
    );
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all
on function private.sync_application_progress_from_requirement()
from public, anon, authenticated;

drop trigger if exists
  admission_document_requirements_sync_application_progress
on public.admission_document_requirements;

create trigger
  admission_document_requirements_sync_application_progress
after insert or update or delete
on public.admission_document_requirements
for each row
execute function private.sync_application_progress_from_requirement();

-- ============================================================
-- 5. INITIAL BACKFILL
-- ============================================================

do $$
declare
  application_record record;
begin
  for application_record in
    select id
    from public.admission_applications
    where deleted_at is null
  loop
    perform private.synchronize_admission_application_document_progress(
      application_record.id
    );
  end loop;
end;
$$;

-- ============================================================
-- 6. VALIDATION
-- ============================================================

do $$
declare
  function_count integer;
  trigger_count integer;
begin
  select count(*)
  into function_count
  from pg_proc procedure
  join pg_namespace namespace
    on namespace.oid =
       procedure.pronamespace
  where namespace.nspname = 'private'
    and procedure.proname in (
      'calculate_admission_application_document_progress',
      'synchronize_admission_application_document_progress',
      'sync_application_progress_from_document',
      'sync_application_progress_from_requirement'
    );

  if function_count <> 4 then
    raise exception
      'Expected 4 application progress functions, found %.',
      function_count;
  end if;

  select count(distinct trigger_name)
  into trigger_count
  from information_schema.triggers
  where event_object_schema = 'public'
    and trigger_name in (
      'admission_application_documents_sync_application_progress',
      'admission_document_requirements_sync_application_progress'
    );

  if trigger_count <> 2 then
    raise exception
      'Expected 2 application progress triggers, found %.',
      trigger_count;
  end if;
end;
$$;

commit;
