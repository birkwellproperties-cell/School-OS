begin;

drop policy if exists
  assessment_questions_select_editors
on public.assessment_questions;

create policy
  assessment_questions_select_editors
on public.assessment_questions
for select
to authenticated
using (
  private.has_school_permission(
    school_id,
    'assessments.edit'
  )
  or
  private.has_organization_permission(
    organization_id,
    'assessments.edit'
  )
);

drop policy if exists
  assessment_question_options_select_editors
on public.assessment_question_options;

create policy
  assessment_question_options_select_editors
on public.assessment_question_options
for select
to authenticated
using (
  private.has_school_permission(
    school_id,
    'assessments.edit'
  )
  or
  private.has_organization_permission(
    organization_id,
    'assessments.edit'
  )
);

commit;
