alter table public.assessment_templates
  add column if not exists max_attempts integer not null default 1,

  add column if not exists randomize_questions boolean not null default false,
  add column if not exists randomize_sections boolean not null default false,

  add column if not exists show_results boolean not null default true,
  add column if not exists show_correct_answers boolean not null default false,

  add column if not exists calculator_policy text not null default 'not_allowed',
  add column if not exists resource_policy text not null default 'closed_book',
  add column if not exists fullscreen_policy text not null default 'disabled',

  add column if not exists tab_switch_policy text not null default 'ignore',
  add column if not exists tab_switch_limit integer,

  add column if not exists copy_paste_policy text not null default 'enabled',
  add column if not exists proctoring_mode text not null default 'none',

  add column if not exists version_number integer not null default 1,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

  do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'assessment_templates_max_attempts_check'
  ) then
    alter table public.assessment_templates
      add constraint assessment_templates_max_attempts_check
      check (max_attempts >= 1);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'assessment_templates_tab_switch_limit_check'
  ) then
    alter table public.assessment_templates
      add constraint assessment_templates_tab_switch_limit_check
      check (
        tab_switch_limit is null
        or tab_switch_limit >= 0
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'assessment_templates_version_number_check'
  ) then
    alter table public.assessment_templates
      add constraint assessment_templates_version_number_check
      check (version_number >= 1);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'assessment_templates_calculator_policy_check'
  ) then
    alter table public.assessment_templates
      add constraint assessment_templates_calculator_policy_check
      check (
        calculator_policy in (
          'not_allowed',
          'basic',
          'scientific',
          'provided',
          'unrestricted'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'assessment_templates_resource_policy_check'
  ) then
    alter table public.assessment_templates
      add constraint assessment_templates_resource_policy_check
      check (
        resource_policy in (
          'closed_book',
          'open_book',
          'provided_resources',
          'unrestricted'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'assessment_templates_fullscreen_policy_check'
  ) then
    alter table public.assessment_templates
      add constraint assessment_templates_fullscreen_policy_check
      check (
        fullscreen_policy in (
          'disabled',
          'optional',
          'required'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'assessment_templates_tab_switch_policy_check'
  ) then
    alter table public.assessment_templates
      add constraint assessment_templates_tab_switch_policy_check
      check (
        tab_switch_policy in (
          'ignore',
          'log_only',
          'warn',
          'limit',
          'terminate'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'assessment_templates_copy_paste_policy_check'
  ) then
    alter table public.assessment_templates
      add constraint assessment_templates_copy_paste_policy_check
      check (
        copy_paste_policy in (
          'enabled',
          'disabled',
          'log_only'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'assessment_templates_proctoring_mode_check'
  ) then
    alter table public.assessment_templates
      add constraint assessment_templates_proctoring_mode_check
      check (
        proctoring_mode in (
          'none',
          'browser_events',
          'live',
          'recorded',
          'external'
        )
      );
  end if;
end
$$;