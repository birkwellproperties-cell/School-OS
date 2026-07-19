begin;

-- ============================================================
-- SchoolOS Enterprise
-- Assessment Center
-- Phase 1.2B — Questions and Answer Options
-- ============================================================

-- ============================================================
-- 1. ASSESSMENT QUESTIONS
-- ============================================================

create table public.assessment_questions (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete restrict,

  school_id uuid not null
    references public.schools(id)
    on delete restrict,

  bank_id uuid not null
    references public.assessment_banks(id)
    on delete restrict,

  category_id uuid
    references public.assessment_categories(id)
    on delete restrict,

  subject_id uuid
    references public.assessment_subjects(id)
    on delete restrict,

  topic_id uuid
    references public.assessment_topics(id)
    on delete restrict,

  question_number text not null,

  title text,

  question_type text not null,

  prompt text not null,

  instructions text,

  prompt_format text not null default 'plain_text',

  difficulty text not null default 'medium',

  grade_level text,

  learning_outcome text,

  default_marks numeric(12, 4) not null default 1,

  negative_marks numeric(12, 4) not null default 0,

  allow_partial_credit boolean not null default false,

  answer_required boolean not null default true,

  answer_config jsonb not null default '{}'::jsonb,

  explanation text,

  correct_feedback text,

  incorrect_feedback text,

  estimated_time_seconds integer,

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

  constraint assessment_questions_number_not_blank
    check (
      length(trim(question_number)) > 0
    ),

  constraint assessment_questions_prompt_not_blank
    check (
      length(trim(prompt)) > 0
    ),

  constraint assessment_questions_type_check
    check (
      question_type in (
        'multiple_choice',
        'multiple_response',
        'true_false',
        'fill_blank',
        'short_answer',
        'essay',
        'numeric',
        'matching',
        'ordering',
        'file_upload'
      )
    ),

  constraint assessment_questions_prompt_format_check
    check (
      prompt_format in (
        'plain_text',
        'markdown',
        'html'
      )
    ),

  constraint assessment_questions_difficulty_check
    check (
      difficulty in (
        'very_easy',
        'easy',
        'medium',
        'hard',
        'very_hard'
      )
    ),

  constraint assessment_questions_marks_check
    check (
      default_marks > 0
    ),

  constraint assessment_questions_negative_marks_check
    check (
      negative_marks >= 0
      and negative_marks <= default_marks
    ),

  constraint assessment_questions_estimated_time_check
    check (
      estimated_time_seconds is null
      or estimated_time_seconds > 0
    ),

  constraint assessment_questions_status_check
    check (
      status in (
        'draft',
        'review',
        'approved',
        'active',
        'retired',
        'archived'
      )
    ),

  constraint assessment_questions_archive_consistency
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

  constraint assessment_questions_deleted_consistency
    check (
      (
        deleted_at is null
        and deleted_by is null
      )
      or deleted_at is not null
    )
);

comment on table public.assessment_questions
is 'Reusable tenant-scoped assessment questions stored in SchoolOS question banks.';

comment on column public.assessment_questions.answer_config
is 'Question-type-specific answer and scoring configuration stored as JSON.';

comment on column public.assessment_questions.allow_partial_credit
is 'Controls whether the grading engine may award fractional credit.';

create unique index assessment_questions_active_number_unique_idx
  on public.assessment_questions (
    bank_id,
    lower(question_number)
  )
  where deleted_at is null;

create index assessment_questions_organization_idx
  on public.assessment_questions (
    organization_id
  )
  where deleted_at is null;

create index assessment_questions_school_status_idx
  on public.assessment_questions (
    school_id,
    status,
    created_at desc
  )
  where deleted_at is null;

create index assessment_questions_bank_status_idx
  on public.assessment_questions (
    bank_id,
    status,
    created_at desc
  )
  where deleted_at is null;

create index assessment_questions_category_idx
  on public.assessment_questions (
    category_id,
    status
  )
  where category_id is not null
    and deleted_at is null;

create index assessment_questions_subject_idx
  on public.assessment_questions (
    subject_id,
    status
  )
  where subject_id is not null
    and deleted_at is null;

create index assessment_questions_topic_idx
  on public.assessment_questions (
    topic_id,
    status
  )
  where topic_id is not null
    and deleted_at is null;

create index assessment_questions_type_difficulty_idx
  on public.assessment_questions (
    question_type,
    difficulty
  )
  where deleted_at is null;

create index assessment_questions_owner_idx
  on public.assessment_questions (
    owner_id,
    status
  )
  where owner_id is not null
    and deleted_at is null;

create trigger assessment_questions_set_updated_at
before update on public.assessment_questions
for each row
execute function public.set_updated_at();

-- ============================================================
-- 2. ASSESSMENT QUESTION OPTIONS
-- ============================================================

create table public.assessment_question_options (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete restrict,

  school_id uuid not null
    references public.schools(id)
    on delete restrict,

  question_id uuid not null
    references public.assessment_questions(id)
    on delete restrict,

  option_key text not null,

  option_text text not null,

  option_format text not null default 'plain_text',

  display_order integer not null default 0,

  is_correct boolean not null default false,

  score_fraction numeric(8, 6) not null default 0,

  matching_key text,

  response_value text,

  feedback text,

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

  constraint assessment_question_options_key_not_blank
    check (
      length(trim(option_key)) > 0
    ),

  constraint assessment_question_options_text_not_blank
    check (
      length(trim(option_text)) > 0
    ),

  constraint assessment_question_options_format_check
    check (
      option_format in (
        'plain_text',
        'markdown',
        'html'
      )
    ),

  constraint assessment_question_options_order_check
    check (
      display_order >= 0
    ),

  constraint assessment_question_options_score_fraction_check
    check (
      score_fraction >= 0
      and score_fraction <= 1
    ),

  constraint assessment_question_options_correct_score_consistency
    check (
      is_correct = false
      or score_fraction > 0
    ),

  constraint assessment_question_options_deleted_consistency
    check (
      (
        deleted_at is null
        and deleted_by is null
      )
      or deleted_at is not null
    )
);

comment on table public.assessment_question_options
is 'Selectable, matchable, or orderable answer options belonging to reusable assessment questions.';

comment on column public.assessment_question_options.score_fraction
is 'Fraction of the question marks awarded when this option contributes to a correct response.';

create unique index assessment_question_options_active_key_unique_idx
  on public.assessment_question_options (
    question_id,
    lower(option_key)
  )
  where deleted_at is null;

create unique index assessment_question_options_active_order_unique_idx
  on public.assessment_question_options (
    question_id,
    display_order
  )
  where deleted_at is null;

create index assessment_question_options_organization_idx
  on public.assessment_question_options (
    organization_id
  )
  where deleted_at is null;

create index assessment_question_options_school_idx
  on public.assessment_question_options (
    school_id
  )
  where deleted_at is null;

create index assessment_question_options_question_idx
  on public.assessment_question_options (
    question_id,
    display_order
  )
  where deleted_at is null;

create index assessment_question_options_correct_idx
  on public.assessment_question_options (
    question_id,
    is_correct
  )
  where is_correct is true
    and deleted_at is null;

create index assessment_question_options_matching_idx
  on public.assessment_question_options (
    question_id,
    matching_key
  )
  where matching_key is not null
    and deleted_at is null;

create trigger assessment_question_options_set_updated_at
before update on public.assessment_question_options
for each row
execute function public.set_updated_at();

-- ============================================================
-- 3. QUESTION TENANT AND TAXONOMY VALIDATION
-- ============================================================

create or replace function private.validate_assessment_question_tenant()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  bank_record public.assessment_banks%rowtype;

  category_record public.assessment_categories%rowtype;

  subject_record public.assessment_subjects%rowtype;

  topic_record public.assessment_topics%rowtype;
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

  if new.topic_id is not null then
    select *
    into topic_record
    from public.assessment_topics
    where id = new.topic_id
      and deleted_at is null;

    if topic_record.id is null then
      raise exception
        using
          errcode = '23503',
          message =
            'The selected assessment topic could not be found.';
    end if;

    if
      topic_record.organization_id <> new.organization_id
      or topic_record.school_id <> new.school_id
    then
      raise exception
        using
          errcode = '23514',
          message =
            'The selected assessment topic must belong to the same organization and school.';
    end if;

    if (
      new.subject_id is null
      or topic_record.subject_id <> new.subject_id
    ) then
      raise exception
        using
          errcode = '23514',
          message =
            'The selected assessment topic must belong to the selected subject.';
    end if;
  end if;

  return new;
end;
$$;

revoke all
on function private.validate_assessment_question_tenant()
from public, anon, authenticated;

create trigger assessment_questions_validate_tenant
before insert or update
on public.assessment_questions
for each row
execute function private.validate_assessment_question_tenant();

-- ============================================================
-- 4. OPTION TENANT AND QUESTION-TYPE VALIDATION
-- ============================================================

create or replace function private.validate_assessment_question_option()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  question_record public.assessment_questions%rowtype;
begin
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
          'The parent assessment question could not be found.';
  end if;

  if
    question_record.organization_id <> new.organization_id
    or question_record.school_id <> new.school_id
  then
    raise exception
      using
        errcode = '23514',
        message =
          'The assessment question option must belong to the same organization and school as its question.';
  end if;

  if question_record.question_type not in (
    'multiple_choice',
    'multiple_response',
    'true_false',
    'matching',
    'ordering'
  ) then
    raise exception
      using
        errcode = '23514',
        message =
          'The selected question type does not support answer option records.';
  end if;

  if
    question_record.question_type = 'true_false'
    and lower(trim(new.option_key)) not in (
      'true',
      'false'
    )
  then
    raise exception
      using
        errcode = '23514',
        message =
          'True/false assessment options must use option keys TRUE or FALSE.';
  end if;

  if
    question_record.question_type = 'matching'
    and nullif(
      trim(
        coalesce(
          new.matching_key,
          ''
        )
      ),
      ''
    ) is null
  then
    raise exception
      using
        errcode = '23514',
        message =
          'Matching question options require a matching key.';
  end if;

  if
    question_record.question_type <> 'matching'
    and new.matching_key is not null
  then
    raise exception
      using
        errcode = '23514',
        message =
          'Matching keys may only be used with matching questions.';
  end if;

  return new;
end;
$$;

revoke all
on function private.validate_assessment_question_option()
from public, anon, authenticated;

create trigger assessment_question_options_validate
before insert or update
on public.assessment_question_options
for each row
execute function private.validate_assessment_question_option();

-- ============================================================
-- 5. QUESTION CONFIGURATION VALIDATION
-- ============================================================

create or replace function private.validate_assessment_question_configuration()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if
    new.question_type = 'essay'
    and new.allow_partial_credit is false
  then
    new.allow_partial_credit = true;
  end if;

  if
    new.question_type = 'short_answer'
    and new.allow_partial_credit is false
  then
    new.allow_partial_credit = true;
  end if;

  if
    new.question_type = 'file_upload'
    and new.answer_required is false
  then
    raise exception
      using
        errcode = '23514',
        message =
          'File upload questions must require a response.';
  end if;

  if
    new.question_type in (
      'essay',
      'short_answer',
      'file_upload'
    )
    and new.negative_marks > 0
  then
    raise exception
      using
        errcode = '23514',
        message =
          'Negative marks are not supported for manually graded question types.';
  end if;

  return new;
end;
$$;

revoke all
on function private.validate_assessment_question_configuration()
from public, anon, authenticated;

create trigger assessment_questions_validate_configuration
before insert or update
on public.assessment_questions
for each row
execute function private.validate_assessment_question_configuration();

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

alter table public.assessment_questions
  enable row level security;

alter table public.assessment_questions
  force row level security;

alter table public.assessment_question_options
  enable row level security;

alter table public.assessment_question_options
  force row level security;

-- ============================================================
-- 7. QUESTION POLICIES
-- ============================================================

create policy assessment_questions_select_authorized
on public.assessment_questions
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

create policy assessment_questions_insert_authorized
on public.assessment_questions
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

create policy assessment_questions_update_authorized
on public.assessment_questions
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
-- 8. OPTION POLICIES
-- ============================================================

create policy assessment_question_options_select_authorized
on public.assessment_question_options
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

create policy assessment_question_options_insert_authorized
on public.assessment_question_options
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

create policy assessment_question_options_update_authorized
on public.assessment_question_options
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
on table public.assessment_questions
to authenticated;

grant update (
  bank_id,
  category_id,
  subject_id,
  topic_id,
  question_number,
  title,
  question_type,
  prompt,
  instructions,
  prompt_format,
  difficulty,
  grade_level,
  learning_outcome,
  default_marks,
  negative_marks,
  allow_partial_credit,
  answer_required,
  answer_config,
  explanation,
  correct_feedback,
  incorrect_feedback,
  estimated_time_seconds,
  status,
  owner_id,
  metadata,
  updated_by,
  archived_at,
  archived_by,
  deleted_at,
  deleted_by
)
on table public.assessment_questions
to authenticated;

grant select, insert
on table public.assessment_question_options
to authenticated;

grant update (
  question_id,
  option_key,
  option_text,
  option_format,
  display_order,
  is_correct,
  score_fraction,
  matching_key,
  response_value,
  feedback,
  metadata,
  updated_by,
  deleted_at,
  deleted_by
)
on table public.assessment_question_options
to authenticated;

commit;