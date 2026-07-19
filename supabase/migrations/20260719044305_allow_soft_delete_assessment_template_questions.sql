create or replace function private.validate_assessment_template_question()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_temp'
as $function$
declare
  template_record public.assessment_templates%rowtype;
  section_record public.assessment_template_sections%rowtype;
  question_record public.assessment_questions%rowtype;
  effective_marks numeric(12, 4);
  effective_negative_marks numeric(12, 4);
begin
  if
    tg_op = 'UPDATE'
    and old.deleted_at is null
    and new.deleted_at is not null
  then
    return new;
  end if;

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
$function$;
