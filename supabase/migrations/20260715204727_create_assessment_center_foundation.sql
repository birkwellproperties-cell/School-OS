insert into public.permissions (
  code,
  module,
  action,
  description,
  risk_level
)
values
  (
    'assessments.view',
    'assessments',
    'view',
    'View assessment banks, templates, assignments, attempts, and results.',
    'standard'
  ),
  (
    'assessments.create',
    'assessments',
    'create',
    'Create assessment banks, questions, and templates.',
    'elevated'
  ),
  (
    'assessments.edit',
    'assessments',
    'edit',
    'Modify assessment banks, questions, templates, and settings.',
    'elevated'
  ),
  (
    'assessments.publish',
    'assessments',
    'publish',
    'Publish assessment versions for assignment and delivery.',
    'critical'
  ),
  (
    'assessments.assign',
    'assessments',
    'assign',
    'Assign assessments to candidates, applicants, students, or staff.',
    'elevated'
  ),
  (
    'assessments.take',
    'assessments',
    'take',
    'Take assigned assessments and submit responses.',
    'standard'
  ),
  (
    'assessments.grade',
    'assessments',
    'grade',
    'Grade assessment responses and record scores.',
    'elevated'
  ),
  (
    'assessments.review',
    'assessments',
    'review',
    'Review assessment attempts, results, and integrity events.',
    'elevated'
  ),
  (
    'assessments.manage',
    'assessments',
    'manage',
    'Manage assessment configuration, security, publishing, and administration.',
    'critical'
  )
on conflict (lower(code)) do update
set
  module = excluded.module,
  action = excluded.action,
  description = excluded.description,
  risk_level = excluded.risk_level;