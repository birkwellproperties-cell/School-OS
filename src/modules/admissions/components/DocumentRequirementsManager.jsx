import {
  useMemo,
  useState,
} from "react";

import {
  Archive,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FilePlus2,
  Loader2,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import {
  getAdmissionStatusLabel,
} from "../constants";

import {
  useAdmissions,
} from "../hooks";

import DocumentRequirementDialog
  from "./DocumentRequirementDialog";

function RequirementStatusBadge({
  status,
}) {
  const tone =
    status === "required"
      ? "border-red-200 bg-red-50 text-red-700"
      : status === "optional"
        ? "border-slate-200 bg-slate-100 text-slate-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-black",
        tone,
      ].join(" ")}
    >
      {status === "conditionally_required"
        ? "Conditionally required"
        : getAdmissionStatusLabel(
            status,
          )}
    </span>
  );
}

function Metric({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
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

export default function DocumentRequirementsManager() {
  const {
    selectedAdmissionCycle,

    documentRequirements = {
      items: [],
      total: 0,
    },

    documentRequirementsLoading,
    documentRequirementsError,

    documentRequirementMutationLoading,
    documentRequirementMutationError,

    canManageDocumentRequirements,

    refreshDocumentRequirements,
    archiveDocumentRequirement,
    deleteDocumentRequirement,

    clearDocumentRequirementMutationError,
  } = useAdmissions();

  const [
    dialogState,
    setDialogState,
  ] = useState(null);

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    actionState,
    setActionState,
  ] = useState({
    id: null,
    action: null,
  });

  const requirements =
    useMemo(
      () =>
        [
          ...(
            documentRequirements
              ?.items || []
          ),
        ].sort((left, right) => {
          const orderDifference =
            Number(
              left.display_order || 0,
            ) -
            Number(
              right.display_order || 0,
            );

          if (orderDifference !== 0) {
            return orderDifference;
          }

          return String(
            left.document_label || "",
          ).localeCompare(
            String(
              right.document_label || "",
            ),
          );
        }),
      [documentRequirements],
    );

  const activeRequirements =
    requirements.filter(
      (requirement) =>
        requirement.is_active !==
        false,
    );

  const requiredCount =
    activeRequirements.filter(
      (requirement) =>
        requirement.requirement_status ===
        "required",
    ).length;

  const optionalCount =
    activeRequirements.filter(
      (requirement) =>
        requirement.requirement_status ===
        "optional",
    ).length;

  const conditionalCount =
    activeRequirements.filter(
      (requirement) =>
        requirement.requirement_status ===
        "conditionally_required",
    ).length;

  const loading =
    Boolean(
      documentRequirementsLoading,
    );

  const mutating =
    Boolean(
      documentRequirementMutationLoading,
    );

  function openCreateDialog() {
    setActionError("");

    clearDocumentRequirementMutationError?.();

    setDialogState({
      mode: "create",
      requirement: null,
    });
  }

  function openEditDialog(
    requirement,
  ) {
    setActionError("");

    clearDocumentRequirementMutationError?.();

    setDialogState({
      mode: "edit",
      requirement,
    });
  }

  function closeDialog() {
    if (mutating) {
      return;
    }

    setDialogState(null);
  }

  async function handleArchive(
    requirement,
  ) {
    if (
      !requirement?.id ||
      !canManageDocumentRequirements ||
      mutating
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Archive "${requirement.document_label}"? It will no longer appear on active application checklists.`,
      );

    if (!confirmed) {
      return;
    }

    setActionError("");

    clearDocumentRequirementMutationError?.();

    setActionState({
      id: requirement.id,
      action: "archive",
    });

    try {
      await archiveDocumentRequirement(
        requirement.id,
      );
    } catch (error) {
      setActionError(
        getErrorMessage(
          error,
          "Unable to archive the document requirement.",
        ),
      );
    } finally {
      setActionState({
        id: null,
        action: null,
      });
    }
  }

  async function handleDelete(
    requirement,
  ) {
    if (
      !requirement?.id ||
      !canManageDocumentRequirements ||
      mutating
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${requirement.document_label}"? This action removes the requirement from the active checklist.`,
      );

    if (!confirmed) {
      return;
    }

    setActionError("");

    clearDocumentRequirementMutationError?.();

    setActionState({
      id: requirement.id,
      action: "delete",
    });

    try {
      await deleteDocumentRequirement(
        requirement.id,
      );
    } catch (error) {
      setActionError(
        getErrorMessage(
          error,
          "Unable to delete the document requirement.",
        ),
      );
    } finally {
      setActionState({
        id: null,
        action: null,
      });
    }
  }

  const visibleError =
    actionError ||
    documentRequirementsError ||
    documentRequirementMutationError ||
    "";

  if (!selectedAdmissionCycle) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <ClipboardList
          size={28}
          aria-hidden="true"
          className="mx-auto text-slate-400"
        />

        <h2 className="mt-4 text-lg font-black text-slate-900">
          Select an admission cycle
        </h2>

        <p className="mx-auto mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
          Document requirements are configured separately for each admission cycle.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <FileCheck2
                size={20}
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-950">
                Document requirements
              </h2>

              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                Configure the application checklist for{" "}
                <span className="font-black text-slate-700">
                  {selectedAdmissionCycle.name}
                </span>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setActionError("");
                refreshDocumentRequirements();
              }}
              disabled={
                loading ||
                mutating
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                aria-hidden="true"
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            {canManageDocumentRequirements && (
              <button
                type="button"
                onClick={
                  openCreateDialog
                }
                disabled={mutating}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FilePlus2
                  size={16}
                  aria-hidden="true"
                />

                Add requirement
              </button>
            )}
          </div>
        </header>

        <div className="p-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Active"
              value={
                activeRequirements.length
              }
            />

            <Metric
              label="Required"
              value={requiredCount}
            />

            <Metric
              label="Optional"
              value={optionalCount}
            />

            <Metric
              label="Conditional"
              value={conditionalCount}
            />
          </div>

          {visibleError && (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4"
            >
              <p className="font-black text-red-800">
                Document requirements could not be updated
              </p>

              <p className="mt-1 text-sm font-semibold text-red-700">
                {visibleError}
              </p>
            </div>
          )}

          {loading &&
          !requirements.length ? (
            <div className="mt-5 flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
              <div className="text-center">
                <Loader2
                  size={24}
                  aria-hidden="true"
                  className="mx-auto animate-spin text-indigo-600"
                />

                <p className="mt-3 text-sm font-black text-slate-700">
                  Loading requirements...
                </p>
              </div>
            </div>
          ) : !requirements.length ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <FileCheck2
                size={28}
                aria-hidden="true"
                className="mx-auto text-slate-400"
              />

              <h3 className="mt-4 font-black text-slate-900">
                No document requirements
              </h3>

              <p className="mx-auto mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                Add the documents applicants must provide during this admission cycle.
              </p>

              {canManageDocumentRequirements && (
                <button
                  type="button"
                  onClick={
                    openCreateDialog
                  }
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white transition hover:bg-indigo-500"
                >
                  <FilePlus2
                    size={16}
                    aria-hidden="true"
                  />

                  Add first requirement
                </button>
              )}
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {requirements.map(
                (requirement) => {
                  const archiving =
                    actionState.id ===
                      requirement.id &&
                    actionState.action ===
                      "archive";

                  const deleting =
                    actionState.id ===
                      requirement.id &&
                    actionState.action ===
                      "delete";

                  const inactive =
                    requirement.is_active ===
                    false;

                  return (
                    <article
                      key={requirement.id}
                      className={[
                        "rounded-2xl border p-4 transition",
                        inactive
                          ? "border-slate-200 bg-slate-50 opacity-75"
                          : "border-slate-200 bg-white hover:border-indigo-200",
                      ].join(" ")}
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className={[
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                              inactive
                                ? "bg-slate-200 text-slate-600"
                                : "bg-indigo-100 text-indigo-700",
                            ].join(" ")}
                          >
                            <FileCheck2
                              size={19}
                              aria-hidden="true"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-black text-slate-950">
                                {
                                  requirement.document_label
                                }
                              </h3>

                              <RequirementStatusBadge
                                status={
                                  requirement.requirement_status
                                }
                              />

                              {inactive && (
                                <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                                  Inactive
                                </span>
                              )}
                            </div>

                            <p className="mt-2 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                              {
                                requirement.document_type
                              }
                            </p>

                            {requirement.instructions && (
                              <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-600">
                                {
                                  requirement.instructions
                                }
                              </p>
                            )}

                            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                              <span>
                                Order:{" "}
                                <strong className="text-slate-700">
                                  {
                                    requirement.display_order
                                  }
                                </strong>
                              </span>

                              <span className="inline-flex items-center gap-1.5">
                                {requirement.review_required ? (
                                  <ShieldCheck
                                    size={14}
                                    aria-hidden="true"
                                    className="text-emerald-600"
                                  />
                                ) : (
                                  <CheckCircle2
                                    size={14}
                                    aria-hidden="true"
                                    className="text-slate-500"
                                  />
                                )}

                                {requirement.review_required
                                  ? "Verification required"
                                  : "Upload satisfies requirement"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {canManageDocumentRequirements && (
                          <div className="flex flex-wrap gap-2 xl:justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                openEditDialog(
                                  requirement,
                                )
                              }
                              disabled={mutating}
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 text-xs font-black text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Pencil
                                size={14}
                                aria-hidden="true"
                              />

                              Edit
                            </button>

                            {!inactive && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleArchive(
                                    requirement,
                                  )
                                }
                                disabled={mutating}
                                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-3 text-xs font-black text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {archiving ? (
                                  <Loader2
                                    size={14}
                                    aria-hidden="true"
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Archive
                                    size={14}
                                    aria-hidden="true"
                                  />
                                )}

                                Archive
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  requirement,
                                )
                              }
                              disabled={mutating}
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-xs font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deleting ? (
                                <Loader2
                                  size={14}
                                  aria-hidden="true"
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={14}
                                  aria-hidden="true"
                                />
                              )}

                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </div>
      </section>

      <DocumentRequirementDialog
        open={Boolean(dialogState)}
        mode={
          dialogState?.mode ||
          "create"
        }
        requirement={
          dialogState?.requirement ||
          null
        }
        onClose={closeDialog}
      />
    </>
  );
}


