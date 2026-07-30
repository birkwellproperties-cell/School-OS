import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  LockKeyhole,
  Play,
  RotateCcw,
  Timer,
} from "lucide-react";

const STATUS_STYLES = {
  available:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  in_progress:
    "border-blue-200 bg-blue-50 text-blue-700",

  upcoming:
    "border-indigo-200 bg-indigo-50 text-indigo-700",

  submitted:
    "border-amber-200 bg-amber-50 text-amber-700",

  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  expired:
    "border-red-200 bg-red-50 text-red-700",

  cancelled:
    "border-red-200 bg-red-50 text-red-700",

  attempts_exhausted:
    "border-slate-200 bg-slate-100 text-slate-700",

  unavailable:
    "border-slate-200 bg-slate-100 text-slate-600",
};

function normalizeText(
  value,
) {
  return String(
    value ?? "",
  ).trim();
}

function humanizeValue(
  value,
  fallback = "Not specified",
) {
  const normalized =
    normalizeText(
      value,
    );

  if (!normalized) {
    return fallback;
  }

  return normalized
    .replace(
      /[_-]+/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (
        character,
      ) =>
        character.toUpperCase(),
    );
}

function formatDateTime(
  value,
  fallback = "Not scheduled",
) {
  if (!value) {
    return fallback;
  }

  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return fallback;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle:
        "medium",
      timeStyle:
        "short",
    },
  ).format(
    date,
  );
}

function AssessmentStatusBadge({
  status,
}) {
  const normalized =
    normalizeText(
      status,
    ).toLowerCase() ||
    "unavailable";

  const style =
    STATUS_STYLES[
      normalized
    ] ||
    STATUS_STYLES.unavailable;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {humanizeValue(
        normalized,
        "Unavailable",
      )}
    </span>
  );
}

function MetadataItem({
  icon: Icon,
  children,
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Icon
        className="h-4 w-4 shrink-0 text-slate-400"
        aria-hidden="true"
      />

      <span className="truncate">
        {children}
      </span>
    </span>
  );
}

function resolveActionLabel(
  assessment,
) {
  if (
    assessment?.canResume
  ) {
    return "Resume";
  }

  if (
    assessment?.canStart
  ) {
    return "Start";
  }

  if (
    assessment?.availabilityStatus ===
      "completed" ||
    assessment?.availabilityStatus ===
      "submitted"
  ) {
    return "View details";
  }

  return "Unavailable";
}

function resolveActionIcon(
  assessment,
) {
  if (
    assessment?.canResume
  ) {
    return RotateCcw;
  }

  if (
    assessment?.canStart
  ) {
    return Play;
  }

  if (
    assessment?.availabilityStatus ===
      "completed" ||
    assessment?.availabilityStatus ===
      "submitted"
  ) {
    return CheckCircle2;
  }

  return LockKeyhole;
}

export default function StudentAssessmentCard({
  assessment,
  onLaunch,
  onSelect,
}) {
  const assignment =
    assessment
      ?.assignment ||
    {};

  const template =
    assignment
      ?.template ||
    assignment
      ?.assessment_template ||
    {};

  const title =
    assignment.title ||
    template.name ||
    template.title ||
    "Untitled assessment";

  const reference =
    assignment
      .assignment_number ||
    template
      .template_number ||
    "Assessment";

  const ActionIcon =
    resolveActionIcon(
      assessment,
    );

  const actionDisabled =
    !assessment?.canStart &&
    !assessment?.canResume &&
    ![
      "completed",
      "submitted",
    ].includes(
      assessment
        ?.availabilityStatus,
    );

  const handleLaunch =
    () => {
      if (
        actionDisabled
      ) {
        return;
      }

      onLaunch?.(
        assessment,
      );
    };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() =>
            onSelect?.(
              assessment,
            )
          }
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            {reference}
          </p>

          <h3 className="mt-1 break-words text-base font-semibold text-slate-950">
            {title}
          </h3>

          {assignment.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
              {assignment.description}
            </p>
          )}
        </button>

        <AssessmentStatusBadge
          status={
            assessment
              ?.availabilityStatus
          }
        />
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <MetadataItem
          icon={
            CalendarClock
          }
        >
          Due{" "}
          {formatDateTime(
            assessment
              ?.dueAt,
          )}
        </MetadataItem>

        <MetadataItem
          icon={
            Timer
          }
        >
          {assessment
            ?.durationMinutes
            ? `${assessment.durationMinutes} minutes`
            : "No time limit"}
        </MetadataItem>

        <MetadataItem
          icon={
            Clock3
          }
        >
          {assessment
            ?.attemptsRemaining}{" "}
          attempt
          {assessment
            ?.attemptsRemaining ===
          1
            ? ""
            : "s"}{" "}
          remaining
        </MetadataItem>

        <MetadataItem
          icon={
            FileText
          }
        >
          {humanizeValue(
            assignment
              ?.delivery_mode,
            "Online assessment",
          )}
        </MetadataItem>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-slate-500">
          {assessment?.canResume
            ? "Continue your current attempt."
            : assessment?.canStart
              ? "Ready when you are."
              : assessment
                    ?.availabilityStatus ===
                  "upcoming"
                ? `Available ${formatDateTime(
                    assessment
                      ?.availableFrom,
                  )}.`
                : assessment
                      ?.availabilityStatus ===
                    "expired"
                  ? "The assessment window has closed."
                  : assessment
                        ?.availabilityStatus ===
                      "completed"
                    ? "Assessment completed."
                    : assessment
                          ?.availabilityStatus ===
                        "submitted"
                      ? "Submitted for grading."
                      : "This assessment is not currently available."}
        </p>

        <button
          type="button"
          onClick={
            handleLaunch
          }
          disabled={
            actionDisabled
          }
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <ActionIcon
            className="h-4 w-4"
            aria-hidden="true"
          />

          {resolveActionLabel(
            assessment,
          )}
        </button>
      </div>
    </article>
  );
}