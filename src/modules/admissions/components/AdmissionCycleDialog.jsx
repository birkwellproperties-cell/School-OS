import {
  Archive,
  CalendarDays,
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

const EMPTY_FORM = Object.freeze({
  name: "",
  code: "",
  academic_year_label: "",
  status: "draft",
  opens_at: "",
  closes_at: "",
  application_target: "",
  seat_capacity: "",
  notes: "",
});

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

function createFormState(cycle) {
  if (!cycle) {
    return {
      ...EMPTY_FORM,
    };
  }

  return {
    name: cycle.name || "",
    code: cycle.code || "",
    academic_year_label:
      cycle.academic_year_label || "",
    status: cycle.status || "draft",
    opens_at:
      toDateTimeLocal(
        cycle.opens_at,
      ),
    closes_at:
      toDateTimeLocal(
        cycle.closes_at,
      ),
    application_target:
      cycle.application_target ??
      "",
    seat_capacity:
      cycle.seat_capacity ??
      "",
    notes: cycle.notes || "",
  };
}

function normalizeOptionalNumber(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return Number(value);
}

function validateForm(form) {
  if (!form.name.trim()) {
    return "Admission cycle name is required.";
  }

  if (!form.code.trim()) {
    return "Admission cycle code is required.";
  }

  if (
    !form.academic_year_label.trim()
  ) {
    return "Academic year is required.";
  }

  if (
    form.opens_at &&
    form.closes_at &&
    new Date(form.closes_at).getTime() <
      new Date(form.opens_at).getTime()
  ) {
    return "Closing date cannot be earlier than the opening date.";
  }

  const applicationTarget =
    normalizeOptionalNumber(
      form.application_target,
    );

  if (
    applicationTarget !== null &&
    (!Number.isInteger(
      applicationTarget,
    ) ||
      applicationTarget < 0)
  ) {
    return "Application target must be a non-negative whole number.";
  }

  const seatCapacity =
    normalizeOptionalNumber(
      form.seat_capacity,
    );

  if (
    seatCapacity !== null &&
    (!Number.isInteger(
      seatCapacity,
    ) ||
      seatCapacity < 0)
  ) {
    return "Seat capacity must be a non-negative whole number.";
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

const INPUT_CLASSES =
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70";

export default function AdmissionCycleDialog({
  open,
  mode = "create",
  cycle = null,
  onClose,
}) {
  const {
    createAdmissionCycle,
    updateAdmissionCycle,
    archiveAdmissionCycle,

    canCreateAdmissions,
    canEditAdmissions,

    admissionCycleMutationLoading,
    admissionCycleMutationError,
    clearAdmissionCycleMutationError,
  } = useAdmissions();

  const isEditMode =
    mode === "edit" && Boolean(cycle);

  const canSubmit =
    isEditMode
      ? canEditAdmissions
      : canCreateAdmissions;

  const [
    form,
    setForm,
  ] = useState(() =>
    createFormState(cycle),
  );

  const [
    localError,
    setLocalError,
  ] = useState("");

  const title = isEditMode
    ? "Edit admission cycle"
    : "Create admission cycle";

  const submitLabel = isEditMode
    ? "Save changes"
    : "Create cycle";

  const archived =
    cycle?.status === "archived";

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      createFormState(
        isEditMode ? cycle : null,
      ),
    );

    setLocalError("");
    clearAdmissionCycleMutationError();
  }, [
    open,
    isEditMode,
    cycle,
    clearAdmissionCycleMutationError,
  ]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        !admissionCycleMutationLoading
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
    admissionCycleMutationLoading,
  ]);

  const payload = useMemo(
    () => ({
      name: form.name.trim(),
      code:
        form.code
          .trim()
          .toUpperCase(),
      academic_year_label:
        form.academic_year_label.trim(),
      status: form.status,
      opens_at:
        form.opens_at || null,
      closes_at:
        form.closes_at || null,
      application_target:
        normalizeOptionalNumber(
          form.application_target,
        ),
      seat_capacity:
        normalizeOptionalNumber(
          form.seat_capacity,
        ),
      notes:
        form.notes.trim() || null,
    }),
    [form],
  );

  if (!open) {
    return null;
  }

  const updateField =
    (field) => (event) => {
      const value =
        event.target.value;

      setForm((current) => ({
        ...current,
        [field]: value,
      }));

      setLocalError("");
      clearAdmissionCycleMutationError();
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

      if (!canSubmit) {
        setLocalError(
          "You do not have permission to perform this action.",
        );
        return;
      }

      try {
        if (isEditMode) {
          await updateAdmissionCycle(
            cycle.id,
            payload,
          );
        } else {
          await createAdmissionCycle(
            payload,
          );
        }

        onClose?.();
      } catch {
        // Provider exposes the normalized
        // mutation error.
      }
    };

  const handleArchive =
    async () => {
      if (
        !isEditMode ||
        !cycle?.id ||
        archived
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Archive "${cycle.name}"? It will no longer be available as an active admission cycle.`,
        );

      if (!confirmed) {
        return;
      }

      try {
        await archiveAdmissionCycle(
          cycle.id,
        );

        onClose?.();
      } catch {
        // Provider exposes the normalized
        // mutation error.
      }
    };

  const visibleError =
    localError ||
    admissionCycleMutationError;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !admissionCycleMutationLoading
        ) {
          onClose?.();
        }
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="admission-cycle-dialog-title"
          className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 p-5 sm:p-7">
            <div>
              <div className="flex items-center gap-2 text-indigo-700">
                <CalendarDays
                  size={18}
                />

                <p className="text-xs font-black uppercase tracking-[0.16em]">
                  Admissions configuration
                </p>
              </div>

              <h2
                id="admission-cycle-dialog-title"
                className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl"
              >
                {title}
              </h2>

              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                Configure the admissions
                period, operating window,
                targets, and capacity for this
                school workspace.
              </p>
            </div>

            <button
              type="button"
              aria-label="Close dialog"
              onClick={onClose}
              disabled={
                admissionCycleMutationLoading
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
              <Field
                label="Cycle name"
                required
                helper="A clear name visible throughout the Admissions module."
              >
                <input
                  type="text"
                  value={form.name}
                  onChange={
                    updateField("name")
                  }
                  placeholder="2027 Intake"
                  disabled={
                    admissionCycleMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <Field
                label="Cycle code"
                required
                helper="A short unique code for reporting and workflows."
              >
                <input
                  type="text"
                  value={form.code}
                  onChange={
                    updateField("code")
                  }
                  placeholder="2027-INTAKE"
                  disabled={
                    admissionCycleMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <Field
                label="Academic year"
                required
              >
                <input
                  type="text"
                  value={
                    form.academic_year_label
                  }
                  onChange={updateField(
                    "academic_year_label",
                  )}
                  placeholder="2027–2028"
                  disabled={
                    admissionCycleMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <Field label="Status">
                <select
                  value={form.status}
                  onChange={
                    updateField("status")
                  }
                  disabled={
                    admissionCycleMutationLoading ||
                    archived
                  }
                  className={
                    INPUT_CLASSES
                  }
                >
                  <option value="draft">
                    Draft
                  </option>

                  <option value="open">
                    Open
                  </option>

                  <option value="closed">
                    Closed
                  </option>

                  {archived && (
                    <option value="archived">
                      Archived
                    </option>
                  )}
                </select>
              </Field>

              <Field label="Opening date">
                <input
                  type="datetime-local"
                  value={form.opens_at}
                  onChange={updateField(
                    "opens_at",
                  )}
                  disabled={
                    admissionCycleMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <Field label="Closing date">
                <input
                  type="datetime-local"
                  value={form.closes_at}
                  onChange={updateField(
                    "closes_at",
                  )}
                  disabled={
                    admissionCycleMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <Field
                label="Application target"
                helper="Optional target number of applications for this cycle."
              >
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.application_target
                  }
                  onChange={updateField(
                    "application_target",
                  )}
                  placeholder="500"
                  disabled={
                    admissionCycleMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <Field
                label="Seat capacity"
                helper="Optional maximum enrollment capacity for this cycle."
              >
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.seat_capacity
                  }
                  onChange={updateField(
                    "seat_capacity",
                  )}
                  placeholder="250"
                  disabled={
                    admissionCycleMutationLoading
                  }
                  className={
                    INPUT_CLASSES
                  }
                />
              </Field>

              <div className="sm:col-span-2">
                <Field
                  label="Notes"
                  helper="Internal administrative notes about this cycle."
                >
                  <textarea
                    rows="4"
                    value={form.notes}
                    onChange={
                      updateField("notes")
                    }
                    placeholder="Add internal cycle notes..."
                    disabled={
                      admissionCycleMutationLoading
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
                    The admission cycle could
                    not be saved.
                  </p>

                  <p className="mt-1 text-sm font-semibold text-red-700">
                    {visibleError}
                  </p>
                </div>
              )}
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div>
                {isEditMode &&
                  canEditAdmissions &&
                  !archived && (
                    <button
                      type="button"
                      onClick={
                        handleArchive
                      }
                      disabled={
                        admissionCycleMutationLoading
                      }
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Archive
                        size={17}
                      />

                      Archive cycle
                    </button>
                  )}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={
                    admissionCycleMutationLoading
                  }
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    admissionCycleMutationLoading ||
                    !canSubmit ||
                    archived
                  }
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {admissionCycleMutationLoading ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {admissionCycleMutationLoading
                    ? "Saving..."
                    : submitLabel}
                </button>
              </div>
            </footer>
          </form>
        </section>
      </div>
    </div>
  );
}