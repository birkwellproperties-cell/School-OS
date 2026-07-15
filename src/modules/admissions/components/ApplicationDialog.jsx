import {
  ClipboardList,
  Loader2,
  Save,
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

const INPUT_CLASSES =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

const TEXTAREA_CLASSES =
  "min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

const EMPTY_FORM = Object.freeze({
  entry_grade_level: "",
  intended_start_date: "",
  application_type: "new_student",
  status: "draft",
  priority: "normal",

  completion_percentage: "0",

  application_fee_amount: "",
  application_fee_currency: "",
  application_fee_status: "",

  applicant_statement: "",
  internal_notes: "",
});

function createFormState(application) {
  if (!application) {
    return {
      ...EMPTY_FORM,
    };
  }

  return {
    entry_grade_level:
      application.entry_grade_level ||
      "",

    intended_start_date:
      application.intended_start_date ||
      "",

    application_type:
      application.application_type ||
      "new_student",

    status:
      application.status ||
      "draft",

    priority:
      application.priority ||
      "normal",

    completion_percentage:
      application
        .completion_percentage !==
      undefined
        ? String(
            application
              .completion_percentage,
          )
        : "0",

    application_fee_amount:
      application
        .application_fee_amount !==
        null &&
      application
        .application_fee_amount !==
        undefined
        ? String(
            application
              .application_fee_amount,
          )
        : "",

    application_fee_currency:
      application
        .application_fee_currency ||
      "",

    application_fee_status:
      application
        .application_fee_status ||
      "",

    applicant_statement:
      application
        .applicant_statement ||
      "",

    internal_notes:
      application.internal_notes ||
      "",
  };
}

function normalizeOptionalText(value) {
  const normalized =
    value?.trim?.() || "";

  return normalized || null;
}

function getApplicantName(applicant) {
  return [
    applicant?.first_name,
    applicant?.middle_name,
    applicant?.last_name,
  ]
    .filter(Boolean)
    .join(" ");
}

function validateForm(form, applicant) {
  if (!applicant?.id) {
    return "Select an applicant before starting an application.";
  }

  if (
    !form.entry_grade_level.trim()
  ) {
    return "Entry grade level is required.";
  }

  const completionPercentage =
    Number(
      form.completion_percentage,
    );

  if (
    !Number.isFinite(
      completionPercentage,
    ) ||
    completionPercentage < 0 ||
    completionPercentage > 100
  ) {
    return "Completion percentage must be between 0 and 100.";
  }

  if (
    form.application_fee_amount !==
      "" &&
    (
      !Number.isFinite(
        Number(
          form.application_fee_amount,
        ),
      ) ||
      Number(
        form.application_fee_amount,
      ) < 0
    )
  ) {
    return "Application fee amount must be zero or greater.";
  }

  if (
    form.application_fee_currency &&
    !/^[A-Za-z]{3}$/.test(
      form.application_fee_currency
        .trim(),
    )
  ) {
    return "Application fee currency must contain exactly three letters.";
  }

  if (
    form.status !== "draft" &&
    form.status !== "cancelled" &&
    form.status !== "withdrawn"
  ) {
    return "New applications must begin as Draft. Submission and workflow status changes will be handled in the Application Workspace.";
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

export default function ApplicationDialog({
  open,
  mode = "create",
  applicant = null,
  application = null,
  onClose,
  onSaved,
}) {
  const {
    createApplication,
    updateApplication,

    canCreateApplications,
    canEditApplications,

    applicationMutationLoading,
    applicationMutationError,
    clearApplicationMutationError,

    selectedAdmissionCycle,
  } = useAdmissions();

  const isEditMode =
    mode === "edit" &&
    Boolean(application);

  const canSubmit =
    isEditMode
      ? canEditApplications
      : canCreateApplications;

  const [
    form,
    setForm,
  ] = useState(() =>
    createFormState(application),
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
          ? application
          : null,
      ),
    );

    setLocalError("");
    clearApplicationMutationError();
  }, [
    open,
    isEditMode,
    application,
    clearApplicationMutationError,
  ]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (
      event,
    ) => {
      if (
        event.key === "Escape" &&
        !applicationMutationLoading
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
    applicationMutationLoading,
    onClose,
  ]);

  const payload = useMemo(
    () => ({
      applicant_id:
        applicant?.id ||
        application?.applicant_id,

      source_inquiry_id:
        applicant?.source_inquiry_id ||
        application
          ?.source_inquiry_id ||
        null,

      entry_grade_level:
        form.entry_grade_level.trim(),

      intended_start_date:
        form.intended_start_date ||
        null,

      application_type:
        form.application_type,

      status:
        form.status,

      priority:
        form.priority,

      completion_percentage:
        Number(
          form.completion_percentage ||
            0,
        ),

      application_fee_amount:
        form.application_fee_amount ===
        ""
          ? null
          : Number(
              form
                .application_fee_amount,
            ),

      application_fee_currency:
        form.application_fee_currency
          .trim()
          ? form
              .application_fee_currency
              .trim()
              .toUpperCase()
          : null,

      application_fee_status:
        form.application_fee_status ||
        null,

      applicant_statement:
        normalizeOptionalText(
          form.applicant_statement,
        ),

      internal_notes:
        normalizeOptionalText(
          form.internal_notes,
        ),
    }),
    [
      applicant,
      application,
      form,
    ],
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
      clearApplicationMutationError();
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const effectiveApplicant =
        applicant ||
        (
          application?.applicant_id
            ? {
                id:
                  application
                    .applicant_id,
              }
            : null
        );

      const validationError =
        validateForm(
          form,
          effectiveApplicant,
        );

      if (validationError) {
        setLocalError(
          validationError,
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
        const savedApplication =
          isEditMode
            ? await updateApplication(
                application.id,
                payload,
              )
            : await createApplication(
                payload,
              );

        onSaved?.(
          savedApplication,
        );

        onClose?.();
      } catch {
        // Mutation errors are exposed
        // through application state.
      }
    };

  const applicantName =
    getApplicantName(applicant) ||
    "Selected applicant";

  const visibleError =
    localError ||
    applicationMutationError;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !applicationMutationLoading
        ) {
          onClose?.();
        }
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="application-dialog-title"
          className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:p-7">
            <div>
              <div className="flex items-center gap-2 text-indigo-700">
                <ClipboardList
                  size={18}
                />

                <p className="text-xs font-black uppercase tracking-[0.16em]">
                  Admission application
                </p>
              </div>

              <h2
                id="application-dialog-title"
                className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl"
              >
                {isEditMode
                  ? "Edit application"
                  : "Start application"}
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                Create the formal
                application record for{" "}
                <span className="font-black text-slate-900">
                  {applicantName}
                </span>
                .
              </p>
            </div>

            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              disabled={
                applicationMutationLoading
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
              <div className="sm:col-span-2 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">
                  Application scope
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold text-slate-500">
                      Applicant
                    </p>

                    <p className="mt-1 font-black text-slate-950">
                      {applicantName}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {applicant
                        ?.applicant_number ||
                        "Applicant number will remain linked to this application."}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-500">
                      Admission cycle
                    </p>

                    <p className="mt-1 font-black text-slate-950">
                      {selectedAdmissionCycle
                        ?.name ||
                        "Selected admission cycle"}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {selectedAdmissionCycle
                        ?.academic_year_label ||
                        selectedAdmissionCycle
                          ?.code ||
                        "The active cycle will be linked automatically."}
                    </p>
                  </div>
                </div>
              </div>

              <SectionHeading
                title="Application details"
                description="Define the intended entry point and application classification."
              />

              <Field
                label="Entry grade level"
                required
                helper="The grade or year level the applicant intends to enter."
              >
                <input
                  type="text"
                  value={
                    form.entry_grade_level
                  }
                  onChange={updateField(
                    "entry_grade_level",
                  )}
                  placeholder="Grade 6"
                  disabled={
                    applicationMutationLoading
                  }
                  className={INPUT_CLASSES}
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
                    applicationMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="Application type">
                <select
                  value={
                    form.application_type
                  }
                  onChange={updateField(
                    "application_type",
                  )}
                  disabled={
                    applicationMutationLoading
                  }
                  className={INPUT_CLASSES}
                >
                  <option value="new_student">
                    New student
                  </option>

                  <option value="transfer">
                    Transfer
                  </option>

                  <option value="returning_student">
                    Returning student
                  </option>

                  <option value="international">
                    International
                  </option>

                  <option value="scholarship">
                    Scholarship
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </Field>

              <Field label="Priority">
                <select
                  value={form.priority}
                  onChange={updateField(
                    "priority",
                  )}
                  disabled={
                    applicationMutationLoading
                  }
                  className={INPUT_CLASSES}
                >
                  <option value="low">
                    Low
                  </option>

                  <option value="normal">
                    Normal
                  </option>

                  <option value="high">
                    High
                  </option>

                  <option value="urgent">
                    Urgent
                  </option>
                </select>
              </Field>

              <Field
                label="Status"
                helper="New applications begin as drafts. Submission is handled in the Application Workspace."
              >
                <select
                  value={form.status}
                  onChange={updateField(
                    "status",
                  )}
                  disabled={
                    applicationMutationLoading ||
                    !isEditMode
                  }
                  className={INPUT_CLASSES}
                >
                  <option value="draft">
                    Draft
                  </option>

                  {isEditMode && (
                    <>
                      <option value="cancelled">
                        Cancelled
                      </option>

                      <option value="withdrawn">
                        Withdrawn
                      </option>
                    </>
                  )}
                </select>
              </Field>

              <Field
                label="Completion percentage"
                helper="Initial application completeness from 0 to 100."
              >
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={
                    form.completion_percentage
                  }
                  onChange={updateField(
                    "completion_percentage",
                  )}
                  disabled={
                    applicationMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <SectionHeading
                title="Application fee"
                description="Optional fee details for this application."
              />

              <Field label="Fee amount">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.application_fee_amount
                  }
                  onChange={updateField(
                    "application_fee_amount",
                  )}
                  placeholder="0.00"
                  disabled={
                    applicationMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field
                label="Currency"
                helper="Use a three-letter currency code such as USD or KES."
              >
                <input
                  type="text"
                  maxLength={3}
                  value={
                    form.application_fee_currency
                  }
                  onChange={updateField(
                    "application_fee_currency",
                  )}
                  placeholder="USD"
                  disabled={
                    applicationMutationLoading
                  }
                  className={INPUT_CLASSES}
                />
              </Field>

              <Field label="Fee status">
                <select
                  value={
                    form.application_fee_status
                  }
                  onChange={updateField(
                    "application_fee_status",
                  )}
                  disabled={
                    applicationMutationLoading
                  }
                  className={INPUT_CLASSES}
                >
                  <option value="">
                    Not specified
                  </option>

                  <option value="not_required">
                    Not required
                  </option>

                  <option value="pending">
                    Pending
                  </option>

                  <option value="paid">
                    Paid
                  </option>

                  <option value="waived">
                    Waived
                  </option>

                  <option value="refunded">
                    Refunded
                  </option>
                </select>
              </Field>

              <div className="hidden sm:block" />

              <SectionHeading
                title="Statements and notes"
                description="Capture applicant-facing information and internal Admissions context."
              />

              <Field label="Applicant statement">
                <textarea
                  value={
                    form.applicant_statement
                  }
                  onChange={updateField(
                    "applicant_statement",
                  )}
                  placeholder="Applicant or family statement..."
                  disabled={
                    applicationMutationLoading
                  }
                  className={
                    TEXTAREA_CLASSES
                  }
                />
              </Field>

              <Field label="Internal notes">
                <textarea
                  value={
                    form.internal_notes
                  }
                  onChange={updateField(
                    "internal_notes",
                  )}
                  placeholder="Internal Admissions notes..."
                  disabled={
                    applicationMutationLoading
                  }
                  className={
                    TEXTAREA_CLASSES
                  }
                />
              </Field>
            </div>

            <footer className="border-t border-slate-200 bg-slate-50 p-5 sm:p-7">
              {visibleError && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                >
                  {visibleError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={
                    applicationMutationLoading
                  }
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    applicationMutationLoading ||
                    !canSubmit
                  }
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {applicationMutationLoading
                    ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    )
                    : (
                      <Save size={17} />
                    )}

                  {applicationMutationLoading
                    ? "Saving..."
                    : isEditMode
                      ? "Save application"
                      : "Start application"}
                </button>
              </div>
            </footer>
          </form>
        </section>
      </div>
    </div>
  );
}