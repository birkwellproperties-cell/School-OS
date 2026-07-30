-- ============================================================
-- SchoolOS Enterprise
-- Admission Document Requirements
-- ============================================================
--
-- Provides admission-cycle document checklist configuration.
--
-- Responsibilities:
--   1. Define required and optional documents by admission cycle.
--   2. Link application document records to configured requirements.
--   3. Enforce tenant and admission-cycle consistency.
--   4. Apply enterprise audit and authorization controls.
--
-- Existing permissions reused:
--   applications.view
--   applications.create
--   applications.edit
--   applications.review
-- ============================================================

begin;

-- ============================================================
-- 1. DOCUMENT REQUIREMENT DEFINITIONS
-- ============================================================

create table public.admission_document_requirements (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  campus_id uuid
    references public.campuses(id) on delete restrict,

  admission_cycle_id uuid not null
    references public.admission_cycles(id) on delete cascade,

  document_type text not null,
  document_label text not null,

  requirement_status text not null default 'required'
    check (
      requirement_status in (
        'required',
        'optional',
        'conditionally_required'
      )
    ),

  instructions text,

  display_order integer not null default 0
    check (display_order >= 0),

  accepted_mime_types text[] not null default array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[],

  max_file_size_bytes bigint not null default 10485760
    check (max_file_size_bytes > 0),

  review_required boolean not null default true,

  is_active boolean not null default true,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint admission_document_requirements_type_not_blank
    check (length(trim(document_type)) > 0),

  constraint admission_document_requirements_label_not_blank
    check (length(trim(document_label)) > 0),

  constraint admission_document_requirements_mime_types_not_empty
    check (cardinality(accepted_mime_types) > 0),

  constraint admission_document_requirements_archived_consistency
    check (
      (archived_at is null and archived_by is null)
      or archived_at is not null
    ),

  constraint admission_document_requirements_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    ),

  constraint admission_document_requirements_active_consistency
    check (
      is_active = true
      or archived_at is not null
      or deleted_at is not null
    )
);

comment on table public.admission_document_requirements
is 'Admission-cycle document checklist definitions used to determine application document completion.';

comment on column public.admission_document_requirements.document_type
is 'Stable machine-readable identifier used to match an application document to this requirement.';

comment on column public.admission_document_requirements.requirement_status
is 'Whether the checklist item is required, optional, or conditionally required.';

comment on column public.admission_document_requirements.review_required
is 'Whether an uploaded document must be reviewed and verified before satisfying this requirement.';

comment on column public.admission_document_requirements.display_order
is 'Administrative ordering of checklist items within an admission cycle.';

-- ============================================================
-- 2. INDEXES
-- ============================================================

create unique index admission_document_requirements_active_type_unique_idx
  on public.admission_document_requirements (
    admission_cycle_id,
    lower(document_type)
  )
  where deleted_at is null;

create index admission_document_requirements_organization_idx
  on public.admission_document_requirements (organization_id)
  where deleted_at is null;

create index admission_document_requirements_school_cycle_idx
  on public.admission_document_requirements (
    school_id,
    admission_cycle_id
  )
  where deleted_at is null;

create index admission_document_requirements_cycle_order_idx
  on public.admission_document_requirements (
    admission_cycle_id,
    display_order,
    document_label
  )
  where deleted_at is null
    and is_active = true;

create index admission_document_requirements_campus_idx
  on public.admission_document_requirements (campus_id)
  where campus_id is not null
    and deleted_at is null;

-- ============================================================
-- 3. LINK APPLICATION DOCUMENTS TO REQUIREMENTS
-- ============================================================

alter table public.admission_application_documents
add column requirement_id uuid
  references public.admission_document_requirements(id)
  on delete restrict;

comment on column public.admission_application_documents.requirement_id
is 'Configured admission-cycle document requirement satisfied by this application document.';

create index admission_application_documents_requirement_idx
  on public.admission_application_documents (requirement_id)
  where requirement_id is not null
    and deleted_at is null;

create unique index admission_application_documents_active_requirement_unique_idx
  on public.admission_application_documents (
    application_id,
    requirement_id
  )
  where requirement_id is not null
    and deleted_at is null;

-- ============================================================
-- 4. REQUIREMENT TENANT-SCOPE VALIDATION
-- ============================================================

create or replace function private.validate_admission_document_requirement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_organization_id uuid;
  parent_school_id uuid;
  parent_campus_id uuid;
begin
  if tg_op = 'UPDATE' then
    if new.organization_id is distinct from old.organization_id
       or new.school_id is distinct from old.school_id
       or new.campus_id is distinct from old.campus_id
       or new.admission_cycle_id is distinct from old.admission_cycle_id then
      raise exception
        using
          errcode = '23514',
          message =
            'Admission document requirement tenant scope and admission cycle cannot be changed after creation.';
    end if;
  end if;

  perform private.assert_admissions_scope(
    new.organization_id,
    new.school_id,
    new.campus_id
  );

  select
    ac.organization_id,
    ac.school_id,
    ac.campus_id
  into
    parent_organization_id,
    parent_school_id,
    parent_campus_id
  from public.admission_cycles ac
  where ac.id = new.admission_cycle_id
    and ac.deleted_at is null;

  if parent_school_id is null then
    raise exception
      using
        errcode = '23503',
        message = 'The selected admission cycle does not exist.';
  end if;

  if parent_organization_id <> new.organization_id
     or parent_school_id <> new.school_id
     or (
       parent_campus_id is not null
       and parent_campus_id is distinct from new.campus_id
     ) then
    raise exception
      using
        errcode = '23514',
        message =
          'Document requirement tenant scope does not match its admission cycle.';
  end if;

  return new;
end;
$$;

revoke all
on function private.validate_admission_document_requirement()
from public, anon, authenticated;

create trigger admission_document_requirements_validate_scope
before insert or update
on public.admission_document_requirements
for each row
execute function private.validate_admission_document_requirement();

-- ============================================================
-- 5. APPLICATION DOCUMENT / REQUIREMENT LINK VALIDATION
-- ============================================================

create or replace function private.validate_application_document_requirement_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requirement_organization_id uuid;
  requirement_school_id uuid;
  requirement_cycle_id uuid;
  requirement_document_type text;
  requirement_status_value text;

  application_cycle_id uuid;
begin
  if new.requirement_id is null then
    return new;
  end if;

  select
    adr.organization_id,
    adr.school_id,
    adr.admission_cycle_id,
    adr.document_type,
    adr.requirement_status
  into
    requirement_organization_id,
    requirement_school_id,
    requirement_cycle_id,
    requirement_document_type,
    requirement_status_value
  from public.admission_document_requirements adr
  where adr.id = new.requirement_id
    and adr.deleted_at is null
    and adr.is_active = true;

  if requirement_school_id is null then
    raise exception
      using
        errcode = '23503',
        message =
          'The selected admission document requirement does not exist or is inactive.';
  end if;

  select aa.admission_cycle_id
  into application_cycle_id
  from public.admission_applications aa
  where aa.id = new.application_id
    and aa.deleted_at is null;

  if application_cycle_id is null then
    raise exception
      using
        errcode = '23503',
        message = 'The selected admission application does not exist.';
  end if;

  if requirement_organization_id <> new.organization_id
     or requirement_school_id <> new.school_id then
    raise exception
      using
        errcode = '23514',
        message =
          'Application document tenant scope does not match its configured requirement.';
  end if;

  if requirement_cycle_id <> application_cycle_id then
    raise exception
      using
        errcode = '23514',
        message =
          'Application document requirement does not belong to the application admission cycle.';
  end if;

  if lower(trim(requirement_document_type))
     <> lower(trim(new.document_type)) then
    raise exception
      using
        errcode = '23514',
        message =
          'Application document type does not match its configured requirement.';
  end if;

  if new.requirement_status <> requirement_status_value then
    raise exception
      using
        errcode = '23514',
        message =
          'Application document requirement status must match the configured requirement.';
  end if;

  return new;
end;
$$;

revoke all
on function private.validate_application_document_requirement_link()
from public, anon, authenticated;

create trigger admission_application_documents_validate_requirement_link
before insert or update of
  requirement_id,
  application_id,
  organization_id,
  school_id,
  document_type,
  requirement_status
on public.admission_application_documents
for each row
execute function private.validate_application_document_requirement_link();

-- ============================================================
-- 6. STANDARD AUDIT TRIGGERS
-- ============================================================

create trigger admission_document_requirements_set_updated_at
before update
on public.admission_document_requirements
for each row
execute function public.set_updated_at();

create trigger admission_document_requirements_set_audit_actor
before insert or update
on public.admission_document_requirements
for each row
execute function private.set_admissions_audit_actor();

-- ============================================================
-- 7. ROW-LEVEL SECURITY
-- ============================================================

alter table public.admission_document_requirements
enable row level security;

create policy admission_document_requirements_select_authorized
on public.admission_document_requirements
for select
to authenticated
using (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.view'
  )
);

create policy admission_document_requirements_insert_authorized
on public.admission_document_requirements
for insert
to authenticated
with check (
  deleted_at is null
  and (
    private.has_school_permission(
      school_id,
      'applications.create'
    )
    or private.has_school_permission(
      school_id,
      'applications.edit'
    )
  )
);

create policy admission_document_requirements_update_authorized
on public.admission_document_requirements
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
);

-- No DELETE policy is intentionally provided.
-- Requirements are archived or soft-deleted through UPDATE.

-- ============================================================
-- 8. TABLE PRIVILEGES
-- ============================================================

revoke all
on table public.admission_document_requirements
from anon;

revoke all
on table public.admission_document_requirements
from authenticated;

grant select, insert, update
on table public.admission_document_requirements
to authenticated;

-- Existing application-document privileges remain unchanged.

-- ============================================================
-- 9. VALIDATION
-- ============================================================

do $$
declare
  table_count integer;
  rls_enabled boolean;
  policy_count integer;
  requirement_column_count integer;
  trigger_count integer;
begin
  select count(*)
  into table_count
  from information_schema.tables
  where table_schema = 'public'
    and table_name = 'admission_document_requirements';

  if table_count <> 1 then
    raise exception
      'Expected admission_document_requirements table to exist.';
  end if;

  select c.relrowsecurity
  into rls_enabled
  from pg_class c
  join pg_namespace n
    on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'admission_document_requirements';

  if coalesce(rls_enabled, false) is not true then
    raise exception
      'RLS is not enabled on admission_document_requirements.';
  end if;

  select count(*)
  into policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'admission_document_requirements'
    and policyname in (
      'admission_document_requirements_select_authorized',
      'admission_document_requirements_insert_authorized',
      'admission_document_requirements_update_authorized'
    );

  if policy_count <> 3 then
    raise exception
      'Expected 3 admission document requirement policies, found %.',
      policy_count;
  end if;

  select count(*)
  into requirement_column_count
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'admission_application_documents'
    and column_name = 'requirement_id';

  if requirement_column_count <> 1 then
    raise exception
      'Expected requirement_id on admission_application_documents.';
  end if;

  select count(distinct trigger_name)
  into trigger_count
  from information_schema.triggers
  where event_object_schema = 'public'
    and (
      (
        event_object_table = 'admission_document_requirements'
        and trigger_name in (
          'admission_document_requirements_validate_scope',
          'admission_document_requirements_set_updated_at',
          'admission_document_requirements_set_audit_actor'
        )
      )
      or (
        event_object_table = 'admission_application_documents'
        and trigger_name =
          'admission_application_documents_validate_requirement_link'
      )
    );

  if trigger_count <> 4 then
    raise exception
      'Expected 4 document requirement triggers, found %.',
      trigger_count;
  end if;
end;
$$;

commit;