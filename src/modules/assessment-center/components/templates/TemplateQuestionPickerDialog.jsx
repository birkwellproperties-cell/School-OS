import {
  Check,
  Loader2,
  Search,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

function resolveText(question = {}) {
  return (
    question.question_text ||
    question.prompt ||
    question.stem ||
    question.title ||
    "Untitled question"
  );
}

function resolveType(question = {}) {
  return (
    question.question_type ||
    question.type ||
    "Question"
  );
}

function resolveDifficulty(
  question = {},
) {
  return (
    question.difficulty_level ||
    question.difficulty ||
    "Not set"
  );
}

function formatLabel(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

export default function TemplateQuestionPickerDialog({
  open = false,
  questions = [],
  assignedQuestionIds = [],
  loading = false,
  submitting = false,
  error = "",
  onClose,
  onRefresh,
  onSubmit,
}) {
  const [search, setSearch] =
    useState("");

  const [
    selectedIds,
    setSelectedIds,
  ] = useState([]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedIds([]);
    }
  }, [open]);

  const assignedSet = useMemo(
    () =>
      new Set(
        assignedQuestionIds.filter(
          Boolean,
        ),
      ),
    [assignedQuestionIds],
  );

  const availableQuestions =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return questions
        .filter(
          (question) =>
            !assignedSet.has(
              question.id,
            ),
        )
        .filter((question) => {
          if (!normalizedSearch) {
            return true;
          }

          const searchable = [
            resolveText(question),
            resolveType(question),
            resolveDifficulty(
              question,
            ),
            question.question_number,
            question.code,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            normalizedSearch,
          );
        });
    }, [
      questions,
      assignedSet,
      search,
    ]);

  function toggleQuestion(
    questionId,
  ) {
    setSelectedIds((current) =>
      current.includes(questionId)
        ? current.filter(
            (id) =>
              id !== questionId,
          )
        : [
            ...current,
            questionId,
          ],
    );
  }

  async function handleSubmit() {
    if (!selectedIds.length) {
      return;
    }

    await onSubmit?.(
      selectedIds,
    );
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-question-picker-title"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
              Question Bank
            </p>

            <h3
              id="template-question-picker-title"
              className="mt-1 text-xl font-semibold text-slate-950"
            >
              Add questions to section
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              Select one or more available
              questions.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </header>

        <div className="border-b border-slate-200 p-4 sm:px-6">
          <label className="relative block">
            <span className="sr-only">
              Search Question Bank
            </span>

            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search by question, type, difficulty, or number"
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex min-h-60 items-center justify-center">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Loading Question Bank…
              </div>
            </div>
          ) : availableQuestions.length ? (
            <div className="space-y-3">
              {availableQuestions.map(
                (question) => {
                  const selected =
                    selectedIds.includes(
                      question.id,
                    );

                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() =>
                        toggleQuestion(
                          question.id,
                        )
                      }
                      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          selected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {selected && (
                          <Check
                            size={14}
                          />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-3 block text-sm font-semibold leading-6 text-slate-950">
                          {resolveText(
                            question,
                          )}
                        </span>

                        <span className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {formatLabel(
                              resolveType(
                                question,
                              ),
                            )}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {formatLabel(
                              resolveDifficulty(
                                question,
                              ),
                            )}
                          </span>

                          {question.question_number && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {
                                question.question_number
                              }
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="font-semibold text-slate-900">
                No available questions
              </p>

              <p className="mt-2 text-sm text-slate-600">
                All matching questions may
                already be assigned, or the
                current search returned no
                results.
              </p>

              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="mt-4 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  Refresh Question Bank
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {error}
            </div>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm font-medium text-slate-600">
            {selectedIds.length} selected
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                submitting ||
                !selectedIds.length
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              Add selected
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}