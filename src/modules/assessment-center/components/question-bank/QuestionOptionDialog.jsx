import {
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  Save,
  X,
} from "lucide-react";

const EMPTY_FORM = {
  option_key: "",
  option_text: "",
  option_format: "plain_text",
  display_order: "0",
  is_correct: false,
  score_fraction: "0",
  matching_key: "",
  response_value: "",
  feedback: "",
};

function createFormValue(
  option,
  suggestedOrder = 0,
) {
  if (!option) {
    return {
      ...EMPTY_FORM,

      display_order:
        String(
          suggestedOrder,
        ),
    };
  }

  return {
    option_key:
      option.option_key ||
      "",

    option_text:
      option.option_text ||
      "",

    option_format:
      option.option_format ||
      "plain_text",

    display_order:
      String(
        option.display_order ??
          suggestedOrder,
      ),

    is_correct:
      Boolean(
        option.is_correct,
      ),

    score_fraction:
      String(
        option.score_fraction ??
          0,
      ),

    matching_key:
      option.matching_key ||
      "",

    response_value:
      option.response_value ||
      "",

    feedback:
      option.feedback ||
      "",
  };
}

function FieldLabel({
  children,
  required = false,
}) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
      {required ? " *" : ""}
    </span>
  );
}

export default function QuestionOptionDialog({
  open,
  mode = "create",
  option = null,
  suggestedOrder = 0,
  loading = false,
  error = "",
  onClose,
  onSubmit,
}) {
  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM,
  );

  const [
    localError,
    setLocalError,
  ] = useState("");

  const isEditMode =
    mode === "edit";

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      createFormValue(
        option,
        suggestedOrder,
      ),
    );

    setLocalError("");
  }, [
    open,
    mode,
    option?.id,
    suggestedOrder,
  ]);

  if (!open) {
    return null;
  }

  function updateField(
    field,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    setLocalError("");

    if (
      !form.option_key.trim()
    ) {
      setLocalError(
        "Option key is required.",
      );

      return;
    }

    if (
      !form.option_text.trim()
    ) {
      setLocalError(
        "Option text is required.",
      );

      return;
    }

    const displayOrder =
      Number(
        form.display_order,
      );

    const scoreFraction =
      Number(
        form.score_fraction,
      );

    if (
      !Number.isInteger(
        displayOrder,
      ) ||
      displayOrder < 0
    ) {
      setLocalError(
        "Display order must be a whole number of zero or greater.",
      );

      return;
    }

    if (
      !Number.isFinite(
        scoreFraction,
      ) ||
      scoreFraction < 0 ||
      scoreFraction > 1
    ) {
      setLocalError(
        "Score fraction must be between 0 and 1.",
      );

      return;
    }

    if (
      form.is_correct &&
      scoreFraction <= 0
    ) {
      setLocalError(
        "A correct option must have a score fraction greater than zero.",
      );

      return;
    }

    await onSubmit({
      option_key:
        form.option_key
          .trim(),

      option_text:
        form.option_text
          .trim(),

      option_format:
        form.option_format,

      display_order:
        displayOrder,

      is_correct:
        form.is_correct,

      score_fraction:
        scoreFraction,

      matching_key:
        form.matching_key
          .trim() ||
        null,

      response_value:
        form.response_value
          .trim() ||
        null,

      feedback:
        form.feedback
          .trim() ||
        null,
    });
  }

  const displayedError =
    localError ||
    error;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <section className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Answer Option
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              {isEditMode
                ? "Edit option"
                : "Create option"}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Configure option content, order,
              correctness, score contribution,
              and candidate feedback.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={21} />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
        >
          <div className="space-y-5 px-6 py-6">
            {displayedError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                {displayedError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
              <label className="space-y-1.5">
                <FieldLabel required>
                  Option key
                </FieldLabel>

                <input
                  value={
                    form.option_key
                  }
                  onChange={(event) =>
                    updateField(
                      "option_key",
                      event.target.value,
                    )
                  }
                  placeholder="A"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="space-y-1.5">
                <FieldLabel>
                  Format
                </FieldLabel>

                <select
                  value={
                    form.option_format
                  }
                  onChange={(event) =>
                    updateField(
                      "option_format",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="plain_text">
                    Plain text
                  </option>

                  <option value="markdown">
                    Markdown
                  </option>

                  <option value="html">
                    HTML
                  </option>
                </select>
              </label>
            </div>

            <label className="block space-y-1.5">
              <FieldLabel required>
                Option text
              </FieldLabel>

              <textarea
                value={
                  form.option_text
                }
                onChange={(event) =>
                  updateField(
                    "option_text",
                    event.target.value,
                  )
                }
                rows={4}
                placeholder="Enter the answer option"
                className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <FieldLabel>
                  Display order
                </FieldLabel>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    form.display_order
                  }
                  onChange={(event) =>
                    updateField(
                      "display_order",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="space-y-1.5">
                <FieldLabel>
                  Score fraction
                </FieldLabel>

                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={
                    form.score_fraction
                  }
                  onChange={(event) =>
                    updateField(
                      "score_fraction",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <input
                type="checkbox"
                checked={
                  form.is_correct
                }
                onChange={(event) => {
                  const checked =
                    event.target
                      .checked;

                  setForm(
                    (current) => ({
                      ...current,

                      is_correct:
                        checked,

                      score_fraction:
                        checked &&
                        Number(
                          current
                            .score_fraction,
                        ) <= 0
                          ? "1"
                          : current
                              .score_fraction,
                    }),
                  );
                }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />

              <span className="text-sm font-medium text-slate-700">
                This is a correct option
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <FieldLabel>
                  Matching key
                </FieldLabel>

                <input
                  value={
                    form.matching_key
                  }
                  onChange={(event) =>
                    updateField(
                      "matching_key",
                      event.target.value,
                    )
                  }
                  placeholder="Optional matching identifier"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="space-y-1.5">
                <FieldLabel>
                  Response value
                </FieldLabel>

                <input
                  value={
                    form.response_value
                  }
                  onChange={(event) =>
                    updateField(
                      "response_value",
                      event.target.value,
                    )
                  }
                  placeholder="Optional normalized value"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <FieldLabel>
                Feedback
              </FieldLabel>

              <textarea
                value={form.feedback}
                onChange={(event) =>
                  updateField(
                    "feedback",
                    event.target.value,
                  )
                }
                rows={3}
                placeholder="Optional feedback shown after grading"
                className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              {loading
                ? "Saving…"
                : isEditMode
                  ? "Save changes"
                  : "Create option"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}