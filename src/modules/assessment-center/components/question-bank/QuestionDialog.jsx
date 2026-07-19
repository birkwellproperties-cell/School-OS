import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Loader2,
  Save,
  X,
} from "lucide-react";

const EMPTY_FORM = {
  bank_id: "",
  category_id: "",
  subject_id: "",
  topic_id: "",

  title: "",
  question_type:
    "multiple_choice",

  prompt: "",
  prompt_format:
    "plain_text",

  instructions: "",
  learning_outcome: "",
  explanation: "",

  difficulty: "medium",

  default_marks: "1",
  negative_marks: "0",

  allow_partial_credit: false,
  status: "draft",
};

const QUESTION_TYPES = [
  {
    value: "multiple_choice",
    label: "Multiple choice",
  },
  {
    value: "multiple_response",
    label: "Multiple response",
  },
  {
    value: "true_false",
    label: "True / false",
  },
  {
    value: "short_answer",
    label: "Short answer",
  },
  {
    value: "essay",
    label: "Essay",
  },
  {
    value: "numeric",
    label: "Numeric",
  },
  {
    value: "fill_blank",
    label: "Fill in blank",
  },
  {
    value: "matching",
    label: "Matching",
  },
  {
    value: "ordering",
    label: "Ordering",
  },
];

const DIFFICULTIES = [
  "very_easy",
  "easy",
  "medium",
  "hard",
  "very_hard",
];

const STATUSES = [
  "draft",
  "review",
  "approved",
  "active",
  "paused",
  "retired",
  "archived",
];

function formatLabel(value) {
  return String(value)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function createFormValue(question) {
  if (!question) {
    return {
      ...EMPTY_FORM,
    };
  }

  return {
    bank_id:
      question.bank_id ||
      "",

    category_id:
      question.category_id ||
      "",

    subject_id:
      question.subject_id ||
      "",

    topic_id:
      question.topic_id ||
      "",

    title:
      question.title ||
      "",

    question_type:
      question.question_type ||
      "multiple_choice",

    prompt:
      question.prompt ||
      "",

    prompt_format:
      question.prompt_format ||
      "plain_text",

    instructions:
      question.instructions ||
      "",

    learning_outcome:
      question.learning_outcome ||
      "",

    explanation:
      question.explanation ||
      "",

    difficulty:
      question.difficulty ||
      "medium",

    default_marks:
      String(
        question.default_marks ??
          1,
      ),

    negative_marks:
      String(
        question.negative_marks ??
          0,
      ),

    allow_partial_credit:
      Boolean(
        question
          .allow_partial_credit,
      ),
status:
      question.status ||
      "draft",
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

function TextInput({
  label,
  required = false,
  ...props
}) {
  return (
    <label className="space-y-1.5">
      <FieldLabel
        required={required}
      >
        {label}
      </FieldLabel>

      <input
        {...props}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectInput({
  label,
  required = false,
  children,
  ...props
}) {
  return (
    <label className="space-y-1.5">
      <FieldLabel
        required={required}
      >
        {label}
      </FieldLabel>

      <select
        {...props}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  );
}

export default function QuestionDialog({
  open,
  mode = "create",
  question = null,

  banks = [],
  categories = [],
  subjects = [],
  topics = [],

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
        question,
      ),
    );

    setLocalError("");
  }, [
    open,
    mode,
    question?.id,
  ]);

  const availableSubjects =
    useMemo(
      () =>
        subjects.filter(
          (subject) =>
            !form.category_id ||
            subject.category_id ===
              form.category_id,
        ),
      [
        subjects,
        form.category_id,
      ],
    );

  const availableTopics =
    useMemo(
      () =>
        topics.filter(
          (topic) =>
            !form.subject_id ||
            topic.subject_id ===
              form.subject_id,
        ),
      [
        topics,
        form.subject_id,
      ],
    );

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

    if (!form.bank_id) {
      setLocalError(
        "Assessment bank is required.",
      );

      return;
    }

    if (
      !form.question_type
    ) {
      setLocalError(
        "Question type is required.",
      );

      return;
    }

    if (!form.prompt.trim()) {
      setLocalError(
        "Question prompt is required.",
      );

      return;
    }

    const defaultMarks =
      Number(
        form.default_marks,
      );

    const negativeMarks =
      Number(
        form.negative_marks,
      );

    if (
      !Number.isFinite(
        defaultMarks,
      ) ||
      defaultMarks < 0
    ) {
      setLocalError(
        "Default marks must be zero or greater.",
      );

      return;
    }

    if (
      !Number.isFinite(
        negativeMarks,
      ) ||
      negativeMarks < 0
    ) {
      setLocalError(
        "Negative marks must be zero or greater.",
      );

      return;
    }

    await onSubmit({
      bank_id:
        form.bank_id,

      category_id:
        form.category_id ||
        null,

      subject_id:
        form.subject_id ||
        null,

      topic_id:
        form.topic_id ||
        null,

      title:
        form.title.trim() ||
        null,

      question_type:
        form.question_type,

      prompt:
        form.prompt.trim(),

      prompt_format:
        form.prompt_format,

      instructions:
        form.instructions.trim() ||
        null,

      learning_outcome:
        form.learning_outcome.trim() ||
        null,

      explanation:
        form.explanation.trim() ||
        null,

      difficulty:
        form.difficulty,

      default_marks:
        defaultMarks,

      negative_marks:
        negativeMarks,

      allow_partial_credit:
        form.allow_partial_credit,
status:
        form.status,
    });
  }

  const displayedError =
    localError ||
    error;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <section className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Question Builder
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              {isEditMode
                ? "Edit question"
                : "Create question"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Configure the question content,
              classification, scoring, and
              authoring controls.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X size={21} />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
            {displayedError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                {displayedError}
              </div>
            )}

            <section className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-950">
                  Classification
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  Place the question in the
                  appropriate bank and taxonomy.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SelectInput
                  label="Assessment bank"
                  required
                  value={form.bank_id}
                  onChange={(event) =>
                    updateField(
                      "bank_id",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Select a bank
                  </option>

                  {banks.map(
                    (bank) => (
                      <option
                        key={bank.id}
                        value={bank.id}
                      >
                        {bank.name}
                      </option>
                    ),
                  )}
                </SelectInput>

                <SelectInput
                  label="Category"
                  value={
                    form.category_id
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        category_id:
                          event
                            .target
                            .value,

                        subject_id:
                          "",

                        topic_id:
                          "",
                      }),
                    )
                  }
                >
                  <option value="">
                    No category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {category.name}
                      </option>
                    ),
                  )}
                </SelectInput>

                <SelectInput
                  label="Subject"
                  value={
                    form.subject_id
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        subject_id:
                          event
                            .target
                            .value,

                        topic_id:
                          "",
                      }),
                    )
                  }
                >
                  <option value="">
                    No subject
                  </option>

                  {availableSubjects.map(
                    (subject) => (
                      <option
                        key={
                          subject.id
                        }
                        value={
                          subject.id
                        }
                      >
                        {subject.name}
                      </option>
                    ),
                  )}
                </SelectInput>

                <SelectInput
                  label="Topic"
                  value={form.topic_id}
                  onChange={(event) =>
                    updateField(
                      "topic_id",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    No topic
                  </option>

                  {availableTopics.map(
                    (topic) => (
                      <option
                        key={topic.id}
                        value={topic.id}
                      >
                        {topic.name}
                      </option>
                    ),
                  )}
                </SelectInput>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-950">
                  Question content
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  Define what candidates will
                  read and answer.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Title"
                  value={form.title}
                  onChange={(event) =>
                    updateField(
                      "title",
                      event.target.value,
                    )
                  }
                  placeholder="Optional internal title"
                />

                <SelectInput
                  label="Question type"
                  required
                  value={
                    form.question_type
                  }
                  onChange={(event) =>
                    updateField(
                      "question_type",
                      event.target.value,
                    )
                  }
                >
                  {QUESTION_TYPES.map(
                    (type) => (
                      <option
                        key={type.value}
                        value={type.value}
                      >
                        {type.label}
                      </option>
                    ),
                  )}
                </SelectInput>
              </div>

              <label className="block space-y-1.5">
                <FieldLabel required>
                  Prompt
                </FieldLabel>

                <textarea
                  value={form.prompt}
                  onChange={(event) =>
                    updateField(
                      "prompt",
                      event.target.value,
                    )
                  }
                  rows={6}
                  placeholder="Enter the question prompt"
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block space-y-1.5">
                <FieldLabel>
                  Instructions
                </FieldLabel>

                <textarea
                  value={
                    form.instructions
                  }
                  onChange={(event) =>
                    updateField(
                      "instructions",
                      event.target.value,
                    )
                  }
                  rows={3}
                  placeholder="Optional candidate instructions"
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1.5">
                  <FieldLabel>
                    Learning outcome
                  </FieldLabel>

                  <textarea
                    value={
                      form.learning_outcome
                    }
                    onChange={(event) =>
                      updateField(
                        "learning_outcome",
                        event.target.value,
                      )
                    }
                    rows={3}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block space-y-1.5">
                  <FieldLabel>
                    Explanation
                  </FieldLabel>

                  <textarea
                    value={
                      form.explanation
                    }
                    onChange={(event) =>
                      updateField(
                        "explanation",
                        event.target.value,
                      )
                    }
                    rows={3}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-950">
                  Scoring and controls
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <SelectInput
                  label="Difficulty"
                  value={form.difficulty}
                  onChange={(event) =>
                    updateField(
                      "difficulty",
                      event.target.value,
                    )
                  }
                >
                  {DIFFICULTIES.map(
                    (difficulty) => (
                      <option
                        key={
                          difficulty
                        }
                        value={
                          difficulty
                        }
                      >
                        {formatLabel(
                          difficulty,
                        )}
                      </option>
                    ),
                  )}
                </SelectInput>

                <TextInput
                  label="Default marks"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.default_marks
                  }
                  onChange={(event) =>
                    updateField(
                      "default_marks",
                      event.target.value,
                    )
                  }
                />

                <TextInput
                  label="Negative marks"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.negative_marks
                  }
                  onChange={(event) =>
                    updateField(
                      "negative_marks",
                      event.target.value,
                    )
                  }
                />

                <SelectInput
                  label="Status"
                  value={form.status}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value,
                    )
                  }
                >
                  {STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {formatLabel(
                          status,
                        )}
                      </option>
                    ),
                  )}
                </SelectInput>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      form
                        .allow_partial_credit
                    }
                    onChange={(event) =>
                      updateField(
                        "allow_partial_credit",
                        event.target.checked,
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />

                  <span className="text-sm font-medium text-slate-700">
                    Allow partial credit
                  </span>
                </label>
              </div>
            </section>
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                ? "SavingÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦"
                : isEditMode
                  ? "Save changes"
                  : "Create question"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}