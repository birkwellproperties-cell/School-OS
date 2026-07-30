import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import AssessmentPlayerToolbar from "../components/runtime/AssessmentPlayerToolbar";
import AssessmentQuestionNavigator from "../components/runtime/AssessmentQuestionNavigator";
import AssessmentQuestionView from "../components/runtime/AssessmentQuestionView";
import AssessmentTimer from "../components/runtime/AssessmentTimer";

const AUTOSAVE_DELAY = 750;
const HEARTBEAT_DELAY = 30000;

function rows(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.items)) return result.items;
  return [];
}

function message(error, fallback) {
  return error?.message?.trim?.() || fallback;
}

function snapshotText(value, keys) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";

  for (const key of keys) {
    if (typeof value[key] === "string") return value[key];
  }

  return "";
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];

  return options.map((option, index) => ({
    ...option,
    id: option?.id || option?.option_id || `option-${index + 1}`,
    option_key:
      option?.option_key ||
      option?.key ||
      String.fromCharCode(65 + index),
    option_text:
      option?.option_text ||
      option?.text ||
      option?.label ||
      "",
    display_order: Number(option?.display_order) || index,
  }));
}

function normalizeQuestions(result) {
  return rows(result)
    .map((question, index) => {
      const prompt = snapshotText(
        question?.prompt_snapshot,
        ["prompt", "text", "content", "value"],
      );
      const instructions = snapshotText(
        question?.configuration_snapshot,
        ["instructions", "text", "content"],
      );

      return {
        ...question,
        id: question?.id || `attempt-question-${index + 1}`,
        question_id: question?.question_id || question?.id,
        question_type: question?.question_type || "short_answer",
        prompt_snapshot: prompt,
        prompt,
        instructions_snapshot: instructions,
        instructions,
        options: normalizeOptions(question?.option_snapshot),
        maximum_marks: Number(question?.maximum_marks) || 0,
        default_marks: Number(question?.maximum_marks) || 0,
        display_order: Number(question?.display_order) || index,
        required: question?.required !== false,
      };
    })
    .sort(
      (first, second) =>
        Number(first.display_order) - Number(second.display_order),
    );
}

function unwrapResponseValue(value) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1 &&
    Object.prototype.hasOwnProperty.call(value, "value")
  ) {
    return value.value;
  }

  return value;
}

function normalizeResponse(response) {
  return {
    ...response,
    response_value: unwrapResponseValue(response?.response_value),
    selected_option_ids: Array.isArray(response?.selected_option_ids)
      ? response.selected_option_ids
      : [],
    flagged_for_review: Boolean(response?.flagged_for_review),
    time_spent_seconds: Number(response?.time_spent_seconds) || 0,
    change_count: Number(response?.change_count) || 0,
  };
}

function responseMap(result) {
  return rows(result).reduce((map, response) => {
    const key = response?.attempt_question_id || response?.question_id;
    if (key) map[key] = normalizeResponse(response);
    return map;
  }, {});
}

function jsonResponseValue(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === "") return {};
  return { value };
}

function meaningful(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return Boolean(value.trim());
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.values(value).some(meaningful);
  }
  return true;
}

function answered(response) {
  return Boolean(
    response &&
      ((Array.isArray(response.selected_option_ids) &&
        response.selected_option_ids.length) ||
        meaningful(response.response_text) ||
        meaningful(response.response_value)),
  );
}

function elapsedFor(attempt) {
  const saved =
    Number(attempt?.elapsed_seconds) ||
    Number(attempt?.time_spent_seconds) ||
    0;

  if (!attempt?.started_at || attempt?.status !== "in_progress") {
    return Math.max(saved, 0);
  }

  const started = new Date(attempt.started_at).getTime();
  if (!Number.isFinite(started)) return Math.max(saved, 0);

  return Math.max(
    saved,
    Math.floor((Date.now() - started) / 1000),
  );
}

function titleFor(runtimeRecord) {
  return (
    runtimeRecord?.assignment?.title ||
    runtimeRecord?.assignment?.assignment_number ||
    "Assessment"
  );
}

function subtitleFor(runtimeRecord, attempt) {
  const parts = [`Attempt ${Number(attempt?.attempt_number) || 1}`];
  const mode = runtimeRecord?.assignment?.delivery_mode;

  if (mode) {
    parts.push(
      mode
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    );
  }

  return parts.join(" · ");
}

function CenterState({ loading, error, onRetry, onExit }) {
  if (loading) {
    return (
      <div className="flex min-h-[480px] items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-blue-600" />
          <p className="mt-4 text-sm font-semibold text-slate-900">
            Preparing assessment
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Loading questions and saved responses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[480px] max-w-2xl items-center justify-center px-4">
      <section className="w-full rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto h-9 w-9 text-red-700" />
        <h2 className="mt-5 text-xl font-bold text-slate-950">
          Unable to open assessment
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Return
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </section>
    </div>
  );
}

export default function AssessmentPlayer({
  service,
  runtimeRecord,
  attempt: providedAttempt = null,
  attemptId = null,
  onExit,
  onSubmitted,
}) {
  const mountedRef = useRef(true);
  const attemptRef = useRef(null);
  const questionsRef = useRef([]);
  const responsesRef = useRef({});
  const elapsedRef = useRef(0);
  const dirtyRef = useRef(new Set());
  const saveTimerRef = useRef(null);
  const saveQueueRef = useRef(Promise.resolve());
  const currentQuestionRef = useRef(null);
  const questionStartedRef = useRef(Date.now());
  const submittingRef = useRef(false);
  const expiredRef = useRef(false);

  const [attempt, setAttempt] = useState(
    providedAttempt || runtimeRecord?.activeAttempt || null,
  );
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    elapsedFor(providedAttempt || runtimeRecord?.activeAttempt),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveMessage, setSaveMessage] = useState("Ready");
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex] || null;
  const currentResponse = currentQuestion
    ? responses[currentQuestion.id] || {}
    : {};

  const answeredIds = useMemo(
    () =>
      questions
        .filter((question) => answered(responses[question.id]))
        .map((question) => question.id),
    [questions, responses],
  );

  const flaggedIds = useMemo(
    () =>
      questions
        .filter((question) => responses[question.id]?.flagged_for_review)
        .map((question) => question.id),
    [questions, responses],
  );

  const durationMinutes =
    Number(attempt?.duration_minutes) ||
    Number(runtimeRecord?.durationMinutes) ||
    Number(runtimeRecord?.assignment?.duration_minutes) ||
    null;

  const totalSeconds = durationMinutes
    ? Math.floor(durationMinutes * 60)
    : null;

  const setLocalResponse = useCallback((questionId, updater) => {
    setResponses((current) => {
      const existing = current[questionId] || {};
      const next =
        typeof updater === "function"
          ? updater(existing)
          : { ...existing, ...updater };

      const result = { ...current, [questionId]: next };
      responsesRef.current = result;
      return result;
    });
  }, []);

  const captureQuestionTime = useCallback(
    (questionId) => {
      if (!questionId) return;

      const seconds = Math.max(
        0,
        Math.floor((Date.now() - questionStartedRef.current) / 1000),
      );

      questionStartedRef.current = Date.now();
      if (!seconds) return;

      setLocalResponse(questionId, (existing) => ({
        ...existing,
        time_spent_seconds:
          (Number(existing.time_spent_seconds) || 0) + seconds,
      }));
      dirtyRef.current.add(questionId);
    },
    [setLocalResponse],
  );

  const persistResponse = useCallback(
    async (questionId) => {
      const activeAttempt = attemptRef.current;
      const question = questionsRef.current.find(
        (item) => item.id === questionId,
      );
      const response = responsesRef.current[questionId];

      if (!activeAttempt?.id || !question || !response) return null;

      const now = new Date().toISOString();
      const hasAnswer = answered(response);
      const flagged = Boolean(response.flagged_for_review);
      const payload = {
        response_value: jsonResponseValue(response.response_value),
        response_text:
          typeof response.response_text === "string"
            ? response.response_text
            : null,
        selected_option_ids: Array.isArray(response.selected_option_ids)
          ? response.selected_option_ids
          : [],
        status: flagged
          ? "flagged"
          : hasAnswer
            ? "answered"
            : "unanswered",
        answered_at: hasAnswer ? now : null,
        first_answered_at: hasAnswer
          ? response.first_answered_at || response.answered_at || now
          : response.first_answered_at || null,
        time_spent_seconds:
          Number(response.time_spent_seconds) || 0,
        change_count: (Number(response.change_count) || 0) + 1,
        flagged_for_review: flagged,
      };

      const saved = response.id
        ? await service.updateAssessmentResponse(response.id, payload)
        : await service.createAssessmentResponse({
            assignment_id: activeAttempt.assignment_id,
            attempt_id: activeAttempt.id,
            attempt_question_id: question.id,
            question_id: question.question_id,
            ...payload,
          });

      const normalized = normalizeResponse(saved);
      setLocalResponse(questionId, (existing) => ({
        ...existing,
        ...normalized,
      }));
      return normalized;
    },
    [service, setLocalResponse],
  );

  const persistAttempt = useCallback(
    async (updates = {}) => {
      const activeAttempt = attemptRef.current;
      if (!activeAttempt?.id) return null;

      const saved = await service.updateAssessmentAttempt(
        activeAttempt.id,
        {
          elapsed_seconds: Math.max(0, Number(elapsedRef.current) || 0),
          last_activity_at: new Date().toISOString(),
          ...updates,
        },
      );

      attemptRef.current = saved;
      if (mountedRef.current) setAttempt(saved);
      return saved;
    },
    [service],
  );

  const flush = useCallback(
    async ({ saveAttempt = true, allowSubmitting = false } = {}) => {
      if (submittingRef.current && !allowSubmitting) return;

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      const dirtyIds = [...dirtyRef.current];
      dirtyRef.current.clear();

      if (!dirtyIds.length && !saveAttempt) return;

      setSaveStatus("saving");
      setSaveMessage("Saving...");

      const operation = async () => {
        try {
          for (const id of dirtyIds) await persistResponse(id);

          if (saveAttempt) {
            await persistAttempt(
              attemptRef.current?.status === "not_started"
                ? { status: "in_progress" }
                : {},
            );
          }

          if (mountedRef.current) {
            setSaveStatus("saved");
            setSaveMessage("All changes saved");
          }
        } catch (saveError) {
          dirtyIds.forEach((id) => dirtyRef.current.add(id));

          if (mountedRef.current) {
            setSaveStatus("error");
            setSaveMessage(message(saveError, "Unable to save changes"));
          }

          throw saveError;
        }
      };

      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(operation);

      return saveQueueRef.current;
    },
    [persistAttempt, persistResponse],
  );

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(() => {
      flush().catch(() => undefined);
    }, AUTOSAVE_DELAY);
  }, [flush]);

  const load = useCallback(async () => {
    if (!service) {
      setError("Assessment service is unavailable.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const resolvedAttempt =
        providedAttempt ||
        runtimeRecord?.activeAttempt ||
        (attemptId
          ? await service.getAssessmentAttempt(attemptId)
          : null);

      if (!resolvedAttempt?.id) {
        throw new Error("An active assessment attempt could not be found.");
      }

      const [questionResult, responseResult] = await Promise.all([
        service.getAssessmentAttemptQuestions({
          attemptId: resolvedAttempt.id,
          assignmentId: resolvedAttempt.assignment_id,
          sortBy: "display_order",
          sortDirection: "asc",
          page: 1,
          pageSize: 500,
        }),
        service.getAssessmentResponses({
          attemptId: resolvedAttempt.id,
          assignmentId: resolvedAttempt.assignment_id,
          page: 1,
          pageSize: 500,
        }),
      ]);

      const loadedQuestions = normalizeQuestions(questionResult);
      const loadedResponses = responseMap(responseResult);
      let activeAttempt = resolvedAttempt;
      const initialElapsed = elapsedFor(resolvedAttempt);

      if (resolvedAttempt.status === "not_started") {
        activeAttempt = await service.updateAssessmentAttempt(
          resolvedAttempt.id,
          {
            status: "in_progress",
            started_at: resolvedAttempt.started_at || new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            elapsed_seconds: initialElapsed,
          },
        );
      }

      attemptRef.current = activeAttempt;
      questionsRef.current = loadedQuestions;
      responsesRef.current = loadedResponses;
      elapsedRef.current = initialElapsed;
      currentQuestionRef.current = loadedQuestions[0]?.id || null;
      questionStartedRef.current = Date.now();

      setAttempt(activeAttempt);
      setQuestions(loadedQuestions);
      setResponses(loadedResponses);
      setElapsedSeconds(initialElapsed);
      setCurrentIndex(0);
      setSaveStatus("saved");
      setSaveMessage("Assessment loaded");
    } catch (loadError) {
      setError(message(loadError, "Unable to load the assessment player."));
    } finally {
      setLoading(false);
    }
  }, [attemptId, providedAttempt, runtimeRecord, service]);

  useEffect(() => {
    mountedRef.current = true;
    load();

    return () => {
      mountedRef.current = false;
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [load]);

  useEffect(() => {
    const nextId = currentQuestion?.id || null;
    const previousId = currentQuestionRef.current;

    if (previousId && previousId !== nextId) {
      captureQuestionTime(previousId);
      scheduleSave();
    }

    currentQuestionRef.current = nextId;
    questionStartedRef.current = Date.now();
  }, [captureQuestionTime, currentQuestion?.id, scheduleSave]);

  useEffect(() => {
    if (attempt?.status !== "in_progress") return undefined;

    const interval = window.setInterval(() => {
      persistAttempt().catch(() => undefined);
    }, HEARTBEAT_DELAY);

    return () => window.clearInterval(interval);
  }, [attempt?.status, persistAttempt]);

  const changeResponse = useCallback(
    (nextResponse) => {
      if (!currentQuestion || submittingRef.current) return;

      setLocalResponse(currentQuestion.id, (existing) => {
        const merged = {
          ...existing,
          ...nextResponse,
          assignment_id: attemptRef.current?.assignment_id,
          attempt_id: attemptRef.current?.id,
          attempt_question_id: currentQuestion.id,
          question_id: currentQuestion.question_id,
        };

        return {
          ...merged,
          status: merged.flagged_for_review
            ? "flagged"
            : answered(merged)
              ? "answered"
              : "unanswered",
        };
      });

      dirtyRef.current.add(currentQuestion.id);
      setSaveStatus("idle");
      setSaveMessage("Unsaved changes");
      scheduleSave();
    },
    [currentQuestion, scheduleSave, setLocalResponse],
  );

  const toggleFlag = useCallback(() => {
    if (!currentQuestion || submittingRef.current) return;

    setLocalResponse(currentQuestion.id, (existing) => {
      const flagged = !existing.flagged_for_review;

      return {
        ...existing,
        assignment_id: attemptRef.current?.assignment_id,
        attempt_id: attemptRef.current?.id,
        attempt_question_id: currentQuestion.id,
        question_id: currentQuestion.question_id,
        flagged_for_review: flagged,
        status: flagged
          ? "flagged"
          : answered(existing)
            ? "answered"
            : "unanswered",
      };
    });

    dirtyRef.current.add(currentQuestion.id);
    setSaveStatus("idle");
    setSaveMessage("Unsaved changes");
    scheduleSave();
  }, [currentQuestion, scheduleSave, setLocalResponse]);

  const submit = useCallback(
    async ({ expired = false } = {}) => {
      if (submittingRef.current || !attemptRef.current?.id) return;

      submittingRef.current = true;
      setSubmitting(true);
      setSaveStatus("saving");
      setSaveMessage(
        expired ? "Time expired. Submitting..." : "Submitting assessment...",
      );

      captureQuestionTime(currentQuestionRef.current);

      try {
        questionsRef.current.forEach((question) => {
          if (responsesRef.current[question.id]) {
            dirtyRef.current.add(question.id);
          }
        });

        await flush({
          saveAttempt: false,
          allowSubmitting: true,
        });

        for (const question of questionsRef.current) {
          const response = responsesRef.current[question.id];
          if (!response?.id) continue;

          const saved = await service.updateAssessmentResponse(
            response.id,
            {
              status: "submitted",
              time_spent_seconds:
                Number(response.time_spent_seconds) || 0,
              flagged_for_review: Boolean(response.flagged_for_review),
            },
          );

          setLocalResponse(question.id, normalizeResponse(saved));
        }

        const submittedAt = new Date().toISOString();
        const savedAttempt = await persistAttempt({
          status: expired ? "expired" : "submitted",
          grading_status: "pending_review",
          submitted_at: submittedAt,
        });

        setSaveStatus("saved");
        setSaveMessage(
          expired
            ? "Assessment submitted when time expired"
            : "Assessment submitted",
        );

        onSubmitted?.({
          attempt: savedAttempt,
          responses: Object.values(responsesRef.current),
          expired,
        });
      } catch (submitError) {
        setSaveStatus("error");
        setSaveMessage(
          message(submitError, "Unable to submit assessment"),
        );
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [
      captureQuestionTime,
      flush,
      onSubmitted,
      persistAttempt,
      service,
      setLocalResponse,
    ],
  );

  const expire = useCallback(() => {
    if (expiredRef.current) return;
    expiredRef.current = true;
    submit({ expired: true });
  }, [submit]);

  const exit = useCallback(async () => {
    captureQuestionTime(currentQuestionRef.current);

    try {
      await flush();
      onExit?.();
    } catch {
      // Keep the player open so the user can retry saving.
    }
  }, [captureQuestionTime, flush, onExit]);

  if (loading || error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AssessmentPlayerToolbar
          title={titleFor(runtimeRecord)}
          saveStatus={loading ? "saving" : "error"}
          saveMessage={loading ? "Loading assessment" : "Unable to load"}
          submitDisabled
          onExit={onExit}
        />
        <CenterState
          loading={loading}
          error={error}
          onRetry={load}
          onExit={onExit}
        />
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AssessmentPlayerToolbar
          title={titleFor(runtimeRecord)}
          saveStatus={saveStatus}
          saveMessage={saveMessage}
          submitDisabled
          onExit={exit}
        />
        <div className="flex min-h-[480px] items-center justify-center">
          <p className="text-sm font-semibold text-slate-700">
            This attempt contains no questions.
          </p>
        </div>
      </div>
    );
  }

  const locked =
    submitting ||
    ["submitted", "completed", "expired", "invalidated"].includes(
      attempt?.status,
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <AssessmentPlayerToolbar
        title={titleFor(runtimeRecord)}
        subtitle={subtitleFor(runtimeRecord, attempt)}
        saveStatus={saveStatus}
        saveMessage={saveMessage}
        submitting={submitting}
        submitDisabled={locked || !attempt?.id}
        onExit={exit}
        onSubmit={() => submit({ expired: false })}
      />

      <main className="mx-auto grid w-full max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="min-w-0 space-y-5">
          <AssessmentQuestionView
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            response={currentResponse}
            disabled={locked}
            flagged={Boolean(currentResponse.flagged_for_review)}
            onResponseChange={changeResponse}
            onToggleFlag={toggleFlag}
          />

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((index) => Math.max(index - 1, 0))
              }
              disabled={currentIndex === 0 || locked}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            <p className="text-center text-sm font-medium text-slate-500">
              Question {currentIndex + 1} of {questions.length}
            </p>

            <button
              type="button"
              onClick={() =>
                setCurrentIndex((index) =>
                  Math.min(index + 1, questions.length - 1),
                )
              }
              disabled={currentIndex === questions.length - 1 || locked}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          <AssessmentTimer
            mode={totalSeconds ? "countdown" : "countup"}
            totalSeconds={totalSeconds}
            elapsedSeconds={elapsedSeconds}
            running={!locked && attempt?.status === "in_progress"}
            onTick={() =>
              setElapsedSeconds((seconds) => {
                const next = seconds + 1;
                elapsedRef.current = next;
                return next;
              })
            }
            onExpire={expire}
          />

          <AssessmentQuestionNavigator
            questions={questions}
            currentIndex={currentIndex}
            answeredQuestionIds={answeredIds}
            flaggedQuestionIds={flaggedIds}
            onSelectQuestion={(index) => {
              if (!locked && index >= 0 && index < questions.length) {
                setCurrentIndex(index);
              }
            }}
          />
        </aside>
      </main>
    </div>
  );
}
