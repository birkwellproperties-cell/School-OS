import {
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  AlertTriangle,
  Clock3,
  TimerReset,
} from "lucide-react";

function normalizeSeconds(value) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed)
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.floor(parsed),
  );
}

function formatDuration(
  totalSeconds,
) {
  const safeSeconds =
    Math.max(
      0,
      Number(totalSeconds) ||
        0,
    );

  const hours =
    Math.floor(
      safeSeconds / 3600,
    );

  const minutes =
    Math.floor(
      (safeSeconds % 3600) /
        60,
    );

  const seconds =
    safeSeconds % 60;

  if (
    hours > 0
  ) {
    return [
      hours,
      minutes,
      seconds,
    ]
      .map((part) =>
        String(part).padStart(
          2,
          "0",
        ),
      )
      .join(":");
  }

  return [
    minutes,
    seconds,
  ]
    .map((part) =>
      String(part).padStart(
        2,
        "0",
      ),
    )
    .join(":");
}

export default function AssessmentTimer({
  mode = "countdown",
  totalSeconds,
  elapsedSeconds,
  running = true,
  warningThresholdSeconds = 300,
  criticalThresholdSeconds = 60,
  onTick,
  onExpire,
}) {
  const expiredRef =
    useRef(false);

  const normalizedTotal =
    normalizeSeconds(
      totalSeconds,
    );

  const normalizedElapsed =
    normalizeSeconds(
      elapsedSeconds,
    ) || 0;

  const displaySeconds =
    useMemo(() => {
      if (
        mode ===
        "countup"
      ) {
        return normalizedElapsed;
      }

      if (
        normalizedTotal ===
        null
      ) {
        return null;
      }

      return Math.max(
        0,
        normalizedTotal -
          normalizedElapsed,
      );
    }, [
      mode,
      normalizedElapsed,
      normalizedTotal,
    ]);

  useEffect(() => {
    if (
      !running
    ) {
      return undefined;
    }

    const intervalId =
      window.setInterval(
        () => {
          onTick?.();
        },
        1000,
      );

    return () => {
      window.clearInterval(
        intervalId,
      );
    };
  }, [
    onTick,
    running,
  ]);

  useEffect(() => {
    if (
      mode !==
        "countdown" ||
      displaySeconds ===
        null ||
      displaySeconds > 0
    ) {
      expiredRef.current =
        false;

      return;
    }

    if (
      expiredRef.current
    ) {
      return;
    }

    expiredRef.current =
      true;

    onExpire?.();
  }, [
    displaySeconds,
    mode,
    onExpire,
  ]);

  const visualState =
    useMemo(() => {
      if (
        displaySeconds ===
        null
      ) {
        return "neutral";
      }

      if (
        mode ===
          "countdown" &&
        displaySeconds <=
          criticalThresholdSeconds
      ) {
        return "critical";
      }

      if (
        mode ===
          "countdown" &&
        displaySeconds <=
          warningThresholdSeconds
      ) {
        return "warning";
      }

      return "normal";
    }, [
      criticalThresholdSeconds,
      displaySeconds,
      mode,
      warningThresholdSeconds,
    ]);

  const styleByState = {
    neutral:
      "border-slate-200 bg-slate-50 text-slate-700",

    normal:
      "border-blue-200 bg-blue-50 text-blue-800",

    warning:
      "border-amber-200 bg-amber-50 text-amber-800",

    critical:
      "border-red-200 bg-red-50 text-red-800",
  };

  const Icon =
    visualState ===
      "critical" ||
    visualState ===
      "warning"
      ? AlertTriangle
      : mode ===
          "countup"
        ? TimerReset
        : Clock3;

  return (
    <section
      className={`rounded-2xl border p-4 ${styleByState[visualState]}`}
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
          <Icon
            className="h-5 w-5"
            aria-hidden="true"
          />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
            {mode ===
            "countup"
              ? "Time elapsed"
              : "Time remaining"}
          </p>

          <p className="mt-1 font-mono text-2xl font-bold tracking-tight">
            {displaySeconds ===
            null
              ? "Untimed"
              : formatDuration(
                  displaySeconds,
                )}
          </p>
        </div>
      </div>

      {visualState ===
        "warning" && (
        <p className="mt-3 text-xs font-semibold leading-5">
          Time is running low. Review unanswered questions before submitting.
        </p>
      )}

      {visualState ===
        "critical" && (
        <p className="mt-3 text-xs font-semibold leading-5">
          Less than one minute remains. Your assessment may submit automatically when time expires.
        </p>
      )}
    </section>
  );
}