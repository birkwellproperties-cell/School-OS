begin;

-- ============================================================
-- SchoolOS Enterprise
-- Assessment Center
-- Phase 1.2A — Authoring Taxonomy and Question Banks
-- ============================================================

-- ============================================================
-- 1. ASSESSMENT BANKS
-- ============================================================

create table public.assessment_banks (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete restrict,

  school_id uuid not null
    references public.schools(id)
    on delete restrict,

  campus_id uuid
    references public.campuses(id)
    on delete restrict,

  name text not null,
  code text not null,
  description text,

  bank_type text not null default 'question_bank',

  visibility text not null default 'private',

  status text not null default 'draft',

  owner_id uuid
    references public.profiles(id)
    on delete set null,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid
    references public.profiles(id)
    on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid
    references public.profiles(id)
    on delete set null,

  archived_at timestamptz,
  archived_by uuid
    references public.profiles(id)
    on delete set null,

  deleted_at timestamptz,
  deleted_by uuid
    references public.profiles(id)
    on delete set null,

  constraint assessment_banks_name_not_blank
    check (
      length(trim(name)) > 0
    ),

  constraint assessment_banks_code_not_blank
    check (
      length(trim(code)) > 0
    ),

  constraint assessment_banks_code_format
    check (
      code ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'
    ),

  constraint assessment_banks_type_check
    check (
      bank_type in (
        'question_bank',
        'item_bank',
        'shared_library',
        'publisher_library',
        'practice_library'
      )
    ),

  constraint assessment_banks_visibility_check
    check (
      visibility in (
        'private',
        'school',
        'organization',
        'public'
      )
    ),

  constraint assessment_banks_status_check
    check (
      status in (
        'draft',
        'active',
        'archived'
      )
    ),

  constraint assessment_banks_archive_consistency
    check (
      (
        status <> 'archived'
        and archived_at is null
        and archived_by is null
      )
      or (
        status = 'archived'
        and archived_at is not null
      )
    ),

  constraint assessment_banks_deleted_consistency
    check (
      (
        deleted_at is null
        and deleted_by is null
      )
      or deleted_at is not null
    )
);

comment on table public.assessment_banks
is 'Tenant-scoped reusable repositories for assessment questions and authoring content.';

create unique index assessment_banks_active_code_unique_idx
  on public.assessment_banks (
    school_id,
    lower(code)
  )
  where deleted_at is null;

create index assessment_banks_organization_idx
  on public.assessment_banks (
    organization_id
  )
  where deleted_at is null;

create index assessment_banks_school_status_idx
  on public.assessment_banks (
    school_id,
    status,
    created_at desc
  )
  where deleted_at is null;

create index assessment_banks_campus_idx
  on public.assessment_banks (
    campus_id
  )
  where campus_id is not null
    and deleted_at is null;

create index assessment_banks_owner_idx
  on public.assessment_banks (
    owner_id,
    status
  )
  where owner_id is not null
    and deleted_at is null;

create trigger assessment_banks_set_updated_at
before update on public.assessment_banks
for each row
execute function public.set_updated_at();

-- ============================================================
-- 2. ASSESSMENT CATEGORIES
-- ============================================================

create table public.assessment_categories (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete restrict,

  school_id uuid not null
    references public.schools(id)
    on delete restrict,

  parent_category_id uuid
    references public.assessment_categories(id)
    on delete restrict,

  name text not null,
  code text not null,
  description text,

  display_order integer not null default 0,

  status text not null default 'active',

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid
    references public.profiles(id)
    on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid
    references public.profiles(id)
    on delete set null,

  archived_at timestamptz,
  archived_by uuid
    references public.profiles(id)
    on delete set null,

  deleted_at timestamptz,
  deleted_by uuid
    references public.profiles(id)
    on delete set null,

  constraint assessment_categories_name_not_blank
    check (
      length(trim(name)) > 0
    ),

  constraint assessment_categories_code_not_blank
    check (
      length(trim(code)) > 0
    ),

  constraint assessment_categories_code_format
    check (
      code ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'
    ),

  constraint assessment_categories_order_check
    check (
      display_order >= 0
    ),

  constraint assessment_categories_status_check
    check (
      status in (
        'active',
        'inactive',
        'archived'
      )
    ),

  constraint assessment_categories_archive_consistency
    check (
      (
        status <> 'archived'
        and archived_at is null
        and archived_by is null
      )
      or (
        status = 'archived'
        and archived_at is not null
      )
    ),

  constraint assessment_categories_deleted_consistency
    check (
      (
        deleted_at is null
        and deleted_by is null
      )
      or deleted_at is not null
    )
);

comment on table public.assessment_categories
is 'Hierarchical assessment-use categories such as Admissions, Academics, HR, Certification, and Competitions.';

create unique index assessment_categories_active_code_unique_idx
  on public.assessment_categories (
    school_id,
    lower(code)
  )
  where deleted_at is null;

create index assessment_categories_parent_idx
  on public.assessment_categories (
    parent_category_id,
    display_order
  )
  where parent_category_id is not null
    and deleted_at is null;

create index assessment_categories_school_status_idx
  on public.assessment_categories (
    school_id,
    status,
    display_order
  )
  where deleted_at is null;

create trigger assessment_categories_set_updated_at
before update on public.assessment_categories
for each row
execute function public.set_updated_at();

-- ============================================================
-- 3. ASSESSMENT SUBJECTS
-- ============================================================

create table public.assessment_subjects (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete restrict,

  school_id uuid not null
    references public.schools(id)
    on delete restrict,

  category_id uuid
    references public.assessment_categories(id)
    on delete restrict,

  name text not null,
  code text not null,
  description text,

  grade_level_from text,
  grade_level_to text,

  display_order integer not null default 0,

  status text not null default 'active',

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid
    references public.profiles(id)
    on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid
    references public.profiles(id)
    on delete set null,

  archived_at timestamptz,
  archived_by uuid
    references public.profiles(id)
    on delete set null,

  deleted_at timestamptz,
  deleted_by uuid
    references public.profiles(id)
    on delete set null,

  constraint assessment_subjects_name_not_blank
    check (
      length(trim(name)) > 0
    ),

  constraint assessment_subjects_code_not_blank
    check (
      length(trim(code)) > 0
    ),

  constraint assessment_subjects_code_format
    check (
      code ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'
    ),

  constraint assessment_subjects_order_check
    check (
      display_order >= 0
    ),

  constraint assessment_subjects_status_check
    check (
      status in (
        'active',
        'inactive',
        'archived'
      )
    ),

  constraint assessment_subjects_archive_consistency
    check (
      (
        status <> 'archived'
        and archived_at is null
        and archived_by is null
      )
      or (
        status = 'archived'
        and archived_at is not null
      )
    ),

  constraint assessment_subjects_deleted_consistency
    check (
      (
        deleted_at is null
        and deleted_by is null
      )
      or deleted_at is not null
    )
);

comment on table public.assessment_subjects
is 'School-defined academic and non-academic subjects used to classify assessment content.';

create unique index assessment_subjects_active_code_unique_idx
  on public.assessment_subjects (
    school_id,
    lower(code)
  )
  where deleted_at is null;

create index assessment_subjects_category_idx
  on public.assessment_subjects (
    category_id,
    display_order
  )
  where category_id is not null
    and deleted_at is null;

create index assessment_subjects_school_status_idx
  on public.assessment_subjects (
    school_id,
    status,
    display_order
  )
  where deleted_at is null;

create trigger assessment_subjects_set_updated_at
before update on public.assessment_subjects
for each row
execute function public.set_updated_at();

-- ============================================================
-- 4. ASSESSMENT TOPICS
-- ============================================================

create table public.assessment_topics (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete restrict,

  school_id uuid not null
    references public.schools(id)
    on delete restrict,

  subject_id uuid not null
    references public.assessment_subjects(id)
    on delete restrict,

  parent_topic_id uuid
    references public.assessment_topics(id)
    on delete restrict,

  name text not null,
  code text not null,
  description text,

  learning_outcome text,

  display_order integer not null default 0,

  status text not null default 'active',

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid
    references public.profiles(id)
    on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid
    references public.profiles(id)
    on delete set null,

  archived_at timestamptz,
  archived_by uuid
    references public.profiles(id)
    on delete set null,

  deleted_at timestamptz,
  deleted_by uuid
    references public.profiles(id)
    on delete set null,

  constraint assessment_topics_name_not_blank
    check (
      length(trim(name)) > 0
    ),

  constraint assessment_topics_code_not_blank
    check (
      length(trim(code)) > 0
    ),

  constraint assessment_topics_code_format
    check (
      code ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'
    ),

  constraint assessment_topics_order_check
    check (
      display_order >= 0
    ),

  constraint assessment_topics_status_check
    check (
      status in (
        'active',
        'inactive',
        'archived'
      )
    ),

  constraint assessment_topics_archive_consistency
    check (
      (
        status <> 'archived'
        and archived_at is null
        and archived_by is null
      )
      or (
        status = 'archived'
        and archived_at is not null
      )
    ),

  constraint assessment_topics_deleted_consistency
    check (
      (
        deleted_at is null
        and deleted_by is null
      )
      or deleted_at is not null
    )
);

comment on table public.assessment_topics
is 'Hierarchical subject topics and learning outcomes used to classify reusable assessment questions.';

create unique index assessment_topics_active_code_unique_idx
  on public.assessment_topics (
    subject_id,
    lower(code)
  )
  where deleted_at is null;

create index assessment_topics_subject_status_idx
  on public.assessment_topics (
    subject_id,
    status,
    display_order
  )
  where deleted_at is null;

create index assessment_topics_parent_idx
  on public.assessment_topics (
    parent_topic_id,
    display_order
  )
  where parent_topic_id is not null
    and deleted_at is null;

create trigger assessment_topics_set_updated_at
before update on public.assessment_topics
for each row
execute function public.set_updated_at();

-- ============================================================
-- 5. TENANT CONSISTENCY VALIDATION
-- ============================================================

create or replace function private.validate_assessment_authoring_taxonomy_tenant()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  parent_organization_id uuid;
  parent_school_id uuid;
begin
  if not exists (
    select 1
    from public.schools s
    where s.id = new.school_id
      and s.organization_id = new.organization_id
      and s.status = 'active'
      and s.deleted_at is null
  ) then
    raise exception
      using
        errcode = '23514',
        message =
          'The selected school does not belong to the selected organization or is inactive.';
  end if;

  if new.campus_id is not null then
    if not exists (
      select 1
      from public.campuses c
      where c.id = new.campus_id
        and c.organization_id = new.organization_id
        and c.school_id = new.school_id
        and c.status = 'active'
        and c.deleted_at is null
    ) then
      raise exception
        using
          errcode = '23514',
          message =
            'The selected campus does not belong to the selected organization and school or is inactive.';
    end if;
  end if;

  return new;
end;
$$;

revoke all
on function private.validate_assessment_authoring_taxonomy_tenant()
from public, anon, authenticated;

create trigger assessment_banks_validate_tenant
before insert or update
on public.assessment_banks
for each row
execute function private.validate_assessment_authoring_taxonomy_tenant();

create or replace function private.validate_assessment_category_parent()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  parent_record public.assessment_categories%rowtype;
begin
  if new.parent_category_id is null then
    return new;
  end if;

  if new.parent_category_id = new.id then
    raise exception
      using
        errcode = '23514',
        message =
          'An assessment category cannot be its own parent.';
  end if;

  select *
  into parent_record
  from public.assessment_categories
  where id = new.parent_category_id
    and deleted_at is null;

  if parent_record.id is null then
    raise exception
      using
        errcode = '23503',
        message =
          'The parent assessment category could not be found.';
  end if;

  if
    parent_record.organization_id <> new.organization_id
    or parent_record.school_id <> new.school_id
  then
    raise exception
      using
        errcode = '23514',
        message =
          'The parent assessment category must belong to the same organization and school.';
  end if;

  return new;
end;
$$;

revoke all
on function private.validate_assessment_category_parent()
from public, anon, authenticated;

create trigger assessment_categories_validate_parent
before insert or update
on public.assessment_categories
for each row
execute function private.validate_assessment_category_parent();

create or replace function private.validate_assessment_subject_tenant()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  category_record public.assessment_categories%rowtype;
begin
  if not exists (
    select 1
    from public.schools s
    where s.id = new.school_id
      and s.organization_id = new.organization_id
      and s.status = 'active'
      and s.deleted_at is null
  ) then
    raise exception
      using
        errcode = '23514',
        message =
          'The selected school does not belong to the selected organization or is inactive.';
  end if;

  if new.category_id is not null then
    select *
    into category_record
    from public.assessment_categories
    where id = new.category_id
      and deleted_at is null;

    if category_record.id is null then
      raise exception
        using
          errcode = '23503',
          message =
            'The selected assessment category could not be found.';
    end if;

    if
      category_record.organization_id <> new.organization_id
      or category_record.school_id <> new.school_id
    then
      raise exception
        using
          errcode = '23514',
          message =
            'The selected assessment category must belong to the same organization and school.';
    end if;
  end if;

  return new;
end;
$$;

revoke all
on function private.validate_assessment_subject_tenant()
from public, anon, authenticated;

create trigger assessment_subjects_validate_tenant
before insert or update
on public.assessment_subjects
for each row
execute function private.validate_assessment_subject_tenant();

create or replace function private.validate_assessment_topic_tenant()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  subject_record public.assessment_subjects%rowtype;
  parent_record public.assessment_topics%rowtype;
begin
  select *
  into subject_record
  from public.assessment_subjects
  where id = new.subject_id
    and deleted_at is null;

  if subject_record.id is null then
    raise exception
      using
        errcode = '23503',
        message =
          'The selected assessment subject could not be found.';
  end if;

  if
    subject_record.organization_id <> new.organization_id
    or subject_record.school_id <> new.school_id
  then
    raise exception
      using
        errcode = '23514',
        message =
          'The selected assessment subject must belong to the same organization and school.';
  end if;

  if new.parent_topic_id is not null then
    if new.parent_topic_id = new.id then
      raise exception
        using
          errcode = '23514',
          message =
            'An assessment topic cannot be its own parent.';
    end if;

    select *
    into parent_record
    from public.assessment_topics
    where id = new.parent_topic_id
      and deleted_at is null;

    if parent_record.id is null then
      raise exception
        using
          errcode = '23503',
          message =
            'The parent assessment topic could not be found.';
    end if;

    if
      parent_record.organization_id <> new.organization_id
      or parent_record.school_id <> new.school_id
      or parent_record.subject_id <> new.subject_id
    then
      raise exception
        using
          errcode = '23514',
          message =
            'The parent topic must belong to the same organization, school, and subject.';
    end if;
  end if;

  return new;
end;
$$;

revoke all
on function private.validate_assessment_topic_tenant()
from public, anon, authenticated;

create trigger assessment_topics_validate_tenant
before insert or update
on public.assessment_topics
for each row
execute function private.validate_assessment_topic_tenant();

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

alter table public.assessment_banks
  enable row level security;

alter table public.assessment_banks
  force row level security;

alter table public.assessment_categories
  enable row level security;

alter table public.assessment_categories
  force row level security;

alter table public.assessment_subjects
  enable row level security;

alter table public.assessment_subjects
  force row level security;

alter table public.assessment_topics
  enable row level security;

alter table public.assessment_topics
  force row level security;

-- ============================================================
-- 7. ASSESSMENT BANK POLICIES
-- ============================================================

create policy assessment_banks_select_authorized
on public.assessment_banks
for select
to authenticated
using (
  deleted_at is null
  and (
    private.has_school_permission(
      school_id,
      'assessments.view'
    )
    or private.has_organization_permission(
      organization_id,
      'assessments.view'
    )
  )
);

create policy assessment_banks_insert_authorized
on public.assessment_banks
for insert
to authenticated
with check (
  private.has_school_permission(
    school_id,
    'assessments.create'
  )
  or private.has_organization_permission(
    organization_id,
    'assessments.create'
  )
);

create policy assessment_banks_update_authorized
on public.assessment_banks
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'assessments.edit'
  )
  or private.has_organization_permission(
    organization_id,
    'assessments.edit'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'assessments.edit'
  )
  or private.has_organization_permission(
    organization_id,
    'assessments.edit'
  )
);

-- ============================================================
-- 8. TAXONOMY POLICIES
-- ============================================================

create policy assessment_categories_select_authorized
on public.assessment_categories
for select
to authenticated
using (
  deleted_at is null
  and (
    private.has_school_permission(
      school_id,
      'assessments.view'
    )
    or private.has_organization_permission(
      organization_id,
      'assessments.view'
    )
  )
);

create policy assessment_categories_insert_authorized
on public.assessment_categories
for insert
to authenticated
with check (
  private.has_school_permission(
    school_id,
    'assessments.create'
  )
  or private.has_organization_permission(
    organization_id,
    'assessments.create'
  )
);

create policy assessment_categories_update_authorized
on public.assessment_categories
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'assessments.edit'
  )
  or private.has_organization_permission(
    organization_id,
    'assessments.edit'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'assessments.edit'
  )
  or private.has_organization_permission(
    organization_id,
    'assessments.edit'
  )
);

create policy assessment_subjects_select_authorized
on public.assessment_subjects
for select
to authenticated
using (
  deleted_at is null
  and (
    private.has_school_permission(
      school_id,
      'assessments.view'
    )
    or private.has_organization_permission(
      organization_id,
      'assessments.view'
    )
  )
);

create policy assessment_subjects_insert_authorized
on public.assessment_subjects
for insert
to authenticated
with check (
  private.has_school_permission(
    school_id,
    'assessments.create'
  )
  or private.has_organization_permission(
    organization_id,
    'assessments.create'
  )
);

create policy assessment_subjects_update_authorized
on public.assessment_subjects
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'assessments.edit'
  )
  or private.has_organization_permission(
    organization_id,
    'assessments.edit'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'assessments.edit'
  )
  or private.has_organization_permission(
    organization_id,
    'assessments.edit'
  )
);

create policy assessment_topics_select_authorized
on public.assessment_topics
for select
to authenticated
using (
  deleted_at is null
  and (
    private.has_school_permission(
      school_id,
      'assessments.view'
    )
    or private.has_organization_permission(
      organization_id,
      'assessments.view'
    )
  )
);

create policy assessment_topics_insert_authorized
on public.assessment_topics
for insert
to authenticated
with check (
  private.has_school_permission(
    school_id,
    'assessments.create'
  )
  or private.has_organization_permission(
    organization_id,
    'assessments.create'
  )
);

create policy assessment_topics_update_authorized
on public.assessment_topics
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'assessments.edit'
  )
  or private.has_organization_permission(
    organization_id,
    'assessments.edit'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'assessments.edit'
  )
  or private.has_organization_permission(
    organization_id,
    'assessments.edit'
  )
);

-- ============================================================
-- 9. TABLE PRIVILEGES
-- ============================================================

grant select, insert
on table public.assessment_banks
to authenticated;

grant update (
  name,
  code,
  description,
  bank_type,
  visibility,
  status,
  owner_id,
  metadata,
  updated_by,
  archived_at,
  archived_by,
  deleted_at,
  deleted_by
)
on table public.assessment_banks
to authenticated;

grant select, insert
on table public.assessment_categories
to authenticated;

grant update (
  parent_category_id,
  name,
  code,
  description,
  display_order,
  status,
  metadata,
  updated_by,
  archived_at,
  archived_by,
  deleted_at,
  deleted_by
)
on table public.assessment_categories
to authenticated;

grant select, insert
on table public.assessment_subjects
to authenticated;

grant update (
  category_id,
  name,
  code,
  description,
  grade_level_from,
  grade_level_to,
  display_order,
  status,
  metadata,
  updated_by,
  archived_at,
  archived_by,
  deleted_at,
  deleted_by
)
on table public.assessment_subjects
to authenticated;

grant select, insert
on table public.assessment_topics
to authenticated;

grant update (
  subject_id,
  parent_topic_id,
  name,
  code,
  description,
  learning_outcome,
  display_order,
  status,
  metadata,
  updated_by,
  archived_at,
  archived_by,
  deleted_at,
  deleted_by
)
on table public.assessment_topics
to authenticated;

commit;