alter table public.assessment_templates
  add column if not exists duration_minutes integer,
  add column if not exists total_marks numeric(12, 2),
  add column if not exists passing_marks numeric(12, 2),
  add column if not exists pass_percentage numeric(5, 2);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname =
      'assessment_templates_duration_minutes_check'
  ) then
    alter table public.assessment_templates
      add constraint assessment_templates_duration_minutes_check
      check (
        duration_minutes is null
        or duration_minutes >= 1
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname =
      'assessment_templates_total_marks_check'
  ) then
    alter table public.assessment_templates
      add constraint assessment_templates_total_marks_check
      check (
        total_marks is null
        or total_marks >= 0
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname =
      'assessment_templates_passing_marks_check'
  ) then
    alter table public.assessment_templates
      add constraint assessment_templates_passing_marks_check
      check (
        passing_marks is null
        or passing_marks >= 0
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname =
      'assessment_templates_pass_percentage_check'
  ) then
    alter table public.assessment_templates
      add constraint assessment_templates_pass_percentage_check
      check (
        pass_percentage is null
        or (
          pass_percentage >= 0
          and pass_percentage <= 100
        )
      );
  end if;
end
$$;

notify pgrst, 'reload schema';