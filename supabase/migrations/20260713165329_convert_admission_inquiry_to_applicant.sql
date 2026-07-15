-- ============================================================
-- ATOMIC ADMISSION INQUIRY TO APPLICANT CONVERSION
-- ============================================================

create or replace function public.convert_admission_inquiry_to_applicant(
  p_inquiry_id uuid,
  p_transition_notes text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inquiry_record public.admission_inquiries%rowtype;
  applicant_record public.admission_applicants%rowtype;
  generated_applicant_number text;
  current_profile_id uuid;
begin
  if p_inquiry_id is null then
    raise exception
      using
        errcode = '22004',
        message = 'Inquiry id is required.';
  end if;

  current_profile_id := auth.uid();

  if current_profile_id is null then
    raise exception
      using
        errcode = '42501',
        message = 'Authentication is required.';
  end if;

  select *
  into inquiry_record
  from public.admission_inquiries
  where id = p_inquiry_id
    and deleted_at is null
  for update;

  if not found then
    raise exception
      using
        errcode = 'P0002',
        message = 'The admission inquiry could not be found.';
  end if;

  if inquiry_record.status = 'converted'
     and inquiry_record.converted_applicant_id is not null then
    select *
    into applicant_record
    from public.admission_applicants
    where id =
      inquiry_record.converted_applicant_id
      and deleted_at is null;

    if found then
      return jsonb_build_object(
        'inquiry',
        to_jsonb(inquiry_record),
        'applicant',
        to_jsonb(applicant_record),
        'alreadyConverted',
        true
      );
    end if;
  end if;

  if inquiry_record.status <> 'qualified' then
    raise exception
      using
        errcode = '23514',
        message =
          'Only qualified inquiries can be converted to applicants.';
  end if;

  generated_applicant_number :=
    'APP-' ||
    to_char(current_timestamp, 'YYYYMMDD') ||
    '-' ||
    upper(
      substring(
        replace(
          gen_random_uuid()::text,
          '-',
          ''
        )
        from 1
        for 8
      )
    );

  insert into public.admission_applicants (
    organization_id,
    school_id,
    campus_id,
    applicant_number,

    first_name,
    middle_name,
    last_name,

    current_grade_level,

    status,
    metadata,

    created_by,
    updated_by
  )
  values (
    inquiry_record.organization_id,
    inquiry_record.school_id,
    inquiry_record.campus_id,
    generated_applicant_number,

    inquiry_record
      .prospective_student_first_name,

    inquiry_record
      .prospective_student_middle_name,

    inquiry_record
      .prospective_student_last_name,

    inquiry_record
      .prospective_grade_level,

    'applicant',

    jsonb_build_object(
      'source_inquiry_id',
      inquiry_record.id,

      'source_inquiry_number',
      inquiry_record.inquiry_number,

      'intended_start_date',
      inquiry_record.intended_start_date,

      'inquiry_source',
      inquiry_record.source
    ),

    current_profile_id,
    current_profile_id
  )
  returning *
  into applicant_record;

  update public.admission_inquiries
  set
    status = 'converted',

    converted_applicant_id =
      applicant_record.id,

    next_follow_up_at = null,

    updated_by =
      current_profile_id,

    updated_at =
      current_timestamp
  where id = inquiry_record.id
    and deleted_at is null
  returning *
  into inquiry_record;

  insert into public.admission_status_history (
    organization_id,
    school_id,
    campus_id,
    admission_cycle_id,

    inquiry_id,

    entity_type,
    entity_id,

    previous_status,
    new_status,

    transition_reason,
    transition_notes,

    changed_by,
    created_by,

    metadata
  )
  values (
    inquiry_record.organization_id,
    inquiry_record.school_id,
    inquiry_record.campus_id,
    inquiry_record.admission_cycle_id,

    inquiry_record.id,

    'inquiry',
    inquiry_record.id,

    'qualified',
    'converted',

    'inquiry_converted_to_applicant',
    nullif(
      trim(
        coalesce(
          p_transition_notes,
          ''
        )
      ),
      ''
    ),

    current_profile_id,
    current_profile_id,

    jsonb_build_object(
      'applicant_id',
      applicant_record.id,

      'applicant_number',
      applicant_record.applicant_number
    )
  );

  insert into public.admission_status_history (
    organization_id,
    school_id,
    campus_id,
    admission_cycle_id,

    applicant_id,

    entity_type,
    entity_id,

    previous_status,
    new_status,

    transition_reason,
    transition_notes,

    changed_by,
    created_by,

    metadata
  )
  values (
    inquiry_record.organization_id,
    inquiry_record.school_id,
    inquiry_record.campus_id,
    inquiry_record.admission_cycle_id,

    applicant_record.id,

    'applicant',
    applicant_record.id,

    null,
    'applicant',

    'created_from_inquiry',
    nullif(
      trim(
        coalesce(
          p_transition_notes,
          ''
        )
      ),
      ''
    ),

    current_profile_id,
    current_profile_id,

    jsonb_build_object(
      'inquiry_id',
      inquiry_record.id,

      'inquiry_number',
      inquiry_record.inquiry_number
    )
  );

  return jsonb_build_object(
    'inquiry',
    to_jsonb(inquiry_record),

    'applicant',
    to_jsonb(applicant_record),

    'alreadyConverted',
    false
  );
end;
$$;

revoke all
on function public.convert_admission_inquiry_to_applicant(
  uuid,
  text
)
from public;

revoke all
on function public.convert_admission_inquiry_to_applicant(
  uuid,
  text
)
from anon;

grant execute
on function public.convert_admission_inquiry_to_applicant(
  uuid,
  text
)
to authenticated;

comment on function public.convert_admission_inquiry_to_applicant(
  uuid,
  text
)
is
'Atomically converts a qualified admission inquiry into an applicant and records both lifecycle transitions.';