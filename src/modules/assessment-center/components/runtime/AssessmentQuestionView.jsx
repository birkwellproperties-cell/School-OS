import {
  AlertCircle,
  CheckSquare2,
  FileUp,
  Flag,
  GripVertical,
  ListChecks,
  MessageSquareText,
  Type,
} from "lucide-react";

import {
  getAssessmentLabel,
} from "../../constants";

function normalizeOptions(
  options,
) {
  return Array.isArray(
    options,
  )
    ? [...options].sort(
        (
          first,
          second,
        ) =>
          Number(
            first.display_order ??
              0,
          ) -
          Number(
            second.display_order ??
              0,
          ),
      )
    : [];
}

function normalizeSelectedIds(
  response,
) {
  return Array.isArray(
    response?.selected_option_ids,
  )
    ? response.selected_option_ids
    : [];
}

function ChoiceOption({
  option,
  checked,
  multiple,
  disabled,
  onChange,
}) {
  const inputType =
    multiple
      ? "checkbox"
      : "radio";

  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${
        checked
          ? "border-blue-400 bg-blue-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
      } ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : ""
      }`}
    >
      <input
        type={
          inputType
        }
        name="assessment-answer"
        checked={
          checked
        }
        disabled={
          disabled
        }
        onChange={() =>
          onChange?.(
            option,
          )
        }
        className="mt-1 h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
      />

      <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-bold text-slate-700">
        {option.option_key ||
          "—"}
      </span>

      <span className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">
        {option.option_text ||
          "Option"}
      </span>
    </label>
  );
}

function ChoiceResponse({
  question,
  response,
  disabled,
  multiple,
  onResponseChange,
}) {
  const options =
    normalizeOptions(
      question.options,
    );

  const selectedIds =
    normalizeSelectedIds(
      response,
    );

  function handleOptionChange(
    option,
  ) {
    const optionId =
      option.id;

    if (
      !optionId
    ) {
      return;
    }

    if (
      multiple
    ) {
      const nextIds =
        selectedIds.includes(
          optionId,
        )
          ? selectedIds.filter(
              (id) =>
                id !== optionId,
            )
          : [
              ...selectedIds,
              optionId,
            ];

      onResponseChange?.({
        ...response,
        selected_option_ids:
          nextIds,
        response_text: null,
        response_value: null,
      });

      return;
    }

    onResponseChange?.({
      ...response,
      selected_option_ids: [
        optionId,
      ],
      response_text:
        option.option_text ||
        null,
      response_value:
        option.response_value ||
        option.option_key ||
        null,
    });
  }

  if (
    options.length === 0
  ) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
            aria-hidden="true"
          />

          <p className="text-sm leading-6 text-amber-800">
            This question does not have any answer options configured.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {options.map(
        (option) => (
          <ChoiceOption
            key={
              option.id
            }
            option={
              option
            }
            checked={selectedIds.includes(
              option.id,
            )}
            multiple={
              multiple
            }
            disabled={
              disabled
            }
            onChange={
              handleOptionChange
            }
          />
        ),
      )}
    </div>
  );
}

function TextResponse({
  response,
  disabled,
  multiline = false,
  placeholder,
  onResponseChange,
}) {
  const value =
    response?.response_text ||
    "";

  const sharedProps = {
    value,
    disabled,
    placeholder,
    onChange: (
      event,
    ) =>
      onResponseChange?.({
        ...response,
        response_text:
          event.target.value,
        selected_option_ids:
          [],
      }),
    className:
      "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
  };

  if (
    multiline
  ) {
    return (
      <textarea
        {...sharedProps}
        rows={8}
        className={`${sharedProps.className} resize-y`}
      />
    );
  }

  return (
    <input
      {...sharedProps}
      type="text"
    />
  );
}

function NumericResponse({
  response,
  disabled,
  onResponseChange,
}) {
  const value =
    response?.response_value ??
    response?.response_text ??
    "";

  return (
    <input
      type="number"
      inputMode="decimal"
      value={
        value
      }
      disabled={
        disabled
      }
      onChange={(
        event,
      ) =>
        onResponseChange?.({
          ...response,
          response_value:
            event.target.value,
          response_text:
            event.target.value,
          selected_option_ids:
            [],
        })
      }
      placeholder="Enter a numeric answer"
      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
    />
  );
}

function MatchingResponse({
  question,
  response,
  disabled,
  onResponseChange,
}) {
  const options =
    normalizeOptions(
      question.options,
    );

  const currentValue =
    response?.response_value &&
    typeof response.response_value ===
      "object"
      ? response.response_value
      : {};

  function updateMatch(
    option,
    value,
  ) {
    const key =
      option.id ||
      option.option_key;

    onResponseChange?.({
      ...response,
      response_value: {
        ...currentValue,
        [key]: value,
      },
      selected_option_ids:
        [],
    });
  }

  return (
    <div className="space-y-3">
      {options.map(
        (option) => {
          const key =
            option.id ||
            option.option_key;

          return (
            <div
              key={key}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {option.option_key ||
                    "Item"}
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-800">
                  {option.option_text}
                </p>
              </div>

              <input
                type="text"
                value={
                  currentValue[
                    key
                  ] || ""
                }
                disabled={
                  disabled
                }
                onChange={(
                  event,
                ) =>
                  updateMatch(
                    option,
                    event.target
                      .value,
                  )
                }
                placeholder="Enter match"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>
          );
        },
      )}
    </div>
  );
}

function OrderingResponse({
  question,
  response,
  disabled,
  onResponseChange,
}) {
  const options =
    normalizeOptions(
      question.options,
    );

  const storedOrder =
    Array.isArray(
      response?.selected_option_ids,
    )
      ? response.selected_option_ids
      : [];

  const orderedOptions =
    storedOrder.length > 0
      ? storedOrder
          .map((id) =>
            options.find(
              (option) =>
                option.id === id,
            ),
          )
          .filter(Boolean)
      : options;

  function moveOption(
    index,
    direction,
  ) {
    const nextIndex =
      index + direction;

    if (
      nextIndex < 0 ||
      nextIndex >=
        orderedOptions.length
    ) {
      return;
    }

    const next =
      [...orderedOptions];

    [
      next[index],
      next[nextIndex],
    ] = [
      next[nextIndex],
      next[index],
    ];

    onResponseChange?.({
      ...response,
      selected_option_ids:
        next.map(
          (option) =>
            option.id,
        ),
      response_text: null,
    });
  }

  return (
    <div className="space-y-3">
      {orderedOptions.map(
        (
          option,
          index,
        ) => (
          <div
            key={
              option.id
            }
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
          >
            <GripVertical
              className="h-5 w-5 shrink-0 text-slate-400"
              aria-hidden="true"
            />

            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
              {index + 1}
            </span>

            <p className="min-w-0 flex-1 text-sm leading-6 text-slate-800">
              {option.option_text}
            </p>

            <div className="flex gap-1">
              <button
                type="button"
                disabled={
                  disabled ||
                  index === 0
                }
                onClick={() =>
                  moveOption(
                    index,
                    -1,
                  )
                }
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Up
              </button>

              <button
                type="button"
                disabled={
                  disabled ||
                  index ===
                    orderedOptions.length -
                      1
                }
                onClick={() =>
                  moveOption(
                    index,
                    1,
                  )
                }
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Down
              </button>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

function FileUploadResponse() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <FileUp
        className="mx-auto h-8 w-8 text-slate-500"
        aria-hidden="true"
      />

      <p className="mt-3 text-sm font-semibold text-slate-900">
        File upload response
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Secure assessment file uploads will be connected during the runtime storage implementation.
      </p>
    </div>
  );
}

function ResponseEditor({
  question,
  response,
  disabled,
  onResponseChange,
}) {
  switch (
    question.question_type
  ) {
    case "multiple_choice":
    case "true_false":
      return (
        <ChoiceResponse
          question={
            question
          }
          response={
            response
          }
          disabled={
            disabled
          }
          multiple={
            false
          }
          onResponseChange={
            onResponseChange
          }
        />
      );

    case "multiple_response":
      return (
        <ChoiceResponse
          question={
            question
          }
          response={
            response
          }
          disabled={
            disabled
          }
          multiple
          onResponseChange={
            onResponseChange
          }
        />
      );

    case "fill_blank":
      return (
        <TextResponse
          response={
            response
          }
          disabled={
            disabled
          }
          placeholder="Enter the missing word or phrase"
          onResponseChange={
            onResponseChange
          }
        />
      );

    case "short_answer":
      return (
        <TextResponse
          response={
            response
          }
          disabled={
            disabled
          }
          multiline
          placeholder="Enter your answer"
          onResponseChange={
            onResponseChange
          }
        />
      );

    case "essay":
      return (
        <TextResponse
          response={
            response
          }
          disabled={
            disabled
          }
          multiline
          placeholder="Write your essay response"
          onResponseChange={
            onResponseChange
          }
        />
      );

    case "numeric":
      return (
        <NumericResponse
          response={
            response
          }
          disabled={
            disabled
          }
          onResponseChange={
            onResponseChange
          }
        />
      );

    case "matching":
      return (
        <MatchingResponse
          question={
            question
          }
          response={
            response
          }
          disabled={
            disabled
          }
          onResponseChange={
            onResponseChange
          }
        />
      );

    case "ordering":
      return (
        <OrderingResponse
          question={
            question
          }
          response={
            response
          }
          disabled={
            disabled
          }
          onResponseChange={
            onResponseChange
          }
        />
      );

    case "file_upload":
      return (
        <FileUploadResponse />
      );

    default:
      return (
        <TextResponse
          response={
            response
          }
          disabled={
            disabled
          }
          multiline
          placeholder="Enter your response"
          onResponseChange={
            onResponseChange
          }
        />
      );
  }
}

function getTypeIcon(
  questionType,
) {
  switch (
    questionType
  ) {
    case "multiple_choice":
    case "multiple_response":
    case "true_false":
      return CheckSquare2;

    case "matching":
    case "ordering":
      return ListChecks;

    case "essay":
    case "short_answer":
      return MessageSquareText;

    case "file_upload":
      return FileUp;

    default:
      return Type;
  }
}

export default function AssessmentQuestionView({
  question,
  questionNumber = 1,
  totalQuestions = 1,
  response = {},
  disabled = false,
  flagged = false,
  onResponseChange,
  onToggleFlag,
}) {
  if (
    !question
  ) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <AlertCircle
          className="mx-auto h-8 w-8 text-slate-400"
          aria-hidden="true"
        />

        <p className="mt-3 text-sm font-semibold text-slate-900">
          Question unavailable
        </p>
      </section>
    );
  }

  const TypeIcon =
    getTypeIcon(
      question.question_type,
    );

  const prompt =
    question.prompt_snapshot ||
    question.prompt ||
    "Question prompt unavailable.";

  const marks =
    question.maximum_marks ??
    question.default_marks ??
    0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <TypeIcon
              className="h-5 w-5"
              aria-hidden="true"
            />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-700">
              Question{" "}
              {questionNumber} of{" "}
              {totalQuestions}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {getAssessmentLabel(
                  question.question_type,
                )}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {Number(
                  marks,
                ) || 0}{" "}
                {Number(
                  marks,
                ) === 1
                  ? "mark"
                  : "marks"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={
            onToggleFlag
          }
          disabled={
            disabled
          }
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
            flagged
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-slate-300 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <Flag
            className={`h-4 w-4 ${
              flagged
                ? "fill-current"
                : ""
            }`}
            aria-hidden="true"
          />

          {flagged
            ? "Flagged"
            : "Flag for review"}
        </button>
      </header>

      {question.instructions_snapshot ||
      question.instructions ? (
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
            Instructions
          </p>

          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-blue-900">
            {question.instructions_snapshot ||
              question.instructions}
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <h2 className="whitespace-pre-wrap text-lg font-semibold leading-8 text-slate-950 sm:text-xl">
          {prompt}
        </h2>
      </div>

      <div className="mt-7">
        <ResponseEditor
          question={
            question
          }
          response={
            response
          }
          disabled={
            disabled
          }
          onResponseChange={
            onResponseChange
          }
        />
      </div>
    </section>
  );
}