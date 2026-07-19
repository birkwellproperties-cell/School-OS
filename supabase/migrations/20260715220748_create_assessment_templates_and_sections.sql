begin;

-- ============================================================
-- SchoolOS Enterprise
-- Assessment Center
-- Phase 1.2C — Templates, Sections, and Question Composition
-- Part 1 — Assessment Templates
-- ============================================================

-- ============================================================
-- 1. ASSESSMENT TEMPLATES
-- ============================================================

create table public.assessment_templates (
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

  category_id uuid
    references public.assessment_categories(id)
    on delete restrict,

  subject_id uuid
    references public.assessment_subjects(id)
    on delete restrict,

  bank_id uuid
    references public.assessment_banks(id)
    on delete restrict,

  template_number text not null,

  name text not null,

  code text not null,

  description text,

  instructions text,

  assessment_type text not null default 'exam',

  delivery_mode text not null default 'online',

  audience_type text not null default 'admission_applicant',

  grade_level text,

  language_code text not null default 'en',

  duration_minutes integer,

  maximum_attempts integer not null default 1,

  passing_score numeric(12, 4),

  passing_percentage numeric(8, 4),

  maximum_score numeric(12, 4),

  question_count integer not null default 0,

  section_count integer not null default 0,

  shuffle_sections boolean not null default false,

  shuffle_questions boolean not null default false,

  shuffle_options boolean not null default false,

  show_question_numbers boolean not null default true,

  allow_question_navigation boolean not null default true,

  allow_back_navigation boolean not null default true,

  allow_review_before_submit boolean not null default true,

  require_all_questions boolean not null default false,

  auto_submit_on_timeout boolean not null default true,

  show_remaining_time boolean not null default true,

  show_progress boolean not null default true,

  show_score_after_submission boolean not null default false,

  show_correct_answers_after_submission boolean not null default false,

  show_explanations_after_submission boolean not null default false,

  calculator_policy text not null default 'not_allowed',

  resource_policy text not null default 'closed_book',

  fullscreen_policy text not null default 'optional',

  tab_switch_policy text not null default 'log_only',

  copy_paste_policy text not null default 'disabled',

  proctoring_mode text not null default 'none',

  security_config jsonb not null default '{}'::jsonb,

  grading_config jsonb not null default '{}'::jsonb,

  delivery_config jsonb not null default '{}'::jsonb,

  availability_config jsonb not null default '{}'::jsonb,

  status text not null default 'draft',

  version_number integer not null default 1,

  published_at timestamptz,

  published_by uuid
    references public.profiles(id)
    on delete set null,

  retired_at timestamptz,

  retired_by uuid
    references public.profiles(id)
    on delete set null,

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

  constraint assessment_templates_number_not_blank
    check (
      length(trim(template_number)) > 0
    ),

  constraint assessment_templates_name_not_blank
    check (
      length(trim(name)) > 0
    ),

  constraint assessment_templates_code_not_blank
    check (
      length(trim(code)) > 0
    ),

  constraint assessment_templates_code_format
    check (
      code ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'
    ),

  constraint assessment_templates_type_check
    check (
      assessment_type in (
        'exam',
        'quiz',
        'practice',
        'placement',
        'entrance_exam',
        'diagnostic',
        'certification',
        'survey',
        'evaluation',
        'competition',
        'custom'
      )
    ),

  constraint assessment_templates_delivery_mode_check
    check (
      delivery_mode in (
        'online',
        'in_person',
        'uploaded_document',
        'external'
      )
    ),

  constraint assessment_templates_audience_type_check
    check (
      audience_type in (
        'admission_applicant',
        'student',
        'staff',
        'candidate',
        'guardian',
        'external_candidate',
        'mixed'
      )
    ),

  constraint assessment_templates_language_code_check
    check (
      language_code ~ '^[A-Za-z]{2}(-[A-Za-z]{2})?$'
    ),

  constraint assessment_templates_duration_check
    check (
      duration_minutes is null
      or duration_minutes > 0
    ),

  constraint assessment_templates_attempts_check
    check (
      maximum_attempts > 0
    ),

  constraint assessment_templates_passing_score_check
    check (
      passing_score is null
      or passing_score >= 0
    ),

  constraint assessment_templates_passing_percentage_check
    check (
      passing_percentage is null
      or (
        passing_percentage >= 0
        and passing_percentage <= 100
      )
    ),

  constraint assessment_templates_maximum_score_check
    check (
      maximum_score is null
      or maximum_score > 0
    ),

  constraint assessment_templates_passing_score_consistency
    check (
      passing_score is null
      or maximum_score is null
      or passing_score <= maximum_score
    ),

  constraint assessment_templates_question_count_check
    check (
      question_count >= 0
    ),

  constraint assessment_templates_section_count_check
    check (
      section_count >= 0
    ),

  constraint assessment_templates_calculator_policy_check
    check (
      calculator_policy in (
        'not_allowed',
        'basic',
        'scientific',
        'provided',
        'unrestricted'
      )
    ),

  constraint assessment_templates_resource_policy_check
    check (
      resource_policy in (
        'closed_book',
        'open_book',
        'provided_resources',
        'unrestricted'
      )
    ),

  constraint assessment_templates_fullscreen_policy_check
    check (
      fullscreen_policy in (
        'disabled',
        'optional',
        'required'
      )
    ),

  constraint assessment_templates_tab_switch_policy_check
    check (
      tab_switch_policy in (
        'ignore',
        'log_only',
        'warn',
        'limit',
        'terminate'
      )
    ),

  constraint assessment_templates_copy_paste_policy_check
    check (
      copy_paste_policy in (
        'enabled',
        'disabled',
        'log_only'
      )
    ),

  constraint assessment_templates_proctoring_mode_check
    check (
      proctoring_mode in (
        'none',
        'browser_events',
        'live',
        'recorded',
        'external'
      )
    ),

  constraint assessment_templates_status_check
    check (
      status in (
        'draft',
        'review',
        'approved',
        'published',
        'paused',
        'retired',
        'archived'
      )
    ),

  constraint assessment_templates_version_check
    check (
      version_number > 0
    ),

  constraint assessment_templates_publish_consistency
    check (
      status <> 'published'
      or (
        published_at is not null
        and published_by is not null
      )
    ),

  constraint assessment_templates_retired_consistency
    check (
      status <> 'retired'
      or retired_at is not null
    ),

  constraint assessment_templates_archive_consistency
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

  constraint assessment_templates_deleted_consistency
    check (
      (
        deleted_at is null
        and deleted_by is null
      )
      or deleted_at is not null
    )
);

comment on table public.assessment_templates
is 'Reusable SchoolOS assessment definitions containing delivery, scoring, security, and candidate-experience settings.';

comment on column public.assessment_templates.security_config
is 'Additional proctoring, browser-event, identity, network, and integrity settings.';

comment on column public.assessment_templates.grading_config
is 'Automatic and manual grading behavior not represented by dedicated columns.';

comment on column public.assessment_templates.delivery_config
is 'Delivery-mode-specific settings including resume, autosave, timing, and navigation configuration.';

comment on column public.assessment_templates.availability_config
is 'Default availability windows, time-zone behavior, and scheduling configuration.';

-- ============================================================
-- 2. TEMPLATE INDEXES
-- ============================================================

create unique index assessment_templates_active_number_unique_idx
  on public.assessment_templates (
    school_id,
    lower(template_number)
  )
  where deleted_at is null;

create unique index assessment_templates_active_code_unique_idx
  on public.assessment_templates (
    school_id,
    lower(code),
    version_number
  )
  where deleted_at is null;

create index assessment_templates_organization_idx
  on public.assessment_templates (
    organization_id
  )
  where deleted_at is null;

create index assessment_templates_school_status_idx
  on public.assessment_templates (
    school_id,
    status,
    updated_at desc
  )
  where deleted_at is null;

create index assessment_templates_campus_idx
  on public.assessment_templates (
    campus_id,
    status
  )
  where campus_id is not null
    and deleted_at is null;

create index assessment_templates_category_idx
  on public.assessment_templates (
    category_id,
    status
  )
  where category_id is not null
    and deleted_at is null;

create index assessment_templates_subject_idx
  on public.assessment_templates (
    subject_id,
    status
  )
  where subject_id is not null
    and deleted_at is null;

create index assessment_templates_bank_idx
  on public.assessment_templates (
    bank_id,
    status
  )
  where bank_id is not null
    and deleted_at is null;

create index assessment_templates_type_delivery_idx
  on public.assessment_templates (
    assessment_type,
    delivery_mode,
    status
  )
  where deleted_at is null;

create index assessment_templates_audience_idx
  on public.assessment_templates (
    audience_type,
    status
  )
  where deleted_at is null;

create index assessment_templates_owner_idx
  on public.assessment_templates (
    owner_id,
    status,
    updated_at desc
  )
  where owner_id is not null
    and deleted_at is null;

create index assessment_templates_published_idx
  on public.assessment_templates (
    published_at desc
  )
  where status = 'published'
    and deleted_at is null;

create trigger assessment_templates_set_updated_at
before update on public.assessment_templates
for each row
execute function public.set_updated_at();

-- ============================================================
-- 3. TEMPLATE TENANT AND TAXONOMY VALIDATION
-- ============================================================

create or replace function private.validate_assessment_template_tenant()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  category_record public.assessment_categories%rowtype;

  subject_record public.assessment_subjects%rowtype;

  bank_record public.assessment_banks%rowtype;
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

  if new.subject_id is not null then
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
  end if;

  if new.bank_id is not null then
    select *
    into bank_record
    from public.assessment_banks
    where id = new.bank_id
      and deleted_at is null;

    if bank_record.id is null then
      raise exception
        using
          errcode = '23503',
          message =
            'The selected assessment bank could not be found.';
    end if;

    if
      bank_record.organization_id <> new.organization_id
      or bank_record.school_id <> new.school_id
    then
      raise exception
        using
          errcode = '23514',
          message =
            'The selected assessment bank must belong to the same organization and school.';
    end if;
  end if;

  return new;
end;
$$;

revoke all
on function private.validate_assessment_template_tenant()
from public, anon, authenticated;

create trigger assessment_templates_validate_tenant
before insert or update
on public.assessment_templates
for each row
execute function private.validate_assessment_template_tenant();

-- ============================================================
-- 4. TEMPLATE CONFIGURATION VALIDATION
-- ============================================================

create or replace function private.validate_assessment_template_configuration()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if
    new.delivery_mode = 'online'
    and new.duration_minutes is null
  then
    raise exception
      using
        errcode = '23514',
        message =
          'Online assessments require a duration.';
  end if;

  if
    new.delivery_mode <> 'online'
    and new.proctoring_mode in (
      'browser_events',
      'live',
      'recorded'
    )
  then
    raise exception
      using
        errcode = '23514',
        message =
          'Browser or media proctoring is available only for online assessments.';
  end if;

  if
    new.fullscreen_policy = 'required'
    and new.delivery_mode <> 'online'
  then
    raise exception
      using
        errcode = '23514',
        message =
          'Required fullscreen mode is available only for online assessments.';
  end if;

  if
    new.tab_switch_policy <> 'ignore'
    and new.delivery_mode <> 'online'
  then
    raise exception
      using
        errcode = '23514',
        message =
          'Tab-switch monitoring is available only for online assessments.';
  end if;

  if
    new.show_correct_answers_after_submission
    and not new.show_score_after_submission
  then
    raise exception
      using
        errcode = '23514',
        message =
          'Correct answers cannot be displayed when post-submission scores are hidden.';
  end if;

  if
    new.show_explanations_after_submission
    and not new.show_correct_answers_after_submission
  then
    raise exception
      using
        errcode = '23514',
        message =
          'Answer explanations require correct answers to be visible after submission.';
  end if;

  if
    new.status = 'published'
    and new.question_count <= 0
  then
    raise exception
      using
        errcode = '23514',
        message =
          'An assessment must contain at least one question before it can be published.';
  end if;

  if
    new.status = 'published'
    and new.section_count <= 0
  then
    raise exception
      using
        errcode = '23514',
        message =
          'An assessment must contain at least one section before it can be published.';
  end if;

  if
    new.status = 'published'
    and (
      new.maximum_score is null
      or new.maximum_score <= 0
    )
  then
    raise exception
      using
        errcode = '23514',
        message =
          'An assessment must have a positive maximum score before it can be published.';
  end if;

  return new;
end;
$$;

revoke all
on function private.validate_assessment_template_configuration()
from public, anon, authenticated;

create trigger assessment_templates_validate_configuration
before insert or update
on public.assessment_templates
for each row
execute function private.validate_assessment_template_configuration();

-- ============================================================
-- END PART 1
-- Do not add COMMIT yet.
-- Append Part 2 directly below this line.
-- ============================================================

-- ============================================================
-- SchoolOS Enterprise
-- Assessment Center
-- Phase 1.2C — Templates, Sections, and Question Composition
-- Part 2 — Sections and Template Questions
-- ============================================================

-- ============================================================
-- 5. ASSESSMENT TEMPLATE SECTIONS
-- ============================================================

create table public.assessment_template_sections (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete restrict,

  school_id uuid not null
    references public.schools(id)
    on delete restrict,

  template_id uuid not null
    references public.assessment_templates(id)
    on delete restrict,

  section_number text not null,

  title text not null,

  description text,

  instructions text,

  display_order integer not null default 0,

  duration_minutes integer,

  question_count integer not null default 0,

  maximum_score numeric(12, 4),

  passing_score numeric(12, 4),

  passing_percentage numeric(8, 4),

  questions_to_display integer,

  shuffle_questions boolean not null default false,

  allow_question_navigation boolean,

  allow_back_navigation boolean,

  require_all_questions boolean,

  auto_submit_on_timeout boolean not null default true,

  section_type text not null default 'standard',

  status text not null default 'active',

  configuration jsonb not null default '{}'::jsonb,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  created_by uuid
    references public.profiles(id)
    on delete set null,

  updated_at timestamptz not null default now(),

  updated_by uuid
    references public.profiles(id)
    on delete set null,

  deleted_at timestamptz,

  deleted_by uuid
    references public.profiles(id)
    on delete set null,

  constraint assessment_template_sections_number_not_blank
    check (
      length(trim(section_number)) > 0
    ),

  constraint assessment_template_sections_title_not_blank
    check (
      length(trim(title)) > 0
    ),

  constraint assessment_template_sections_order_check
    check (
      display_order >= 0
    ),

  constraint assessment_template_sections_duration_check
    check (
      duration_minutes is null
      or duration_minutes > 0
    ),

  constraint assessment_template_sections_question_count_check
    check (
      question_count >= 0
    ),

  constraint assessment_template_sections_questions_to_display_check
    check (
      questions_to_display is null
      or questions_to_display > 0
    ),

  constraint assessment_template_sections_questions_to_display_consistency
    check (
      questions_to_display is null
      or question_count = 0
      or questions_to_display <= question_count
    ),

  constraint assessment_template_sections_maximum_score_check
    check (
      maximum_score is null
      or maximum_score > 0
    ),

  constraint assessment_template_sections_passing_score_check
    check (
      passing_score is null
      or passing_score >= 0
    ),

  constraint assessment_template_sections_passing_percentage_check
    check (
      passing_percentage is null
      or (
        passing_percentage >= 0
        and passing_percentage <= 100
      )
    ),

  constraint assessment_template_sections_passing_score_consistency
    check (
      passing_score is null
      or maximum_score is null
      or passing_score <= maximum_score
    ),

  constraint assessment_template_sections_type_check
    check (
      section_type in (
        'standard',
        'instructions',
        'question_pool',
        'adaptive',
        'manual_review',
        'break'
      )
    ),

  constraint assessment_template_sections_status_check
    check (
      status in (
        'active',
        'inactive',
        'archived'
      )
    ),

  constraint assessment_template_sections_deleted_consistency
    check (
      (
        deleted_at is null
        and deleted_by is null
      )
      or deleted_at is not null
    )
);

comment on table public.assessment_template_sections
is 'Ordered sections belonging to reusable assessment templates, with independent timing and scoring rules.';

create unique index assessment_template_sections_active_number_unique_idx
  on public.assessment_template_sections (
    template_id,
    lower(section_number)
  )
  where deleted_at is null;

create unique index assessment_template_sections_active_order_unique_idx
  on public.assessment_template_sections (
    template_id,
    display_order
  )
  where deleted_at is null;

create index assessment_template_sections_organization_idx
  on public.assessment_template_sections (
    organization_id
  )
  where deleted_at is null;

create index assessment_template_sections_school_idx
  on public.assessment_template_sections (
    school_id,
    status
  )
  where deleted_at is null;

create index assessment_template_sections_template_idx
  on public.assessment_template_sections (
    template_id,
    display_order
  )
  where deleted_at is null;

create trigger assessment_template_sections_set_updated_at
before update on public.assessment_template_sections
for each row
execute function public.set_updated_at();

-- ============================================================
-- 6. ASSESSMENT TEMPLATE QUESTIONS
-- ============================================================

create table public.assessment_template_questions (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete restrict,

  school_id uuid not null
    references public.schools(id)
    on delete restrict,

  template_id uuid not null
    references public.assessment_templates(id)
    on delete restrict,

  section_id uuid not null
    references public.assessment_template_sections(id)
    on delete restrict,

  question_id uuid not null
    references public.assessment_questions(id)
    on delete restrict,

  display_order integer not null default 0,

  marks_override numeric(12, 4),

  negative_marks_override numeric(12, 4),

  required boolean not null default true,

  shuffle_options_override boolean,

  randomization_group text,

  pool_selection_count integer,

  weight numeric(12, 6) not null default 1,

  configuration jsonb not null default '{}'::jsonb,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  created_by uuid
    references public.profiles(id)
    on delete set null,

  updated_at timestamptz not null default now(),

  updated_by uuid
    references public.profiles(id)
    on delete set null,

  deleted_at timestamptz,

  deleted_by uuid
    references public.profiles(id)
    on delete set null,

  constraint assessment_template_questions_order_check
    check (
      display_order >= 0
    ),

  constraint assessment_template_questions_marks_override_check
    check (
      marks_override is null
      or marks_override > 0
    ),

  constraint assessment_template_questions_negative_marks_check
    check (
      negative_marks_override is null
      or negative_marks_override >= 0
    ),

  constraint assessment_template_questions_negative_marks_consistency
    check (
      negative_marks_override is null
      or marks_override is null
      or negative_marks_override <= marks_override
    ),

  constraint assessment_template_questions_group_not_blank
    check (
      randomization_group is null
      or length(trim(randomization_group)) > 0
    ),

  constraint assessment_template_questions_pool_count_check
    check (
      pool_selection_count is null
      or pool_selection_count > 0
    ),

  constraint assessment_template_questions_pool_group_consistency
    check (
      pool_selection_count is null
      or randomization_group is not null
    ),

  constraint assessment_template_questions_weight_check
    check (
      weight > 0
    ),

  constraint assessment_template_questions_deleted_consistency
    check (
      (
        deleted_at is null
        and deleted_by is null
      )
      or deleted_at is not null
    )
);

comment on table public.assessment_template_questions
is 'Question composition records linking reusable questions to assessment template sections.';

create unique index assessment_template_questions_active_question_unique_idx
  on public.assessment_template_questions (
    template_id,
    section_id,
    question_id
  )
  where deleted_at is null;

create unique index assessment_template_questions_active_order_unique_idx
  on public.assessment_template_questions (
    section_id,
    display_order
  )
  where deleted_at is null;

create index assessment_template_questions_organization_idx
  on public.assessment_template_questions (
    organization_id
  )
  where deleted_at is null;

create index assessment_template_questions_school_idx
  on public.assessment_template_questions (
    school_id
  )
  where deleted_at is null;

create index assessment_template_questions_template_idx
  on public.assessment_template_questions (
    template_id,
    section_id,
    display_order
  )
  where deleted_at is null;

create index assessment_template_questions_question_idx
  on public.assessment_template_questions (
    question_id
  )
  where deleted_at is null;

create index assessment_template_questions_randomization_idx
  on public.assessment_template_questions (
    section_id,
    randomization_group
  )
  where randomization_group is not null
    and deleted_at is null;

create trigger assessment_template_questions_set_updated_at
before update on public.assessment_template_questions
for each row
execute function public.set_updated_at();

-- ============================================================
-- 7. SECTION TENANT VALIDATION
-- ============================================================

create or replace function private.validate_assessment_template_section()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  template_record public.assessment_templates%rowtype;
begin
  select *
  into template_record
  from public.assessment_templates
  where id = new.template_id
    and deleted_at is null;

  if template_record.id is null then
    raise exception
      using
        errcode = '23503',
        message =
          'The parent assessment template could not be found.';
  end if;

  if
    template_record.organization_id <> new.organization_id
    or template_record.school_id <> new.school_id
  then
    raise exception
      using
        errcode = '23514',
        message =
          'The assessment section must belong to the same organization and school as its template.';
  end if;

  if template_record.status in (
    'published',
    'retired',
    'archived'
  ) then
    raise exception
      using
        errcode = '23514',
        message =
          'Sections cannot be changed on a published, retired, or archived assessment template.';
  end if;

  if
    new.section_type = 'break'
    and (
      new.question_count <> 0
      or new.maximum_score is not null
      or new.passing_score is not null
      or new.passing_percentage is not null
      or new.questions_to_display is not null
    )
  then
    raise exception
      using
        errcode = '23514',
        message =
          'Break sections cannot contain questions or scoring configuration.';
  end if;

  if
    new.section_type = 'instructions'
    and new.question_count <> 0
  then
    raise exception
      using
        errcode = '23514',
        message =
          'Instruction sections cannot contain questions.';
  end if;

  return new;
end;
$$;

revoke all
on function private.validate_assessment_template_section()
from public, anon, authenticated;

create trigger assessment_template_sections_validate
before insert or update
on public.assessment_template_sections
for each row
execute function private.validate_assessment_template_section();

-- ============================================================
-- 8. TEMPLATE QUESTION VALIDATION
-- ============================================================

create or replace function private.validate_assessment_template_question()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  template_record public.assessment_templates%rowtype;

  section_record public.assessment_template_sections%rowtype;

  question_record public.assessment_questions%rowtype;

  effective_marks numeric(12, 4);

  effective_negative_marks numeric(12, 4);
begin
  select *
  into template_record
  from public.assessment_templates
  where id = new.template_id
    and deleted_at is null;

  if template_record.id is null then
    raise exception
      using
        errcode = '23503',
        message =
          'The assessment template could not be found.';
  end if;

  if template_record.status in (
    'published',
    'retired',
    'archived'
  ) then
    raise exception
      using
        errcode = '23514',
        message =
          'Questions cannot be changed on a published, retired, or archived assessment template.';
  end if;

  select *
  into section_record
  from public.assessment_template_sections
  where id = new.section_id
    and deleted_at is null;

  if section_record.id is null then
    raise exception
      using
        errcode = '23503',
        message =
          'The assessment template section could not be found.';
  end if;

  if section_record.template_id <> new.template_id then
    raise exception
      using
        errcode = '23514',
        message =
          'The selected section does not belong to the selected assessment template.';
  end if;

  if section_record.section_type in (
    'instructions',
    'break'
  ) then
    raise exception
      using
        errcode = '23514',
        message =
          'Questions cannot be added to instruction or break sections.';
  end if;

  select *
  into question_record
  from public.assessment_questions
  where id = new.question_id
    and deleted_at is null;

  if question_record.id is null then
    raise exception
      using
        errcode = '23503',
        message =
          'The selected assessment question could not be found.';
  end if;

  if
    question_record.organization_id <> new.organization_id
    or question_record.school_id <> new.school_id
    or template_record.organization_id <> new.organization_id
    or template_record.school_id <> new.school_id
    or section_record.organization_id <> new.organization_id
    or section_record.school_id <> new.school_id
  then
    raise exception
      using
        errcode = '23514',
        message =
          'The template, section, and question must belong to the same organization and school.';
  end if;

  if question_record.status not in (
    'approved',
    'active'
  ) then
    raise exception
      using
        errcode = '23514',
        message =
          'Only approved or active questions can be added to an assessment template.';
  end if;

  effective_marks =
    coalesce(
      new.marks_override,
      question_record.default_marks
    );

  effective_negative_marks =
    coalesce(
      new.negative_marks_override,
      question_record.negative_marks
    );

  if effective_negative_marks > effective_marks then
    raise exception
      using
        errcode = '23514',
        message =
          'Negative marks cannot exceed the effective question marks.';
  end if;

  return new;
end;
$$;

revoke all
on function private.validate_assessment_template_question()
from public, anon, authenticated;

create trigger assessment_template_questions_validate
before insert or update
on public.assessment_template_questions
for each row
execute function private.validate_assessment_template_question();

-- ============================================================
-- 9. TEMPLATE AGGREGATE REFRESH
-- ============================================================

create or replace function private.refresh_assessment_template_aggregates(
  target_template_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  calculated_section_count integer;

  calculated_question_count integer;

  calculated_maximum_score numeric(12, 4);
begin
  select count(*)
  into calculated_section_count
  from public.assessment_template_sections s
  where s.template_id = target_template_id
    and s.deleted_at is null
    and s.status = 'active';

  select
    count(*),
    coalesce(
      sum(
        coalesce(
          tq.marks_override,
          q.default_marks
        )
      ),
      0
    )
  into
    calculated_question_count,
    calculated_maximum_score
  from public.assessment_template_questions tq
  join public.assessment_questions q
    on q.id = tq.question_id
  join public.assessment_template_sections s
    on s.id = tq.section_id
  where tq.template_id = target_template_id
    and tq.deleted_at is null
    and q.deleted_at is null
    and s.deleted_at is null
    and s.status = 'active';

  update public.assessment_templates
  set
    section_count =
      calculated_section_count,

    question_count =
      calculated_question_count,

    maximum_score =
      case
        when calculated_question_count > 0
          then calculated_maximum_score
        else null
      end,

    updated_at = now()
  where id = target_template_id;
end;
$$;

revoke all
on function private.refresh_assessment_template_aggregates(uuid)
from public, anon, authenticated;

-- ============================================================
-- 10. SECTION AGGREGATE REFRESH
-- ============================================================

create or replace function private.refresh_assessment_section_aggregates(
  target_section_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  calculated_question_count integer;

  calculated_maximum_score numeric(12, 4);
begin
  select
    count(*),
    coalesce(
      sum(
        coalesce(
          tq.marks_override,
          q.default_marks
        )
      ),
      0
    )
  into
    calculated_question_count,
    calculated_maximum_score
  from public.assessment_template_questions tq
  join public.assessment_questions q
    on q.id = tq.question_id
  where tq.section_id = target_section_id
    and tq.deleted_at is null
    and q.deleted_at is null;

  update public.assessment_template_sections
  set
    question_count =
      calculated_question_count,

    maximum_score =
      case
        when calculated_question_count > 0
          then calculated_maximum_score
        else null
      end,

    updated_at = now()
  where id = target_section_id;
end;
$$;

revoke all
on function private.refresh_assessment_section_aggregates(uuid)
from public, anon, authenticated;

-- ============================================================
-- 11. AGGREGATE TRIGGERS
-- ============================================================

create or replace function private.handle_assessment_section_aggregate_change()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_assessment_template_aggregates(
      old.template_id
    );

    return old;
  end if;

  perform private.refresh_assessment_template_aggregates(
    new.template_id
  );

  if
    tg_op = 'UPDATE'
    and old.template_id <> new.template_id
  then
    perform private.refresh_assessment_template_aggregates(
      old.template_id
    );
  end if;

  return new;
end;
$$;

revoke all
on function private.handle_assessment_section_aggregate_change()
from public, anon, authenticated;

create trigger assessment_template_sections_refresh_template
after insert or update or delete
on public.assessment_template_sections
for each row
execute function private.handle_assessment_section_aggregate_change();

create or replace function private.handle_assessment_template_question_aggregate_change()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_assessment_section_aggregates(
      old.section_id
    );

    perform private.refresh_assessment_template_aggregates(
      old.template_id
    );

    return old;
  end if;

  perform private.refresh_assessment_section_aggregates(
    new.section_id
  );

  perform private.refresh_assessment_template_aggregates(
    new.template_id
  );

  if
    tg_op = 'UPDATE'
    and old.section_id <> new.section_id
  then
    perform private.refresh_assessment_section_aggregates(
      old.section_id
    );
  end if;

  if
    tg_op = 'UPDATE'
    and old.template_id <> new.template_id
  then
    perform private.refresh_assessment_template_aggregates(
      old.template_id
    );
  end if;

  return new;
end;
$$;

revoke all
on function private.handle_assessment_template_question_aggregate_change()
from public, anon, authenticated;

create trigger assessment_template_questions_refresh_aggregates
after insert or update or delete
on public.assessment_template_questions
for each row
execute function private.handle_assessment_template_question_aggregate_change();

-- ============================================================
-- END PART 2
-- Do not add COMMIT yet.
-- Append Part 3 directly below this line.
-- ============================================================s

-- ============================================================
-- SchoolOS Enterprise
-- Assessment Center
-- Phase 1.2C — Templates, Sections, and Question Composition
-- Part 3 — RLS, Privileges, Publishing, and Finalization
-- ============================================================

-- ============================================================
-- 12. ROW LEVEL SECURITY
-- ============================================================

alter table public.assessment_templates
  enable row level security;

alter table public.assessment_templates
  force row level security;

alter table public.assessment_template_sections
  enable row level security;

alter table public.assessment_template_sections
  force row level security;

alter table public.assessment_template_questions
  enable row level security;

alter table public.assessment_template_questions
  force row level security;

-- ============================================================
-- 13. TEMPLATE POLICIES
-- ============================================================

create policy assessment_templates_select_authorized
on public.assessment_templates
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

create policy assessment_templates_insert_authorized
on public.assessment_templates
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

create policy assessment_templates_update_authorized
on public.assessment_templates
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
  or private.has_school_permission(
    school_id,
    'assessments.publish'
  )
  or private.has_organization_permission(
    organization_id,
    'assessments.publish'
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
  or private.has_school_permission(
    school_id,
    'assessments.publish'
  )
  or private.has_organization_permission(
    organization_id,
    'assessments.publish'
  )
);

-- ============================================================
-- 14. SECTION POLICIES
-- ============================================================

create policy assessment_template_sections_select_authorized
on public.assessment_template_sections
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

create policy assessment_template_sections_insert_authorized
on public.assessment_template_sections
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

create policy assessment_template_sections_update_authorized
on public.assessment_template_sections
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
-- 15. TEMPLATE QUESTION POLICIES
-- ============================================================

create policy assessment_template_questions_select_authorized
on public.assessment_template_questions
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

create policy assessment_template_questions_insert_authorized
on public.assessment_template_questions
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

create policy assessment_template_questions_update_authorized
on public.assessment_template_questions
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
-- 16. PUBLISHING VALIDATION
-- ============================================================

create or replace function private.assert_assessment_template_publishable(
  target_template_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  template_record public.assessment_templates%rowtype;

  active_section_count integer;

  active_question_count integer;

  calculated_maximum_score numeric(12, 4);

  invalid_question_count integer;

  invalid_section_count integer;

  option_question_count integer;

  option_question_without_options_count integer;

  single_answer_invalid_count integer;
begin
  select *
  into template_record
  from public.assessment_templates
  where id = target_template_id
    and deleted_at is null;

  if template_record.id is null then
    raise exception
      using
        errcode = '23503',
        message =
          'The assessment template could not be found.';
  end if;

  select count(*)
  into active_section_count
  from public.assessment_template_sections s
  where s.template_id = target_template_id
    and s.status = 'active'
    and s.deleted_at is null;

  if active_section_count = 0 then
    raise exception
      using
        errcode = '23514',
        message =
          'An assessment requires at least one active section before publishing.';
  end if;

  select count(*)
  into invalid_section_count
  from public.assessment_template_sections s
  where s.template_id = target_template_id
    and s.status = 'active'
    and s.deleted_at is null
    and s.section_type not in (
      'instructions',
      'break'
    )
    and s.question_count = 0;

  if invalid_section_count > 0 then
    raise exception
      using
        errcode = '23514',
        message =
          'Every active scored assessment section must contain at least one question.';
  end if;

  select
    count(*),
    coalesce(
      sum(
        coalesce(
          tq.marks_override,
          q.default_marks
        )
      ),
      0
    )
  into
    active_question_count,
    calculated_maximum_score
  from public.assessment_template_questions tq
  join public.assessment_questions q
    on q.id = tq.question_id
  join public.assessment_template_sections s
    on s.id = tq.section_id
  where tq.template_id = target_template_id
    and tq.deleted_at is null
    and q.deleted_at is null
    and q.status in (
      'approved',
      'active'
    )
    and s.deleted_at is null
    and s.status = 'active';

  if active_question_count = 0 then
    raise exception
      using
        errcode = '23514',
        message =
          'An assessment requires at least one approved or active question before publishing.';
  end if;

  if calculated_maximum_score <= 0 then
    raise exception
      using
        errcode = '23514',
        message =
          'The assessment maximum score must be greater than zero before publishing.';
  end if;

  select count(*)
  into invalid_question_count
  from public.assessment_template_questions tq
  join public.assessment_questions q
    on q.id = tq.question_id
  where tq.template_id = target_template_id
    and tq.deleted_at is null
    and (
      q.deleted_at is not null
      or q.status not in (
        'approved',
        'active'
      )
    );

  if invalid_question_count > 0 then
    raise exception
      using
        errcode = '23514',
        message =
          'The assessment contains questions that are not approved or active.';
  end if;

  select count(*)
  into option_question_count
  from public.assessment_template_questions tq
  join public.assessment_questions q
    on q.id = tq.question_id
  where tq.template_id = target_template_id
    and tq.deleted_at is null
    and q.deleted_at is null
    and q.question_type in (
      'multiple_choice',
      'multiple_response',
      'true_false',
      'matching',
      'ordering'
    );

  select count(*)
  into option_question_without_options_count
  from public.assessment_template_questions tq
  join public.assessment_questions q
    on q.id = tq.question_id
  where tq.template_id = target_template_id
    and tq.deleted_at is null
    and q.deleted_at is null
    and q.question_type in (
      'multiple_choice',
      'multiple_response',
      'true_false',
      'matching',
      'ordering'
    )
    and not exists (
      select 1
      from public.assessment_question_options qo
      where qo.question_id = q.id
        and qo.deleted_at is null
    );

  if
    option_question_count > 0
    and option_question_without_options_count > 0
  then
    raise exception
      using
        errcode = '23514',
        message =
          'Every option-based question must contain answer options before publishing.';
  end if;

  select count(*)
  into single_answer_invalid_count
  from public.assessment_template_questions tq
  join public.assessment_questions q
    on q.id = tq.question_id
  where tq.template_id = target_template_id
    and tq.deleted_at is null
    and q.deleted_at is null
    and q.question_type in (
      'multiple_choice',
      'true_false'
    )
    and (
      select count(*)
      from public.assessment_question_options qo
      where qo.question_id = q.id
        and qo.deleted_at is null
        and qo.is_correct is true
    ) <> 1;

  if single_answer_invalid_count > 0 then
    raise exception
      using
        errcode = '23514',
        message =
          'Multiple-choice and true/false questions must have exactly one correct option before publishing.';
  end if;

  if
    template_record.passing_score is not null
    and template_record.passing_score >
      calculated_maximum_score
  then
    raise exception
      using
        errcode = '23514',
        message =
          'The assessment passing score cannot exceed its calculated maximum score.';
  end if;
end;
$$;

revoke all
on function private.assert_assessment_template_publishable(uuid)
from public, anon, authenticated;

-- ============================================================
-- 17. PUBLISH TEMPLATE RPC
-- ============================================================

create or replace function public.publish_assessment_template(
  target_template_id uuid
)
returns public.assessment_templates
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  template_record public.assessment_templates%rowtype;

  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception
      using
        errcode = '42501',
        message =
          'Authentication is required to publish an assessment.';
  end if;

  select *
  into template_record
  from public.assessment_templates
  where id = target_template_id
    and deleted_at is null;

  if template_record.id is null then
    raise exception
      using
        errcode = '23503',
        message =
          'The assessment template could not be found.';
  end if;

  if not (
    private.has_school_permission(
      template_record.school_id,
      'assessments.publish'
    )
    or private.has_organization_permission(
      template_record.organization_id,
      'assessments.publish'
    )
  ) then
    raise exception
      using
        errcode = '42501',
        message =
          'You are not authorized to publish this assessment.';
  end if;

  if template_record.status = 'published' then
    return template_record;
  end if;

  if template_record.status not in (
    'draft',
    'review',
    'approved',
    'paused'
  ) then
    raise exception
      using
        errcode = '23514',
        message =
          'The assessment template is not in a publishable status.';
  end if;

  perform private.refresh_assessment_template_aggregates(
    target_template_id
  );

  perform private.assert_assessment_template_publishable(
    target_template_id
  );

  update public.assessment_templates
  set
    status = 'published',
    published_at = now(),
    published_by = actor_id,
    retired_at = null,
    retired_by = null,
    archived_at = null,
    archived_by = null,
    updated_by = actor_id
  where id = target_template_id
  returning *
  into template_record;

  return template_record;
end;
$$;

revoke all
on function public.publish_assessment_template(uuid)
from public, anon;

grant execute
on function public.publish_assessment_template(uuid)
to authenticated;

comment on function public.publish_assessment_template(uuid)
is 'Validates and publishes an assessment template for assignment and delivery.';

-- ============================================================
-- 18. PAUSE TEMPLATE RPC
-- ============================================================

create or replace function public.pause_assessment_template(
  target_template_id uuid
)
returns public.assessment_templates
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  template_record public.assessment_templates%rowtype;

  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception
      using
        errcode = '42501',
        message =
          'Authentication is required to pause an assessment.';
  end if;

  select *
  into template_record
  from public.assessment_templates
  where id = target_template_id
    and deleted_at is null;

  if template_record.id is null then
    raise exception
      using
        errcode = '23503',
        message =
          'The assessment template could not be found.';
  end if;

  if not (
    private.has_school_permission(
      template_record.school_id,
      'assessments.publish'
    )
    or private.has_organization_permission(
      template_record.organization_id,
      'assessments.publish'
    )
  ) then
    raise exception
      using
        errcode = '42501',
        message =
          'You are not authorized to pause this assessment.';
  end if;

  if template_record.status <> 'published' then
    raise exception
      using
        errcode = '23514',
        message =
          'Only published assessments can be paused.';
  end if;

  update public.assessment_templates
  set
    status = 'paused',
    updated_by = actor_id
  where id = target_template_id
  returning *
  into template_record;

  return template_record;
end;
$$;

revoke all
on function public.pause_assessment_template(uuid)
from public, anon;

grant execute
on function public.pause_assessment_template(uuid)
to authenticated;

-- ============================================================
-- 19. RETIRE TEMPLATE RPC
-- ============================================================

create or replace function public.retire_assessment_template(
  target_template_id uuid
)
returns public.assessment_templates
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  template_record public.assessment_templates%rowtype;

  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception
      using
        errcode = '42501',
        message =
          'Authentication is required to retire an assessment.';
  end if;

  select *
  into template_record
  from public.assessment_templates
  where id = target_template_id
    and deleted_at is null;

  if template_record.id is null then
    raise exception
      using
        errcode = '23503',
        message =
          'The assessment template could not be found.';
  end if;

  if not (
    private.has_school_permission(
      template_record.school_id,
      'assessments.manage'
    )
    or private.has_organization_permission(
      template_record.organization_id,
      'assessments.manage'
    )
  ) then
    raise exception
      using
        errcode = '42501',
        message =
          'You are not authorized to retire this assessment.';
  end if;

  if template_record.status not in (
    'published',
    'paused'
  ) then
    raise exception
      using
        errcode = '23514',
        message =
          'Only published or paused assessments can be retired.';
  end if;

  update public.assessment_templates
  set
    status = 'retired',
    retired_at = now(),
    retired_by = actor_id,
    updated_by = actor_id
  where id = target_template_id
  returning *
  into template_record;

  return template_record;
end;
$$;

revoke all
on function public.retire_assessment_template(uuid)
from public, anon;

grant execute
on function public.retire_assessment_template(uuid)
to authenticated;

-- ============================================================
-- 20. TABLE PRIVILEGES
-- ============================================================

grant select, insert
on table public.assessment_templates
to authenticated;

grant update (
  campus_id,
  category_id,
  subject_id,
  bank_id,
  template_number,
  name,
  code,
  description,
  instructions,
  assessment_type,
  delivery_mode,
  audience_type,
  grade_level,
  language_code,
  duration_minutes,
  maximum_attempts,
  passing_score,
  passing_percentage,
  shuffle_sections,
  shuffle_questions,
  shuffle_options,
  show_question_numbers,
  allow_question_navigation,
  allow_back_navigation,
  allow_review_before_submit,
  require_all_questions,
  auto_submit_on_timeout,
  show_remaining_time,
  show_progress,
  show_score_after_submission,
  show_correct_answers_after_submission,
  show_explanations_after_submission,
  calculator_policy,
  resource_policy,
  fullscreen_policy,
  tab_switch_policy,
  copy_paste_policy,
  proctoring_mode,
  security_config,
  grading_config,
  delivery_config,
  availability_config,
  status,
  version_number,
  published_at,
  published_by,
  retired_at,
  retired_by,
  owner_id,
  metadata,
  updated_by,
  archived_at,
  archived_by,
  deleted_at,
  deleted_by
)
on table public.assessment_templates
to authenticated;

grant select, insert
on table public.assessment_template_sections
to authenticated;

grant update (
  template_id,
  section_number,
  title,
  description,
  instructions,
  display_order,
  duration_minutes,
  passing_score,
  passing_percentage,
  questions_to_display,
  shuffle_questions,
  allow_question_navigation,
  allow_back_navigation,
  require_all_questions,
  auto_submit_on_timeout,
  section_type,
  status,
  configuration,
  metadata,
  updated_by,
  deleted_at,
  deleted_by
)
on table public.assessment_template_sections
to authenticated;

grant select, insert
on table public.assessment_template_questions
to authenticated;

grant update (
  template_id,
  section_id,
  question_id,
  display_order,
  marks_override,
  negative_marks_override,
  required,
  shuffle_options_override,
  randomization_group,
  pool_selection_count,
  weight,
  configuration,
  metadata,
  updated_by,
  deleted_at,
  deleted_by
)
on table public.assessment_template_questions
to authenticated;

-- ============================================================
-- 21. FINAL SCHEMA ASSERTIONS
-- ============================================================

do $$
declare
  missing_table_count integer;

  missing_policy_count integer;

  missing_function_count integer;
begin
  select count(*)
  into missing_table_count
  from (
    values
      ('assessment_templates'),
      ('assessment_template_sections'),
      ('assessment_template_questions')
  ) as required_tables(table_name)
  where to_regclass(
    'public.' || table_name
  ) is null;

  if missing_table_count <> 0 then
    raise exception
      'Assessment template foundation tables are incomplete.';
  end if;

  select count(*)
  into missing_policy_count
  from (
    values
      (
        'assessment_templates',
        'assessment_templates_select_authorized'
      ),
      (
        'assessment_templates',
        'assessment_templates_insert_authorized'
      ),
      (
        'assessment_templates',
        'assessment_templates_update_authorized'
      ),
      (
        'assessment_template_sections',
        'assessment_template_sections_select_authorized'
      ),
      (
        'assessment_template_sections',
        'assessment_template_sections_insert_authorized'
      ),
      (
        'assessment_template_sections',
        'assessment_template_sections_update_authorized'
      ),
      (
        'assessment_template_questions',
        'assessment_template_questions_select_authorized'
      ),
      (
        'assessment_template_questions',
        'assessment_template_questions_insert_authorized'
      ),
      (
        'assessment_template_questions',
        'assessment_template_questions_update_authorized'
      )
  ) as required_policies(
    table_name,
    policy_name
  )
  where not exists (
    select 1
    from pg_catalog.pg_policies p
    where p.schemaname = 'public'
      and p.tablename =
        required_policies.table_name
      and p.policyname =
        required_policies.policy_name
  );

  if missing_policy_count <> 0 then
    raise exception
      'Assessment template RLS policies are incomplete.';
  end if;

  select count(*)
  into missing_function_count
  from (
    values
      (
        'public.publish_assessment_template(uuid)'::regprocedure
      ),
      (
        'public.pause_assessment_template(uuid)'::regprocedure
      ),
      (
        'public.retire_assessment_template(uuid)'::regprocedure
      ),
      (
        'private.assert_assessment_template_publishable(uuid)'::regprocedure
      )
  ) as required_functions(function_oid)
  where function_oid is null;

  if missing_function_count <> 0 then
    raise exception
      'Assessment template functions are incomplete.';
  end if;
end;
$$;

commit;