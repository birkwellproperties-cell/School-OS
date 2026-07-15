import {
  CalendarClock,
  Loader2,
  Save,
  UserPlus,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAdmissions,
} from "../hooks";

const EMPTY_FORM = Object.freeze({
  prospective_student_first_name: "",
  prospective_student_middle_name: "",
  prospective_student_last_name: "",
  prospective_grade_level: "",
  intended_start_date: "",

  contact_name: "",
  contact_relationship: "",
  contact_email: "",
  contact_phone: "",
  preferred_contact_method: "",

  source: "manual",
  status: "new",
  next_follow_up_at: "",
  message: "",
});

const INPUT_CLASSES =
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - offset,
  )
    .toISOString()
    .slice(0, 16);
}

function createFormState(inquiry) {
  if (!inquiry) {
    return {
      ...EMPTY_FORM,
    };
  }

  return {
    prospective_student_first_name:
      inquiry
        .prospective_student_first_name ||
      "",

    prospective_student_middle_name:
      inquiry
        .prospective_student_middle_name ||
      "",

    prospective_student_last_name:
      inquiry
        .prospective_student_last_name ||
      "",

    prospective_grade_level:
      inquiry.prospective_grade_level ||
      "",

    intended_start_date:
      inquiry.intended_start_date ||
      "",

    contact_name:
      inquiry.contact_name || "",

    contact_relationship:
      inquiry.contact_relationship ||
      "",

    contact_email:
      inquiry.contact_email || "",

    contact_phone:
      inquiry.contact_phone || "",

    preferred_contact_method:
      inquiry.preferred_contact_method ||
      "",

    source:
      inquiry.source || "manual",

    status:
      inquiry.status || "new",

    next_follow_up_at:
      toDateTimeLocal(
        inquiry.next_follow_up_at,
      ),

    message:
      inquiry.message || "",
  };
}

function validateForm(form) {
  if (
    !form
      .prospective_student_first_name
      .trim()
  ) {
    return "Prospective student first name is required.";
  }

  if (
    !form
      .prospective_student_last_name
      .trim()
  ) {
    return "Prospective student last name is required.";
  }

  if (!form.contact_name.trim()) {
    return "Primary contact name is required.";
  }

  if (
    !form.contact_email.trim() &&
    !form.contact_phone.trim()
  ) {
    return "Enter either a contact email or contact phone.";
  }

  if (
    form.contact_email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      form.contact_email.trim(),
    )
  ) {
    return "Enter a valid contact email address.";
  }

  return "";
}

function Field({
  label,
  required = false,
  helper,
  children,
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-800">
        {label}

        {required && (
          <span className="ml-1 text-red-600">
            *
          </span>
        )}
      </span>

      <span className="mt-2 block">
        {children}
      </span>

      {helper && (
        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
          {helper}
        </span>
      )}
    </label>
  );
}

function SectionHeading({
  title,
  description,
}) {
  return (
    <div className="sm:col-span-2">
      <h3 className="text-base font-black text-slate-950">
        {title}
      </h3>

      {description && (
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

export default function InquiryDialog({
  open,
  mode = "create",
  inquiry = null,
  onClose,
}) {
  const {
    selectedAdmissionCycle,

    createInquiry,
    updateInquiry,

    canCreateInquiries,
    canEditInquiries,

    inquiryMutationLoading,
    inquiryMutationError,
    clearInquiryMutationError,
  } = useAdmissions();

  const isEditMode =
    mode === "edit" &&
    Boolean(inquiry);

  const canSubmit =
    isEditMode
      ? canEditInquiries
      : canCreateInquiries;

  const [
    form,
    setForm,
  ] = useState(() =>
    createFormState(inquiry),
  );

  const [
    localError,
    setLocalError,
  ] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      createFormState(
        isEditMode
          ? inquiry
          : null,
      ),
    );

    setLocalError("");
    clearInquiryMutationError();
  }, [
    open,
    isEditMode,
    inquiry,
    clearInquiryMutationError,
  ]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        !inquiryMutationLoading
      ) {
        onClose?.();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    open,
    onClose,
    inquiryMutationLoading,
  ]);

  const payload = useMemo(
    () => ({
      prospective_student_first_name:
        form
          .prospective_student_first_name
          .trim(),

      prospective_student_middle_name:
        form
          .prospective_student_middle_name
          .trim() ||
        null,

      prospective_student_last_name:
        form
          .prospective_student_last_name
          .trim(),

      prospective_grade_level:
        form.prospective_grade_level
          .trim() ||
        null,

      intended_start_date:
        form.intended_start_date ||
        null,

      contact_name:
        form.contact_name.trim(),

      contact_relationship:
        form.contact_relationship
          .trim() ||
        null,

      contact_email:
        form.contact_email.trim() ||
        null,

      contact_phone:
        form.contact_phone.trim() ||
        null,

      preferred_contact_method:
        form.preferred_contact_method ||
        null,

      source:
        form.source,

      status:
        form.status,

      next_follow_up_at:
        form.next_follow_up_at ||
        null,

      message:
        form.message.trim() ||
        null,
    }),
    [form],
  );

  if (!open) {
    return null;
  }

  const updateField =
    (field) => (event) => {
      setForm((current) => ({
        ...current,
        [field]:
          event.target.value,
      }));

      setLocalError("");
      clearInquiryMutationError();
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const validationError =
        validateForm(form);

      if (validationError) {
        setLocalError(
          validationError,
        );
        return;
      }

      if (!selectedAdmissionCycle) {
        setLocalError(
          "Select an admission cycle before saving an inquiry.",
        );
        return;
      }

      if (!canSubmit) {
        setLocalError(
          "You do not have permission to perform this action.",
        );
        return;
      }

      try {
        if (isEditMode) {
          await updateInquiry(
            inquiry.id,
            payload,
          );
        } else {
          await createInquiry(
            payload,
          );
        }

        onClose?.();
      } catch {
        // Normalized mutation error is
        // exposed by the provider.
      }
    };

  const visibleError =
    localError ||
    inquiryMutationError;

  const title = isEditMode
    ? "Edit admission inquiry"
    : "Create admission inquiry";

  const submitLabel = isEditMode
    ? "Save changes"
    : "Create inquiry";

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !inquiryMutationLoading
        ) {
          onClose?.();
        }
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="inquiry-dialog-title"
          className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:p-7">
            <div>
              <div className="flex items-center gap-2 text-indigo-700">
                <UserPlus size={18} />

                <p className="text-xs font-black uppercase tracking-[0.16em]">
                  Admissions inquiry
                </p>
              </div>

              <h2
                id="inquiry-dialog-title"
                className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl"
              >
                {title}
              </h2>

              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                Capture the prospective
                student, primary contact, source,
                and follow-up details for the
                selected admission cycle.
              </p>

              {selectedAdmissionCycle && (
                <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-indigo-600">
                  {
                    selectedAdmissionCycle.name
                  }
                  {" · "}
                  {
                    selectedAdmissionCycle
                      .academic_year_label
                  }
                </p>
              )}
            </div>

            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              disabled={
                inquiryMutationLoading
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={19} />
            </button>
          </header>

          <form
            onSubmit={handleSubmit}
          >
            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
              <SectionHeading
                title="Prospective student"
                description="Student details associated with this inquiry."
              />

              <Field
                label="First name"
                required
              >
                <input
                  type="text"
                  value={
                    form
                      .prospective_student_first_name
                  }
                  onChange={updateField(
                    "prospective_student_first_name",
                  )}
                  placeholder="First name"
                  disabled={
                    inquiryMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <Field label="Middle name">
                <input
                  type="text"
                  value={
                    form
                      .prospective_student_middle_name
                  }
                  onChange={updateField(
                    "prospective_student_middle_name",
                  )}
                  placeholder="Middle name"
                  disabled={
                    inquiryMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <Field
                label="Last name"
                required
              >
                <input
                  type="text"
                  value={
                    form
                      .prospective_student_last_name
                  }
                  onChange={updateField(
                    "prospective_student_last_name",
                  )}
                  placeholder="Last name"
                  disabled={
                    inquiryMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <Field label="Grade applying for">
                <input
                  type="text"
                  value={
                    form
                      .prospective_grade_level
                  }
                  onChange={updateField(
                    "prospective_grade_level",
                  )}
                  placeholder="Grade 7"
                  disabled={
                    inquiryMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <Field label="Intended start date">
                <input
                  type="date"
                  value={
                    form.intended_start_date
                  }
                  onChange={updateField(
                    "intended_start_date",
                  )}
                  disabled={
                    inquiryMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <div className="hidden sm:block" />

              <SectionHeading
                title="Primary contact"
                description="Parent, guardian, or other responsible contact."
              />

              <Field
                label="Contact name"
                required
              >
                <input
                  type="text"
                  value={
                    form.contact_name
                  }
                  onChange={updateField(
                    "contact_name",
                  )}
                  placeholder="Parent or guardian name"
                  disabled={
                    inquiryMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <Field label="Relationship">
                <input
                  type="text"
                  value={
                    form.contact_relationship
                  }
                  onChange={updateField(
                    "contact_relationship",
                  )}
                  placeholder="Mother, father, guardian..."
                  disabled={
                    inquiryMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <Field
                label="Email"
                helper="Either an email or phone number is required."
              >
                <input
                  type="email"
                  value={
                    form.contact_email
                  }
                  onChange={updateField(
                    "contact_email",
                  )}
                  placeholder="parent@example.com"
                  disabled={
                    inquiryMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <Field
                label="Phone"
                helper="Either a phone number or email is required."
              >
                <input
                  type="tel"
                  value={
                    form.contact_phone
                  }
                  onChange={updateField(
                    "contact_phone",
                  )}
                  placeholder="+1 555 010 1000"
                  disabled={
                    inquiryMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <Field label="Preferred contact">
                <select
                  value={
                    form
                      .preferred_contact_method
                  }
                  onChange={updateField(
                    "preferred_contact_method",
                  )}
                  disabled={
                    inquiryMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                >
                  <option value="">
                    Not specified
                  </option>

                  <option value="email">
                    Email
                  </option>

                  <option value="phone">
                    Phone
                  </option>

                  <option value="sms">
                    SMS
                  </option>

                  <option value="whatsapp">
                    WhatsApp
                  </option>
                </select>
              </Field>

              <div className="hidden sm:block" />

              <SectionHeading
                title="Inquiry workflow"
                description="Source, status, and follow-up information."
              />

              <Field label="Inquiry source">
                <select
                  value={form.source}
                  onChange={updateField(
                    "source",
                  )}
                  disabled={
                    inquiryMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                >
                  <option value="manual">
                    Manual
                  </option>

                  <option value="website">
                    Website
                  </option>

                  <option value="phone">
                    Phone
                  </option>

                  <option value="email">
                    Email
                  </option>

                  <option value="walk_in">
                    Walk-in
                  </option>

                  <option value="referral">
                    Referral
                  </option>

                  <option value="event">
                    Event
                  </option>

                  <option value="campaign">
                    Campaign
                  </option>

                  <option value="partner">
                    Partner
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </Field>

              <Field label="Status">
                <select
                  value={form.status}
                  onChange={updateField(
                    "status",
                  )}
                  disabled={
                    inquiryMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                >
                  <option value="new">
                    New
                  </option>

                  <option value="contacted">
                    Contacted
                  </option>

                  <option value="qualified">
                    Qualified
                  </option>

                  <option value="unqualified">
                    Unqualified
                  </option>

                  {isEditMode && (
                    <>
                      <option value="converted">
                        Converted
                      </option>

                      <option value="closed">
                        Closed
                      </option>
                    </>
                  )}
                </select>
              </Field>

              <Field
                label="Next follow-up"
                helper="Optional reminder for the next contact."
              >
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={
                      form.next_follow_up_at
                    }
                    onChange={updateField(
                      "next_follow_up_at",
                    )}
                    disabled={
                      inquiryMutationLoading
                    }
                    className={
                      INPUT_CLASSES
                    }
                  />

                  <CalendarClock
                    size={17}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </Field>

              <div className="hidden sm:block" />

              <div className="sm:col-span-2">
                <Field
                  label="Inquiry notes"
                  helper="Initial request, context, or internal follow-up notes."
                >
                  <textarea
                    rows="5"
                    value={form.message}
                    onChange={updateField(
                      "message",
                    )}
                    placeholder="Add the family's inquiry, questions, or internal notes..."
                    disabled={
                      inquiryMutationLoading
                    }
                    className={`${INPUT_CLASSES} resize-y py-3`}
                  />
                </Field>
              </div>

              {visibleError && (
                <div
                  role="alert"
                  className="sm:col-span-2 rounded-2xl border border-red-200 bg-red-50 p-4"
                >
                  <p className="font-black text-red-800">
                    The inquiry could not be saved.
                  </p>

                  <p className="mt-1 text-sm font-semibold text-red-700">
                    {visibleError}
                  </p>
                </div>
              )}
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:justify-end sm:p-7">
              <button
                type="button"
                onClick={onClose}
                disabled={
                  inquiryMutationLoading
                }
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  inquiryMutationLoading ||
                  !canSubmit ||
                  !selectedAdmissionCycle
                }
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {inquiryMutationLoading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}

                {inquiryMutationLoading
                  ? "Saving..."
                  : submitLabel}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </div>
  );
}