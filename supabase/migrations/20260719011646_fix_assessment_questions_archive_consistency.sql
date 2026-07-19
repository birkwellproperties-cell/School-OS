alter table public.assessment_questions
drop constraint if exists assessment_questions_archive_consistency;

alter table public.assessment_questions
add constraint assessment_questions_archive_consistency
check (
  deleted_at is not null

  or (
    status <> 'archived'
    and archived_at is null
    and archived_by is null
  )

  or (
    status = 'archived'
    and archived_at is not null
  )
);
