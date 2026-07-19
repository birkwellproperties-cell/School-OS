begin;

grant update (
  duration_minutes,
  total_marks,
  passing_marks,
  pass_percentage,
  max_attempts,
  randomize_questions,
  randomize_sections,
  show_results,
  show_correct_answers,
  calculator_policy,
  resource_policy,
  fullscreen_policy,
  tab_switch_policy,
  tab_switch_limit,
  copy_paste_policy,
  proctoring_mode
)
on table public.assessment_templates
to authenticated;

notify pgrst, 'reload schema';

commit;
