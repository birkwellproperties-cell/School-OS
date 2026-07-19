import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  Search,
  X,
} from "lucide-react";

function formatLabel(value) {
  if (!value) {
    return "Not configured";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

export default function TemplateQuestionDialog({
  open = false,
  section = null,
  questions = [],
  attachedQuestionIds = [],
  loading = false,
  error = "",
  onClose,
  onSubmit,
}) {
  const [
    search,
    setSearch,
  ] = useState("");

  const [
    selectedIds,
    setSelectedIds,
  ] = useState([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSearch("");
    setSelectedIds([]);
  }, [open, section?.id]);

  const attachedSet =
    useMemo(
      () =>
        new Set(
          attachedQuestionIds,
        ),
      [attachedQuestionIds],
    );

  const availableQuestions =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return questions
        .filter(
          (question) =>
            !attachedSet.has(
              question.id,
            ),
        )
        .filter((question) => {
          const status =
            String(
              question.status || "",
            )
              .trim()
              .toLowerCase();

          return (
            status === "approved" ||
            status === "active"
          );
        })
        .filter((question) => {
          if (!normalizedSearch) {
            return true;
          }

          const searchable = [
            question.question_number,
            question.title,
            question.prompt,
            question.question_type,
            question.difficulty,
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
      attachedSet,
      search,
    ]);

  if (!open) {
    return null;
  }

  function toggleQuestion(
    questionId,
  ) {
    setSelectedIds(
      (currentIds) =>
        currentIds.includes(
          questionId,
        )
          ? currentIds.filter(
              (id) =>
                id !== questionId,
            )
          : [
              ...currentIds,
              questionId,
            ],
    );
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (
      !section ||
      selectedIds.length === 0
    ) {
      return;
    }

    await onSubmit?.(
      selectedIds,
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Question bank
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              Add questions
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {section
                ? `Add approved or active questions to "${section.title}".`
                : "Select a section before adding questions."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="border-b border-slate-200 p-4">
            <label className="relative block">
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
                placeholder="Search by number, title, prompt, type, or difficulty"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {error && (
            <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {error}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {availableQuestions.length ? (
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
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                              selected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 bg-white text-transparent"
                            }`}
                          >
                            <Check size={14} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                                {question.question_number ||
                                  "Question"}
                              </span>

                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                {formatLabel(
                                  question.question_type,
                                )}
                              </span>

                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                {formatLabel(
                                  question.status,
                                )}
                              </span>
                            </div>

                            <p className="mt-2 font-semibold text-slate-950">
                              {question.title ||
                                question.prompt ||
                                "Untitled question"}
                            </p>

                            {question.title &&
                              question.prompt && (
                                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                                  {question.prompt}
                                </p>
                              )}

                            <p className="mt-2 text-xs text-slate-500">
                              {formatLabel(
                                question.difficulty,
                              )}{" "}
                              ·{" "}
                              {Number(
                                question.default_marks ??
                                  0,
                              )}{" "}
                              mark
                              {Number(
                                question.default_marks ??
                                  0,
                              ) === 1
                                ? ""
                                : "s"}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <p className="font-semibold text-slate-900">
                  No available approved questions
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Approve or activate questions in the Question Bank, or change your search.
                </p>
              </div>
            )}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              {selectedIds.length} question
              {selectedIds.length === 1
                ? ""
                : "s"}{" "}
              selected
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  loading ||
                  !section ||
                  selectedIds.length === 0
                }
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Adding..."
                  : `Add ${selectedIds.length || ""} question${
                      selectedIds.length === 1
                        ? ""
                        : "s"
                    }`}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
