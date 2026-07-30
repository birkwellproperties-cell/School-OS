begin;

create table public.assessment_assignments (
id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  campus_id uuid references public.campuses(id) on delete restrict,
  template_id uuid not null references public.assessment_templates(id) on delete restrict,
  assignment_number text not null,
  title text not null,
  description text,
  instructions text,
  status text not null default 'draft',
  opens_at timestamptz,
  due_at timestamptz,
  closes_at timestamptz,
  duration_minutes integer,
  maximum_attempts integer not null default 1,
  passing_score numeric(12,4),
  passing_percentage numeric(8,4),
  delivery_mode text not null default 'online',
  proctoring_mode text not null default 'none',
  source_type text,
  source_id uuid,
  configuration jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  published_by uuid references public.profiles(id) on delete set null,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  check (btrim(assignment_number) <> ''),
  check (btrim(title) <> ''),
  check (status in ('draft','scheduled','open','closed','cancelled','completed','archived')),
  check (delivery_mode in ('online','paper','hybrid','oral','practical')),
  check (proctoring_mode in ('none','manual','browser_events','locked_browser','remote_live','onsite')),
  check (duration_minutes is null or duration_minutes > 0),
  check (maximum_attempts > 0),
  check (passing_score is null or passing_score >= 0),
  check (passing_percentage is null or passing_percentage between 0 and 100),
  check ((source_type is null and source_id is null) or (source_type is not null and source_id is not null)),
  check ((opens_at is null or due_at is null or opens_at <= due_at)
     and (due_at is null or closes_at is null or due_at <= closes_at)
     and (opens_at is null or closes_at is null or opens_at <= closes_at))
);

create trigger assessment_assignments_set_updated_at before update on public.assessment_assignments for each row execute function public.set_updated_at();

create table public.assessment_assignment_recipients (
id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  campus_id uuid references public.campuses(id) on delete restrict,
  assignment_id uuid not null references public.assessment_assignments(id) on delete restrict,
  audience_type text not null,
  audience_id uuid not null,
  recipient_profile_id uuid references public.profiles(id) on delete set null,
  source_type text,
  source_id uuid,
  status text not null default 'assigned',
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles(id) on delete set null,
  available_from timestamptz,
  due_at timestamptz,
  expires_at timestamptz,
  maximum_attempts_override integer,
  duration_minutes_override integer,
  accommodations jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id) on delete set null,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  check (audience_type in ('admission_applicant','student','staff','candidate','guardian','external_candidate')),
  check (status in ('assigned','not_started','in_progress','submitted','completed','expired','cancelled')),
  check ((source_type is null and source_id is null) or (source_type is not null and source_id is not null)),
  check (maximum_attempts_override is null or maximum_attempts_override > 0),
  check (duration_minutes_override is null or duration_minutes_override > 0)
);

create trigger assessment_assignment_recipients_set_updated_at before update on public.assessment_assignment_recipients for each row execute function public.set_updated_at();

create table public.assessment_attempts (
id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  campus_id uuid references public.campuses(id) on delete restrict,
  assignment_id uuid not null references public.assessment_assignments(id) on delete restrict,
  recipient_id uuid not null references public.assessment_assignment_recipients(id) on delete restrict,
  template_id uuid not null references public.assessment_templates(id) on delete restrict,
  attempt_number integer not null,
  status text not null default 'not_started',
  started_at timestamptz,
  last_activity_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  duration_minutes integer,
  elapsed_seconds integer not null default 0,
  maximum_score numeric(12,4),
  raw_score numeric(12,4),
  percentage_score numeric(8,4),
  passed boolean,
  grading_status text not null default 'not_started',
  auto_graded_score numeric(12,4),
  manually_graded_score numeric(12,4),
  graded_at timestamptz,
  graded_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  attempt_snapshot jsonb not null default '{}'::jsonb,
  delivery_context jsonb not null default '{}'::jsonb,
  proctoring_events jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  invalidated_at timestamptz,
  invalidated_by uuid references public.profiles(id) on delete set null,
  invalidation_reason text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  check (attempt_number > 0),
  check (status in ('not_started','in_progress','paused','submitted','grading','completed','expired','abandoned','invalidated')),
  check (grading_status in ('not_started','auto_grading','manual_grading','pending_review','completed')),
  check (duration_minutes is null or duration_minutes > 0),
  check (elapsed_seconds >= 0),
  check (percentage_score is null or percentage_score between 0 and 100)
);

create trigger assessment_attempts_set_updated_at before update on public.assessment_attempts for each row execute function public.set_updated_at();

create table public.assessment_attempt_questions (
id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  campus_id uuid references public.campuses(id) on delete restrict,
  assignment_id uuid not null references public.assessment_assignments(id) on delete restrict,
  attempt_id uuid not null references public.assessment_attempts(id) on delete restrict,
  template_id uuid not null references public.assessment_templates(id) on delete restrict,
  section_id uuid references public.assessment_template_sections(id) on delete restrict,
  template_question_id uuid references public.assessment_template_questions(id) on delete restrict,
  question_id uuid not null references public.assessment_questions(id) on delete restrict,
  display_order integer not null default 0,
  question_number text,
  question_type text not null,
  prompt_snapshot jsonb not null,
  option_snapshot jsonb not null default '[]'::jsonb,
  scoring_snapshot jsonb not null default '{}'::jsonb,
  configuration_snapshot jsonb not null default '{}'::jsonb,
  maximum_marks numeric(12,4) not null default 0,
  negative_marks numeric(12,4) not null default 0,
  required boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  check (display_order >= 0),
  check (maximum_marks >= 0 and negative_marks >= 0),
  check (jsonb_typeof(prompt_snapshot) = 'object'),
  check (jsonb_typeof(option_snapshot) = 'array')
);

create trigger assessment_attempt_questions_set_updated_at before update on public.assessment_attempt_questions for each row execute function public.set_updated_at();

create table public.assessment_responses (
id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  campus_id uuid references public.campuses(id) on delete restrict,
  assignment_id uuid not null references public.assessment_assignments(id) on delete restrict,
  attempt_id uuid not null references public.assessment_attempts(id) on delete restrict,
  attempt_question_id uuid not null references public.assessment_attempt_questions(id) on delete restrict,
  question_id uuid not null references public.assessment_questions(id) on delete restrict,
  response_value jsonb,
  response_text text,
  selected_option_ids uuid[] not null default '{}'::uuid[],
  status text not null default 'unanswered',
  answered_at timestamptz,
  first_answered_at timestamptz,
  time_spent_seconds integer not null default 0,
  change_count integer not null default 0,
  flagged_for_review boolean not null default false,
  auto_graded boolean not null default false,
  manual_review_required boolean not null default false,
  is_correct boolean,
  marks_awarded numeric(12,4),
  negative_marks_awarded numeric(12,4) not null default 0,
  grader_feedback text,
  graded_at timestamptz,
  graded_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  check (status in ('unanswered','answered','skipped','flagged','submitted','graded')),
  check (time_spent_seconds >= 0),
  check (change_count >= 0),
  check (marks_awarded is null or marks_awarded >= 0),
  check (negative_marks_awarded >= 0)
);

create trigger assessment_responses_set_updated_at before update on public.assessment_responses for each row execute function public.set_updated_at();

create table public.assessment_results (
id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  campus_id uuid references public.campuses(id) on delete restrict,
  assignment_id uuid not null references public.assessment_assignments(id) on delete restrict,
  recipient_id uuid not null references public.assessment_assignment_recipients(id) on delete restrict,
  attempt_id uuid not null references public.assessment_attempts(id) on delete restrict,
  template_id uuid not null references public.assessment_templates(id) on delete restrict,
  status text not null default 'provisional',
  maximum_score numeric(12,4) not null default 0,
  raw_score numeric(12,4) not null default 0,
  percentage_score numeric(8,4),
  passed boolean,
  grade_label text,
  grade_value text,
  section_results jsonb not null default '[]'::jsonb,
  competency_results jsonb not null default '[]'::jsonb,
  recommendation text,
  reviewer_notes text,
  calculated_at timestamptz not null default now(),
  finalized_at timestamptz,
  finalized_by uuid references public.profiles(id) on delete set null,
  released_at timestamptz,
  released_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  check (status in ('provisional','pending_review','final','released','withheld','void')),
  check (maximum_score >= 0 and raw_score >= 0),
  check (percentage_score is null or percentage_score between 0 and 100),
  check (jsonb_typeof(section_results) = 'array'),
  check (jsonb_typeof(competency_results) = 'array')
);

create trigger assessment_results_set_updated_at before update on public.assessment_results for each row execute function public.set_updated_at();


create unique index assessment_assignments_school_number_unique
on public.assessment_assignments (school_id, lower(assignment_number))
where deleted_at is null;

create unique index assessment_assignment_recipients_unique_active
on public.assessment_assignment_recipients (assignment_id, audience_type, audience_id)
where deleted_at is null;

create unique index assessment_attempts_recipient_number_unique
on public.assessment_attempts (recipient_id, attempt_number)
where deleted_at is null;

create unique index assessment_attempt_questions_unique_order
on public.assessment_attempt_questions (attempt_id, display_order)
where deleted_at is null;

create unique index assessment_responses_attempt_question_unique
on public.assessment_responses (attempt_id, attempt_question_id)
where deleted_at is null;

create unique index assessment_results_attempt_unique
on public.assessment_results (attempt_id)
where deleted_at is null;

create index assessment_assignment_recipients_source_idx
on public.assessment_assignment_recipients (source_type, source_id)
where source_type is not null and source_id is not null and deleted_at is null;

create index assessment_attempts_grading_queue_idx
on public.assessment_attempts (school_id, grading_status, submitted_at)
where grading_status in ('manual_grading','pending_review') and deleted_at is null;


create or replace function private.set_assessment_runtime_audit_actor()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth, pg_temp
as $$
declare actor_id uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, actor_id);
  end if;
  new.updated_by := coalesce(new.updated_by, actor_id);
  return new;
end;
$$;

revoke all on function private.set_assessment_runtime_audit_actor()
from public, anon, authenticated;

create trigger assessment_assignments_set_audit_actor before insert or update on public.assessment_assignments for each row execute function private.set_assessment_runtime_audit_actor();

create trigger assessment_assignment_recipients_set_audit_actor before insert or update on public.assessment_assignment_recipients for each row execute function private.set_assessment_runtime_audit_actor();

create trigger assessment_attempts_set_audit_actor before insert or update on public.assessment_attempts for each row execute function private.set_assessment_runtime_audit_actor();

create trigger assessment_attempt_questions_set_audit_actor before insert or update on public.assessment_attempt_questions for each row execute function private.set_assessment_runtime_audit_actor();

create trigger assessment_responses_set_audit_actor before insert or update on public.assessment_responses for each row execute function private.set_assessment_runtime_audit_actor();

create trigger assessment_results_set_audit_actor before insert or update on public.assessment_results for each row execute function private.set_assessment_runtime_audit_actor();


create or replace function private.validate_assessment_runtime_scope()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  assignment_record public.assessment_assignments%rowtype;
  recipient_record public.assessment_assignment_recipients%rowtype;
  attempt_record public.assessment_attempts%rowtype;
  attempt_question_record public.assessment_attempt_questions%rowtype;
  template_record public.assessment_templates%rowtype;
begin
  if not exists (
    select 1 from public.schools s
    where s.id = new.school_id
      and s.organization_id = new.organization_id
      and s.status = 'active'
      and s.deleted_at is null
  ) then
    raise exception using errcode='23514',
      message='The selected school does not belong to the selected organization or is inactive.';
  end if;

  if new.campus_id is not null and not exists (
    select 1 from public.campuses c
    where c.id = new.campus_id
      and c.organization_id = new.organization_id
      and c.school_id = new.school_id
      and c.status = 'active'
      and c.deleted_at is null
  ) then
    raise exception using errcode='23514',
      message='The selected campus does not belong to the selected school or is inactive.';
  end if;

  if tg_table_name = 'assessment_assignments' then
    select * into template_record
    from public.assessment_templates
    where id = new.template_id and deleted_at is null;

    if template_record.id is null then
      raise exception using errcode='23503',
        message='The selected assessment template could not be found.';
    end if;

    if template_record.organization_id <> new.organization_id
       or template_record.school_id <> new.school_id
       or (template_record.campus_id is not null and template_record.campus_id is distinct from new.campus_id) then
      raise exception using errcode='23514',
        message='The assignment and template must belong to the same tenant scope.';
    end if;

    if template_record.status <> 'published' then
      raise exception using errcode='23514',
        message='Only published assessment templates may be assigned.';
    end if;
    return new;
  end if;

  select * into assignment_record
  from public.assessment_assignments
  where id = new.assignment_id and deleted_at is null;

  if assignment_record.id is null then
    raise exception using errcode='23503',
      message='The parent assessment assignment could not be found.';
  end if;

  if assignment_record.organization_id <> new.organization_id
     or assignment_record.school_id <> new.school_id
     or assignment_record.campus_id is distinct from new.campus_id then
    raise exception using errcode='23514',
      message='The runtime record and assignment must belong to the same tenant scope.';
  end if;

  if tg_table_name in ('assessment_attempts','assessment_results') then
    select * into recipient_record
    from public.assessment_assignment_recipients
    where id = new.recipient_id and deleted_at is null;

    if recipient_record.id is null or recipient_record.assignment_id <> new.assignment_id then
      raise exception using errcode='23514',
        message='The recipient must belong to the same assignment.';
    end if;
  end if;

  if tg_table_name in ('assessment_attempt_questions','assessment_responses','assessment_results') then
    select * into attempt_record
    from public.assessment_attempts
    where id = new.attempt_id and deleted_at is null;

    if attempt_record.id is null or attempt_record.assignment_id <> new.assignment_id then
      raise exception using errcode='23514',
        message='The attempt must belong to the same assignment.';
    end if;
  end if;

  if tg_table_name = 'assessment_responses' then
    select * into attempt_question_record
    from public.assessment_attempt_questions
    where id = new.attempt_question_id and deleted_at is null;

    if attempt_question_record.id is null
       or attempt_question_record.attempt_id <> new.attempt_id
       or attempt_question_record.question_id <> new.question_id then
      raise exception using errcode='23514',
        message='The response must reference a question from the same attempt.';
    end if;
  end if;

  if tg_table_name = 'assessment_results' and
     (attempt_record.recipient_id <> new.recipient_id or attempt_record.template_id <> new.template_id) then
    raise exception using errcode='23514',
      message='The result must reference the same recipient and template as the attempt.';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_assessment_runtime_scope()
from public, anon, authenticated;

create trigger assessment_assignments_validate_scope before insert or update on public.assessment_assignments for each row execute function private.validate_assessment_runtime_scope();

create trigger assessment_assignment_recipients_validate_scope before insert or update on public.assessment_assignment_recipients for each row execute function private.validate_assessment_runtime_scope();

create trigger assessment_attempts_validate_scope before insert or update on public.assessment_attempts for each row execute function private.validate_assessment_runtime_scope();

create trigger assessment_attempt_questions_validate_scope before insert or update on public.assessment_attempt_questions for each row execute function private.validate_assessment_runtime_scope();

create trigger assessment_responses_validate_scope before insert or update on public.assessment_responses for each row execute function private.validate_assessment_runtime_scope();

create trigger assessment_results_validate_scope before insert or update on public.assessment_results for each row execute function private.validate_assessment_runtime_scope();

alter table public.assessment_assignments enable row level security;
alter table public.assessment_assignments force row level security;

alter table public.assessment_assignment_recipients enable row level security;
alter table public.assessment_assignment_recipients force row level security;

alter table public.assessment_attempts enable row level security;
alter table public.assessment_attempts force row level security;

alter table public.assessment_attempt_questions enable row level security;
alter table public.assessment_attempt_questions force row level security;

alter table public.assessment_responses enable row level security;
alter table public.assessment_responses force row level security;

alter table public.assessment_results enable row level security;
alter table public.assessment_results force row level security;


create policy assessment_assignments_select_authorized on public.assessment_assignments
for select to authenticated using (
  deleted_at is null and (
    private.has_school_permission(school_id,'assessments.view')
    or private.has_organization_permission(organization_id,'assessments.view')
    
  )
);
create policy assessment_assignments_insert_authorized on public.assessment_assignments
for insert to authenticated with check (
  private.has_school_permission(school_id,'assessments.assign')
  or private.has_organization_permission(organization_id,'assessments.assign')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
);
create policy assessment_assignments_update_authorized on public.assessment_assignments
for update to authenticated using (
  private.has_school_permission(school_id,'assessments.assign')
  or private.has_organization_permission(organization_id,'assessments.assign')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
) with check (
  private.has_school_permission(school_id,'assessments.assign')
  or private.has_organization_permission(organization_id,'assessments.assign')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
);


create policy assessment_assignment_recipients_select_authorized on public.assessment_assignment_recipients
for select to authenticated using (
  deleted_at is null and (
    private.has_school_permission(school_id,'assessments.view')
    or private.has_organization_permission(organization_id,'assessments.view')
    or recipient_profile_id = auth.uid()
  )
);
create policy assessment_assignment_recipients_insert_authorized on public.assessment_assignment_recipients
for insert to authenticated with check (
  private.has_school_permission(school_id,'assessments.assign')
  or private.has_organization_permission(organization_id,'assessments.assign')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
);
create policy assessment_assignment_recipients_update_authorized on public.assessment_assignment_recipients
for update to authenticated using (
  private.has_school_permission(school_id,'assessments.assign')
  or private.has_organization_permission(organization_id,'assessments.assign')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
) with check (
  private.has_school_permission(school_id,'assessments.assign')
  or private.has_organization_permission(organization_id,'assessments.assign')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
);


create policy assessment_attempts_select_authorized on public.assessment_attempts
for select to authenticated using (
  deleted_at is null and (
    exists (select 1 from public.assessment_assignment_recipients r where r.id = assessment_attempts.recipient_id and r.recipient_profile_id = auth.uid() and r.deleted_at is null)
    or private.has_school_permission(school_id,'assessments.view')
    or private.has_organization_permission(organization_id,'assessments.view')
    or private.has_school_permission(school_id,'assessments.review')
    or private.has_organization_permission(organization_id,'assessments.review')
  )
);
create policy assessment_attempts_insert_authorized on public.assessment_attempts
for insert to authenticated with check (
  private.has_school_permission(school_id,'assessments.take')
  or private.has_organization_permission(organization_id,'assessments.take')
  or private.has_school_permission(school_id,'assessments.grade')
  or private.has_organization_permission(organization_id,'assessments.grade')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
);
create policy assessment_attempts_update_authorized on public.assessment_attempts
for update to authenticated using (
  exists (select 1 from public.assessment_assignment_recipients r where r.id = assessment_attempts.recipient_id and r.recipient_profile_id = auth.uid() and r.deleted_at is null)
  or private.has_school_permission(school_id,'assessments.grade')
  or private.has_organization_permission(organization_id,'assessments.grade')
  or private.has_school_permission(school_id,'assessments.review')
  or private.has_organization_permission(organization_id,'assessments.review')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
) with check (
  exists (select 1 from public.assessment_assignment_recipients r where r.id = assessment_attempts.recipient_id and r.recipient_profile_id = auth.uid() and r.deleted_at is null)
  or private.has_school_permission(school_id,'assessments.grade')
  or private.has_organization_permission(organization_id,'assessments.grade')
  or private.has_school_permission(school_id,'assessments.review')
  or private.has_organization_permission(organization_id,'assessments.review')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
);


create policy assessment_attempt_questions_select_authorized on public.assessment_attempt_questions
for select to authenticated using (
  deleted_at is null and (
    exists (select 1 from public.assessment_attempts a join public.assessment_assignment_recipients r on r.id=a.recipient_id where a.id=assessment_attempt_questions.attempt_id and r.recipient_profile_id=auth.uid() and a.deleted_at is null and r.deleted_at is null)
    or private.has_school_permission(school_id,'assessments.view')
    or private.has_organization_permission(organization_id,'assessments.view')
    or private.has_school_permission(school_id,'assessments.review')
    or private.has_organization_permission(organization_id,'assessments.review')
  )
);
create policy assessment_attempt_questions_insert_authorized on public.assessment_attempt_questions
for insert to authenticated with check (
  private.has_school_permission(school_id,'assessments.take')
  or private.has_organization_permission(organization_id,'assessments.take')
  or private.has_school_permission(school_id,'assessments.grade')
  or private.has_organization_permission(organization_id,'assessments.grade')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
);
create policy assessment_attempt_questions_update_authorized on public.assessment_attempt_questions
for update to authenticated using (
  exists (select 1 from public.assessment_attempts a join public.assessment_assignment_recipients r on r.id=a.recipient_id where a.id=assessment_attempt_questions.attempt_id and r.recipient_profile_id=auth.uid() and a.deleted_at is null and r.deleted_at is null)
  or private.has_school_permission(school_id,'assessments.grade')
  or private.has_organization_permission(organization_id,'assessments.grade')
  or private.has_school_permission(school_id,'assessments.review')
  or private.has_organization_permission(organization_id,'assessments.review')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
) with check (
  exists (select 1 from public.assessment_attempts a join public.assessment_assignment_recipients r on r.id=a.recipient_id where a.id=assessment_attempt_questions.attempt_id and r.recipient_profile_id=auth.uid() and a.deleted_at is null and r.deleted_at is null)
  or private.has_school_permission(school_id,'assessments.grade')
  or private.has_organization_permission(organization_id,'assessments.grade')
  or private.has_school_permission(school_id,'assessments.review')
  or private.has_organization_permission(organization_id,'assessments.review')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
);


create policy assessment_responses_select_authorized on public.assessment_responses
for select to authenticated using (
  deleted_at is null and (
    exists (select 1 from public.assessment_attempts a join public.assessment_assignment_recipients r on r.id=a.recipient_id where a.id=assessment_responses.attempt_id and r.recipient_profile_id=auth.uid() and a.deleted_at is null and r.deleted_at is null)
    or private.has_school_permission(school_id,'assessments.view')
    or private.has_organization_permission(organization_id,'assessments.view')
    or private.has_school_permission(school_id,'assessments.review')
    or private.has_organization_permission(organization_id,'assessments.review')
  )
);
create policy assessment_responses_insert_authorized on public.assessment_responses
for insert to authenticated with check (
  private.has_school_permission(school_id,'assessments.take')
  or private.has_organization_permission(organization_id,'assessments.take')
  or private.has_school_permission(school_id,'assessments.grade')
  or private.has_organization_permission(organization_id,'assessments.grade')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
);
create policy assessment_responses_update_authorized on public.assessment_responses
for update to authenticated using (
  exists (select 1 from public.assessment_attempts a join public.assessment_assignment_recipients r on r.id=a.recipient_id where a.id=assessment_responses.attempt_id and r.recipient_profile_id=auth.uid() and a.deleted_at is null and r.deleted_at is null)
  or private.has_school_permission(school_id,'assessments.grade')
  or private.has_organization_permission(organization_id,'assessments.grade')
  or private.has_school_permission(school_id,'assessments.review')
  or private.has_organization_permission(organization_id,'assessments.review')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
) with check (
  exists (select 1 from public.assessment_attempts a join public.assessment_assignment_recipients r on r.id=a.recipient_id where a.id=assessment_responses.attempt_id and r.recipient_profile_id=auth.uid() and a.deleted_at is null and r.deleted_at is null)
  or private.has_school_permission(school_id,'assessments.grade')
  or private.has_organization_permission(organization_id,'assessments.grade')
  or private.has_school_permission(school_id,'assessments.review')
  or private.has_organization_permission(organization_id,'assessments.review')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
);


create policy assessment_results_select_authorized on public.assessment_results
for select to authenticated using (
  deleted_at is null and (
    exists (select 1 from public.assessment_assignment_recipients r where r.id=assessment_results.recipient_id and r.recipient_profile_id=auth.uid() and r.deleted_at is null)
    or private.has_school_permission(school_id,'assessments.view')
    or private.has_organization_permission(organization_id,'assessments.view')
    or private.has_school_permission(school_id,'assessments.review')
    or private.has_organization_permission(organization_id,'assessments.review')
  )
);
create policy assessment_results_insert_authorized on public.assessment_results
for insert to authenticated with check (
  private.has_school_permission(school_id,'assessments.take')
  or private.has_organization_permission(organization_id,'assessments.take')
  or private.has_school_permission(school_id,'assessments.grade')
  or private.has_organization_permission(organization_id,'assessments.grade')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
);
create policy assessment_results_update_authorized on public.assessment_results
for update to authenticated using (
  exists (select 1 from public.assessment_assignment_recipients r where r.id=assessment_results.recipient_id and r.recipient_profile_id=auth.uid() and r.deleted_at is null)
  or private.has_school_permission(school_id,'assessments.grade')
  or private.has_organization_permission(organization_id,'assessments.grade')
  or private.has_school_permission(school_id,'assessments.review')
  or private.has_organization_permission(organization_id,'assessments.review')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
) with check (
  exists (select 1 from public.assessment_assignment_recipients r where r.id=assessment_results.recipient_id and r.recipient_profile_id=auth.uid() and r.deleted_at is null)
  or private.has_school_permission(school_id,'assessments.grade')
  or private.has_organization_permission(organization_id,'assessments.grade')
  or private.has_school_permission(school_id,'assessments.review')
  or private.has_organization_permission(organization_id,'assessments.review')
  or private.has_school_permission(school_id,'assessments.manage')
  or private.has_organization_permission(organization_id,'assessments.manage')
);


revoke all on table public.assessment_assignments,
  public.assessment_assignment_recipients,
  public.assessment_attempts,
  public.assessment_attempt_questions,
  public.assessment_responses,
  public.assessment_results from anon;
revoke all on table public.assessment_assignments,
  public.assessment_assignment_recipients,
  public.assessment_attempts,
  public.assessment_attempt_questions,
  public.assessment_responses,
  public.assessment_results from authenticated;
grant select, insert, update on table public.assessment_assignments,
  public.assessment_assignment_recipients,
  public.assessment_attempts,
  public.assessment_attempt_questions,
  public.assessment_responses,
  public.assessment_results to authenticated;

do $$
declare table_count integer; rls_count integer; policy_count integer;
begin
  select count(*) into table_count from information_schema.tables
  where table_schema='public' and table_name in ('assessment_assignments','assessment_assignment_recipients','assessment_attempts','assessment_attempt_questions','assessment_responses','assessment_results');
  if table_count <> 6 then raise exception 'Expected 6 assessment runtime tables, found %.', table_count; end if;

  select count(*) into rls_count from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname in ('assessment_assignments','assessment_assignment_recipients','assessment_attempts','assessment_attempt_questions','assessment_responses','assessment_results')
    and c.relrowsecurity and c.relforcerowsecurity;
  if rls_count <> 6 then raise exception 'Expected forced RLS on 6 runtime tables, found %.', rls_count; end if;

  select count(*) into policy_count from pg_policies
  where schemaname='public' and tablename in ('assessment_assignments','assessment_assignment_recipients','assessment_attempts','assessment_attempt_questions','assessment_responses','assessment_results');
  if policy_count <> 18 then raise exception 'Expected 18 runtime policies, found %.', policy_count; end if;
end;
$$;

commit;