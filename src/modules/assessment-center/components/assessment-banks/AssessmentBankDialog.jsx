import {
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  Save,
  X,
} from "lucide-react";

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  bank_type: "question_bank",
  visibility: "school",
  status: "active",
};

const BANK_TYPES = [
  {
    value: "question_bank",
    label: "Question bank",
  },
  {
    value: "item_bank",
    label: "Item bank",
  },
  {
    value: "shared_library",
    label: "Shared library",
  },
  {
    value: "publisher_library",
    label: "Publisher library",
  },
  {
    value: "practice_library",
    label: "Practice library",
  },
];

const VISIBILITIES = [
  {
    value: "private",
    label: "Private",
  },
  {
    value: "school",
    label: "School",
  },
  {
    value: "organization",
    label: "Organization",
  },
  {
    value: "public",
    label: "Public",
  },
];

const STATUSES = [
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

function createFormValue(bank) {
  if (!bank) {
    return {
      ...EMPTY_FORM,
    };
  }

  return {
    name:
      bank.name ||
      "",

    code:
      bank.code ||
      "",

    description:
      bank.description ||
      "",

    bank_type:
      bank.bank_type ||
      "question_bank",

    visibility:
      bank.visibility ||
      "school",

    status:
      bank.status ||
      "active",
  };
}

function FieldLabel({
  children,
  required = false,
}) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
      {required ? " *" : ""}
    </span>
  );
}

export default function AssessmentBankDialog({
  open,
  mode = "create",
  bank = null,
  loading = false,
  error = "",
  onClose,
  onSubmit,
}) {
  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM,
  );

  const [
    localError,
    setLocalError,
  ] = useState("");

  const isEditMode =
    mode === "edit";

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      createFormValue(
        bank,
      ),
    );

    setLocalError("");
  }, [
    open,
    bank,
  ]);

  if (!open) {
    return null;
  }

  function updateField(
    field,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    setLocalError("");

    if (!form.name.trim()) {
      setLocalError(
        "Assessment bank name is required.",
      );

      return;
    }

    if (!form.code.trim()) {
      setLocalError(
        "Assessment bank code is required.",
      );

      return;
    }

    if (
      !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(
        form.code.trim(),
      )
    ) {
      setLocalError(
        "Bank code may contain only letters, numbers, underscores, and hyphens.",
      );

      return;
    }

    await onSubmit({
      name:
        form.name.trim(),

      code:
        form.code.trim(),

      description:
        form.description.trim() ||
        null,

      bank_type:
        form.bank_type,

      visibility:
        form.visibility,

      status:
        form.status,
    });
  }

  const displayedError =
    localError ||
    error;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <section className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Assessment Banks
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              {isEditMode
                ? "Edit assessment bank"
                : "Create assessment bank"}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Configure a governed library for
              reusable assessment questions.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={21} />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
        >
          <div className="space-y-5 px-6 py-6">
            {displayedError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                {displayedError}
              </div>
            )}

            <label className="block space-y-1.5">
              <FieldLabel required>
                Bank name
              </FieldLabel>

              <input
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value,
                  )
                }
                placeholder="General Question Bank"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block space-y-1.5">
              <FieldLabel required>
                Bank code
              </FieldLabel>

              <input
                value={form.code}
                onChange={(event) =>
                  updateField(
                    "code",
                    event.target.value,
                  )
                }
                placeholder="GENERAL"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block space-y-1.5">
              <FieldLabel>
                Description
              </FieldLabel>

              <textarea
                value={
                  form.description
                }
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value,
                  )
                }
                rows={4}
                placeholder="Describe the purpose of this assessment bank."
                className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-1.5">
                <FieldLabel>
                  Bank type
                </FieldLabel>

                <select
                  value={
                    form.bank_type
                  }
                  onChange={(event) =>
                    updateField(
                      "bank_type",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {BANK_TYPES.map(
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
              </label>

              <label className="space-y-1.5">
                <FieldLabel>
                  Visibility
                </FieldLabel>

                <select
                  value={
                    form.visibility
                  }
                  onChange={(event) =>
                    updateField(
                      "visibility",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {VISIBILITIES.map(
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
              </label>

              <label className="space-y-1.5">
                <FieldLabel>
                  Status
                </FieldLabel>

                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {STATUSES.map(
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
              </label>
            </div>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              {loading
                ? "Saving…"
                : isEditMode
                  ? "Save changes"
                  : "Create bank"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}