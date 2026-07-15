-- ============================================================
-- SchoolOS Enterprise
-- Allow Storage RLS policies to execute Admissions authorization
-- helpers for authenticated users.
-- ============================================================

grant execute
on function private.can_view_admission_document_object(text)
to authenticated;

grant execute
on function private.can_create_admission_document_object(text)
to authenticated;

grant execute
on function private.can_manage_admission_document_object(text)
to authenticated;

revoke all
on function private.admission_document_path_organization_id(text)
from public, anon, authenticated;

revoke all
on function private.admission_document_path_school_id(text)
from public, anon, authenticated;

do $$
declare
  missing_grants integer;
begin
  select count(*)
  into missing_grants
  from (
    values
      (
        'private.can_view_admission_document_object(text)'::regprocedure
      ),
      (
        'private.can_create_admission_document_object(text)'::regprocedure
      ),
      (
        'private.can_manage_admission_document_object(text)'::regprocedure
      )
  ) as required_functions(function_oid)
  where not has_function_privilege(
    'authenticated',
    function_oid,
    'EXECUTE'
  );

  if missing_grants <> 0 then
    raise exception
      'Admissions Storage authorization function grants are incomplete.';
  end if;
end;
$$;
