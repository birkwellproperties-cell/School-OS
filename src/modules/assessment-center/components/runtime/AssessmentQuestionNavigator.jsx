import {
  Check,
  Circle,
  Flag,
} from "lucide-react";

function getQuestionState({
  index,
  currentIndex,
  answered,
  flagged,
}) {
  if (
    index === currentIndex
  ) {
    return "current";
  }

  if (
    flagged
  ) {
    return "flagged";
  }

  if (
    answered
  ) {
    return "answered";
  }

  return "unanswered";
}

function getQuestionButtonClass(
  state,
) {
  const base =
    "relative inline-flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

  const classes = {
    current:
      "border-blue-600 bg-blue-600 text-white shadow-sm",

    answered:
      "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100",

    flagged:
      "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100",

    unanswered:
      "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700",
  };

  return `${base} ${classes[state]}`;
}

function LegendItem({
  icon: Icon,
  label,
  className,
}) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-lg border ${className}`}
      >
        <Icon
          className="h-3.5 w-3.5"
          aria-hidden="true"
        />
      </span>

      {label}
    </span>
  );
}

export default function AssessmentQuestionNavigator({
  questions = [],
  currentIndex = 0,
  answeredQuestionIds = [],
  flaggedQuestionIds = [],
  onSelectQuestion,
}) {
  const answeredSet =
    new Set(
      answeredQuestionIds,
    );

  const flaggedSet =
    new Set(
      flaggedQuestionIds,
    );

  const answeredCount =
    questions.filter(
      (question) =>
        answeredSet.has(
          question.id,
        ),
    ).length;

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            Question navigator
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {answeredCount} of{" "}
            {questions.length} answered
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {questions.length}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5">
        {questions.map(
          (
            question,
            index,
          ) => {
            const answered =
              answeredSet.has(
                question.id,
              );

            const flagged =
              flaggedSet.has(
                question.id,
              );

            const state =
              getQuestionState({
                index,
                currentIndex,
                answered,
                flagged,
              });

            return (
              <button
                key={
                  question.id
                }
                type="button"
                onClick={() =>
                  onSelectQuestion?.(
                    index,
                    question,
                  )
                }
                className={getQuestionButtonClass(
                  state,
                )}
                aria-label={`Go to question ${
                  index + 1
                }`}
                aria-current={
                  index ===
                  currentIndex
                    ? "step"
                    : undefined
                }
              >
                {index + 1}

                {answered &&
                  state !==
                    "current" && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                      <Check
                        className="h-2.5 w-2.5"
                        aria-hidden="true"
                      />
                    </span>
                  )}

                {flagged && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                    <Flag
                      className="h-2.5 w-2.5"
                      aria-hidden="true"
                    />
                  </span>
                )}
              </button>
            );
          },
        )}
      </div>

      <div className="mt-5 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:grid-cols-1">
        <LegendItem
          icon={Circle}
          label="Current"
          className="border-blue-600 bg-blue-600 text-white"
        />

        <LegendItem
          icon={Check}
          label="Answered"
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        />

        <LegendItem
          icon={Flag}
          label="Flagged"
          className="border-amber-200 bg-amber-50 text-amber-700"
        />

        <LegendItem
          icon={Circle}
          label="Unanswered"
          className="border-slate-200 bg-white text-slate-500"
        />
      </div>
    </aside>
  );
}