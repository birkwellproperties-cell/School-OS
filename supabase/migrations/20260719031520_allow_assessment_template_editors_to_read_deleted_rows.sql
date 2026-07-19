begin;

drop policy if exists
  assessment_template_questions_select_editors
on public.assessment_template_questions;

create policy
  assessment_template_questions_select_editors
on public.assessment_template_questions
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
  assessment_template_sections_select_editors
on public.assessment_template_sections;

create policy
  assessment_template_sections_select_editors
on public.assessment_template_sections
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
