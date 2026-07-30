import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  Gavel,
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

const EMPTY_FORM =
  Object.freeze({
    application_id: "",
    decision: "",
    decision_reason: "",
    review_summary: "",
    conditions: "",
    effective_on: "",
    expires_on: "",
    internal_notes: "",
  });

const DECISION_OPTIONS = [
  {
    value: "approved",
    label: "Approved",
    description:
      "The applicant meets the admission requirements.",
  },
  {
    value:
      "conditionally_approved",
    label:
      "Conditionally approved",
    description:
      "Approval is granted subject to recorded conditions.",
  },
  {
    value: "waitlisted",
    label: "Waitlisted",
    description:
      "The applicant remains eligible while awaiting capacity.",
  },
  {
    value: "rejected",
    label: "Rejected",
    description:
      "The application will not proceed in the current cycle.",
  },
  {
    value: "deferred",
    label: "Deferred",
    description:
      "A final decision is postponed until a later review.",
  },
  {
    value:
      "additional_review",
    label:
      "Additional review",
    description:
      "Further evaluation or supporting information is required.",
  },
];

const INPUT_CLASSES =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

const TEXTAREA_CLASSES =
  "min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

function normalizeDateValue(
  value,
) {
  if (!value) {
    return "";
  }

  const text =
    String(value);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text,
    )
  ) {
    return text;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function getApplicationNumber(
  application,
) {
  return (
    application
      ?.application_number ||
    application
      ?.number ||
    "Application"
  );
}

function getApplicantName(
  application,
) {
  const applicant =
    application?.applicant ||
    application
      ?.admission_applicant ||
    null;

  const directName = [
    application
      ?.prospective_student_first_name,
    application
      ?.prospective_student_middle_name,
    application
      ?.prospective_student_last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const nestedName = [
    applicant?.first_name,
    applicant?.middle_name,
    applicant?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    directName ||
    nestedName ||
    application
      ?.applicant_name ||
    ""
  );
}

function createFormFromDecision(
  decision,
  application,
) {
  if (!decision) {
    return {
      ...EMPTY_FORM,

      application_id:
        application?.id || "",
    };
  }

  return {
    application_id:
      decision.application_id ||
      application?.id ||
      "",

    decision:
      decision.decision || "",

    decision_reason:
      decision
        .decision_reason || "",

    review_summary:
      decision
        .review_summary || "",

    conditions:
      decision.conditions || "",

    effective_on:
      normalizeDateValue(
        decision.effective_on,
      ),

    expires_on:
      normalizeDateValue(
        decision.expires_on,
      ),

    internal_notes:
      decision
        .internal_notes || "",
  };
}

function validateForm(
  form,
) {
  const errors = {};

  if (!form.application_id) {
    errors.application_id =
      "Select the application receiving this decision.";
  }

  if (!form.decision) {
    errors.decision =
      "Select a decision outcome.";
  }

  if (
    form.effective_on &&
    form.expires_on &&
    form.expires_on <
      form.effective_on
  ) {
    errors.expires_on =
      "Expiration date cannot be earlier than the effective date.";
  }

  if (
    form.decision ===
      "conditionally_approved" &&
    !form.conditions.trim()
  ) {
    errors.conditions =
      "Record the conditions attached to this approval.";
  }

  return errors;
}

function FieldError({
  message,
}) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 flex items-start gap-2 text-xs font-bold text-red-700">
      <AlertCircle
        size={14}
        className="mt-0.5 shrink-0"
      />

      {message}
    </p>
  );
}

function FormField({
  label,
  description,
  required,
  error,
  children,
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-900">
        {label}

        {required && (
          <span className="ml-1 text-red-600">
            *
          </span>
        )}
      </span>

      {description && (
        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
          {description}
        </span>
      )}

      <span className="mt-2 block">
        {children}
      </span>

      <FieldError
        message={error}
      />
    </label>
  );
}

export default function DecisionDialog({
  open = true,
  mode = "create",
  decision = null,
  application = null,
  onClose,
  onSaved,
}) {
  const {
    applications = {
      items: [],
    },

    selectedApplication,

    createDecision,
    updateDecision,

    decisionMutationLoading,
    decisionMutationError,

    canCreateDecisions,
    canEditDecisions,
  } = useAdmissions();

  const isEdit =
    mode === "edit";

  const applicationItems =
    useMemo(
      () =>
        Array.isArray(
          applications?.items,
        )
          ? applications.items
          : [],
      [
        applications?.items,
      ],
    );

  const resolvedApplication =
    application ||
    selectedApplication ||
    null;

  const [
    form,
    setForm,
  ] = useState(() =>
    createFormFromDecision(
      decision,
      resolvedApplication,
    ),
  );

  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    localError,
    setLocalError,
  ] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      createFormFromDecision(
        decision,
        resolvedApplication,
      ),
    );

    setErrors({});
    setLocalError("");
  }, [
    open,
    decision,
    resolvedApplication,
  ]);

  const canSubmit =
    isEdit
      ? Boolean(
          canEditDecisions,
        )
      : Boolean(
          canCreateDecisions,
        );

  const isLocked =
    isEdit &&
    ![
      "draft",
      "pending_approval",
    ].includes(
      decision?.status,
    );

  const selectedOutcome =
    DECISION_OPTIONS.find(
      (option) =>
        option.value ===
        form.decision,
    ) || null;

  const handleChange =
    (field) =>
    (event) => {
      const value =
        event.target.value;

      setForm(
        (current) => ({
          ...current,
          [field]: value,
        }),
      );

      setErrors(
        (current) => {
          if (!current[field]) {
            return current;
          }

          const next = {
            ...current,
          };

          delete next[field];

          return next;
        },
      );

      setLocalError("");
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const nextErrors =
        validateForm(form);

      setErrors(
        nextErrors,
      );

      setLocalError("");

      if (
        Object.keys(
          nextErrors,
        ).length > 0
      ) {
        return;
      }

      if (
        !canSubmit ||
        isLocked
      ) {
        setLocalError(
          isLocked
            ? "Only draft or pending approval decisions can be edited."
            : "You do not have permission to save admission decisions.",
        );

        return;
      }

      const payload = {
        application_id:
          form.application_id,

        decision:
          form.decision,

        decision_reason:
          form
            .decision_reason
            .trim() ||
          null,

        review_summary:
          form
            .review_summary
            .trim() ||
          null,

        conditions:
          form.conditions.trim() ||
          null,

        effective_on:
          form.effective_on ||
          null,

        expires_on:
          form.expires_on ||
          null,

        internal_notes:
          form
            .internal_notes
            .trim() ||
          null,
      };

      try {
        const savedDecision =
          isEdit
            ? await updateDecision(
                decision.id,
                payload,
              )
            : await createDecision(
                payload,
              );

        await onSaved?.(
          savedDecision,
        );

        onClose?.();
      }
      catch (error) {
        setLocalError(
          error?.message ||
          "The admission decision could not be saved.",
        );
      }
    };

  if (!open) {
    return null;
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget &&
          !decisionMutationLoading
        ) {
          onClose?.();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-dialog-title"
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-5 border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <Gavel
                size={23}
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">
                Admission review
              </p>

              <h2
                id="decision-dialog-title"
                className="mt-1 text-xl font-black text-slate-950 sm:text-2xl"
              >
                {isEdit
                  ? "Edit admission decision"
                  : "Create admission decision"}
              </h2>

              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                {isEdit
                  ? "Update the outcome, rationale, conditions, dates, and internal review details."
                  : "Create a draft decision for an application that has completed review."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onClose?.()
            }
            disabled={
              decisionMutationLoading
            }
            aria-label="Close decision dialog"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X
              size={18}
            />
          </button>
        </header>

        <form
          onSubmit={
            handleSubmit
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {(localError ||
              decisionMutationError) && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={19}
                    className="mt-0.5 shrink-0 text-red-700"
                  />

                  <div>
                    <p className="font-black text-red-900">
                      Decision could not be saved
                    </p>

                    <p className="mt-1 text-sm font-semibold leading-6 text-red-700">
                      {localError ||
                        decisionMutationError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isLocked && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-black text-amber-900">
                  This decision is read-only
                </p>

                <p className="mt-1 text-sm font-semibold leading-6 text-amber-700">
                  Only decisions in draft or pending approval status can be edited.
                </p>
              </div>
            )}

            <div className="space-y-7">
              <section>
                <div className="flex items-center gap-2">
                  <FileCheck2
                    size={18}
                    className="text-indigo-600"
                  />

                  <h3 className="font-black text-slate-950">
                    Application and outcome
                  </h3>
                </div>

                <div className="mt-4 grid gap-5 lg:grid-cols-2">
                  <FormField
                    label="Application"
                    description="Select the application receiving the decision."
                    required
                    error={
                      errors.application_id
                    }
                  >
                    <select
                      value={
                        form.application_id
                      }
                      onChange={
                        handleChange(
                          "application_id",
                        )
                      }
                      disabled={
                        isEdit ||
                        isLocked ||
                        decisionMutationLoading
                      }
                      className={
                        INPUT_CLASSES
                      }
                    >
                      <option value="">
                        Select application
                      </option>

                      {resolvedApplication?.id &&
                        !applicationItems.some(
                          (item) =>
                            item.id ===
                            resolvedApplication.id,
                        ) && (
                          <option
                            value={
                              resolvedApplication.id
                            }
                          >
                            {getApplicationNumber(
                              resolvedApplication,
                            )}
                            {getApplicantName(
                              resolvedApplication,
                            )
                              ? ` — ${getApplicantName(
                                  resolvedApplication,
                                )}`
                              : ""}
                          </option>
                        )}

                      {applicationItems.map(
                        (item) => (
                          <option
                            key={
                              item.id
                            }
                            value={
                              item.id
                            }
                          >
                            {getApplicationNumber(
                              item,
                            )}
                            {getApplicantName(
                              item,
                            )
                              ? ` — ${getApplicantName(
                                  item,
                                )}`
                              : ""}
                          </option>
                        ),
                      )}
                    </select>
                  </FormField>

                  <FormField
                    label="Decision outcome"
                    description={
                      selectedOutcome
                        ?.description ||
                      "Select the proposed admission outcome."
                    }
                    required
                    error={
                      errors.decision
                    }
                  >
                    <select
                      value={
                        form.decision
                      }
                      onChange={
                        handleChange(
                          "decision",
                        )
                      }
                      disabled={
                        isLocked ||
                        decisionMutationLoading
                      }
                      className={
                        INPUT_CLASSES
                      }
                    >
                      <option value="">
                        Select decision
                      </option>

                      {DECISION_OPTIONS.map(
                        (option) => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                  </FormField>
                </div>
              </section>

              <section>
                <h3 className="font-black text-slate-950">
                  Review record
                </h3>

                <div className="mt-4 grid gap-5 lg:grid-cols-2">
                  <FormField
                    label="Decision rationale"
                    description="Explain why this outcome was selected."
                  >
                    <textarea
                      value={
                        form.decision_reason
                      }
                      onChange={
                        handleChange(
                          "decision_reason",
                        )
                      }
                      disabled={
                        isLocked ||
                        decisionMutationLoading
                      }
                      placeholder="Record the primary rationale supporting the decision."
                      className={
                        TEXTAREA_CLASSES
                      }
                    />
                  </FormField>

                  <FormField
                    label="Review summary"
                    description="Summarize the committee or reviewer assessment."
                  >
                    <textarea
                      value={
                        form.review_summary
                      }
                      onChange={
                        handleChange(
                          "review_summary",
                        )
                      }
                      disabled={
                        isLocked ||
                        decisionMutationLoading
                      }
                      placeholder="Summarize academic, behavioral, interview, document, and other review findings."
                      className={
                        TEXTAREA_CLASSES
                      }
                    />
                  </FormField>
                </div>

                <div className="mt-5">
                  <FormField
                    label="Conditions"
                    description={
                      form.decision ===
                      "conditionally_approved"
                        ? "Conditions are required for a conditional approval."
                        : "Record any requirements, deadlines, or restrictions attached to the outcome."
                    }
                    required={
                      form.decision ===
                      "conditionally_approved"
                    }
                    error={
                      errors.conditions
                    }
                  >
                    <textarea
                      value={
                        form.conditions
                      }
                      onChange={
                        handleChange(
                          "conditions",
                        )
                      }
                      disabled={
                        isLocked ||
                        decisionMutationLoading
                      }
                      placeholder="Example: Submit the final transcript and immunization record before enrollment."
                      className={
                        TEXTAREA_CLASSES
                      }
                    />
                  </FormField>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2">
                  <CalendarDays
                    size={18}
                    className="text-indigo-600"
                  />

                  <h3 className="font-black text-slate-950">
                    Decision dates
                  </h3>
                </div>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="Effective date"
                    description="Date on which the decision takes effect."
                  >
                    <input
                      type="date"
                      value={
                        form.effective_on
                      }
                      onChange={
                        handleChange(
                          "effective_on",
                        )
                      }
                      disabled={
                        isLocked ||
                        decisionMutationLoading
                      }
                      className={
                        INPUT_CLASSES
                      }
                    />
                  </FormField>

                  <FormField
                    label="Expiration date"
                    description="Optional date after which the decision is no longer valid."
                    error={
                      errors.expires_on
                    }
                  >
                    <input
                      type="date"
                      value={
                        form.expires_on
                      }
                      min={
                        form.effective_on ||
                        undefined
                      }
                      onChange={
                        handleChange(
                          "expires_on",
                        )
                      }
                      disabled={
                        isLocked ||
                        decisionMutationLoading
                      }
                      className={
                        INPUT_CLASSES
                      }
                    />
                  </FormField>
                </div>
              </section>

              <section>
                <FormField
                  label="Internal notes"
                  description="Administrative notes are not intended for applicant publication."
                >
                  <textarea
                    value={
                      form.internal_notes
                    }
                    onChange={
                      handleChange(
                        "internal_notes",
                      )
                    }
                    disabled={
                      isLocked ||
                      decisionMutationLoading
                    }
                    placeholder="Record internal follow-up, reviewer concerns, or administrative context."
                    className={
                      TEXTAREA_CLASSES
                    }
                  />
                </FormField>
              </section>

              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-indigo-700"
                  />

                  <div>
                    <p className="font-black text-indigo-950">
                      Draft workflow
                    </p>

                    <p className="mt-1 text-sm font-semibold leading-6 text-indigo-700">
                      New decisions are saved as drafts. Approval and publication occur through separate controlled workflow actions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={() =>
                onClose?.()
              }
              disabled={
                decisionMutationLoading
              }
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                decisionMutationLoading ||
                !canSubmit ||
                isLocked
              }
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {decisionMutationLoading
                ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )
                : (
                    <Save
                      size={17}
                    />
                  )}

              {decisionMutationLoading
                ? "Saving decision..."
                : isEdit
                  ? "Save changes"
                  : "Create decision"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}