import {
  useState,
} from "react";

import {
  Archive,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  useAssessment,
} from "../../context";

import AssessmentBankDialog from "./AssessmentBankDialog";
import AssessmentBankStatusBadge from "./AssessmentBankStatusBadge";

function formatLabel(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

export default function AssessmentBankManager() {
  const {
    assessmentBanks,
    assessmentBanksResult,
    assessmentBankFilters,

    assessmentBanksLoading,
    assessmentBanksError,

    assessmentBankMutationLoading,
    assessmentBankMutationError,

    selectedAssessmentBankId,
    selectedAssessmentBank,
    selectAssessmentBank,

    updateAssessmentBankFilters,
    resetAssessmentBankFilters,

    refreshAssessmentBanks,

    createAssessmentBank,
    updateAssessmentBank,

    clearAssessmentBankMutationError,

    currentUserId,

    canAuthorAssessments,
  } = useAssessment();

  const [
    dialogMode,
    setDialogMode,
  ] = useState(null);

  function openCreateDialog() {
    clearAssessmentBankMutationError?.();
    setDialogMode("create");
  }

  function openEditDialog() {
    if (!selectedAssessmentBank) {
      return;
    }

    clearAssessmentBankMutationError?.();
    setDialogMode("edit");
  }

  function closeDialog() {
    if (
      assessmentBankMutationLoading
    ) {
      return;
    }

    clearAssessmentBankMutationError?.();
    setDialogMode(null);
  }

  async function handleSubmit(
    payload,
  ) {
    if (
      dialogMode === "edit"
    ) {
      await updateAssessmentBank(
        selectedAssessmentBank.id,
        {
          ...payload,

          updated_by:
            currentUserId,
        },
      );
    } else {
      const created =
        await createAssessmentBank({
          ...payload,

          owner_id:
            currentUserId,

          created_by:
            currentUserId,

          updated_by:
            currentUserId,
        });

      if (created?.id) {
        selectAssessmentBank(
          created.id,
        );
      }
    }

    setDialogMode(null);
  }

  async function handleArchive() {
    if (
      !selectedAssessmentBank
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Archive "${selectedAssessmentBank.name}"? Existing questions will remain associated with the bank.`,
      );

    if (!confirmed) {
      return;
    }

    await updateAssessmentBank(
      selectedAssessmentBank.id,
      {
        status: "archived",
        archived_at: new Date().toISOString(),
        archived_by: currentUserId,
        updated_by: currentUserId,
      },
    );
  }

  const page =
    assessmentBanksResult
      .page ||
    1;

  const totalPages =
    Math.max(
      assessmentBanksResult
        .totalPages ||
        1,
      1,
    );

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
          Assessment Configuration
        </p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          Assessment Banks
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Create and manage governed libraries
          used to organize reusable assessment
          questions.
        </p>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xl">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={
              assessmentBankFilters
                .search
            }
            onChange={(event) =>
              updateAssessmentBankFilters({
                search:
                  event.target.value,
              })
            }
            placeholder="Search bank name, code, or description"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={
              assessmentBankFilters
                .status
            }
            onChange={(event) =>
              updateAssessmentBankFilters({
                status:
                  event.target.value,
              })
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none"
          >
            <option value="">
              All statuses
            </option>

            <option value="draft">
              Draft
            </option>

            <option value="active">
              Active
            </option>

            <option value="archived">
              Archived
            </option>
          </select>

          <button
            type="button"
            onClick={() =>
              refreshAssessmentBanks()
            }
            disabled={
              assessmentBanksLoading
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                assessmentBanksLoading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          {canAuthorAssessments && (
            <button
              type="button"
              onClick={
                openCreateDialog
              }
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={17} />
              New bank
            </button>
          )}
        </div>
      </div>

      {canAuthorAssessments &&
        selectedAssessmentBank && (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={openEditDialog}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <Pencil size={16} />
            Edit selected
          </button>

          {selectedAssessmentBank.status !==
            "archived" && (
            <button
              type="button"
              onClick={handleArchive}
              disabled={
                assessmentBankMutationLoading
              }
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
            >
              <Archive size={16} />
              Archive selected
            </button>
          )}
        </div>
      )}

      {assessmentBanksError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {assessmentBanksError}
        </div>
      )}

      {assessmentBankMutationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {assessmentBankMutationError}
        </div>
      )}

      {assessmentBanksLoading &&
      assessmentBanks.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        </div>
      ) : assessmentBanks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h3 className="text-lg font-semibold text-slate-950">
            No assessment banks yet
          </h3>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
            Create the first assessment bank
            before authoring questions.
          </p>

          {canAuthorAssessments && (
            <button
              type="button"
              onClick={
                openCreateDialog
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={17} />
              Create first bank
            </button>
          )}
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bank
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Visibility
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {assessmentBanks.map(
                  (bank) => {
                    const selected =
                      bank.id ===
                      selectedAssessmentBankId;

                    return (
                      <tr
                        key={bank.id}
                        onClick={() =>
                          selectAssessmentBank(
                            bank.id,
                          )
                        }
                        className={`cursor-pointer transition ${
                          selected
                            ? "bg-blue-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-950">
                            {bank.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {bank.code}
                          </p>

                          {bank.description && (
                            <p className="mt-2 max-w-xl truncate text-sm text-slate-600">
                              {bank.description}
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                          {formatLabel(
                            bank.bank_type,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                          {formatLabel(
                            bank.visibility,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <AssessmentBankStatusBadge
                            status={
                              bank.status
                            }
                          />
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              {assessmentBanksResult.total ||
                0}{" "}
              assessment bank
              {(assessmentBanksResult.total ||
                0) === 1
                ? ""
                : "s"}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={
                  page <= 1 ||
                  assessmentBanksLoading
                }
                onClick={() =>
                  updateAssessmentBankFilters({
                    page:
                      page - 1,
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm font-medium text-slate-600">
                Page {page} of{" "}
                {totalPages}
              </span>

              <button
                type="button"
                disabled={
                  page >=
                    totalPages ||
                  assessmentBanksLoading
                }
                onClick={() =>
                  updateAssessmentBankFilters({
                    page:
                      page + 1,
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </footer>
        </section>
      )}

      <AssessmentBankDialog
        open={Boolean(dialogMode)}
        mode={
          dialogMode ||
          "create"
        }
        bank={
          dialogMode === "edit"
            ? selectedAssessmentBank
            : null
        }
        loading={
          assessmentBankMutationLoading
        }
        error={
          assessmentBankMutationError
        }
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
