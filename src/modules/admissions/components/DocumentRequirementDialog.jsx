import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FileCheck2,
  Loader2,
  Save,
  X,
} from "lucide-react";

import {
  useAdmissions,
} from "../hooks";

const EMPTY_FORM = {
  document_type: "",
  document_label: "",
  requirement_status: "required",
  instructions: "",
  display_order: 0,
  review_required: true,
  is_active: true,
};

function normalizeDocumentType(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function createFormState(requirement) {
  if (!requirement) {
    return {
      ...EMPTY_FORM,
    };
  }

  return {
    document_type:
      requirement.document_type || "",

    document_label:
      requirement.document_label || "",

    requirement_status:
      requirement.requirement_status ||
      "required",

    instructions:
      requirement.instructions || "",

    display_order:
      Number.isFinite(
        Number(
          requirement.display_order,
        ),
      )
        ? Number(
            requirement.display_order,
          )
        : 0,

    review_required:
      requirement.review_required !==
      false,

    is_active:
      requirement.is_active !== false,
  };
}

function getErrorMessage(
  error,
  fallbackMessage,
) {
  if (
    typeof error === "string" &&
    error.trim()
  ) {
    return error;
  }

  if (
    error?.message &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallbackMessage;
}

export default function DocumentRequirementDialog({
  open,
  mode = "create",
  requirement = null,
  onClose,
}) {
  const {
    selectedAdmissionCycle,

    createDocumentRequirement,
    updateDocumentRequirement,

    canManageDocumentRequirements,

    documentRequirementMutationLoading,
    documentRequirementMutationError,

    clearDocumentRequirementMutationError,
  } = useAdmissions();

  const [
    form,
    setForm,
  ] = useState(() =>
    createFormState(requirement),
  );

  const [
    localError,
    setLocalError,
  ] = useState("");

  const isEditMode =
    mode === "edit" &&
    Boolean(requirement?.id);

  const loading =
    Boolean(
      documentRequirementMutationLoading,
    );

  const canSubmit =
    Boolean(
      canManageDocumentRequirements &&
      selectedAdmissionCycle &&
      form.document_type.trim() &&
      form.document_label.trim(),
    );

  const title = isEditMode
    ? "Edit document requirement"
    : "Add document requirement";

  const submitLabel = isEditMode
    ? "Save requirement"
    : "Add requirement";

  const normalizedType =
    useMemo(
      () =>
        normalizeDocumentType(
          form.document_type ||
            form.document_label,
        ),
      [
        form.document_type,
        form.document_label,
      ],
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      createFormState(
        isEditMode
          ? requirement
          : null,
      ),
    );

    setLocalError("");

    clearDocumentRequirementMutationError?.();
  }, [
    open,
    isEditMode,
    requirement,
    clearDocumentRequirementMutationError,
  ]);

  if (!open) {
    return null;
  }

  function updateField(
    field,
    value,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setLocalError("");

    clearDocumentRequirementMutationError?.();
  }

  function handleClose() {
    if (loading) {
      return;
    }

    setLocalError("");

    clearDocumentRequirementMutationError?.();

    onClose?.();
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    setLocalError("");

    clearDocumentRequirementMutationError?.();

    if (!selectedAdmissionCycle) {
      setLocalError(
        "Select an admission cycle before creating document requirements.",
      );

      return;
    }

    if (
      !canManageDocumentRequirements
    ) {
      setLocalError(
        "You do not have permission to manage document requirements.",
      );

      return;
    }

    const documentType =
      normalizeDocumentType(
        form.document_type ||
          form.document_label,
      );

    if (!documentType) {
      setLocalError(
        "Document type is required.",
      );

      return;
    }

    if (
      !form.document_label.trim()
    ) {
      setLocalError(
        "Display label is required.",
      );

      return;
    }

    const displayOrder =
      Number(
        form.display_order,
      );

    if (
      !Number.isInteger(
        displayOrder,
      ) ||
      displayOrder < 0
    ) {
      setLocalError(
        "Display order must be a whole number of zero or greater.",
      );

      return;
    }

    const payload = {
      document_type:
        documentType,

      document_label:
        form.document_label.trim(),

      requirement_status:
        form.requirement_status,

      instructions:
        form.instructions.trim() ||
        null,

      display_order:
        displayOrder,

      review_required:
        Boolean(
          form.review_required,
        ),

      is_active:
        Boolean(
          form.is_active,
        ),
    };

    try {
      if (isEditMode) {
        await updateDocumentRequirement(
          requirement.id,
          payload,
        );
      } else {
        await createDocumentRequirement(
          payload,
        );
      }

      onClose?.();
    } catch (error) {
      setLocalError(
        getErrorMessage(
          error,
          isEditMode
            ? "Unable to update the document requirement."
            : "Unable to create the document requirement.",
        ),
      );
    }
  }

  const visibleError =
    localError ||
    documentRequirementMutationError ||
    "";

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !loading
        ) {
          handleClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-requirement-dialog-title"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <FileCheck2
                size={20}
                aria-hidden="true"
              />
            </div>

            <div>
              <h2
                id="document-requirement-dialog-title"
                className="text-xl font-black text-slate-950"
              >
                {title}
              </h2>

              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                Configure a checklist item for{" "}
                <span className="font-black text-slate-700">
                  {selectedAdmissionCycle
                    ?.name ||
                    "the selected admission cycle"}
                </span>
                .
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close document requirement dialog"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X
              size={18}
              aria-hidden="true"
            />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 px-6 py-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-black text-slate-800">
                Display label
                <span className="text-red-600">
                  {" "}
                  *
                </span>
              </span>

              <input
                type="text"
                value={
                  form.document_label
                }
                onChange={(event) =>
                  updateField(
                    "document_label",
                    event.target.value,
                  )
                }
                disabled={loading}
                autoFocus
                placeholder="Birth certificate"
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-800">
                Document type
                <span className="text-red-600">
                  {" "}
                  *
                </span>
              </span>

              <input
                type="text"
                value={
                  form.document_type
                }
                onChange={(event) =>
                  updateField(
                    "document_type",
                    event.target.value,
                  )
                }
                disabled={loading}
                placeholder="birth_certificate"
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <p className="mt-2 text-xs font-semibold text-slate-500">
                Stored as:{" "}
                <span className="font-black text-slate-700">
                  {normalizedType ||
                    "not_set"}
                </span>
              </p>
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-800">
                Requirement status
              </span>

              <select
                value={
                  form.requirement_status
                }
                onChange={(event) =>
                  updateField(
                    "requirement_status",
                    event.target.value,
                  )
                }
                disabled={loading}
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="required">
                  Required
                </option>

                <option value="optional">
                  Optional
                </option>

                <option value="conditionally_required">
                  Conditionally required
                </option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-800">
                Display order
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={
                  form.display_order
                }
                onChange={(event) =>
                  updateField(
                    "display_order",
                    event.target.value,
                  )
                }
                disabled={loading}
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-black text-slate-800">
              Instructions
            </span>

            <textarea
              value={
                form.instructions
              }
              onChange={(event) =>
                updateField(
                  "instructions",
                  event.target.value,
                )
              }
              rows={5}
              disabled={loading}
              placeholder="Explain what the applicant must provide and any acceptance criteria."
              className="mt-2 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={
                  form.review_required
                }
                onChange={(event) =>
                  updateField(
                    "review_required",
                    event.target.checked,
                  )
                }
                disabled={loading}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />

              <span>
                <span className="block font-black text-slate-900">
                  Review required
                </span>

                <span className="mt-1 block text-sm font-medium leading-6 text-slate-500">
                  The uploaded document must be verified before satisfying this requirement.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={
                  form.is_active
                }
                onChange={(event) =>
                  updateField(
                    "is_active",
                    event.target.checked,
                  )
                }
                disabled={loading}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />

              <span>
                <span className="block font-black text-slate-900">
                  Active requirement
                </span>

                <span className="mt-1 block text-sm font-medium leading-6 text-slate-500">
                  Active requirements appear on application document checklists.
                </span>
              </span>
            </label>
          </div>

          {visibleError && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-4"
            >
              <p className="font-black text-red-800">
                Requirement could not be saved
              </p>

              <p className="mt-1 text-sm font-semibold text-red-700">
                {visibleError}
              </p>
            </div>
          )}

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !canSubmit
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2
                  size={17}
                  aria-hidden="true"
                  className="animate-spin"
                />
              ) : (
                <Save
                  size={17}
                  aria-hidden="true"
                />
              )}

              {loading
                ? "Saving..."
                : submitLabel}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

