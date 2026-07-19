import {
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  WandSparkles,
} from "lucide-react";

import {
  useAssessment,
} from "../../context";

import QuestionOptionDialog from "./QuestionOptionDialog";

const OPTION_SUPPORTED_TYPES =
  new Set([
    "multiple_choice",
    "multiple_response",
    "true_false",
    "matching",
    "ordering",
  ]);

function getSuggestedKey(
  optionCount,
) {
  if (
    optionCount >= 0 &&
    optionCount < 26
  ) {
    return String.fromCharCode(
      65 + optionCount,
    );
  }

  return `OPTION_${optionCount + 1}`;
}

export default function QuestionOptionManager() {
  const {
    selectedQuestion,
    selectedQuestionId,

    questionOptions,
    questionOptionsLoading,
    questionOptionsError,

    questionOptionMutationLoading,
    questionOptionMutationError,

    selectedQuestionOptionId,
    selectedQuestionOption,
    selectQuestionOption,

    refreshQuestionOptions,

    createQuestionOption,
    updateQuestionOption,
    deleteQuestionOption,

    clearQuestionOptionMutationError,

    currentUserId,
    canAuthorAssessments,
  } = useAssessment();

  const [
    dialogMode,
    setDialogMode,
  ] = useState(null);

  const supportsOptions =
    OPTION_SUPPORTED_TYPES.has(
      selectedQuestion
        ?.question_type,
    );

  const sortedOptions =
    useMemo(
      () =>
        [...questionOptions].sort(
          (
            first,
            second,
          ) =>
            (
              first.display_order ??
              0
            ) -
            (
              second.display_order ??
              0
            ),
        ),
      [
        questionOptions,
      ],
    );

  function openCreateDialog() {
    clearQuestionOptionMutationError?.();
    setDialogMode("create");
  }

  function openEditDialog() {
    if (
      !selectedQuestionOption
    ) {
      return;
    }

    clearQuestionOptionMutationError?.();
    setDialogMode("edit");
  }

  function closeDialog() {
    if (
      questionOptionMutationLoading
    ) {
      return;
    }

    clearQuestionOptionMutationError?.();
    setDialogMode(null);
  }

  async function handleSubmit(
    payload,
  ) {
    if (
      dialogMode === "edit"
    ) {
      await updateQuestionOption(
        selectedQuestionOption.id,
        {
          ...payload,

          updated_by:
            currentUserId,
        },
      );
    } else {
      const created =
        await createQuestionOption({
          ...payload,

          question_id:
            selectedQuestionId,

          created_by:
            currentUserId,

          updated_by:
            currentUserId,
        });

      if (created?.id) {
        selectQuestionOption(
          created.id,
        );
      }
    }

    setDialogMode(null);
  }

  async function handleDelete() {
    if (
      !selectedQuestionOption
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete option "${selectedQuestionOption.option_key}"?`,
      );

    if (!confirmed) {
      return;
    }

    await deleteQuestionOption(
      selectedQuestionOption.id,
      currentUserId,
    );
  }

  async function createTrueFalseOptions() {
    if (
      !selectedQuestionId ||
      questionOptions.length > 0
    ) {
      return;
    }

    await createQuestionOption({
      question_id:
        selectedQuestionId,

      option_key: "TRUE",
      option_text: "True",
      option_format:
        "plain_text",

      display_order: 0,
      is_correct: true,
      score_fraction: 1,

      response_value:
        "true",

      created_by:
        currentUserId,

      updated_by:
        currentUserId,
    });

    await createQuestionOption({
      question_id:
        selectedQuestionId,

      option_key: "FALSE",
      option_text: "False",
      option_format:
        "plain_text",

      display_order: 1,
      is_correct: false,
      score_fraction: 0,

      response_value:
        "false",

      created_by:
        currentUserId,

      updated_by:
        currentUserId,
    });

    await refreshQuestionOptions({
      questionId:
        selectedQuestionId,
    });
  }

  if (!selectedQuestionId) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900">
          Select a question
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Select a question from the table to
          manage its answer options.
        </p>
      </section>
    );
  }

  if (!supportsOptions) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Options are not required
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          The selected{" "}
          {selectedQuestion
            ?.question_type
            ?.replaceAll(
              "_",
              " ",
            ) ||
            "question"}{" "}
          type uses answer configuration or
          manual response grading rather than
          selectable options.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">
            Question Builder
          </p>

          <h3 className="mt-1 text-xl font-semibold text-slate-950">
            Answer Options
          </h3>

          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
            Configure selectable, matchable,
            or orderable responses for the
            selected question.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              refreshQuestionOptions({
                questionId:
                  selectedQuestionId,
              })
            }
            disabled={
              questionOptionsLoading
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                questionOptionsLoading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          {canAuthorAssessments &&
            selectedQuestion
              ?.question_type ===
              "true_false" &&
            questionOptions.length ===
              0 && (
            <button
              type="button"
              onClick={
                createTrueFalseOptions
              }
              disabled={
                questionOptionMutationLoading
              }
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
            >
              <WandSparkles
                size={16}
              />

              Create True/False
            </button>
          )}

          {canAuthorAssessments && (
            <button
              type="button"
              onClick={
                openCreateDialog
              }
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={16} />
              Add option
            </button>
          )}
        </div>
      </header>

      {questionOptionsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {questionOptionsError}
        </div>
      )}

      {questionOptionMutationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {questionOptionMutationError}
        </div>
      )}

      {canAuthorAssessments &&
        selectedQuestionOption && (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={openEditDialog}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <Pencil size={16} />
            Edit selected
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={
              questionOptionMutationLoading
            }
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
          >
            <Trash2 size={16} />
            Delete selected
          </button>
        </div>
      )}

      {questionOptionsLoading &&
      sortedOptions.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        </div>
      ) : sortedOptions.length ===
        0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
          <h4 className="font-semibold text-slate-900">
            No answer options
          </h4>

          <p className="mt-2 text-sm text-slate-600">
            Add the first option for this
            question.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedOptions.map(
            (option) => {
              const selected =
                option.id ===
                selectedQuestionOptionId;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    selectQuestionOption(
                      option.id,
                    )
                  }
                  className={`flex w-full items-start gap-4 rounded-xl border px-4 py-4 text-left transition ${
                    selected
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                    {option.option_key}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium leading-6 text-slate-900">
                      {option.option_text}
                    </span>

                    <span className="mt-1 block text-xs text-slate-500">
                      Order{" "}
                      {option.display_order} ·
                      Score{" "}
                      {option.score_fraction}
                    </span>

                    {option.feedback && (
                      <span className="mt-2 block text-xs leading-5 text-slate-600">
                        {option.feedback}
                      </span>
                    )}
                  </span>

                  {option.is_correct && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2
                        size={14}
                      />
                      Correct
                    </span>
                  )}
                </button>
              );
            },
          )}
        </div>
      )}

      <QuestionOptionDialog
        open={Boolean(dialogMode)}
        mode={
          dialogMode ||
          "create"
        }
        option={
          dialogMode === "edit"
            ? selectedQuestionOption
            : null
        }
        suggestedOrder={
          questionOptions.length
        }
        loading={
          questionOptionMutationLoading
        }
        error={
          questionOptionMutationError
        }
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />
    </section>
  );
}