-- ============================================================
-- SCHOOLOS ADMISSIONS DOMAIN
-- Phase 2.1
-- ============================================================
--
-- Establishes the production Admissions domain for:
--   * admission cycles
--   * inquiries
--   * applicants
--   * guardians
--   * applications
--   * documents
--   * interviews
--   * decisions
--   * offers
--   * status history
--   * enrollment conversion
--
-- Authorization uses the existing applications.* permission
-- registry and the TEP tenant-aware permission functions.
--
-- ============================================================

-- ============================================================
-- 1. ADMISSION CYCLES
-- ============================================================

create table public.admission_cycles (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  campus_id uuid
    references public.campuses(id) on delete restrict,

  name text not null,
  code text not null,

  academic_year_label text not null,

  opens_at timestamptz,
  closes_at timestamptz,

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'open',
        'closed',
        'archived'
      )
    ),

  application_target integer
    check (
      application_target is null
      or application_target >= 0
    ),

  seat_capacity integer
    check (
      seat_capacity is null
      or seat_capacity >= 0
    ),

  notes text,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint admission_cycles_name_not_blank
    check (length(trim(name)) > 0),

  constraint admission_cycles_code_not_blank
    check (length(trim(code)) > 0),

  constraint admission_cycles_academic_year_not_blank
    check (length(trim(academic_year_label)) > 0),

  constraint admission_cycles_date_order_check
    check (
      closes_at is null
      or opens_at is null
      or closes_at >= opens_at
    ),

  constraint admission_cycles_archived_consistency
    check (
      (archived_at is null and archived_by is null)
      or archived_at is not null
    ),

  constraint admission_cycles_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    )
);

comment on table public.admission_cycles
is 'School-scoped admissions periods controlling inquiry, application, offer, and enrollment activity.';

create unique index admission_cycles_active_code_unique_idx
  on public.admission_cycles (
    school_id,
    lower(code)
  )
  where deleted_at is null;

create index admission_cycles_organization_idx
  on public.admission_cycles (organization_id)
  where deleted_at is null;

create index admission_cycles_school_status_idx
  on public.admission_cycles (
    school_id,
    status
  )
  where deleted_at is null;

create index admission_cycles_campus_idx
  on public.admission_cycles (campus_id)
  where campus_id is not null
    and deleted_at is null;

create index admission_cycles_open_window_idx
  on public.admission_cycles (
    opens_at,
    closes_at
  )
  where deleted_at is null;

create trigger admission_cycles_set_updated_at
before update on public.admission_cycles
for each row
execute function public.set_updated_at();

-- ============================================================
-- 2. ADMISSION INQUIRIES
-- ============================================================

create table public.admission_inquiries (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  campus_id uuid
    references public.campuses(id) on delete restrict,

  admission_cycle_id uuid
    references public.admission_cycles(id) on delete restrict,

  inquiry_number text not null,

  source text not null default 'manual'
    check (
      source in (
        'manual',
        'website',
        'phone',
        'email',
        'walk_in',
        'referral',
        'event',
        'campaign',
        'partner',
        'other'
      )
    ),

  status text not null default 'new'
    check (
      status in (
        'new',
        'contacted',
        'qualified',
        'unqualified',
        'converted',
        'closed'
      )
    ),

  prospective_student_first_name text not null,
  prospective_student_middle_name text,
  prospective_student_last_name text not null,

  prospective_grade_level text,
  intended_start_date date,

  contact_name text not null,
  contact_relationship text,

  contact_email text,
  contact_phone text,

  preferred_contact_method text
    check (
      preferred_contact_method is null
      or preferred_contact_method in (
        'email',
        'phone',
        'sms',
        'whatsapp'
      )
    ),

  message text,

  assigned_to uuid
    references public.profiles(id) on delete set null,

  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,

  converted_applicant_id uuid,

  closed_at timestamptz,
  closed_reason text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint admission_inquiries_number_not_blank
    check (length(trim(inquiry_number)) > 0),

  constraint admission_inquiries_student_first_name_not_blank
    check (length(trim(prospective_student_first_name)) > 0),

  constraint admission_inquiries_student_last_name_not_blank
    check (length(trim(prospective_student_last_name)) > 0),

  constraint admission_inquiries_contact_name_not_blank
    check (length(trim(contact_name)) > 0),

  constraint admission_inquiries_contact_channel_check
    check (
      nullif(trim(coalesce(contact_email, '')), '') is not null
      or nullif(trim(coalesce(contact_phone, '')), '') is not null
    ),

  constraint admission_inquiries_closed_consistency
    check (
      status <> 'closed'
      or closed_at is not null
    ),

  constraint admission_inquiries_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    )
);

comment on table public.admission_inquiries
is 'Prospective-family inquiries captured before or during the formal application process.';

create unique index admission_inquiries_active_number_unique_idx
  on public.admission_inquiries (
    school_id,
    lower(inquiry_number)
  )
  where deleted_at is null;

create index admission_inquiries_organization_idx
  on public.admission_inquiries (organization_id)
  where deleted_at is null;

create index admission_inquiries_school_status_idx
  on public.admission_inquiries (
    school_id,
    status,
    created_at desc
  )
  where deleted_at is null;

create index admission_inquiries_cycle_idx
  on public.admission_inquiries (admission_cycle_id)
  where admission_cycle_id is not null
    and deleted_at is null;

create index admission_inquiries_assigned_to_idx
  on public.admission_inquiries (
    assigned_to,
    next_follow_up_at
  )
  where assigned_to is not null
    and deleted_at is null;

create index admission_inquiries_contact_email_idx
  on public.admission_inquiries (lower(contact_email))
  where contact_email is not null
    and deleted_at is null;

create index admission_inquiries_contact_phone_idx
  on public.admission_inquiries (contact_phone)
  where contact_phone is not null
    and deleted_at is null;

create trigger admission_inquiries_set_updated_at
before update on public.admission_inquiries
for each row
execute function public.set_updated_at();

-- ============================================================
-- 3. ADMISSION APPLICANTS
-- ============================================================

create table public.admission_applicants (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  campus_id uuid
    references public.campuses(id) on delete restrict,

  applicant_number text not null,

  first_name text not null,
  middle_name text,
  last_name text not null,
  preferred_name text,

  date_of_birth date,
  gender text
    check (
      gender is null
      or gender in (
        'female',
        'male',
        'non_binary',
        'prefer_not_to_say',
        'other'
      )
    ),

  nationality text,
  country_of_birth text,

  primary_language text,
  additional_languages text[] not null default '{}',

  current_school_name text,
  current_grade_level text,

  email text,
  phone text,

  address_line_1 text,
  address_line_2 text,
  city text,
  region text,
  postal_code text,
  country_code char(2),

  medical_notes text,
  learning_support_notes text,
  accessibility_notes text,

  profile_photo_url text,

  status text not null default 'prospect'
    check (
      status in (
        'prospect',
        'applicant',
        'offered',
        'accepted',
        'enrolled',
        'withdrawn',
        'archived'
      )
    ),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint admission_applicants_number_not_blank
    check (length(trim(applicant_number)) > 0),

  constraint admission_applicants_first_name_not_blank
    check (length(trim(first_name)) > 0),

  constraint admission_applicants_last_name_not_blank
    check (length(trim(last_name)) > 0),

  constraint admission_applicants_country_code_uppercase
    check (
      country_code is null
      or country_code = upper(country_code)
    ),

  constraint admission_applicants_archived_consistency
    check (
      (archived_at is null and archived_by is null)
      or archived_at is not null
    ),

  constraint admission_applicants_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    )
);

comment on table public.admission_applicants
is 'Prospective students participating in the admissions lifecycle before permanent student creation.';

create unique index admission_applicants_active_number_unique_idx
  on public.admission_applicants (
    school_id,
    lower(applicant_number)
  )
  where deleted_at is null;

create index admission_applicants_organization_idx
  on public.admission_applicants (organization_id)
  where deleted_at is null;

create index admission_applicants_school_status_idx
  on public.admission_applicants (
    school_id,
    status,
    created_at desc
  )
  where deleted_at is null;

create index admission_applicants_name_idx
  on public.admission_applicants (
    school_id,
    lower(last_name),
    lower(first_name)
  )
  where deleted_at is null;

create index admission_applicants_email_idx
  on public.admission_applicants (lower(email))
  where email is not null
    and deleted_at is null;

create trigger admission_applicants_set_updated_at
before update on public.admission_applicants
for each row
execute function public.set_updated_at();

-- ============================================================
-- 4. ADMISSION GUARDIANS
-- ============================================================

create table public.admission_guardians (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  first_name text not null,
  middle_name text,
  last_name text not null,

  title text,
  occupation text,
  employer text,

  email text,
  phone text,
  alternate_phone text,

  preferred_contact_method text
    check (
      preferred_contact_method is null
      or preferred_contact_method in (
        'email',
        'phone',
        'sms',
        'whatsapp'
      )
    ),

  address_line_1 text,
  address_line_2 text,
  city text,
  region text,
  postal_code text,
  country_code char(2),

  portal_profile_id uuid
    references public.profiles(id) on delete set null,

  status text not null default 'active'
    check (
      status in (
        'active',
        'inactive',
        'archived'
      )
    ),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint admission_guardians_first_name_not_blank
    check (length(trim(first_name)) > 0),

  constraint admission_guardians_last_name_not_blank
    check (length(trim(last_name)) > 0),

  constraint admission_guardians_contact_channel_check
    check (
      nullif(trim(coalesce(email, '')), '') is not null
      or nullif(trim(coalesce(phone, '')), '') is not null
    ),

  constraint admission_guardians_country_code_uppercase
    check (
      country_code is null
      or country_code = upper(country_code)
    ),

  constraint admission_guardians_archived_consistency
    check (
      (archived_at is null and archived_by is null)
      or archived_at is not null
    ),

  constraint admission_guardians_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    )
);

comment on table public.admission_guardians
is 'Guardian and household contacts associated with prospective students.';

create index admission_guardians_organization_idx
  on public.admission_guardians (organization_id)
  where deleted_at is null;

create index admission_guardians_school_status_idx
  on public.admission_guardians (
    school_id,
    status
  )
  where deleted_at is null;

create index admission_guardians_name_idx
  on public.admission_guardians (
    school_id,
    lower(last_name),
    lower(first_name)
  )
  where deleted_at is null;

create index admission_guardians_email_idx
  on public.admission_guardians (
    school_id,
    lower(email)
  )
  where email is not null
    and deleted_at is null;

create index admission_guardians_phone_idx
  on public.admission_guardians (
    school_id,
    phone
  )
  where phone is not null
    and deleted_at is null;

create trigger admission_guardians_set_updated_at
before update on public.admission_guardians
for each row
execute function public.set_updated_at();

-- ============================================================
-- 5. APPLICANT-GUARDIAN RELATIONSHIPS
-- ============================================================

create table public.admission_applicant_guardians (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  applicant_id uuid not null
    references public.admission_applicants(id) on delete cascade,

  guardian_id uuid not null
    references public.admission_guardians(id) on delete restrict,

  relationship_type text not null,

  is_primary boolean not null default false,
  has_legal_custody boolean not null default false,
  is_emergency_contact boolean not null default false,
  is_financially_responsible boolean not null default false,

  pickup_authorized boolean not null default false,

  notes text,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint admission_applicant_guardians_relationship_not_blank
    check (length(trim(relationship_type)) > 0),

  constraint admission_applicant_guardians_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    )
);

comment on table public.admission_applicant_guardians
is 'Many-to-many relationships between prospective students and guardian contacts.';

create unique index admission_applicant_guardians_active_unique_idx
  on public.admission_applicant_guardians (
    applicant_id,
    guardian_id
  )
  where deleted_at is null;

create unique index admission_applicant_guardians_primary_unique_idx
  on public.admission_applicant_guardians (applicant_id)
  where is_primary is true
    and deleted_at is null;

create index admission_applicant_guardians_guardian_idx
  on public.admission_applicant_guardians (guardian_id)
  where deleted_at is null;

create index admission_applicant_guardians_school_idx
  on public.admission_applicant_guardians (school_id)
  where deleted_at is null;

create trigger admission_applicant_guardians_set_updated_at
before update on public.admission_applicant_guardians
for each row
execute function public.set_updated_at();


-- ============================================================
-- 6. ADMISSION APPLICATIONS
-- ============================================================

create table public.admission_applications (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  campus_id uuid
    references public.campuses(id) on delete restrict,

  admission_cycle_id uuid not null
    references public.admission_cycles(id) on delete restrict,

  applicant_id uuid not null
    references public.admission_applicants(id) on delete restrict,

  source_inquiry_id uuid
    references public.admission_inquiries(id) on delete set null,

  application_number text not null,

  entry_grade_level text not null,
  intended_start_date date,

  application_type text not null default 'new_student'
    check (
      application_type in (
        'new_student',
        'transfer',
        'returning_student',
        'international',
        'scholarship',
        'other'
      )
    ),

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'submitted',
        'documents_pending',
        'under_review',
        'assessment_pending',
        'interview_pending',
        'decision_pending',
        'approved',
        'waitlisted',
        'rejected',
        'offer_sent',
        'offer_accepted',
        'offer_declined',
        'enrolled',
        'withdrawn',
        'cancelled'
      )
    ),

  priority text not null default 'normal'
    check (
      priority in (
        'low',
        'normal',
        'high',
        'urgent'
      )
    ),

  submitted_at timestamptz,

  assigned_reviewer_id uuid
    references public.profiles(id) on delete set null,

  review_started_at timestamptz,
  review_completed_at timestamptz,

  completion_percentage numeric(5,2) not null default 0
    check (
      completion_percentage >= 0
      and completion_percentage <= 100
    ),

  application_fee_amount numeric(14,2)
    check (
      application_fee_amount is null
      or application_fee_amount >= 0
    ),

  application_fee_currency char(3),

  application_fee_status text
    check (
      application_fee_status is null
      or application_fee_status in (
        'not_required',
        'pending',
        'paid',
        'waived',
        'refunded'
      )
    ),

  application_fee_paid_at timestamptz,

  internal_notes text,
  applicant_statement text,

  withdrawal_reason text,
  withdrawn_at timestamptz,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint admission_applications_number_not_blank
    check (length(trim(application_number)) > 0),

  constraint admission_applications_grade_level_not_blank
    check (length(trim(entry_grade_level)) > 0),

  constraint admission_applications_currency_uppercase
    check (
      application_fee_currency is null
      or application_fee_currency = upper(application_fee_currency)
    ),

  constraint admission_applications_submission_consistency
    check (
      status = 'draft'
      or submitted_at is not null
      or status in ('cancelled', 'withdrawn')
    ),

  constraint admission_applications_review_date_order
    check (
      review_completed_at is null
      or review_started_at is null
      or review_completed_at >= review_started_at
    ),

  constraint admission_applications_withdrawal_consistency
    check (
      status <> 'withdrawn'
      or withdrawn_at is not null
    ),

  constraint admission_applications_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    )
);

comment on table public.admission_applications
is 'Formal school admission applications submitted for prospective students.';

create unique index admission_applications_active_number_unique_idx
  on public.admission_applications (
    school_id,
    lower(application_number)
  )
  where deleted_at is null;

create unique index admission_applications_cycle_applicant_unique_idx
  on public.admission_applications (
    admission_cycle_id,
    applicant_id
  )
  where deleted_at is null
    and status not in ('cancelled', 'withdrawn');

create index admission_applications_organization_idx
  on public.admission_applications (organization_id)
  where deleted_at is null;

create index admission_applications_school_status_idx
  on public.admission_applications (
    school_id,
    status,
    created_at desc
  )
  where deleted_at is null;

create index admission_applications_cycle_status_idx
  on public.admission_applications (
    admission_cycle_id,
    status
  )
  where deleted_at is null;

create index admission_applications_applicant_idx
  on public.admission_applications (applicant_id)
  where deleted_at is null;

create index admission_applications_reviewer_idx
  on public.admission_applications (
    assigned_reviewer_id,
    status,
    submitted_at
  )
  where assigned_reviewer_id is not null
    and deleted_at is null;

create index admission_applications_source_inquiry_idx
  on public.admission_applications (source_inquiry_id)
  where source_inquiry_id is not null
    and deleted_at is null;

create trigger admission_applications_set_updated_at
before update on public.admission_applications
for each row
execute function public.set_updated_at();

-- ============================================================
-- 7. APPLICATION DOCUMENTS
-- ============================================================

create table public.admission_application_documents (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  application_id uuid not null
    references public.admission_applications(id) on delete cascade,

  applicant_id uuid not null
    references public.admission_applicants(id) on delete restrict,

  document_type text not null,
  document_label text not null,

  requirement_status text not null default 'required'
    check (
      requirement_status in (
        'required',
        'optional',
        'conditionally_required',
        'waived'
      )
    ),

  status text not null default 'missing'
    check (
      status in (
        'missing',
        'requested',
        'uploaded',
        'under_review',
        'verified',
        'rejected',
        'expired',
        'waived'
      )
    ),

  file_name text,
  storage_bucket text,
  storage_path text,
  mime_type text,
  file_size_bytes bigint
    check (
      file_size_bytes is null
      or file_size_bytes >= 0
    ),

  uploaded_at timestamptz,
  uploaded_by uuid references public.profiles(id) on delete set null,

  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,

  rejected_at timestamptz,
  rejected_by uuid references public.profiles(id) on delete set null,
  rejection_reason text,

  issued_on date,
  expires_on date,

  notes text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint admission_application_documents_type_not_blank
    check (length(trim(document_type)) > 0),

  constraint admission_application_documents_label_not_blank
    check (length(trim(document_label)) > 0),

  constraint admission_application_documents_file_consistency
    check (
      status not in (
        'uploaded',
        'under_review',
        'verified',
        'rejected',
        'expired'
      )
      or (
        nullif(trim(coalesce(storage_bucket, '')), '') is not null
        and nullif(trim(coalesce(storage_path, '')), '') is not null
      )
    ),

  constraint admission_application_documents_verified_consistency
    check (
      status <> 'verified'
      or verified_at is not null
    ),

  constraint admission_application_documents_rejected_consistency
    check (
      status <> 'rejected'
      or (
        rejected_at is not null
        and nullif(trim(coalesce(rejection_reason, '')), '') is not null
      )
    ),

  constraint admission_application_documents_expiry_order
    check (
      expires_on is null
      or issued_on is null
      or expires_on >= issued_on
    ),

  constraint admission_application_documents_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    )
);

comment on table public.admission_application_documents
is 'Required and optional documents submitted and reviewed for admission applications.';

create unique index admission_application_documents_active_type_unique_idx
  on public.admission_application_documents (
    application_id,
    lower(document_type)
  )
  where deleted_at is null;

create index admission_application_documents_organization_idx
  on public.admission_application_documents (organization_id)
  where deleted_at is null;

create index admission_application_documents_school_status_idx
  on public.admission_application_documents (
    school_id,
    status
  )
  where deleted_at is null;

create index admission_application_documents_application_idx
  on public.admission_application_documents (
    application_id,
    status
  )
  where deleted_at is null;

create index admission_application_documents_applicant_idx
  on public.admission_application_documents (applicant_id)
  where deleted_at is null;

create index admission_application_documents_verifier_idx
  on public.admission_application_documents (
    verified_by,
    verified_at
  )
  where verified_by is not null
    and deleted_at is null;

create index admission_application_documents_expiry_idx
  on public.admission_application_documents (expires_on)
  where expires_on is not null
    and deleted_at is null;

create trigger admission_application_documents_set_updated_at
before update on public.admission_application_documents
for each row
execute function public.set_updated_at();

-- ============================================================
-- 8. ADMISSION INTERVIEWS
-- ============================================================

create table public.admission_interviews (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  campus_id uuid
    references public.campuses(id) on delete restrict,

  application_id uuid not null
    references public.admission_applications(id) on delete cascade,

  applicant_id uuid not null
    references public.admission_applicants(id) on delete restrict,

  interview_type text not null default 'admissions'
    check (
      interview_type in (
        'admissions',
        'academic',
        'family',
        'behavioral',
        'scholarship',
        'special_support',
        'other'
      )
    ),

  status text not null default 'scheduled'
    check (
      status in (
        'scheduled',
        'confirmed',
        'completed',
        'cancelled',
        'no_show',
        'reschedule_required'
      )
    ),

  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz not null,

  location_type text not null default 'on_campus'
    check (
      location_type in (
        'on_campus',
        'video',
        'phone',
        'off_site'
      )
    ),

  location_details text,
  meeting_url text,

  lead_interviewer_id uuid
    references public.profiles(id) on delete set null,

  interviewer_ids uuid[] not null default '{}',

  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,

  recommendation text
    check (
      recommendation is null
      or recommendation in (
        'strongly_recommend',
        'recommend',
        'neutral',
        'do_not_recommend',
        'additional_review'
      )
    ),

  score numeric(5,2)
    check (
      score is null
      or (
        score >= 0
        and score <= 100
      )
    ),

  summary text,
  internal_notes text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint admission_interviews_schedule_order
    check (scheduled_end_at > scheduled_start_at),

  constraint admission_interviews_completed_consistency
    check (
      status <> 'completed'
      or completed_at is not null
    ),

  constraint admission_interviews_cancelled_consistency
    check (
      status <> 'cancelled'
      or cancelled_at is not null
    ),

  constraint admission_interviews_location_consistency
    check (
      location_type <> 'video'
      or nullif(trim(coalesce(meeting_url, '')), '') is not null
    ),

  constraint admission_interviews_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    )
);

comment on table public.admission_interviews
is 'Applicant interview and assessment appointments associated with admission applications.';

create index admission_interviews_organization_idx
  on public.admission_interviews (organization_id)
  where deleted_at is null;

create index admission_interviews_school_schedule_idx
  on public.admission_interviews (
    school_id,
    scheduled_start_at,
    status
  )
  where deleted_at is null;

create index admission_interviews_application_idx
  on public.admission_interviews (
    application_id,
    scheduled_start_at
  )
  where deleted_at is null;

create index admission_interviews_applicant_idx
  on public.admission_interviews (applicant_id)
  where deleted_at is null;

create index admission_interviews_lead_interviewer_idx
  on public.admission_interviews (
    lead_interviewer_id,
    scheduled_start_at
  )
  where lead_interviewer_id is not null
    and deleted_at is null;

create trigger admission_interviews_set_updated_at
before update on public.admission_interviews
for each row
execute function public.set_updated_at();


-- ============================================================
-- 9. ADMISSION DECISIONS
-- ============================================================

create table public.admission_decisions (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  campus_id uuid
    references public.campuses(id) on delete restrict,

  admission_cycle_id uuid not null
    references public.admission_cycles(id) on delete restrict,

  application_id uuid not null
    references public.admission_applications(id) on delete cascade,

  applicant_id uuid not null
    references public.admission_applicants(id) on delete restrict,

  decision text not null
    check (
      decision in (
        'approved',
        'conditionally_approved',
        'waitlisted',
        'rejected',
        'deferred',
        'additional_review'
      )
    ),

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'pending_approval',
        'approved',
        'published',
        'superseded',
        'withdrawn'
      )
    ),

  decision_reason text,
  conditions text,

  review_summary text,
  internal_notes text,

  recommended_by uuid
    references public.profiles(id) on delete set null,

  recommended_at timestamptz,

  approved_by uuid
    references public.profiles(id) on delete set null,

  approved_at timestamptz,

  published_by uuid
    references public.profiles(id) on delete set null,

  published_at timestamptz,

  effective_on date,
  expires_on date,

  supersedes_decision_id uuid
    references public.admission_decisions(id) on delete set null,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint admission_decisions_approval_consistency
    check (
      status not in (
        'approved',
        'published'
      )
      or approved_at is not null
    ),

  constraint admission_decisions_publication_consistency
    check (
      status <> 'published'
      or published_at is not null
    ),

  constraint admission_decisions_expiry_order
    check (
      expires_on is null
      or effective_on is null
      or expires_on >= effective_on
    ),

  constraint admission_decisions_self_supersede_check
    check (
      supersedes_decision_id is null
      or supersedes_decision_id <> id
    ),

  constraint admission_decisions_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    )
);

comment on table public.admission_decisions
is 'Governed admission decisions produced from application review, assessment, and interview outcomes.';

create unique index admission_decisions_active_application_unique_idx
  on public.admission_decisions (application_id)
  where status not in (
    'superseded',
    'withdrawn'
  )
    and deleted_at is null;

create index admission_decisions_organization_idx
  on public.admission_decisions (organization_id)
  where deleted_at is null;

create index admission_decisions_school_status_idx
  on public.admission_decisions (
    school_id,
    status,
    created_at desc
  )
  where deleted_at is null;

create index admission_decisions_cycle_decision_idx
  on public.admission_decisions (
    admission_cycle_id,
    decision
  )
  where deleted_at is null;

create index admission_decisions_application_idx
  on public.admission_decisions (application_id)
  where deleted_at is null;

create index admission_decisions_applicant_idx
  on public.admission_decisions (applicant_id)
  where deleted_at is null;

create index admission_decisions_approval_queue_idx
  on public.admission_decisions (
    status,
    recommended_at
  )
  where status = 'pending_approval'
    and deleted_at is null;

create trigger admission_decisions_set_updated_at
before update on public.admission_decisions
for each row
execute function public.set_updated_at();

-- ============================================================
-- 10. ADMISSION OFFERS
-- ============================================================

create table public.admission_offers (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  campus_id uuid
    references public.campuses(id) on delete restrict,

  admission_cycle_id uuid not null
    references public.admission_cycles(id) on delete restrict,

  application_id uuid not null
    references public.admission_applications(id) on delete cascade,

  applicant_id uuid not null
    references public.admission_applicants(id) on delete restrict,

  decision_id uuid not null
    references public.admission_decisions(id) on delete restrict,

  offer_number text not null,

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'pending_approval',
        'approved',
        'sent',
        'viewed',
        'accepted',
        'declined',
        'expired',
        'withdrawn',
        'superseded'
      )
    ),

  entry_grade_level text not null,
  intended_start_date date,

  offered_on date,
  expires_at timestamptz,

  tuition_amount numeric(14,2)
    check (
      tuition_amount is null
      or tuition_amount >= 0
    ),

  currency_code char(3),

  deposit_amount numeric(14,2)
    check (
      deposit_amount is null
      or deposit_amount >= 0
    ),

  deposit_due_on date,

  scholarship_amount numeric(14,2)
    check (
      scholarship_amount is null
      or scholarship_amount >= 0
    ),

  financial_aid_amount numeric(14,2)
    check (
      financial_aid_amount is null
      or financial_aid_amount >= 0
    ),

  conditions text,
  offer_message text,
  internal_notes text,

  approved_by uuid
    references public.profiles(id) on delete set null,

  approved_at timestamptz,

  sent_by uuid
    references public.profiles(id) on delete set null,

  sent_at timestamptz,

  viewed_at timestamptz,

  responded_at timestamptz,
  response_notes text,

  withdrawn_at timestamptz,
  withdrawal_reason text,

  supersedes_offer_id uuid
    references public.admission_offers(id) on delete set null,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint admission_offers_number_not_blank
    check (length(trim(offer_number)) > 0),

  constraint admission_offers_grade_level_not_blank
    check (length(trim(entry_grade_level)) > 0),

  constraint admission_offers_currency_uppercase
    check (
      currency_code is null
      or currency_code = upper(currency_code)
    ),

  constraint admission_offers_approval_consistency
    check (
      status not in (
        'approved',
        'sent',
        'viewed',
        'accepted',
        'declined',
        'expired'
      )
      or approved_at is not null
    ),

  constraint admission_offers_sent_consistency
    check (
      status not in (
        'sent',
        'viewed',
        'accepted',
        'declined',
        'expired'
      )
      or sent_at is not null
    ),

  constraint admission_offers_response_consistency
    check (
      status not in (
        'accepted',
        'declined'
      )
      or responded_at is not null
    ),

  constraint admission_offers_withdrawal_consistency
    check (
      status <> 'withdrawn'
      or withdrawn_at is not null
    ),

  constraint admission_offers_self_supersede_check
    check (
      supersedes_offer_id is null
      or supersedes_offer_id <> id
    ),

  constraint admission_offers_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    )
);

comment on table public.admission_offers
is 'Formal admission offers issued to approved applicants and tracked through acceptance or decline.';

create unique index admission_offers_active_number_unique_idx
  on public.admission_offers (
    school_id,
    lower(offer_number)
  )
  where deleted_at is null;

create unique index admission_offers_active_application_unique_idx
  on public.admission_offers (application_id)
  where status not in (
    'declined',
    'expired',
    'withdrawn',
    'superseded'
  )
    and deleted_at is null;

create index admission_offers_organization_idx
  on public.admission_offers (organization_id)
  where deleted_at is null;

create index admission_offers_school_status_idx
  on public.admission_offers (
    school_id,
    status,
    created_at desc
  )
  where deleted_at is null;

create index admission_offers_cycle_status_idx
  on public.admission_offers (
    admission_cycle_id,
    status
  )
  where deleted_at is null;

create index admission_offers_application_idx
  on public.admission_offers (application_id)
  where deleted_at is null;

create index admission_offers_applicant_idx
  on public.admission_offers (applicant_id)
  where deleted_at is null;

create index admission_offers_expiry_idx
  on public.admission_offers (
    expires_at,
    status
  )
  where expires_at is not null
    and status in (
      'sent',
      'viewed'
    )
    and deleted_at is null;

create trigger admission_offers_set_updated_at
before update on public.admission_offers
for each row
execute function public.set_updated_at();

-- ============================================================
-- 11. ADMISSION STATUS HISTORY
-- ============================================================

create table public.admission_status_history (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  campus_id uuid
    references public.campuses(id) on delete restrict,

  admission_cycle_id uuid
    references public.admission_cycles(id) on delete restrict,

  inquiry_id uuid
    references public.admission_inquiries(id) on delete cascade,

  applicant_id uuid
    references public.admission_applicants(id) on delete cascade,

  application_id uuid
    references public.admission_applications(id) on delete cascade,

  entity_type text not null
    check (
      entity_type in (
        'inquiry',
        'applicant',
        'application',
        'document',
        'interview',
        'decision',
        'offer',
        'enrollment_conversion'
      )
    ),

  entity_id uuid not null,

  previous_status text,
  new_status text not null,

  transition_reason text,
  transition_notes text,

  changed_at timestamptz not null default now(),
  changed_by uuid references public.profiles(id) on delete set null,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint admission_status_history_new_status_not_blank
    check (length(trim(new_status)) > 0),

  constraint admission_status_history_entity_reference_check
    check (
      (
        entity_type = 'inquiry'
        and inquiry_id = entity_id
        and applicant_id is null
        and application_id is null
      )
      or
      (
        entity_type = 'applicant'
        and applicant_id = entity_id
        and inquiry_id is null
        and application_id is null
      )
      or
      (
        entity_type in (
          'application',
          'document',
          'interview',
          'decision',
          'offer',
          'enrollment_conversion'
        )
        and application_id is not null
      )
    ),

  constraint admission_status_history_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    )
);

comment on table public.admission_status_history
is 'Append-oriented lifecycle history for admissions entities and governed workflow transitions.';

create index admission_status_history_organization_idx
  on public.admission_status_history (organization_id)
  where deleted_at is null;

create index admission_status_history_school_changed_idx
  on public.admission_status_history (
    school_id,
    changed_at desc
  )
  where deleted_at is null;

create index admission_status_history_entity_idx
  on public.admission_status_history (
    entity_type,
    entity_id,
    changed_at desc
  )
  where deleted_at is null;

create index admission_status_history_application_idx
  on public.admission_status_history (
    application_id,
    changed_at desc
  )
  where application_id is not null
    and deleted_at is null;

create index admission_status_history_applicant_idx
  on public.admission_status_history (
    applicant_id,
    changed_at desc
  )
  where applicant_id is not null
    and deleted_at is null;

create index admission_status_history_inquiry_idx
  on public.admission_status_history (
    inquiry_id,
    changed_at desc
  )
  where inquiry_id is not null
    and deleted_at is null;

-- ============================================================
-- 12. ADMISSION ENROLLMENT CONVERSIONS
-- ============================================================

create table public.admission_enrollment_conversions (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete restrict,

  school_id uuid not null
    references public.schools(id) on delete restrict,

  campus_id uuid
    references public.campuses(id) on delete restrict,

  admission_cycle_id uuid not null
    references public.admission_cycles(id) on delete restrict,

  application_id uuid not null
    references public.admission_applications(id) on delete restrict,

  applicant_id uuid not null
    references public.admission_applicants(id) on delete restrict,

  decision_id uuid not null
    references public.admission_decisions(id) on delete restrict,

  offer_id uuid not null
    references public.admission_offers(id) on delete restrict,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'validating',
        'ready',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'reversed'
      )
    ),

  target_grade_level text not null,
  enrollment_start_date date not null,

  student_id uuid,
  enrollment_id uuid,

  validation_errors jsonb not null default '[]'::jsonb,

  requested_at timestamptz not null default now(),
  requested_by uuid references public.profiles(id) on delete set null,

  processing_started_at timestamptz,

  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,

  failed_at timestamptz,
  failure_reason text,

  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id) on delete set null,
  cancellation_reason text,

  reversed_at timestamptz,
  reversed_by uuid references public.profiles(id) on delete set null,
  reversal_reason text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,

  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,

  constraint admission_enrollment_conversions_grade_not_blank
    check (length(trim(target_grade_level)) > 0),

  constraint admission_enrollment_conversions_completed_consistency
    check (
      status <> 'completed'
      or (
        completed_at is not null
        and student_id is not null
        and enrollment_id is not null
      )
    ),

  constraint admission_enrollment_conversions_failed_consistency
    check (
      status <> 'failed'
      or (
        failed_at is not null
        and nullif(trim(coalesce(failure_reason, '')), '') is not null
      )
    ),

  constraint admission_enrollment_conversions_cancelled_consistency
    check (
      status <> 'cancelled'
      or cancelled_at is not null
    ),

  constraint admission_enrollment_conversions_reversed_consistency
    check (
      status <> 'reversed'
      or reversed_at is not null
    ),

  constraint admission_enrollment_conversions_deleted_consistency
    check (
      (deleted_at is null and deleted_by is null)
      or deleted_at is not null
    )
);

comment on table public.admission_enrollment_conversions
is 'Governed conversion records connecting accepted admission offers to future student and enrollment records.';

comment on column public.admission_enrollment_conversions.student_id
is 'Future permanent student identifier. A foreign key will be added when the Student domain is created.';

comment on column public.admission_enrollment_conversions.enrollment_id
is 'Future enrollment identifier. A foreign key will be added when the Student enrollment domain is created.';

create unique index admission_enrollment_conversions_active_application_unique_idx
  on public.admission_enrollment_conversions (application_id)
  where status not in (
    'failed',
    'cancelled',
    'reversed'
  )
    and deleted_at is null;

create index admission_enrollment_conversions_organization_idx
  on public.admission_enrollment_conversions (organization_id)
  where deleted_at is null;

create index admission_enrollment_conversions_school_status_idx
  on public.admission_enrollment_conversions (
    school_id,
    status,
    requested_at
  )
  where deleted_at is null;

create index admission_enrollment_conversions_cycle_idx
  on public.admission_enrollment_conversions (
    admission_cycle_id,
    status
  )
  where deleted_at is null;

create index admission_enrollment_conversions_applicant_idx
  on public.admission_enrollment_conversions (applicant_id)
  where deleted_at is null;

create index admission_enrollment_conversions_student_idx
  on public.admission_enrollment_conversions (student_id)
  where student_id is not null
    and deleted_at is null;

create trigger admission_enrollment_conversions_set_updated_at
before update on public.admission_enrollment_conversions
for each row
execute function public.set_updated_at();

-- ============================================================
-- 13. DEFERRED INQUIRY CONVERSION FOREIGN KEY
-- ============================================================

alter table public.admission_inquiries
  add constraint admission_inquiries_converted_applicant_fk
  foreign key (converted_applicant_id)
  references public.admission_applicants(id)
  on delete set null;

create index admission_inquiries_converted_applicant_idx
  on public.admission_inquiries (converted_applicant_id)
  where converted_applicant_id is not null
    and deleted_at is null;


-- ============================================================
-- 14. ADMISSIONS SCOPE VALIDATION
-- ============================================================

create or replace function private.assert_admissions_scope(
  target_organization_id uuid,
  target_school_id uuid,
  target_campus_id uuid default null
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if target_organization_id is null then
    raise exception
      using
        errcode = '23514',
        message = 'Admissions organization_id is required.';
  end if;

  if target_school_id is null then
    raise exception
      using
        errcode = '23514',
        message = 'Admissions school_id is required.';
  end if;

  if not exists (
    select 1
    from public.schools s
    where s.id = target_school_id
      and s.organization_id = target_organization_id
      and s.deleted_at is null
  ) then
    raise exception
      using
        errcode = '23514',
        message =
          'Admissions school does not belong to the supplied organization.';
  end if;

  if target_campus_id is not null
     and not exists (
       select 1
       from public.campuses c
       where c.id = target_campus_id
         and c.organization_id = target_organization_id
         and c.school_id = target_school_id
         and c.deleted_at is null
     ) then
    raise exception
      using
        errcode = '23514',
        message =
          'Admissions campus does not belong to the supplied school and organization.';
  end if;
end;
$$;

comment on function private.assert_admissions_scope(uuid, uuid, uuid)
is 'Validates the organization, school, and optional campus hierarchy for Admissions records.';

-- ============================================================
-- 15. GENERIC ADMISSIONS AUDIT ACTOR TRIGGER
-- ============================================================

create or replace function private.set_admissions_audit_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if new.created_by is null and actor_id is not null then
      new.created_by := actor_id;
    end if;

    if new.updated_by is null and actor_id is not null then
      new.updated_by := actor_id;
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if actor_id is not null then
      new.updated_by := actor_id;
    end if;

    return new;
  end if;

  return new;
end;
$$;

comment on function private.set_admissions_audit_actor()
is 'Assigns the authenticated profile to Admissions created_by and updated_by audit fields.';

-- ============================================================
-- 16. STATUS HISTORY AUDIT ACTOR TRIGGER
-- ============================================================

create or replace function private.set_admission_history_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if new.changed_by is null and actor_id is not null then
    new.changed_by := actor_id;
  end if;

  if new.created_by is null and actor_id is not null then
    new.created_by := actor_id;
  end if;

  return new;
end;
$$;

comment on function private.set_admission_history_actor()
is 'Assigns the authenticated profile to Admissions status-history actor fields.';

-- ============================================================
-- 17. ADMISSIONS TENANT AND PARENT INTEGRITY TRIGGER
-- ============================================================

create or replace function private.validate_admissions_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_organization_id uuid;
  parent_school_id uuid;
  parent_campus_id uuid;
  parent_applicant_id uuid;
  parent_admission_cycle_id uuid;
begin
  if tg_op = 'UPDATE' then
    if new.organization_id is distinct from old.organization_id
       or new.school_id is distinct from old.school_id
       or (
         (to_jsonb(new) ? 'campus_id')
         and (
           nullif(to_jsonb(new) ->> 'campus_id', '')::uuid
           is distinct from
           nullif(to_jsonb(old) ->> 'campus_id', '')::uuid
         )
       ) then
      raise exception
        using
          errcode = '23514',
          message =
            'Admissions tenant scope cannot be changed after record creation.';
    end if;
  end if;

  perform private.assert_admissions_scope(
    new.organization_id,
    new.school_id,
    case
      when to_jsonb(new) ? 'campus_id'
        then nullif(to_jsonb(new) ->> 'campus_id', '')::uuid
      else null
    end
  );

  -- ----------------------------------------------------------
  -- Admission inquiries
  -- ----------------------------------------------------------

  if tg_table_name = 'admission_inquiries' then
    if new.admission_cycle_id is not null then
      select
        ac.organization_id,
        ac.school_id,
        ac.campus_id
      into
        parent_organization_id,
        parent_school_id,
        parent_campus_id
      from public.admission_cycles ac
      where ac.id = new.admission_cycle_id
        and ac.deleted_at is null;

      if parent_school_id is null then
        raise exception
          using
            errcode = '23503',
            message = 'The selected admission cycle does not exist.';
      end if;

      if parent_organization_id <> new.organization_id
         or parent_school_id <> new.school_id
         or (
           parent_campus_id is not null
           and parent_campus_id is distinct from new.campus_id
         ) then
        raise exception
          using
            errcode = '23514',
            message =
              'Inquiry tenant scope does not match its admission cycle.';
      end if;
    end if;

    if new.converted_applicant_id is not null then
      select
        aa.organization_id,
        aa.school_id,
        aa.campus_id
      into
        parent_organization_id,
        parent_school_id,
        parent_campus_id
      from public.admission_applicants aa
      where aa.id = new.converted_applicant_id
        and aa.deleted_at is null;

      if parent_school_id is null then
        raise exception
          using
            errcode = '23503',
            message = 'The converted applicant does not exist.';
      end if;

      if parent_organization_id <> new.organization_id
         or parent_school_id <> new.school_id
         or (
           parent_campus_id is not null
           and parent_campus_id is distinct from new.campus_id
         ) then
        raise exception
          using
            errcode = '23514',
            message =
              'Converted applicant tenant scope does not match the inquiry.';
      end if;
    end if;
  end if;

  -- ----------------------------------------------------------
  -- Applicant-guardian relationships
  -- ----------------------------------------------------------

  if tg_table_name = 'admission_applicant_guardians' then
    select
      aa.organization_id,
      aa.school_id
    into
      parent_organization_id,
      parent_school_id
    from public.admission_applicants aa
    where aa.id = new.applicant_id
      and aa.deleted_at is null;

    if parent_school_id is null then
      raise exception
        using
          errcode = '23503',
          message = 'The selected applicant does not exist.';
    end if;

    if parent_organization_id <> new.organization_id
       or parent_school_id <> new.school_id then
      raise exception
        using
          errcode = '23514',
          message =
            'Applicant-guardian tenant scope does not match the applicant.';
    end if;

    select
      ag.organization_id,
      ag.school_id
    into
      parent_organization_id,
      parent_school_id
    from public.admission_guardians ag
    where ag.id = new.guardian_id
      and ag.deleted_at is null;

    if parent_school_id is null then
      raise exception
        using
          errcode = '23503',
          message = 'The selected guardian does not exist.';
    end if;

    if parent_organization_id <> new.organization_id
       or parent_school_id <> new.school_id then
      raise exception
        using
          errcode = '23514',
          message =
            'Applicant-guardian tenant scope does not match the guardian.';
    end if;
  end if;

  -- ----------------------------------------------------------
  -- Formal applications
  -- ----------------------------------------------------------

  if tg_table_name = 'admission_applications' then
    select
      ac.organization_id,
      ac.school_id,
      ac.campus_id
    into
      parent_organization_id,
      parent_school_id,
      parent_campus_id
    from public.admission_cycles ac
    where ac.id = new.admission_cycle_id
      and ac.deleted_at is null;

    if parent_school_id is null then
      raise exception
        using
          errcode = '23503',
          message = 'The selected admission cycle does not exist.';
    end if;

    if parent_organization_id <> new.organization_id
       or parent_school_id <> new.school_id
       or (
         parent_campus_id is not null
         and parent_campus_id is distinct from new.campus_id
       ) then
      raise exception
        using
          errcode = '23514',
          message =
            'Application tenant scope does not match its admission cycle.';
    end if;

    select
      aa.organization_id,
      aa.school_id,
      aa.campus_id
    into
      parent_organization_id,
      parent_school_id,
      parent_campus_id
    from public.admission_applicants aa
    where aa.id = new.applicant_id
      and aa.deleted_at is null;

    if parent_school_id is null then
      raise exception
        using
          errcode = '23503',
          message = 'The selected applicant does not exist.';
    end if;

    if parent_organization_id <> new.organization_id
       or parent_school_id <> new.school_id
       or (
         parent_campus_id is not null
         and parent_campus_id is distinct from new.campus_id
       ) then
      raise exception
        using
          errcode = '23514',
          message =
            'Application tenant scope does not match its applicant.';
    end if;

    if new.source_inquiry_id is not null then
      select
        ai.organization_id,
        ai.school_id,
        ai.campus_id
      into
        parent_organization_id,
        parent_school_id,
        parent_campus_id
      from public.admission_inquiries ai
      where ai.id = new.source_inquiry_id
        and ai.deleted_at is null;

      if parent_school_id is null then
        raise exception
          using
            errcode = '23503',
            message = 'The selected source inquiry does not exist.';
      end if;

      if parent_organization_id <> new.organization_id
         or parent_school_id <> new.school_id
         or (
           parent_campus_id is not null
           and parent_campus_id is distinct from new.campus_id
         ) then
        raise exception
          using
            errcode = '23514',
            message =
              'Application tenant scope does not match its source inquiry.';
      end if;
    end if;
  end if;

  -- ----------------------------------------------------------
  -- Application documents
  -- ----------------------------------------------------------

  if tg_table_name = 'admission_application_documents' then
    select
      ap.organization_id,
      ap.school_id,
      ap.applicant_id
    into
      parent_organization_id,
      parent_school_id,
      parent_applicant_id
    from public.admission_applications ap
    where ap.id = new.application_id
      and ap.deleted_at is null;

    if parent_school_id is null then
      raise exception
        using
          errcode = '23503',
          message = 'The selected application does not exist.';
    end if;

    if parent_organization_id <> new.organization_id
       or parent_school_id <> new.school_id
       or parent_applicant_id <> new.applicant_id then
      raise exception
        using
          errcode = '23514',
          message =
            'Document scope does not match its application and applicant.';
    end if;
  end if;

  -- ----------------------------------------------------------
  -- Interviews, decisions, offers, and conversions
  -- ----------------------------------------------------------

  if tg_table_name in (
    'admission_interviews',
    'admission_decisions',
    'admission_offers',
    'admission_enrollment_conversions'
  ) then
    select
      ap.organization_id,
      ap.school_id,
      ap.campus_id,
      ap.admission_cycle_id,
      ap.applicant_id
    into
      parent_organization_id,
      parent_school_id,
      parent_campus_id,
      parent_admission_cycle_id,
      parent_applicant_id
    from public.admission_applications ap
    where ap.id = new.application_id
      and ap.deleted_at is null;

    if parent_school_id is null then
      raise exception
        using
          errcode = '23503',
          message = 'The selected application does not exist.';
    end if;

    if parent_organization_id <> new.organization_id
       or parent_school_id <> new.school_id
       or parent_applicant_id <> new.applicant_id
       or (
         parent_campus_id is not null
         and parent_campus_id is distinct from new.campus_id
       ) then
      raise exception
        using
          errcode = '23514',
          message =
            'Admissions workflow record does not match its application scope.';
    end if;

    if tg_table_name in (
      'admission_decisions',
      'admission_offers',
      'admission_enrollment_conversions'
    )
       and parent_admission_cycle_id <> new.admission_cycle_id then
      raise exception
        using
          errcode = '23514',
          message =
            'Admissions workflow cycle does not match the application cycle.';
    end if;
  end if;

  -- ----------------------------------------------------------
  -- Offers
  -- ----------------------------------------------------------

  if tg_table_name = 'admission_offers' then
    if not exists (
      select 1
      from public.admission_decisions ad
      where ad.id = new.decision_id
        and ad.application_id = new.application_id
        and ad.applicant_id = new.applicant_id
        and ad.organization_id = new.organization_id
        and ad.school_id = new.school_id
        and ad.deleted_at is null
    ) then
      raise exception
        using
          errcode = '23514',
          message =
            'Offer decision does not match the supplied application and applicant.';
    end if;
  end if;

  -- ----------------------------------------------------------
  -- Enrollment conversions
  -- ----------------------------------------------------------

  if tg_table_name = 'admission_enrollment_conversions' then
    if not exists (
      select 1
      from public.admission_decisions ad
      where ad.id = new.decision_id
        and ad.application_id = new.application_id
        and ad.applicant_id = new.applicant_id
        and ad.organization_id = new.organization_id
        and ad.school_id = new.school_id
        and ad.deleted_at is null
    ) then
      raise exception
        using
          errcode = '23514',
          message =
            'Enrollment conversion decision does not match the application.';
    end if;

    if not exists (
      select 1
      from public.admission_offers ao
      where ao.id = new.offer_id
        and ao.application_id = new.application_id
        and ao.applicant_id = new.applicant_id
        and ao.decision_id = new.decision_id
        and ao.organization_id = new.organization_id
        and ao.school_id = new.school_id
        and ao.deleted_at is null
    ) then
      raise exception
        using
          errcode = '23514',
          message =
            'Enrollment conversion offer does not match the application and decision.';
    end if;
  end if;

  -- ----------------------------------------------------------
  -- Status history
  -- ----------------------------------------------------------

  if tg_table_name = 'admission_status_history' then
    if new.inquiry_id is not null
       and not exists (
         select 1
         from public.admission_inquiries ai
         where ai.id = new.inquiry_id
           and ai.organization_id = new.organization_id
           and ai.school_id = new.school_id
           and ai.deleted_at is null
       ) then
      raise exception
        using
          errcode = '23514',
          message =
            'Status-history inquiry does not match the supplied tenant scope.';
    end if;

    if new.applicant_id is not null
       and not exists (
         select 1
         from public.admission_applicants aa
         where aa.id = new.applicant_id
           and aa.organization_id = new.organization_id
           and aa.school_id = new.school_id
           and aa.deleted_at is null
       ) then
      raise exception
        using
          errcode = '23514',
          message =
            'Status-history applicant does not match the supplied tenant scope.';
    end if;

    if new.application_id is not null
       and not exists (
         select 1
         from public.admission_applications ap
         where ap.id = new.application_id
           and ap.organization_id = new.organization_id
           and ap.school_id = new.school_id
           and ap.deleted_at is null
       ) then
      raise exception
        using
          errcode = '23514',
          message =
            'Status-history application does not match the supplied tenant scope.';
    end if;
  end if;

  return new;
end;
$$;

comment on function private.validate_admissions_record()
is 'Enforces Admissions tenant hierarchy and parent-child record consistency.';

-- ============================================================
-- 18. TENANT-INTEGRITY TRIGGERS
-- ============================================================

create trigger admission_cycles_validate_scope
before insert or update on public.admission_cycles
for each row
execute function private.validate_admissions_record();

create trigger admission_inquiries_validate_scope
before insert or update on public.admission_inquiries
for each row
execute function private.validate_admissions_record();

create trigger admission_applicants_validate_scope
before insert or update on public.admission_applicants
for each row
execute function private.validate_admissions_record();

create trigger admission_guardians_validate_scope
before insert or update on public.admission_guardians
for each row
execute function private.validate_admissions_record();

create trigger admission_applicant_guardians_validate_scope
before insert or update on public.admission_applicant_guardians
for each row
execute function private.validate_admissions_record();

create trigger admission_applications_validate_scope
before insert or update on public.admission_applications
for each row
execute function private.validate_admissions_record();

create trigger admission_application_documents_validate_scope
before insert or update on public.admission_application_documents
for each row
execute function private.validate_admissions_record();

create trigger admission_interviews_validate_scope
before insert or update on public.admission_interviews
for each row
execute function private.validate_admissions_record();

create trigger admission_decisions_validate_scope
before insert or update on public.admission_decisions
for each row
execute function private.validate_admissions_record();

create trigger admission_offers_validate_scope
before insert or update on public.admission_offers
for each row
execute function private.validate_admissions_record();

create trigger admission_status_history_validate_scope
before insert or update on public.admission_status_history
for each row
execute function private.validate_admissions_record();

create trigger admission_enrollment_conversions_validate_scope
before insert or update on public.admission_enrollment_conversions
for each row
execute function private.validate_admissions_record();

-- ============================================================
-- 19. AUDIT ACTOR TRIGGERS
-- ============================================================

create trigger admission_cycles_set_audit_actor
before insert or update on public.admission_cycles
for each row
execute function private.set_admissions_audit_actor();

create trigger admission_inquiries_set_audit_actor
before insert or update on public.admission_inquiries
for each row
execute function private.set_admissions_audit_actor();

create trigger admission_applicants_set_audit_actor
before insert or update on public.admission_applicants
for each row
execute function private.set_admissions_audit_actor();

create trigger admission_guardians_set_audit_actor
before insert or update on public.admission_guardians
for each row
execute function private.set_admissions_audit_actor();

create trigger admission_applicant_guardians_set_audit_actor
before insert or update on public.admission_applicant_guardians
for each row
execute function private.set_admissions_audit_actor();

create trigger admission_applications_set_audit_actor
before insert or update on public.admission_applications
for each row
execute function private.set_admissions_audit_actor();

create trigger admission_application_documents_set_audit_actor
before insert or update on public.admission_application_documents
for each row
execute function private.set_admissions_audit_actor();

create trigger admission_interviews_set_audit_actor
before insert or update on public.admission_interviews
for each row
execute function private.set_admissions_audit_actor();

create trigger admission_decisions_set_audit_actor
before insert or update on public.admission_decisions
for each row
execute function private.set_admissions_audit_actor();

create trigger admission_offers_set_audit_actor
before insert or update on public.admission_offers
for each row
execute function private.set_admissions_audit_actor();

create trigger admission_enrollment_conversions_set_audit_actor
before insert or update on public.admission_enrollment_conversions
for each row
execute function private.set_admissions_audit_actor();

create trigger admission_status_history_set_actor
before insert on public.admission_status_history
for each row
execute function private.set_admission_history_actor();

-- Trigger-only functions must not be callable directly through API roles.

revoke all on function private.assert_admissions_scope(uuid, uuid, uuid)
  from public, anon, authenticated;

revoke all on function private.set_admissions_audit_actor()
  from public, anon, authenticated;

revoke all on function private.set_admission_history_actor()
  from public, anon, authenticated;

revoke all on function private.validate_admissions_record()
  from public, anon, authenticated;




-- ============================================================
-- 20. ENABLE AND FORCE ROW LEVEL SECURITY
-- ============================================================

alter table public.admission_cycles
  enable row level security;
alter table public.admission_cycles
  force row level security;

alter table public.admission_inquiries
  enable row level security;
alter table public.admission_inquiries
  force row level security;

alter table public.admission_applicants
  enable row level security;
alter table public.admission_applicants
  force row level security;

alter table public.admission_guardians
  enable row level security;
alter table public.admission_guardians
  force row level security;

alter table public.admission_applicant_guardians
  enable row level security;
alter table public.admission_applicant_guardians
  force row level security;

alter table public.admission_applications
  enable row level security;
alter table public.admission_applications
  force row level security;

alter table public.admission_application_documents
  enable row level security;
alter table public.admission_application_documents
  force row level security;

alter table public.admission_interviews
  enable row level security;
alter table public.admission_interviews
  force row level security;

alter table public.admission_decisions
  enable row level security;
alter table public.admission_decisions
  force row level security;

alter table public.admission_offers
  enable row level security;
alter table public.admission_offers
  force row level security;

alter table public.admission_status_history
  enable row level security;
alter table public.admission_status_history
  force row level security;

alter table public.admission_enrollment_conversions
  enable row level security;
alter table public.admission_enrollment_conversions
  force row level security;

-- ============================================================
-- 21. ADMISSION CYCLE POLICIES
-- ============================================================

create policy admission_cycles_select_authorized
on public.admission_cycles
for select
to authenticated
using (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.view'
  )
);

create policy admission_cycles_insert_authorized
on public.admission_cycles
for insert
to authenticated
with check (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.create'
  )
);

create policy admission_cycles_update_authorized
on public.admission_cycles
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
);

-- ============================================================
-- 22. INQUIRY POLICIES
-- ============================================================

create policy admission_inquiries_select_authorized
on public.admission_inquiries
for select
to authenticated
using (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.view'
  )
);

create policy admission_inquiries_insert_authorized
on public.admission_inquiries
for insert
to authenticated
with check (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.create'
  )
);

create policy admission_inquiries_update_authorized
on public.admission_inquiries
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
);

-- ============================================================
-- 23. APPLICANT POLICIES
-- ============================================================

create policy admission_applicants_select_authorized
on public.admission_applicants
for select
to authenticated
using (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.view'
  )
);

create policy admission_applicants_insert_authorized
on public.admission_applicants
for insert
to authenticated
with check (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.create'
  )
);

create policy admission_applicants_update_authorized
on public.admission_applicants
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
);

-- ============================================================
-- 24. GUARDIAN POLICIES
-- ============================================================

create policy admission_guardians_select_authorized
on public.admission_guardians
for select
to authenticated
using (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.view'
  )
);

create policy admission_guardians_insert_authorized
on public.admission_guardians
for insert
to authenticated
with check (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.create'
  )
);

create policy admission_guardians_update_authorized
on public.admission_guardians
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
);

-- ============================================================
-- 25. APPLICANT-GUARDIAN POLICIES
-- ============================================================

create policy admission_applicant_guardians_select_authorized
on public.admission_applicant_guardians
for select
to authenticated
using (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.view'
  )
);

create policy admission_applicant_guardians_insert_authorized
on public.admission_applicant_guardians
for insert
to authenticated
with check (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.create'
  )
);

create policy admission_applicant_guardians_update_authorized
on public.admission_applicant_guardians
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
);

-- ============================================================
-- 26. APPLICATION POLICIES
-- ============================================================

create policy admission_applications_select_authorized
on public.admission_applications
for select
to authenticated
using (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.view'
  )
);

create policy admission_applications_insert_authorized
on public.admission_applications
for insert
to authenticated
with check (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.create'
  )
);

create policy admission_applications_update_authorized
on public.admission_applications
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
  or private.has_school_permission(
    school_id,
    'applications.review'
  )
  or private.has_school_permission(
    school_id,
    'applications.approve'
  )
  or private.has_school_permission(
    school_id,
    'applications.enroll'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
  or private.has_school_permission(
    school_id,
    'applications.review'
  )
  or private.has_school_permission(
    school_id,
    'applications.approve'
  )
  or private.has_school_permission(
    school_id,
    'applications.enroll'
  )
);

-- ============================================================
-- 27. DOCUMENT POLICIES
-- ============================================================

create policy admission_application_documents_select_authorized
on public.admission_application_documents
for select
to authenticated
using (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.view'
  )
);

create policy admission_application_documents_insert_authorized
on public.admission_application_documents
for insert
to authenticated
with check (
  deleted_at is null
  and (
    private.has_school_permission(
      school_id,
      'applications.create'
    )
    or private.has_school_permission(
      school_id,
      'applications.review'
    )
  )
);

create policy admission_application_documents_update_authorized
on public.admission_application_documents
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
  or private.has_school_permission(
    school_id,
    'applications.review'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
  or private.has_school_permission(
    school_id,
    'applications.review'
  )
);

-- ============================================================
-- 28. INTERVIEW POLICIES
-- ============================================================

create policy admission_interviews_select_authorized
on public.admission_interviews
for select
to authenticated
using (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.view'
  )
);

create policy admission_interviews_insert_authorized
on public.admission_interviews
for insert
to authenticated
with check (
  deleted_at is null
  and (
    private.has_school_permission(
      school_id,
      'applications.create'
    )
    or private.has_school_permission(
      school_id,
      'applications.review'
    )
  )
);

create policy admission_interviews_update_authorized
on public.admission_interviews
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
  or private.has_school_permission(
    school_id,
    'applications.review'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'applications.edit'
  )
  or private.has_school_permission(
    school_id,
    'applications.review'
  )
);

-- ============================================================
-- 29. DECISION POLICIES
-- ============================================================

create policy admission_decisions_select_authorized
on public.admission_decisions
for select
to authenticated
using (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.view'
  )
);

create policy admission_decisions_insert_authorized
on public.admission_decisions
for insert
to authenticated
with check (
  deleted_at is null
  and (
    private.has_school_permission(
      school_id,
      'applications.review'
    )
    or private.has_school_permission(
      school_id,
      'applications.approve'
    )
  )
);

create policy admission_decisions_update_authorized
on public.admission_decisions
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'applications.approve'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'applications.approve'
  )
);

-- ============================================================
-- 30. OFFER POLICIES
-- ============================================================

create policy admission_offers_select_authorized
on public.admission_offers
for select
to authenticated
using (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.view'
  )
);

create policy admission_offers_insert_authorized
on public.admission_offers
for insert
to authenticated
with check (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.approve'
  )
);

create policy admission_offers_update_authorized
on public.admission_offers
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'applications.approve'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'applications.approve'
  )
);

-- ============================================================
-- 31. STATUS-HISTORY POLICIES
-- ============================================================

create policy admission_status_history_select_authorized
on public.admission_status_history
for select
to authenticated
using (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.view'
  )
);

create policy admission_status_history_insert_authorized
on public.admission_status_history
for insert
to authenticated
with check (
  deleted_at is null
  and (
    private.has_school_permission(
      school_id,
      'applications.edit'
    )
    or private.has_school_permission(
      school_id,
      'applications.review'
    )
    or private.has_school_permission(
      school_id,
      'applications.approve'
    )
    or private.has_school_permission(
      school_id,
      'applications.enroll'
    )
  )
);

-- Status history is append-oriented. Authenticated users receive no
-- direct UPDATE or DELETE privilege on this table.

-- ============================================================
-- 32. ENROLLMENT-CONVERSION POLICIES
-- ============================================================

create policy admission_enrollment_conversions_select_authorized
on public.admission_enrollment_conversions
for select
to authenticated
using (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.view'
  )
);

create policy admission_enrollment_conversions_insert_authorized
on public.admission_enrollment_conversions
for insert
to authenticated
with check (
  deleted_at is null
  and private.has_school_permission(
    school_id,
    'applications.enroll'
  )
);

create policy admission_enrollment_conversions_update_authorized
on public.admission_enrollment_conversions
for update
to authenticated
using (
  private.has_school_permission(
    school_id,
    'applications.enroll'
  )
)
with check (
  private.has_school_permission(
    school_id,
    'applications.enroll'
  )
);

-- ============================================================
-- 33. TABLE PRIVILEGES
-- ============================================================

revoke all
on table
  public.admission_cycles,
  public.admission_inquiries,
  public.admission_applicants,
  public.admission_guardians,
  public.admission_applicant_guardians,
  public.admission_applications,
  public.admission_application_documents,
  public.admission_interviews,
  public.admission_decisions,
  public.admission_offers,
  public.admission_status_history,
  public.admission_enrollment_conversions
from public, anon, authenticated;

grant select, insert, update
on table
  public.admission_cycles,
  public.admission_inquiries,
  public.admission_applicants,
  public.admission_guardians,
  public.admission_applicant_guardians,
  public.admission_applications,
  public.admission_application_documents,
  public.admission_interviews,
  public.admission_decisions,
  public.admission_offers,
  public.admission_enrollment_conversions
to authenticated;

grant select, insert
on table public.admission_status_history
to authenticated;

grant all privileges
on table
  public.admission_cycles,
  public.admission_inquiries,
  public.admission_applicants,
  public.admission_guardians,
  public.admission_applicant_guardians,
  public.admission_applications,
  public.admission_application_documents,
  public.admission_interviews,
  public.admission_decisions,
  public.admission_offers,
  public.admission_status_history,
  public.admission_enrollment_conversions
to service_role;

-- ============================================================
-- 34. RLS CONFIGURATION VALIDATION
-- ============================================================

do $$
declare
  missing_rls_tables text;
  missing_forced_rls_tables text;
begin
  select string_agg(
    expected.table_name,
    ', '
    order by expected.table_name
  )
  into missing_rls_tables
  from (
    values
      ('admission_cycles'),
      ('admission_inquiries'),
      ('admission_applicants'),
      ('admission_guardians'),
      ('admission_applicant_guardians'),
      ('admission_applications'),
      ('admission_application_documents'),
      ('admission_interviews'),
      ('admission_decisions'),
      ('admission_offers'),
      ('admission_status_history'),
      ('admission_enrollment_conversions')
  ) as expected(table_name)
  left join pg_catalog.pg_class c
    on c.relname = expected.table_name
  left join pg_catalog.pg_namespace n
    on n.oid = c.relnamespace
   and n.nspname = 'public'
  where c.oid is null
     or c.relrowsecurity is not true;

  if missing_rls_tables is not null then
    raise exception
      using
        errcode = 'P0001',
        message =
          'RLS is not enabled for Admissions tables: '
          || missing_rls_tables;
  end if;

  select string_agg(
    expected.table_name,
    ', '
    order by expected.table_name
  )
  into missing_forced_rls_tables
  from (
    values
      ('admission_cycles'),
      ('admission_inquiries'),
      ('admission_applicants'),
      ('admission_guardians'),
      ('admission_applicant_guardians'),
      ('admission_applications'),
      ('admission_application_documents'),
      ('admission_interviews'),
      ('admission_decisions'),
      ('admission_offers'),
      ('admission_status_history'),
      ('admission_enrollment_conversions')
  ) as expected(table_name)
  left join pg_catalog.pg_class c
    on c.relname = expected.table_name
  left join pg_catalog.pg_namespace n
    on n.oid = c.relnamespace
   and n.nspname = 'public'
  where c.oid is null
     or c.relforcerowsecurity is not true;

  if missing_forced_rls_tables is not null then
    raise exception
      using
        errcode = 'P0001',
        message =
          'Forced RLS is not enabled for Admissions tables: '
          || missing_forced_rls_tables;
  end if;
end;
$$;

-- ============================================================
-- 35. POLICY COUNT VALIDATION
-- ============================================================

do $$
declare
  policy_count integer;
begin
  select count(*)
  into policy_count
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and tablename in (
      'admission_cycles',
      'admission_inquiries',
      'admission_applicants',
      'admission_guardians',
      'admission_applicant_guardians',
      'admission_applications',
      'admission_application_documents',
      'admission_interviews',
      'admission_decisions',
      'admission_offers',
      'admission_status_history',
      'admission_enrollment_conversions'
    );

  if policy_count <> 35 then
    raise exception
      using
        errcode = 'P0001',
        message =
          'Expected 35 Admissions RLS policies, found '
          || policy_count::text
          || '.';
  end if;
end;
$$;

-- ============================================================
-- 36. REQUIRED PERMISSION VALIDATION
-- ============================================================

do $$
declare
  missing_permissions text;
begin
  select string_agg(
    required.code,
    ', '
    order by required.code
  )
  into missing_permissions
  from (
    values
      ('applications.view'),
      ('applications.create'),
      ('applications.edit'),
      ('applications.review'),
      ('applications.approve'),
      ('applications.enroll')
  ) as required(code)
  where not exists (
    select 1
    from public.permissions p
    where lower(p.code) = lower(required.code)
  );

  if missing_permissions is not null then
    raise exception
      using
        errcode = 'P0001',
        message =
          'Missing required Admissions permissions: '
          || missing_permissions;
  end if;
end;
$$;

-- ============================================================
-- 37. ADMISSIONS DOMAIN COMPLETION
-- ============================================================

comment on table public.admission_applications
is 'SchoolOS Admissions applications protected by tenant-aware permission RLS.';

comment on table public.admission_status_history
is 'Append-oriented Admissions lifecycle history protected by tenant-aware permission RLS.';
