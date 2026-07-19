import {
  FileQuestion,
  Plus,
  RefreshCw,
  Trash2,
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

export default function TemplateQuestionPanel({
  template = null,
  section = null,
  questions = [],
  loading = false,
  mutationLoading = false,
  error = "",
  mutationError = "",
  canEdit = false,
  onAdd,
  onDelete,
  onRefresh,
}) {
  if (!template) {
    return null;
  }

  const orderedQuestions = [
    ...questions,
  ].sort(
    (left, right) =>
      Number(
        left.display_order ?? 0,
      ) -
      Number(
        right.display_order ?? 0,
      ),
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            Assessment composition
          </p>

          <h3 className="mt-1 text-xl font-semibold text-slate-950">
            Section Questions
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            {section
              ? `${section.title} · ${orderedQuestions.length} question${
                  orderedQuestions.length === 1
                    ? ""
                    : "s"
                }`
              : "Select a section to manage its questions."}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={
              loading ||
              mutationLoading ||
              !section
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={onAdd}
              disabled={
                mutationLoading ||
                !section
              }
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={16} />
              Add questions
            </button>
          )}
        </div>
      </header>

      {(error || mutationError) && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {mutationError || error}
        </div>
      )}

      {!section ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <FileQuestion
            size={30}
            className="mx-auto text-slate-400"
          />

          <h4 className="mt-3 font-semibold text-slate-900">
            Select a section
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            Choose a section above before adding questions.
          </p>
        </div>
      ) : loading &&
        !orderedQuestions.length ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Loading section questions...
        </div>
      ) : orderedQuestions.length ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Order
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Question
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Marks
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  {canEdit && (
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {orderedQuestions.map(
                  (
                    templateQuestion,
                    index,
                  ) => {
                    const question =
                      templateQuestion.question ||
                      {};

                    const marks =
                      templateQuestion.marks_override ??
                      question.default_marks ??
                      0;

                    return (
                      <tr
                        key={
                          templateQuestion.id
                        }
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-600">
                          {Number(
                            templateQuestion.display_order ??
                              index,
                          ) + 1}
                        </td>

                        <td className="min-w-[280px] px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                            {question.question_number ||
                              "Question"}
                          </p>

                          <p className="mt-1 font-semibold text-slate-950">
                            {question.title ||
                              question.prompt ||
                              "Untitled question"}
                          </p>

                          {question.title &&
                            question.prompt && (
                              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                {question.prompt}
                              </p>
                            )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {formatLabel(
                            question.question_type,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-800">
                          {Number(marks)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              ["approved", "active"].includes(
                                String(
                                  question.status ||
                                    "",
                                ).toLowerCase(),
                              )
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {formatLabel(
                              question.status,
                            )}
                          </span>
                        </td>

                        {canEdit && (
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                onDelete?.(
                                  templateQuestion,
                                )
                              }
                              disabled={
                                mutationLoading
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2
                                size={15}
                              />
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <FileQuestion
            size={30}
            className="mx-auto text-slate-400"
          />

          <h4 className="mt-3 font-semibold text-slate-900">
            No questions attached
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            Add approved or active questions from the Question Bank.
          </p>
        </div>
      )}
    </section>
  );
}
