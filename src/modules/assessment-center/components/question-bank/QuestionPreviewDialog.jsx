import {
  Eye,
  X,
} from "lucide-react";

function formatLabel(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function MetadataItem({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value || "Not specified"}
      </p>
    </div>
  );
}

export default function QuestionPreviewDialog({
  open,
  question,
  options = [],
  bankName = "",
  categoryName = "",
  subjectName = "",
  topicName = "",
  onClose,
}) {
  if (
    !open ||
    !question
  ) {
    return null;
  }

  const visibleOptions =
    Array.isArray(options)
      ? options.filter(
          (option) =>
            !option.question_id ||
            option.question_id ===
              question.id,
        )
      : [];

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-preview-title"
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              <Eye size={16} />
              Student Preview
            </p>

            <h2
              id="question-preview-title"
              className="mt-2 text-2xl font-semibold text-slate-950"
            >
              {question.title ||
                "Question preview"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Preview the question content and
              scoring configuration.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close question preview"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={21} />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {question.instructions && (
            <section className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Instructions
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-950">
                {question.instructions}
              </p>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Question
                </p>

                <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-slate-950">
                  {question.prompt}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
                {question.default_marks ?? 0}{" "}
                mark
                {Number(
                  question.default_marks ?? 0,
                ) === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            {visibleOptions.length > 0 && (
              <div className="mt-6 space-y-3">
                {visibleOptions.map(
                  (
                    option,
                    index,
                  ) => (
                    <div
                      key={
                        option.id ||
                        `${question.id}-${index}`
                      }
                      className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                        {String.fromCharCode(
                          65 + index,
                        )}
                      </span>

                      <p className="min-w-0 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                        {option.option_text ||
                          option.text ||
                          option.label ||
                          option.value ||
                          "Option"}
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}

            {visibleOptions.length === 0 &&
              [
                "multiple_choice",
                "multiple_response",
                "true_false",
                "matching",
                "ordering",
              ].includes(
                question.question_type,
              ) && (
                <div className="mt-6 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center">
                  <p className="text-sm text-slate-600">
                    No answer options are currently
                    available for this question.
                  </p>
                </div>
              )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetadataItem
              label="Type"
              value={formatLabel(
                question.question_type,
              )}
            />

            <MetadataItem
              label="Difficulty"
              value={formatLabel(
                question.difficulty,
              )}
            />

            <MetadataItem
              label="Status"
              value={formatLabel(
                question.status,
              )}
            />

            <MetadataItem
              label="Negative marks"
              value={
                question.negative_marks ??
                0
              }
            />

            <MetadataItem
              label="Bank"
              value={bankName}
            />

            <MetadataItem
              label="Category"
              value={categoryName}
            />

            <MetadataItem
              label="Subject"
              value={subjectName}
            />

            <MetadataItem
              label="Topic"
              value={topicName}
            />
          </section>

          {question.learning_outcome && (
            <section className="rounded-2xl border border-slate-200 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Learning outcome
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {question.learning_outcome}
              </p>
            </section>
          )}

          {question.explanation && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Author explanation
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-emerald-950">
                {question.explanation}
              </p>
            </section>
          )}
        </div>

        <footer className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Close preview
          </button>
        </footer>
      </section>
    </div>
  );
}
