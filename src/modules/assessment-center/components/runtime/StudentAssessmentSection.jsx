import {
  ClipboardList,
} from "lucide-react";

import StudentAssessmentCard from "./StudentAssessmentCard";

export default function StudentAssessmentSection({
  title,
  description,
  assessments = [],
  emptyTitle,
  emptyDescription,
  icon: Icon =
    ClipboardList,
  onLaunch,
  onSelect,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <header className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Icon
            className="h-5 w-5"
            aria-hidden="true"
          />
        </span>

        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {description}
            </p>
          )}
        </div>
      </header>

      {assessments.length > 0 ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {assessments.map(
            (
              assessment,
            ) => (
              <StudentAssessmentCard
                key={
                  assessment.id
                }
                assessment={
                  assessment
                }
                onLaunch={
                  onLaunch
                }
                onSelect={
                  onSelect
                }
              />
            ),
          )}
        </div>
      ) : (
        <div className="mt-5 flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
            <Icon
              className="h-5 w-5"
              aria-hidden="true"
            />
          </span>

          <h3 className="mt-4 text-sm font-semibold text-slate-950">
            {emptyTitle}
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            {emptyDescription}
          </p>
        </div>
      )}
    </section>
  );
}