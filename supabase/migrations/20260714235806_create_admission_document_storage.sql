-- ============================================================
-- SchoolOS Enterprise
-- Admissions document storage foundation
-- ============================================================

-- Private bucket used for admission application documents.
--
-- Expected object path:
--
-- organization_id/
-- school_id/
-- campus_or_school/
-- application_id/
-- unique_file_name
--
-- The first two path segments are UUIDs and are used by
-- Storage RLS to enforce organization and school scope.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'admission-documents',
  'admission-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- Helper functions
-- ============================================================

create or replace function private.admission_document_path_organization_id(
  object_name text
)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  path_parts text[];
begin
  path_parts := storage.foldername(object_name);

  if coalesce(array_length(path_parts, 1), 0) < 2 then
    return null;
  end if;

  begin
    return path_parts[1]::uuid;
  exception
    when invalid_text_representation then
      return null;
  end;
end;
$$;

create or replace function private.admission_document_path_school_id(
  object_name text
)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  path_parts text[];
begin
  path_parts := storage.foldername(object_name);

  if coalesce(array_length(path_parts, 1), 0) < 2 then
    return null;
  end if;

  begin
    return path_parts[2]::uuid;
  exception
    when invalid_text_representation then
      return null;
  end;
end;
$$;

create or replace function private.can_view_admission_document_object(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.admission_document_path_organization_id(object_name)
      is not null
    and private.admission_document_path_school_id(object_name)
      is not null
    and private.has_school_permission(
      private.admission_document_path_school_id(object_name),
      'applications.view'
    );
$$;

create or replace function private.can_create_admission_document_object(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.admission_document_path_organization_id(object_name)
      is not null
    and private.admission_document_path_school_id(object_name)
      is not null
    and (
      private.has_school_permission(
        private.admission_document_path_school_id(object_name),
        'applications.create'
      )
      or private.has_school_permission(
        private.admission_document_path_school_id(object_name),
        'applications.edit'
      )
      or private.has_school_permission(
        private.admission_document_path_school_id(object_name),
        'applications.review'
      )
    );
$$;

create or replace function private.can_manage_admission_document_object(
  object_name text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.admission_document_path_organization_id(object_name)
      is not null
    and private.admission_document_path_school_id(object_name)
      is not null
    and (
      private.has_school_permission(
        private.admission_document_path_school_id(object_name),
        'applications.edit'
      )
      or private.has_school_permission(
        private.admission_document_path_school_id(object_name),
        'applications.review'
      )
    );
$$;

revoke all
on function private.admission_document_path_organization_id(text)
from public, anon, authenticated;

revoke all
on function private.admission_document_path_school_id(text)
from public, anon, authenticated;

revoke all
on function private.can_view_admission_document_object(text)
from public, anon, authenticated;

revoke all
on function private.can_create_admission_document_object(text)
from public, anon, authenticated;

revoke all
on function private.can_manage_admission_document_object(text)
from public, anon, authenticated;

-- ============================================================
-- Storage object policies
-- ============================================================

drop policy if exists
  admission_documents_select_authorized
on storage.objects;

create policy admission_documents_select_authorized
on storage.objects
for select
to authenticated
using (
  bucket_id = 'admission-documents'
  and private.can_view_admission_document_object(name)
);

drop policy if exists
  admission_documents_insert_authorized
on storage.objects;

create policy admission_documents_insert_authorized
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'admission-documents'
  and private.can_create_admission_document_object(name)
);

drop policy if exists
  admission_documents_update_authorized
on storage.objects;

create policy admission_documents_update_authorized
on storage.objects
for update
to authenticated
using (
  bucket_id = 'admission-documents'
  and private.can_manage_admission_document_object(name)
)
with check (
  bucket_id = 'admission-documents'
  and private.can_manage_admission_document_object(name)
);

drop policy if exists
  admission_documents_delete_authorized
on storage.objects;

create policy admission_documents_delete_authorized
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'admission-documents'
  and private.can_manage_admission_document_object(name)
);

-- ============================================================
-- Validation
-- ============================================================

do $$
declare
  bucket_count integer;
  policy_count integer;
begin
  select count(*)
  into bucket_count
  from storage.buckets
  where id = 'admission-documents'
    and public is false
    and file_size_limit = 10485760;

  if bucket_count <> 1 then
    raise exception
      'Admissions document storage bucket validation failed.';
  end if;

  select count(*)
  into policy_count
  from pg_catalog.pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname in (
      'admission_documents_select_authorized',
      'admission_documents_insert_authorized',
      'admission_documents_update_authorized',
      'admission_documents_delete_authorized'
    );

  if policy_count <> 4 then
    raise exception
      'Expected 4 Admissions Storage policies, found %.',
      policy_count;
  end if;
end;
$$;