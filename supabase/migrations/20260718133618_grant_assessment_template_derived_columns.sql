begin;

grant update (
  maximum_score,
  question_count,
  section_count
)
on table public.assessment_templates
to authenticated;

notify pgrst, 'reload schema';

commit;
