import {
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,

  Copy,
  Eye,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import {
  useAssessment,
} from "../../context";

import {
  downloadQuestionExportCsv,
  downloadQuestionTemplateCsv,
  readQuestionCsvFile,
} from "../../utils/questionCsv";

import QuestionDialog from "./QuestionDialog";
import QuestionFilters from "./QuestionFilters";
import QuestionOptionManager from "./QuestionOptionManager";
import QuestionPreviewDialog from "./QuestionPreviewDialog";
import QuestionTable from "./QuestionTable";
import QuestionToolbar from "./QuestionToolbar";

const BULK_STATUS_OPTIONS = [
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "review",
    label: "Review",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "paused",
    label: "Paused",
  },
  {
    value: "retired",
    label: "Retired",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

function getErrorMessage(
  error,
  fallback,
) {
  return (
    error?.message ||
    error?.details ||
    error?.hint ||
    fallback
  );
}

export default function QuestionBank() {
  const {
    questions,
    questionResult,
    questionFilters,

    questionsLoading,
    questionsError,

    selectedQuestionId,
    selectedQuestion,
    selectQuestion,

    updateQuestionFilters,
    resetQuestionFilters,
    refreshQuestions,

    createQuestion,
    importQuestions,
    updateQuestion,
    deleteQuestion,


    questionOptions,
    questionMutationLoading,
    questionMutationError,
    clearQuestionMutationError,

    assessmentBanks,
    categories,
    subjects,
    topics,

    currentUserId,
    canAuthorAssessments,
  } = useAssessment();

  const [
    dialogMode,
    setDialogMode,
  ] = useState(null);
  const [
    previewOpen,
    setPreviewOpen,
  ] = useState(false);

  const [
    importingQuestions,
    setImportingQuestions,
  ] = useState(false);

  const [
    importResult,
    setImportResult,
  ] = useState(null);

  const [
    selectedQuestionIds,
    setSelectedQuestionIds,
  ] = useState([]);

  const [
    bulkStatus,
    setBulkStatus,
  ] = useState("active");

  const [
    bulkMutationLoading,
    setBulkMutationLoading,
  ] = useState(false);

  const [
    bulkResult,
    setBulkResult,
  ] = useState(null);

  const selectedQuestionFallback =
    useMemo(
      () =>
        selectedQuestion ||
        questions.find(
          (question) =>
            question.id ===
            selectedQuestionId,
        ) ||
        null,
      [
        selectedQuestion,
        questions,
        selectedQuestionId,
      ],
    );

  const selectedBankName =
    assessmentBanks.find(
      (bank) =>
        bank.id ===
        selectedQuestionFallback?.bank_id,
    )?.name || "";

  const selectedCategoryName =
    categories.find(
      (category) =>
        category.id ===
        selectedQuestionFallback?.category_id,
    )?.name || "";

  const selectedSubjectName =
    subjects.find(
      (subject) =>
        subject.id ===
        selectedQuestionFallback?.subject_id,
    )?.name || "";

  const selectedTopicName =
    topics.find(
      (topic) =>
        topic.id ===
        selectedQuestionFallback?.topic_id,
    )?.name || "";

  function openPreviewDialog() {
    if (!selectedQuestionFallback) {
      return;
    }

    setPreviewOpen(true);
  }

  function closePreviewDialog() {
    setPreviewOpen(false);
  }

  function openDuplicateDialog() {
    if (!selectedQuestionFallback) {
      return;
    }

    clearQuestionMutationError?.();
    setDialogMode("duplicate");
  }

  function toggleQuestionSelection(
    questionId,
  ) {
    if (!questionId) {
      return;
    }

    setSelectedQuestionIds(
      (currentIds) => {
        if (
          currentIds.includes(
            questionId,
          )
        ) {
          return currentIds.filter(
            (currentId) =>
              currentId !==
              questionId,
          );
        }

        return [
          ...currentIds,
          questionId,
        ];
      },
    );

    setBulkResult(null);
  }

  function toggleSelectAllVisible(
    visibleQuestionIds,
  ) {
    const normalizedVisibleIds =
      Array.isArray(
        visibleQuestionIds,
      )
        ? visibleQuestionIds.filter(
            Boolean,
          )
        : [];

    if (
      normalizedVisibleIds.length ===
      0
    ) {
      return;
    }

    setSelectedQuestionIds(
      (currentIds) => {
        const currentIdSet =
          new Set(currentIds);

        const allVisibleSelected =
          normalizedVisibleIds.every(
            (questionId) =>
              currentIdSet.has(
                questionId,
              ),
          );

        if (allVisibleSelected) {
          return currentIds.filter(
            (questionId) =>
              !normalizedVisibleIds.includes(
                questionId,
              ),
          );
        }

        return Array.from(
          new Set([
            ...currentIds,
            ...normalizedVisibleIds,
          ]),
        );
      },
    );

    setBulkResult(null);
  }

  function clearSelectedQuestions() {
    if (bulkMutationLoading) {
      return;
    }

    setSelectedQuestionIds([]);
    setBulkResult(null);
  }

  function openCreateDialog() {
    clearQuestionMutationError?.();
    setDialogMode("create");
  }

  function openEditDialog() {
    if (
      !selectedQuestionFallback
    ) {
      return;
    }

    clearQuestionMutationError?.();
    setDialogMode("edit");
  }

  function closeDialog() {
    if (
      questionMutationLoading
    ) {
      return;
    }

    clearQuestionMutationError?.();
    setDialogMode(null);
  }

  async function handleSave(
    payload,
  ) {
    if (
      dialogMode === "edit"
    ) {
      await updateQuestion(
        selectedQuestionFallback.id,
        {
          ...payload,

          updated_by:
            currentUserId,
        },
      );
    } else {
      const created =
        await createQuestion({
          ...payload,

          owner_id:
            currentUserId,

          created_by:
            currentUserId,

          updated_by:
            currentUserId,
        });

      if (created?.id) {
        selectQuestion(
          created.id,
        );
      }
    }

    setDialogMode(null);
  }

  async function handleImportFile(
    file,
  ) {
    setImportingQuestions(true);
    setImportResult(null);
    clearQuestionMutationError?.();

    try {
      const parsed =
        await readQuestionCsvFile(
          file,
        );

      const parsedQuestions =
        Array.isArray(
          parsed?.questions,
        )
          ? parsed.questions
          : [];

      const validationErrors =
        Array.isArray(
          parsed?.errors,
        )
          ? parsed.errors
          : [];

      if (
        parsedQuestions.length === 0
      ) {
        setImportResult({
          importedCount: 0,

          skippedCount:
            validationErrors.length,

          errors:
            validationErrors.length > 0
              ? validationErrors
              : [
                  {
                    message:
                      "The CSV file did not contain any valid questions.",
                  },
                ],
        });

        return;
      }

      const result =
        await importQuestions(
          parsedQuestions,
          {
            owner_id:
              currentUserId,

            created_by:
              currentUserId,

            updated_by:
              currentUserId,
          },
        );

      const serviceErrors =
        Array.isArray(
          result?.errors,
        )
          ? result.errors
          : [];

      setImportResult({
        importedCount:
          result?.importedCount ??
          result?.imported?.length ??
          0,

        skippedCount:
          (result?.skippedCount ??
            serviceErrors.length) +
          validationErrors.length,

        errors: [
          ...validationErrors,
          ...serviceErrors,
        ],
      });
    } catch (error) {
      setImportResult({
        importedCount: 0,
        skippedCount: 1,

        errors: [
          {
            message:
              getErrorMessage(
                error,
                "Unable to import the CSV file.",
              ),
          },
        ],
      });
    } finally {
      setImportingQuestions(false);
    }
  }

  function handleExportQuestions() {
    downloadQuestionExportCsv(
      questions,
    );
  }

  function handleDownloadTemplate() {
    downloadQuestionTemplateCsv();
  }

  async function runBulkStatusUpdate(
    nextStatus,
  ) {
    const questionIds = [
      ...selectedQuestionIds,
    ];

    if (
      questionIds.length === 0 ||
      !nextStatus ||
      bulkMutationLoading
    ) {
      return;
    }

    setBulkMutationLoading(true);
    setBulkResult(null);
    clearQuestionMutationError?.();

    const succeededIds = [];
    const errors = [];

    try {
      for (
        let index = 0;
        index < questionIds.length;
        index += 1
      ) {
        const questionId =
          questionIds[index];

        try {
          await updateQuestion(
            questionId,
            {
              status:
                nextStatus,

              updated_by:
                currentUserId,
            },
          );

          succeededIds.push(
            questionId,
          );
        } catch (error) {
          errors.push({
            questionId,

            message:
              getErrorMessage(
                error,
                `Unable to update question ${questionId}.`,
              ),
          });
        }
      }

      try {
        await refreshQuestions();
      } catch {
        // Each successful update may already refresh
        // context state. A final refresh failure should
        // not erase the mutation result.
      }

      setSelectedQuestionIds(
        (currentIds) =>
          currentIds.filter(
            (questionId) =>
              !succeededIds.includes(
                questionId,
              ),
          ),
      );

      setBulkResult({
        status:
          nextStatus,

        succeededCount:
          succeededIds.length,

        failedCount:
          errors.length,

        errors,
      });
    } finally {
      setBulkMutationLoading(false);
    }
  }

  async function handleBulkStatusChange() {
    if (
      selectedQuestionIds.length ===
      0
    ) {
      return;
    }

    const statusLabel =
      BULK_STATUS_OPTIONS.find(
        (option) =>
          option.value ===
          bulkStatus,
      )?.label || bulkStatus;

    const confirmed =
      window.confirm(
        `Change ${selectedQuestionIds.length} selected question${
          selectedQuestionIds.length ===
          1
            ? ""
            : "s"
        } to ${statusLabel}?`,
      );

    if (!confirmed) {
      return;
    }

    await runBulkStatusUpdate(
      bulkStatus,
    );
  }

  async function handleBulkDelete() {
    const questionIds = [
      ...selectedQuestionIds,
    ];

    if (
      questionIds.length === 0 ||
      bulkMutationLoading
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Permanently delete ${questionIds.length} selected question${
          questionIds.length === 1
            ? ""
            : "s"
        }? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setBulkMutationLoading(true);
    setBulkResult(null);
    clearQuestionMutationError?.();

    const succeededIds = [];
    const errors = [];

    try {
      for (
        let index = 0;
        index < questionIds.length;
        index += 1
      ) {
        const questionId =
          questionIds[index];

        try {
          await deleteQuestion(
            questionId,
          );

          succeededIds.push(
            questionId,
          );
        } catch (error) {
          errors.push({
            questionId,

            message:
              getErrorMessage(
                error,
                `Unable to delete question ${questionId}.`,
              ),
          });
        }
      }

      try {
        await refreshQuestions();
      } catch {
        // Preserve the completed mutation result
        // even when the final refresh fails.
      }

      if (
        succeededIds.includes(
          selectedQuestionId,
        )
      ) {
        selectQuestion(null);
      }

      setSelectedQuestionIds(
        (currentIds) =>
          currentIds.filter(
            (questionId) =>
              !succeededIds.includes(
                questionId,
              ),
          ),
      );

      setBulkResult({
        action: "delete",
        succeededCount:
          succeededIds.length,
        failedCount:
          errors.length,
        errors,
      });
    } finally {
      setBulkMutationLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
          Authoring
        </p>

        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          Question Bank
        </h2>

        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Search, filter, create, edit, and
          configure reusable assessment
          questions and answer options.
        </p>
      </header>

      <QuestionToolbar
        search={
          questionFilters.search
        }
        loading={questionsLoading}
        canCreate={
          canAuthorAssessments
        }
        onSearchChange={(search) =>
          updateQuestionFilters({
            search,
          })
        }
        onRefresh={() =>
          refreshQuestions()
        }
        onCreate={
          openCreateDialog
        }
        importing={
          importingQuestions
        }
        canExport={
          questions.length > 0
        }
        onImportFile={
          handleImportFile
        }
        onExport={
          handleExportQuestions
        }
        onDownloadTemplate={
          handleDownloadTemplate
        }
      />

      {importResult && (
        <section
          className={
            importResult.errors?.length
              ? "rounded-xl border border-amber-200 bg-amber-50 px-4 py-4"
              : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4"
          }
        >
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Question import results
              </h3>

              <p className="mt-1 text-sm text-slate-700">
                Imported{" "}
                <span className="font-semibold">
                  {
                    importResult.importedCount
                  }
                </span>{" "}
                question
                {importResult.importedCount ===
                1
                  ? ""
                  : "s"}
                . Skipped{" "}
                <span className="font-semibold">
                  {
                    importResult.skippedCount
                  }
                </span>
                .
              </p>
            </div>

            {importResult.errors?.length >
              0 && (
              <div className="max-h-48 overflow-auto rounded-lg border border-amber-200 bg-white p-3">
                <ul className="space-y-1 text-sm text-amber-900">
                  {importResult.errors.map(
                    (
                      error,
                      index,
                    ) => (
                      <li
                        key={`${index}-${error?.row ?? "general"}`}
                      >
                        {error?.row
                          ? `Row ${error.row}: `
                          : ""}
                        {error?.message ||
                          String(error)}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() =>
                  setImportResult(
                    null,
                  )
                }
                className="text-sm font-semibold text-slate-700 hover:text-slate-950"
              >
                Dismiss
              </button>
            </div>
          </div>
        </section>
      )}

      {canAuthorAssessments &&
        selectedQuestionIds.length >
          0 && (
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-950">
                  {
                    selectedQuestionIds.length
                  }{" "}
                  question
                  {selectedQuestionIds.length ===
                  1
                    ? ""
                    : "s"}{" "}
                  selected
                </p>

                <p className="mt-1 text-xs text-blue-700">
                  Selection is preserved while
                  moving between result pages.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={bulkStatus}
                  disabled={
                    bulkMutationLoading
                  }
                  onChange={(event) =>
                    setBulkStatus(
                      event.target.value,
                    )
                  }
                  aria-label="Bulk question status"
                  className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {BULK_STATUS_OPTIONS.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    ),
                  )}
                </select>

                <button
                  type="button"
                  disabled={
                    bulkMutationLoading
                  }
                  onClick={
                    handleBulkStatusChange
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bulkMutationLoading ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle2
                      size={16}
                    />
                  )}

                  Change status
                </button>

                <button
                  type="button"
                  disabled={
                    bulkMutationLoading
                  }
                  onClick={
                    handleBulkDelete
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  Delete
                </button>

                <button
                  type="button"
                  disabled={
                    bulkMutationLoading
                  }
                  onClick={
                    clearSelectedQuestions
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X size={16} />
                  Clear
                </button>
              </div>
            </div>
          </section>
        )}

      {bulkResult && (
        <section
          className={
            bulkResult.failedCount > 0
              ? "rounded-xl border border-amber-200 bg-amber-50 px-4 py-4"
              : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4"
          }
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Bulk action results
              </h3>

              <p className="mt-1 text-sm text-slate-700">
                Updated{" "}
                <span className="font-semibold">
                  {
                    bulkResult.succeededCount
                  }
                </span>{" "}
                question
                {bulkResult.succeededCount ===
                1
                  ? ""
                  : "s"}
                .

                {bulkResult.failedCount >
                  0 && (
                  <>
                    {" "}
                    Failed{" "}
                    <span className="font-semibold">
                      {
                        bulkResult.failedCount
                      }
                    </span>
                    .
                  </>
                )}
              </p>
            </div>

            <button
              type="button"
              aria-label="Dismiss bulk action results"
              onClick={() =>
                setBulkResult(null)
              }
              className="rounded-lg p-1 text-slate-500 transition hover:bg-white hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </div>

          {bulkResult.errors?.length >
            0 && (
            <div className="mt-3 max-h-48 overflow-auto rounded-lg border border-amber-200 bg-white p-3">
              <ul className="space-y-1 text-sm text-amber-900">
                {bulkResult.errors.map(
                  (
                    error,
                    index,
                  ) => (
                    <li
                      key={`${error.questionId}-${index}`}
                    >
                      {error.message}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </section>
      )}

      {(selectedQuestionIds.length >
        0 ||
        (canAuthorAssessments &&
          selectedQuestionFallback)) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {selectedQuestionIds.length >
            0 ? (
            <p className="text-sm font-medium text-slate-600">
              Use the bulk action bar above
              to update the checked rows.
            </p>
          ) : (
            <div />
          )}

          {canAuthorAssessments &&
            selectedQuestionFallback && (
              <>
                <button
                  type="button"
                  onClick={
                    openPreviewDialog
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Eye size={16} />
                  Preview
                </button>

                <button
                  type="button"
                  onClick={
                    openDuplicateDialog
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                >
                  <Copy size={16} />
                  Duplicate
                </button>

                <button
                  type="button"
                  onClick={
                    openEditDialog
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  <Pencil size={16} />
                  Edit selected question
                </button>
              </>
            )}
        </div>
      )}

      <QuestionFilters
        filters={questionFilters}
        banks={assessmentBanks}
        categories={categories}
        subjects={subjects}
        topics={topics}
        onChange={
          updateQuestionFilters
        }
        onReset={
          resetQuestionFilters
        }
      />

      {questionsError && (
        <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">
            {questionsError}
          </p>
        </section>
      )}

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <QuestionTable
          questions={questions}
          result={questionResult}
          loading={questionsLoading}
          selectedQuestionId={
            selectedQuestionId
          }
          selectedQuestionIds={
            selectedQuestionIds
          }
          onSelect={
            selectQuestion
          }
          onToggleSelection={
            toggleQuestionSelection
          }
          onToggleSelectAll={
            toggleSelectAllVisible
          }
          onPageChange={(page) =>
            updateQuestionFilters({
              page,
            })
          }
        />

        <QuestionOptionManager />
      </div>
      <QuestionPreviewDialog
        open={previewOpen}
        question={
          selectedQuestionFallback
        }
        options={
          questionOptions || []
        }
        bankName={
          selectedBankName
        }
        categoryName={
          selectedCategoryName
        }
        subjectName={
          selectedSubjectName
        }
        topicName={
          selectedTopicName
        }
        onClose={
          closePreviewDialog
        }
      />

      <QuestionDialog
        open={Boolean(dialogMode)}
        mode={
          dialogMode ||
          "create"
        }
        question={
          dialogMode === "edit" ||
          dialogMode === "duplicate"
            ? selectedQuestionFallback
            : null
        }
        banks={assessmentBanks}
        categories={categories}
        subjects={subjects}
        topics={topics}
        loading={
          questionMutationLoading
        }
        error={
          questionMutationError
        }
        onClose={closeDialog}
        onSubmit={handleSave}
      />
    </div>
  );
}



