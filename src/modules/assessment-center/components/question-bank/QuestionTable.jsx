import {
  useEffect,
  useRef,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import QuestionStatusBadge from "./QuestionStatusBadge";

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

function getQuestionTitle(question) {
  return (
    question.title ||
    question.prompt ||
    "Untitled question"
  );
}

function SelectionCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  ariaLabel,
  onChange,
}) {
  const checkboxRef =
    useRef(null);

  useEffect(() => {
    if (!checkboxRef.current) {
      return;
    }

    checkboxRef.current.indeterminate =
      Boolean(indeterminate);
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={onChange}
      onClick={(event) =>
        event.stopPropagation()
      }
      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

export default function QuestionTable({
  questions,
  result,
  loading,
  selectedQuestionId,
  selectedQuestionIds = [],
  onSelect,
  onToggleSelection,
  onToggleSelectAll,
  onPageChange,
}) {
  const selectedIdSet =
    new Set(selectedQuestionIds);

  const visibleQuestionIds =
    questions
      .map((question) =>
        question?.id,
      )
      .filter(Boolean);

  const selectedVisibleCount =
    visibleQuestionIds.filter(
      (questionId) =>
        selectedIdSet.has(
          questionId,
        ),
    ).length;

  const allVisibleSelected =
    visibleQuestionIds.length > 0 &&
    selectedVisibleCount ===
      visibleQuestionIds.length;

  const someVisibleSelected =
    selectedVisibleCount > 0 &&
    !allVisibleSelected;

  if (
    loading &&
    questions.length === 0
  ) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="mt-3 text-sm font-medium text-slate-600">
            Loading questions…
          </p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <h3 className="text-lg font-semibold text-slate-900">
          No questions found
        </h3>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
          Adjust the current filters or create
          the first question in this workspace.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-12 px-5 py-3 text-left">
                <SelectionCheckbox
                  checked={
                    allVisibleSelected
                  }
                  indeterminate={
                    someVisibleSelected
                  }
                  disabled={
                    loading ||
                    visibleQuestionIds.length ===
                      0
                  }
                  ariaLabel="Select all visible questions"
                  onChange={() =>
                    onToggleSelectAll?.(
                      visibleQuestionIds,
                    )
                  }
                />
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Question
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Difficulty
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Marks
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {questions.map(
              (question) => {
                const activeRow =
                  selectedQuestionId ===
                  question.id;

                const bulkSelected =
                  selectedIdSet.has(
                    question.id,
                  );

                return (
                  <tr
                    key={question.id}
                    onClick={() =>
                      onSelect?.(
                        question.id,
                      )
                    }
                    className={`cursor-pointer transition ${
                      activeRow
                        ? "bg-blue-50"
                        : bulkSelected
                          ? "bg-slate-50"
                          : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="w-12 px-5 py-4">
                      <SelectionCheckbox
                        checked={
                          bulkSelected
                        }
                        disabled={loading}
                        ariaLabel={`Select ${getQuestionTitle(
                          question,
                        )}`}
                        onChange={() =>
                          onToggleSelection?.(
                            question.id,
                          )
                        }
                      />
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-xl truncate text-sm font-semibold text-slate-900">
                        {getQuestionTitle(
                          question,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {question.question_number ||
                          "Number pending"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {formatLabel(
                        question.question_type,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {formatLabel(
                        question.difficulty,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                      {question.default_marks ??
                        "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <QuestionStatusBadge
                        status={
                          question.status
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
        <div>
          <p className="text-sm text-slate-600">
            {result.total || 0} question
            {(result.total || 0) === 1
              ? ""
              : "s"}
          </p>

          {selectedQuestionIds.length >
            0 && (
            <p className="mt-1 text-xs font-semibold text-blue-700">
              {
                selectedQuestionIds.length
              }{" "}
              selected
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={
              loading ||
              result.page <= 1
            }
            onClick={() =>
              onPageChange?.(
                result.page - 1,
              )
            }
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <span className="px-2 text-sm font-medium text-slate-600">
            Page {result.page || 1} of{" "}
            {Math.max(
              result.totalPages || 1,
              1,
            )}
          </span>

          <button
            type="button"
            disabled={
              loading ||
              result.page >=
                Math.max(
                  result.totalPages ||
                    1,
                  1,
                )
            }
            onClick={() =>
              onPageChange?.(
                result.page + 1,
              )
            }
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    </section>
  );
}
