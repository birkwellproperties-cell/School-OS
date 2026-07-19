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

  name: "",
  code: "",
  description: "",
  instructions: "",

  assessment_type: "exam",
  delivery_mode: "online",
  audience_type: "student",
  grade_level: "",

  duration_minutes: "",
  total_marks: "",
  passing_marks: "",
  pass_percentage: "",
  max_attempts: "1",

  randomize_questions: false,
  randomize_sections: false,
  show_results: true,
  show_correct_answers: false,

  status: "draft",
};

const ASSESSMENT_TYPES = [
  "exam",
  "quiz",
  "test",
  "assignment",
  "practice",
  "diagnostic",
  "formative",
  "summative",
];

const DELIVERY_MODES = [
  "online",
  "offline",
  "hybrid",
  "paper",
];

const AUDIENCE_TYPES = [
  "student",
  "staff",
  "applicant",
  "general",
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

function createFormValue(template) {
  if (!template) {
    return {
      ...EMPTY_FORM,
    };
  }

  return {
    bank_id:
      template.bank_id || "",
    category_id:
      template.category_id || "",
    subject_id:
      template.subject_id || "",

    name:
      template.name || "",
    code:
      template.code || "",
    description:
      template.description || "",
    instructions:
      template.instructions || "",

    assessment_type:
      template.assessment_type ||
      "exam",
    delivery_mode:
      template.delivery_mode ||
      "online",
    audience_type:
      template.audience_type ||
      "student",
    grade_level:
      template.grade_level || "",

    duration_minutes:
      String(
        template.duration_minutes ??
          "",
      ),
    total_marks:
      String(
        template.total_marks ??
          "",
      ),
    passing_marks:
      String(
        template.passing_marks ??
          "",
      ),
    pass_percentage:
      String(
        template.pass_percentage ??
          "",
      ),
    max_attempts:
      String(
        template.max_attempts ??
          1,
      ),

    randomize_questions:
      Boolean(
        template.randomize_questions,
      ),
    randomize_sections:
      Boolean(
        template.randomize_sections,
      ),
    show_results:
      template.show_results !==
      false,
    show_correct_answers:
      Boolean(
        template.show_correct_answers,
      ),

    status:
      template.status ||
      "draft",
  };
}

function generateTemplateCode(
  name,
) {
  const normalizedName = String(
    name || "TEMPLATE",
  )
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

  const suffix = Date.now()
    .toString()
    .slice(-6);

  return `${normalizedName || "TEMPLATE"}-${suffix}`;
}

function normalizeNullableNumber(
  value,
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return Number(value);
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

export default function TemplateDialog({
  open,
  mode = "create",
  template = null,

  banks = [],
  categories = [],
  subjects = [],

  loading = false,
  error = "",

  onClose,
  onSubmit,
}) {
  const [
    form,
    setForm,
  ] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      createFormValue(
        mode === "edit"
          ? template
          : null,
      ),
    );
  }, [
    open,
    mode,
    template,
  ]);

  const visibleSubjects =
    useMemo(
      () =>
        form.category_id
          ? subjects.filter(
              (subject) =>
                subject.category_id ===
                form.category_id,
            )
          : subjects,
      [
        subjects,
        form.category_id,
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

    await onSubmit({
      bank_id:
        form.bank_id || null,
      category_id:
        form.category_id || null,
      subject_id:
        form.subject_id || null,

      name:
        form.name.trim(),
      code:
        form.code.trim() ||
        generateTemplateCode(
          form.name,
        ),
      description:
        form.description.trim() ||
        null,
      instructions:
        form.instructions.trim() ||
        null,

      assessment_type:
        form.assessment_type,
      delivery_mode:
        form.delivery_mode,
      audience_type:
        form.audience_type,
      grade_level:
        form.grade_level.trim() ||
        null,

      duration_minutes:
        normalizeNullableNumber(
          form.duration_minutes,
        ),
      total_marks:
        normalizeNullableNumber(
          form.total_marks,
        ),
      passing_marks:
        normalizeNullableNumber(
          form.passing_marks,
        ),
      pass_percentage:
        normalizeNullableNumber(
          form.pass_percentage,
        ),
      max_attempts:
        Number(
          form.max_attempts ||
            1,
        ),

      randomize_questions:
        form.randomize_questions,
      randomize_sections:
        form.randomize_sections,
      show_results:
        form.show_results,
      show_correct_answers:
        form.show_correct_answers,

      status:
        form.status,
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full overflow-hidden rounded-3xl bg-white shadow-2xl"
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">
                Template Builder
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                {mode === "edit"
                  ? "Edit assessment template"
                  : "Create assessment template"}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </header>

          <div className="max-h-[72vh] space-y-7 overflow-y-auto px-6 py-6 sm:px-8">
            {error && (
              <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-800">
                  {error}
                </p>
              </section>
            )}

            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-950">
                Classification
              </h3>

              <div className="grid gap-4 md:grid-cols-3">
                <SelectInput
                  label="Assessment bank"
                  value={form.bank_id}
                  onChange={(event) =>
                    updateField(
                      "bank_id",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    No bank selected
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
                  onChange={(event) => {
                    updateField(
                      "category_id",
                      event.target.value,
                    );

                    updateField(
                      "subject_id",
                      "",
                    );
                  }}
                >
                  <option value="">
                    No category selected
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ),
                  )}
                </SelectInput>

                <SelectInput
                  label="Subject"
                  value={form.subject_id}
                  onChange={(event) =>
                    updateField(
                      "subject_id",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    No subject selected
                  </option>

                  {visibleSubjects.map(
                    (subject) => (
                      <option
                        key={subject.id}
                        value={subject.id}
                      >
                        {subject.name}
                      </option>
                    ),
                  )}
                </SelectInput>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-950">
                Template details
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Template name"
                  required
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value,
                    )
                  }
                />

                <TextInput
                  label="Code"
                  placeholder="Generated automatically when blank"
                  value={form.code}
                  onChange={(event) =>
                    updateField(
                      "code",
                      event.target.value,
                    )
                  }
                />

                <SelectInput
                  label="Assessment type"
                  required
                  value={
                    form.assessment_type
                  }
                  onChange={(event) =>
                    updateField(
                      "assessment_type",
                      event.target.value,
                    )
                  }
                >
                  {ASSESSMENT_TYPES.map(
                    (value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {formatLabel(
                          value,
                        )}
                      </option>
                    ),
                  )}
                </SelectInput>

                <SelectInput
                  label="Delivery mode"
                  required
                  value={
                    form.delivery_mode
                  }
                  onChange={(event) =>
                    updateField(
                      "delivery_mode",
                      event.target.value,
                    )
                  }
                >
                  {DELIVERY_MODES.map(
                    (value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {formatLabel(
                          value,
                        )}
                      </option>
                    ),
                  )}
                </SelectInput>

                <SelectInput
                  label="Audience"
                  required
                  value={
                    form.audience_type
                  }
                  onChange={(event) =>
                    updateField(
                      "audience_type",
                      event.target.value,
                    )
                  }
                >
                  {AUDIENCE_TYPES.map(
                    (value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {formatLabel(
                          value,
                        )}
                      </option>
                    ),
                  )}
                </SelectInput>

                <TextInput
                  label="Grade level"
                  value={
                    form.grade_level
                  }
                  onChange={(event) =>
                    updateField(
                      "grade_level",
                      event.target.value,
                    )
                  }
                />
              </div>

              <label className="block space-y-1.5">
                <FieldLabel>
                  Description
                </FieldLabel>

                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block space-y-1.5">
                <FieldLabel>
                  Instructions
                </FieldLabel>

                <textarea
                  rows={4}
                  value={form.instructions}
                  onChange={(event) =>
                    updateField(
                      "instructions",
                      event.target.value,
                    )
                  }
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-950">
                Scoring and delivery
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <TextInput
                  type="number"
                  min="1"
                  label="Duration"
                  value={
                    form.duration_minutes
                  }
                  onChange={(event) =>
                    updateField(
                      "duration_minutes",
                      event.target.value,
                    )
                  }
                />

                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  label="Total marks"
                  value={
                    form.total_marks
                  }
                  onChange={(event) =>
                    updateField(
                      "total_marks",
                      event.target.value,
                    )
                  }
                />

                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  label="Passing marks"
                  value={
                    form.passing_marks
                  }
                  onChange={(event) =>
                    updateField(
                      "passing_marks",
                      event.target.value,
                    )
                  }
                />

                <TextInput
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  label="Pass percentage"
                  value={
                    form.pass_percentage
                  }
                  onChange={(event) =>
                    updateField(
                      "pass_percentage",
                      event.target.value,
                    )
                  }
                />

                <TextInput
                  type="number"
                  min="1"
                  label="Max attempts"
                  value={
                    form.max_attempts
                  }
                  onChange={(event) =>
                    updateField(
                      "max_attempts",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  [
                    "randomize_questions",
                    "Randomize questions",
                  ],
                  [
                    "randomize_sections",
                    "Randomize sections",
                  ],
                  [
                    "show_results",
                    "Show results",
                  ],
                  [
                    "show_correct_answers",
                    "Show correct answers",
                  ],
                ].map(
                  ([field, label]) => (
                    <label
                      key={field}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={
                          form[field]
                        }
                        onChange={(event) =>
                          updateField(
                            field,
                            event.target
                              .checked,
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />

                      <span className="text-sm font-medium text-slate-700">
                        {label}
                      </span>
                    </label>
                  ),
                )}
              </div>
            </section>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !form.name.trim()
              }
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

              {mode === "edit"
                ? "Save changes"
                : "Create template"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
