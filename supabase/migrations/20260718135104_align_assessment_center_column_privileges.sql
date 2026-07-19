begin;

-- ============================================================
-- Assessment Center column privilege alignment
--
-- Scope:
--   * public tables beginning with assessment_
--   * authenticated already possesses at least one UPDATE grant
--
-- Excluded:
--   * record identity
--   * tenancy identifiers
--   * immutable creation metadata
--   * generated or identity columns
-- ============================================================

do $migration$
declare
  target_table record;
  writable_columns text;
begin
  for target_table in
    select distinct
      c.table_schema,
      c.table_name
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name like 'assessment\_%' escape '\'
      and exists (
        select 1
        from information_schema.column_privileges cp
        where cp.table_schema = c.table_schema
          and cp.table_name = c.table_name
          and cp.grantee = 'authenticated'
          and cp.privilege_type = 'UPDATE'
      )
    order by c.table_name
  loop
    select
      string_agg(
        format('%I', c.column_name),
        ', ' order by c.ordinal_position
      )
    into writable_columns
    from information_schema.columns c
    where c.table_schema = target_table.table_schema
      and c.table_name = target_table.table_name

      -- Do not permit changing record identity.
      and c.column_name not in (
        'id'
      )

      -- Do not permit moving records between tenant scopes.
      and c.column_name not in (
        'organization_id',
        'school_id',
        'campus_id'
      )

      -- Creation metadata is immutable.
      and c.column_name not in (
        'created_at',
        'created_by'
      )

      -- PostgreSQL-managed/generated columns are excluded.
      and coalesce(c.is_generated, 'NEVER') = 'NEVER'
      and coalesce(c.is_identity, 'NO') = 'NO';

    if writable_columns is not null then
      execute format(
        'grant update (%s) on table %I.%I to authenticated',
        writable_columns,
        target_table.table_schema,
        target_table.table_name
      );

      raise notice
        'Aligned UPDATE privileges on %.%',
        target_table.table_schema,
        target_table.table_name;
    end if;
  end loop;
end;
$migration$;

notify pgrst, 'reload schema';

commit;
