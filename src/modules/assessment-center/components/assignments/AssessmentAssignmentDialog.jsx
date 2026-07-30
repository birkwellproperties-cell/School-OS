import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarClock,
  ClipboardList,
  LoaderCircle,
  Save,
  X,
} from "lucide-react";

import {
  useAssessment,
} from "../../context";

const DELIVERY_MODES = [
  {
    value: "online",
    label: "Online",
  },
  {
    value: "paper",
    label: "Paper",
  },
  {
    value: "hybrid",
    label: "Hybrid",
  },
];

const PROCTORING_MODES = [
  {
    value: "none",
    label: "No proctoring",
  },
  {
    value: "teacher",
    label: "Teacher proctored",
  },
  {
    value: "remote",
    label: "Remote proctored",
  },
  {
    value: "secure_browser",
    label: "Secure browser",
  },
];

const RESULT_RELEASE_POLICIES = [
  {
    value: "immediate",
    label: "Immediately after submission",
  },
  {
    value: "after_due_date",
    label: "After due date",
  },
  {
    value: "after_close",
    label: "After assignment closes",
  },
  {
    value: "manual",
    label: "Manual release",
  },
  {
    value: "never",
    label: "Do not release",
  },
];

const EMPTY_FORM = {
  template_id: "",
  title: "",
  description: "",

  status: "draft",
  delivery_mode: "online",
  proctoring_mode: "none",

  opens_at: "",
  due_at: "",
  closes_at: "",

  duration_minutes: "",
  maximum_attempts: "1",
  passing_percentage: "",

  randomize_questions: false,
  randomize_options: false,

  result_release_policy: "manual",
};

function normalizeText(
  value,
) {
  return String(
    value ?? "",
  ).trim();
}

function normalizeDateTimeLocal(
  value,
) {
  if (
    !value
  ) {
    return "";
  }

  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const offset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
        offset *
          60 *
          1000,
    );

  return localDate
    .toISOString()
    .slice(
      0,
      16,
    );
}

function createInitialForm(
  assignment,
) {
  if (
    !assignment
  ) {
    return {
      ...EMPTY_FORM,
    };
  }

  return {
    template_id:
      assignment.template_id ||
      "",

    title:
      assignment.title ||
      "",

    description:
      assignment.description ||
      "",

    status:
      assignment.status ||
      "draft",

    delivery_mode:
      assignment.delivery_mode ||
      "online",

    proctoring_mode:
      assignment.proctoring_mode ||
      "none",

    opens_at:
      normalizeDateTimeLocal(
        assignment.opens_at,
      ),

    due_at:
      normalizeDateTimeLocal(
        assignment.due_at,
      ),

    closes_at:
      normalizeDateTimeLocal(
        assignment.closes_at,
      ),

    duration_minutes:
      assignment.duration_minutes ??
      "",

    maximum_attempts:
      assignment.maximum_attempts ??
      assignment.max_attempts ??
      "1",

    passing_percentage:
      assignment.passing_percentage ??
      "",

    randomize_questions:
      Boolean(
        assignment.randomize_questions,
      ),

    randomize_options:
      Boolean(
        assignment.randomize_options,
      ),

    result_release_policy:
      assignment.result_release_policy ||
      assignment.results_release_policy ||
      "manual",
  };
}

function toNullableInteger(
  value,
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number =
    Number(
      value,
    );

  if (
    !Number.isInteger(
      number,
    )
  ) {
    return null;
  }

  return number;
}

function toIsoDateTime(
  value,
) {
  if (
    !value
  ) {
    return null;
  }

  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date.toISOString();
}

function validateForm(
  form,
) {
  const errors = {};

  if (
    !normalizeText(
      form.template_id,
    )
  ) {
    errors.template_id =
      "Select an assessment template.";
  }

  if (
    !normalizeText(
      form.title,
    )
  ) {
    errors.title =
      "Assignment title is required.";
  }

  const opensAt =
    form.opens_at
      ? new Date(
          form.opens_at,
        )
      : null;

  const dueAt =
    form.due_at
      ? new Date(
          form.due_at,
        )
      : null;

  const closesAt =
    form.closes_at
      ? new Date(
          form.closes_at,
        )
      : null;

  if (
    opensAt &&
    dueAt &&
    dueAt <= opensAt
  ) {
    errors.due_at =
      "Due time must be later than the opening time.";
  }

  if (
    opensAt &&
    closesAt &&
    closesAt <= opensAt
  ) {
    errors.closes_at =
      "Closing time must be later than the opening time.";
  }

  if (
    dueAt &&
    closesAt &&
    closesAt < dueAt
  ) {
    errors.closes_at =
      "Closing time cannot be earlier than the due time.";
  }

  if (
    form.duration_minutes !==
      ""
  ) {
    const duration =
      Number(
        form.duration_minutes,
      );

    if (
      !Number.isInteger(
        duration,
      ) ||
      duration < 1
    ) {
      errors.duration_minutes =
        "Duration must be a whole number greater than zero.";
    }
  }

  const attempts =
    Number(
      form.maximum_attempts,
    );

  if (
    !Number.isInteger(
      attempts,
    ) ||
    attempts < 1
  ) {
    errors.maximum_attempts =
      "Maximum attempts must be at least one.";
  }

  if (
    form.passing_percentage !==
      ""
  ) {
    const percentage =
      Number(
        form.passing_percentage,
      );

    if (
      Number.isNaN(
        percentage,
      ) ||
      percentage < 0 ||
      percentage > 100
    ) {
      errors.passing_percentage =
        "Passing percentage must be between 0 and 100.";
    }
  }

  return errors;
}

function FieldError({
  message,
}) {
  if (
    !message
  ) {
    return null;
  }

  return (
    <p className="mt-1.5 text-xs font-medium text-red-600">
      {message}
    </p>
  );
}

function ToggleField({
  checked,
  description,
  disabled,
  label,
  onChange,
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <input
        type="checkbox"
        checked={
          checked
        }
        disabled={
          disabled
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target.checked,
          )
        }
        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />

      <span>
        <span className="block text-sm font-semibold text-slate-900">
          {label}
        </span>

        <span className="mt-1 block text-xs leading-5 text-slate-600">
          {description}
        </span>
      </span>
    </label>
  );
}

export default function AssessmentAssignmentDialog({
  assignment = null,
  mode = "create",
  open,
  onClose,
  onSaved,
}) {
  const {
    templates,

    createAssignment,
    updateAssignment,

    assignmentMutationLoading,
    assignmentMutationError,

    clearAssignmentMutationError,
  } = useAssessment();

  const isEdit =
    mode === "edit" &&
    Boolean(
      assignment?.id,
    );

  const [
    form,
    setForm,
  ] = useState(() =>
    createInitialForm(
      assignment,
    ),
  );

  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    submitError,
    setSubmitError,
  ] = useState("");

  const eligibleTemplates =
    useMemo(
      () =>
        templates.filter(
          (
            template,
          ) => {
            const status =
              normalizeText(
                template.status,
              ).toLowerCase();

            return (
              status ===
                "published" ||
              status ===
                "active" ||
              template.id ===
                assignment?.template_id
            );
          },
        ),
      [
        templates,
        assignment?.template_id,
      ],
    );

  useEffect(() => {
    if (
      !open
    ) {
      return;
    }

    setForm(
      createInitialForm(
        assignment,
      ),
    );

    setErrors({});
    setSubmitError("");

    clearAssignmentMutationError?.();
  }, [
    open,
    assignment,
    clearAssignmentMutationError,
  ]);

  if (
    !open
  ) {
    return null;
  }

  const updateField =
    (
      field,
      value,
    ) => {
      setForm(
        (
          current,
        ) => ({
          ...current,
          [field]:
            value,
        }),
      );

      setErrors(
        (
          current,
        ) => {
          if (
            !current[field]
          ) {
            return current;
          }

          const next = {
            ...current,
          };

          delete next[
            field
          ];

          return next;
        },
      );

      setSubmitError("");
    };

  const handleClose =
    () => {
      if (
        assignmentMutationLoading
      ) {
        return;
      }

      clearAssignmentMutationError?.();
      onClose?.();
    };

  const handleSubmit =
    async (
      event,
    ) => {
      event.preventDefault();

      const nextErrors =
        validateForm(
          form,
        );

      setErrors(
        nextErrors,
      );

      setSubmitError("");

      if (
        Object.keys(
          nextErrors,
        ).length
      ) {
        return;
      }

      const payload = {
        template_id:
          normalizeText(
            form.template_id,
          ),

        title:
          normalizeText(
            form.title,
          ),

        description:
          normalizeText(
            form.description,
          ) ||
          null,

        status:
          form.status,

        delivery_mode:
          form.delivery_mode,

        proctoring_mode:
          form.proctoring_mode,

        opens_at:
          toIsoDateTime(
            form.opens_at,
          ),

        due_at:
          toIsoDateTime(
            form.due_at,
          ),

        closes_at:
          toIsoDateTime(
            form.closes_at,
          ),

        duration_minutes:
          toNullableInteger(
            form.duration_minutes,
          ),

        maximum_attempts:
          toNullableInteger(
            form.maximum_attempts,
          ),

        passing_percentage:
          form.passing_percentage ===
          ""
            ? null
            : Number(
                form.passing_percentage,
              ),

        randomize_questions:
          Boolean(
            form.randomize_questions,
          ),

        randomize_options:
          Boolean(
            form.randomize_options,
          ),

        result_release_policy:
          form.result_release_policy,
      };

      try {
        const saved =
          isEdit
            ? await updateAssignment(
                assignment.id,
                payload,
              )
            : await createAssignment(
                payload,
              );

        onSaved?.(
          saved,
        );

        onClose?.();
      } catch (
        error
      ) {
        setSubmitError(
          error?.message ||
            "Unable to save the assessment assignment.",
        );
      }
    };

  const visibleError =
    submitError ||
    assignmentMutationError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <button
        type="button"
        aria-label="Close assignment dialog"
        onClick={
          handleClose
        }
        className="absolute inset-0 cursor-default"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="assessment-assignment-dialog-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ClipboardList
                className="h-5 w-5"
                aria-hidden="true"
              />
            </span>

            <div>
              <p className="text-sm font-semibold text-blue-700">
                Assessment runtime
              </p>

              <h2
                id="assessment-assignment-dialog-title"
                className="mt-1 text-xl font-semibold tracking-tight text-slate-950"
              >
                {isEdit
                  ? "Edit assignment"
                  : "Create assignment"}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Configure the assessment source, schedule, delivery rules, and attempt policy.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              assignmentMutationLoading
            }
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X
              className="h-5 w-5"
              aria-hidden="true"
            />

            <span className="sr-only">
              Close
            </span>
          </button>
        </header>

        <form
          onSubmit={
            handleSubmit
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-7">
            {visibleError && (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Assignment could not be saved
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  {visibleError}
                </p>
              </section>
            )}

            <section>
              <h3 className="text-sm font-semibold text-slate-950">
                Assessment source
              </h3>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Published template
                  </span>

                  <select
                    value={
                      form.template_id
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "template_id",
                        event.target.value,
                      )
                    }
                    disabled={
                      assignmentMutationLoading ||
                      isEdit
                    }
                    className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:ring-4 ${
                      errors.template_id
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  >
                    <option value="">
                      Select a template
                    </option>

                    {eligibleTemplates.map(
                      (
                        template,
                      ) => (
                        <option
                          key={
                            template.id
                          }
                          value={
                            template.id
                          }
                        >
                          {template.title ||
                            template.name ||
                            template.template_name ||
                            "Untitled template"}
                        </option>
                      ),
                    )}
                  </select>

                  <FieldError
                    message={
                      errors.template_id
                    }
                  />

                  {eligibleTemplates.length ===
                    0 && (
                    <p className="mt-2 text-xs leading-5 text-amber-700">
                      No published templates are currently available. Publish an assessment template before creating an assignment.
                    </p>
                  )}
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Assignment status
                  </span>

                  <select
                    value={
                      form.status
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "status",
                        event.target.value,
                      )
                    }
                    disabled={
                      assignmentMutationLoading
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="draft">
                      Draft
                    </option>

                    <option value="scheduled">
                      Scheduled
                    </option>
                  </select>
                </label>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-950">
                Assignment information
              </h3>

              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Assignment title
                  </span>

                  <input
                    type="text"
                    value={
                      form.title
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "title",
                        event.target.value,
                      )
                    }
                    disabled={
                      assignmentMutationLoading
                    }
                    placeholder="Example: Grade 8 Mathematics Midterm"
                    className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                      errors.title
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />

                  <FieldError
                    message={
                      errors.title
                    }
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Description
                  </span>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "description",
                        event.target.value,
                      )
                    }
                    disabled={
                      assignmentMutationLoading
                    }
                    rows={3}
                    placeholder="Optional instructions or administrative notes"
                    className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2">
                <CalendarClock
                  className="h-4 w-4 text-blue-600"
                  aria-hidden="true"
                />

                <h3 className="text-sm font-semibold text-slate-950">
                  Schedule
                </h3>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Opens at
                  </span>

                  <input
                    type="datetime-local"
                    value={
                      form.opens_at
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "opens_at",
                        event.target.value,
                      )
                    }
                    disabled={
                      assignmentMutationLoading
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Due at
                  </span>

                  <input
                    type="datetime-local"
                    value={
                      form.due_at
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "due_at",
                        event.target.value,
                      )
                    }
                    disabled={
                      assignmentMutationLoading
                    }
                    className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:ring-4 ${
                      errors.due_at
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />

                  <FieldError
                    message={
                      errors.due_at
                    }
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Closes at
                  </span>

                  <input
                    type="datetime-local"
                    value={
                      form.closes_at
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "closes_at",
                        event.target.value,
                      )
                    }
                    disabled={
                      assignmentMutationLoading
                    }
                    className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:ring-4 ${
                      errors.closes_at
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />

                  <FieldError
                    message={
                      errors.closes_at
                    }
                  />
                </label>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-950">
                Delivery configuration
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Delivery mode
                  </span>

                  <select
                    value={
                      form.delivery_mode
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "delivery_mode",
                        event.target.value,
                      )
                    }
                    disabled={
                      assignmentMutationLoading
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    {DELIVERY_MODES.map(
                      (
                        option,
                      ) => (
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
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Proctoring mode
                  </span>

                  <select
                    value={
                      form.proctoring_mode
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "proctoring_mode",
                        event.target.value,
                      )
                    }
                    disabled={
                      assignmentMutationLoading
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    {PROCTORING_MODES.map(
                      (
                        option,
                      ) => (
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
                </label>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-950">
                Attempt and scoring rules
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Duration in minutes
                  </span>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      form.duration_minutes
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "duration_minutes",
                        event.target.value,
                      )
                    }
                    disabled={
                      assignmentMutationLoading
                    }
                    placeholder="No limit"
                    className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:ring-4 ${
                      errors.duration_minutes
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />

                  <FieldError
                    message={
                      errors.duration_minutes
                    }
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Maximum attempts
                  </span>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      form.maximum_attempts
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "maximum_attempts",
                        event.target.value,
                      )
                    }
                    disabled={
                      assignmentMutationLoading
                    }
                    className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:ring-4 ${
                      errors.maximum_attempts
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />

                  <FieldError
                    message={
                      errors.maximum_attempts
                    }
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Passing percentage
                  </span>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={
                      form.passing_percentage
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "passing_percentage",
                        event.target.value,
                      )
                    }
                    disabled={
                      assignmentMutationLoading
                    }
                    placeholder="Optional"
                    className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:ring-4 ${
                      errors.passing_percentage
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />

                  <FieldError
                    message={
                      errors.passing_percentage
                    }
                  />
                </label>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-950">
                Candidate experience
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ToggleField
                  checked={
                    form.randomize_questions
                  }
                  disabled={
                    assignmentMutationLoading
                  }
                  label="Randomize questions"
                  description="Present assessment questions in a different order for each attempt."
                  onChange={(
                    checked,
                  ) =>
                    updateField(
                      "randomize_questions",
                      checked,
                    )
                  }
                />

                <ToggleField
                  checked={
                    form.randomize_options
                  }
                  disabled={
                    assignmentMutationLoading
                  }
                  label="Randomize answer options"
                  description="Shuffle available answer options when the assessment is delivered."
                  onChange={(
                    checked,
                  ) =>
                    updateField(
                      "randomize_options",
                      checked,
                    )
                  }
                />
              </div>

              <label className="mt-4 block">
                <span className="text-sm font-semibold text-slate-700">
                  Result release policy
                </span>

                <select
                  value={
                    form.result_release_policy
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "result_release_policy",
                      event.target.value,
                    )
                  }
                  disabled={
                    assignmentMutationLoading
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:max-w-md"
                >
                  {RESULT_RELEASE_POLICIES.map(
                    (
                      option,
                    ) => (
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
              </label>
            </section>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={
                handleClose
              }
              disabled={
                assignmentMutationLoading
              }
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                assignmentMutationLoading ||
                eligibleTemplates.length ===
                  0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assignmentMutationLoading
                ? (
                  <LoaderCircle
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )
                : (
                  <Save
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                )}

              {assignmentMutationLoading
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create assignment"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
