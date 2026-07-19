import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Circle,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

export function resolveQuestion(
  record = {},
) {
  return (
    record.question ||
    record.assessment_question ||
    record.assessment_questions ||
    {}
  );
}

export function resolveText(
  record = {},
) {
  const question =
    resolveQuestion(record);

  return (
    question.question_text ||
    question.prompt ||
    question.stem ||
    question.title ||
    record.question_text ||
    record.prompt ||
    record.title ||
    "Untitled question"
  );
}

export function resolveType(
  record = {},
) {
  const question =
    resolveQuestion(record);

  return (
    question.question_type ||
    question.type ||
    record.question_type ||
    record.type ||
    "Question"
  );
}

export function resolveDifficulty(
  record = {},
) {
  const question =
    resolveQuestion(record);

  return (
    question.difficulty_level ||
    question.difficulty ||
    record.difficulty_level ||
    record.difficulty ||
    "Not set"
  );
}

export function resolveDefaultMarks(
  record = {},
) {
  const question =
    resolveQuestion(record);

  const value =
    question.default_marks ??
    question.marks ??
    question.points ??
    record.default_marks ??
    0;

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

export function resolveMarks(
  record = {},
) {
  const override =
    record.marks_override;

  if (
    override !== null &&
    override !== undefined &&
    override !== ""
  ) {
    const number =
      Number(override);

    return Number.isFinite(number)
      ? number
      : 0;
  }

  return resolveDefaultMarks(
    record,
  );
}

export function hasMarksOverride(
  record = {},
) {
  return (
    record.marks_override !== null &&
    record.marks_override !==
      undefined &&
    record.marks_override !== ""
  );
}

function isRequired(record = {}) {
  return (
    record.required ??
    record.is_required ??
    true
  );
}

function getOrder(
  record = {},
  index,
) {
  const value =
    record.display_order ??
    record.sequence_number ??
    record.position ??
    index + 1;

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : index + 1;
}

function formatLabel(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function MarksEditor({
  record,
  disabled = false,
  onSave,
}) {
  const [editing, setEditing] =
    useState(false);

  const [value, setValue] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!editing) {
      return;
    }

    setValue(
      hasMarksOverride(record)
        ? String(
            record.marks_override,
          )
        : String(
            resolveDefaultMarks(
              record,
            ),
          ),
    );

    setError("");
  }, [editing, record]);

  async function saveOverride() {
    if (value.trim() === "") {
      setError(
        "Enter marks or restore the default.",
      );
      return;
    }

    const number =
      Number(value);

    if (
      !Number.isFinite(number) ||
      number < 0
    ) {
      setError(
        "Marks must be zero or greater.",
      );
      return;
    }

    setError("");

    await onSave?.(
      record,
      number,
    );

    setEditing(false);
  }

  async function restoreDefault() {
    setError("");

    await onSave?.(
      record,
      null,
    );

    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-sm font-semibold text-slate-950">
            {resolveMarks(record)}
          </span>

          <button
            type="button"
            title="Edit marks"
            disabled={disabled}
            onClick={() =>
              setEditing(true)
            }
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Pencil size={13} />
          </button>
        </div>

        <span
          className={`text-[11px] font-medium ${
            hasMarksOverride(record)
              ? "text-blue-600"
              : "text-slate-400"
          }`}
        >
          {hasMarksOverride(record)
            ? "Override"
            : "Default"}
        </span>
      </div>
    );
  }

  return (
    <div className="min-w-36 space-y-2">
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        autoFocus
        disabled={disabled}
        onChange={(event) =>
          setValue(
            event.target.value,
          )
        }
        onKeyDown={(event) => {
          if (
            event.key === "Enter"
          ) {
            event.preventDefault();
            saveOverride();
          }

          if (
            event.key === "Escape"
          ) {
            setEditing(false);
          }
        }}
        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-right text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-1">
        <button
          type="button"
          title="Use default marks"
          disabled={disabled}
          onClick={restoreDefault}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
        >
          <RotateCcw size={14} />
        </button>

        <button
          type="button"
          title="Cancel"
          disabled={disabled}
          onClick={() =>
            setEditing(false)
          }
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
        >
          <X size={14} />
        </button>

        <button
          type="button"
          title="Save marks"
          disabled={disabled}
          onClick={saveOverride}
          className="rounded-md bg-blue-600 p-1.5 text-white hover:bg-blue-700 disabled:opacity-40"
        >
          <Check size={14} />
        </button>
      </div>
    </div>
  );
}

export default function TemplateQuestionTable({
  questions = [],
  loading = false,
  mutationLoading = false,
  canEdit = false,
  onToggleRequired,
  onUpdateMarks,
  onMoveUp,
  onMoveDown,
  onRemove,
}) {
  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Loader2
            size={18}
            className="animate-spin"
          />

          Loading assigned questions…
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <p className="text-base font-semibold text-slate-900">
          No questions assigned
        </p>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
          Select a template section and
          add questions from the Question
          Bank.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="w-20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Number
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Question
              </th>

              <th className="w-36 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
              </th>

              <th className="w-32 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Difficulty
              </th>

              <th className="w-36 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Marks
              </th>

              <th className="w-32 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                Required
              </th>

              {canEdit && (
                <th className="w-40 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {questions.map(
              (record, index) => {
                const required =
                  isRequired(record);

                const disabled =
                  mutationLoading;

                return (
                  <tr
                    key={
                      record.id ||
                      `${record.question_id}-${index}`
                    }
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex w-fit min-w-9 justify-center rounded-lg bg-blue-50 px-2 py-1 text-sm font-semibold text-blue-700">
                          {index + 1}
                        </span>

                        <span className="text-[11px] text-slate-400">
                          Order{" "}
                          {getOrder(
                            record,
                            index,
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 align-top">
                      <p className="line-clamp-3 text-sm font-semibold leading-6 text-slate-950">
                        {resolveText(
                          record,
                        )}
                      </p>

                      {(record.question_number ||
                        resolveQuestion(
                          record,
                        )
                          .question_number) && (
                        <p className="mt-1 text-xs text-slate-500">
                          Bank reference:{" "}
                          {record.question_number ||
                            resolveQuestion(
                              record,
                            )
                              .question_number}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 align-top">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {formatLabel(
                          resolveType(
                            record,
                          ),
                        )}
                      </span>
                    </td>

                    <td className="px-4 py-4 align-top text-sm text-slate-700">
                      {formatLabel(
                        resolveDifficulty(
                          record,
                        ),
                      )}
                    </td>

                    <td className="px-4 py-4 text-right align-top">
                      {canEdit ? (
                        <MarksEditor
                          record={record}
                          disabled={disabled}
                          onSave={
                            onUpdateMarks
                          }
                        />
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-semibold text-slate-950">
                            {resolveMarks(
                              record,
                            )}
                          </span>

                          <span className="text-[11px] text-slate-400">
                            {hasMarksOverride(
                              record,
                            )
                              ? "Override"
                              : "Default"}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center align-top">
                      <button
                        type="button"
                        disabled={
                          !canEdit ||
                          disabled
                        }
                        onClick={() =>
                          onToggleRequired?.(
                            record,
                            !required,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-default disabled:opacity-70"
                      >
                        {required ? (
                          <CheckCircle2
                            size={17}
                            className="text-emerald-600"
                          />
                        ) : (
                          <Circle
                            size={17}
                            className="text-slate-400"
                          />
                        )}

                        {required
                          ? "Required"
                          : "Optional"}
                      </button>
                    </td>

                    {canEdit && (
                      <td className="px-4 py-4 align-top">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            title="Move question up"
                            disabled={
                              disabled ||
                              index === 0
                            }
                            onClick={() =>
                              onMoveUp?.(
                                record,
                                index,
                              )
                            }
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowUp
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            title="Move question down"
                            disabled={
                              disabled ||
                              index ===
                                questions.length -
                                  1
                            }
                            onClick={() =>
                              onMoveDown?.(
                                record,
                                index,
                              )
                            }
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ArrowDown
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            title="Remove question"
                            disabled={disabled}
                            onClick={() =>
                              onRemove?.(
                                record,
                              )
                            }
                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>
                        </div>
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
  );
}