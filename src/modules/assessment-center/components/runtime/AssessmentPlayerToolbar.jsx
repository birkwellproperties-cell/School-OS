import {
  ArrowLeft,
  CheckCircle2,
  Cloud,
  CloudOff,
  LoaderCircle,
  Send,
} from "lucide-react";

function SaveStatus({
  status,
  message,
}) {
  if (
    status ===
    "saving"
  ) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-700">
        <LoaderCircle
          className="h-4 w-4 animate-spin"
          aria-hidden="true"
        />

        {message ||
          "Saving…"}
      </span>
    );
  }

  if (
    status ===
    "saved"
  ) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
        <CheckCircle2
          className="h-4 w-4"
          aria-hidden="true"
        />

        {message ||
          "All changes saved"}
      </span>
    );
  }

  if (
    status ===
    "error"
  ) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-red-700">
        <CloudOff
          className="h-4 w-4"
          aria-hidden="true"
        />

        {message ||
          "Save failed"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
      <Cloud
        className="h-4 w-4"
        aria-hidden="true"
      />

      {message ||
        "Ready"}
    </span>
  );
}

export default function AssessmentPlayerToolbar({
  title = "Assessment",
  subtitle,
  saveStatus = "idle",
  saveMessage,
  submitting = false,
  submitDisabled = false,
  onExit,
  onSubmit,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={
              onExit
            }
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            aria-label="Exit assessment"
          >
            <ArrowLeft
              className="h-5 w-5"
              aria-hidden="true"
            />
          </button>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Assessment Player
            </p>

            <h1 className="mt-1 truncate text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-1 truncate text-sm text-slate-600">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
          <div className="min-w-40">
            <SaveStatus
              status={
                saveStatus
              }
              message={
                saveMessage
              }
            />
          </div>

          <button
            type="button"
            onClick={
              onSubmit
            }
            disabled={
              submitDisabled ||
              submitting
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Send
                className="h-4 w-4"
                aria-hidden="true"
              />
            )}

            {submitting
              ? "Submitting…"
              : "Submit assessment"}
          </button>
        </div>
      </div>
    </header>
  );
}