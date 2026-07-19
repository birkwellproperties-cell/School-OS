import {
  useEffect,
  useState,
} from "react";

import {
  X,
} from "lucide-react";

const EMPTY_FORM = {
  section_number: "",
  title: "",
  section_type: "standard",
  description: "",
  instructions: "",
  display_order: 0,
  duration_minutes: "",
  marks: "",
  question_count: "",
  questions_to_attempt: "",
  randomize_questions: false,
  status: "active",
};

function optionalNumber(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

export default function TemplateSectionDialog({
  open,
  mode = "create",
  section = null,
  defaultDisplayOrder = 0,
  loading = false,
  error = "",
  onClose,
  onSubmit,
}) {
  const [form, setForm] =
    useState(EMPTY_FORM);

  const [
    validationError,
    setValidationError,
  ] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setValidationError("");

    setForm({
      ...EMPTY_FORM,
      section_number:
        section?.section_number || "",
      title: section?.title || "",
      section_type:
        section?.section_type ||
        "standard",
      description:
        section?.description || "",
      instructions:
        section?.instructions || "",
      display_order:
        section?.display_order ??
        defaultDisplayOrder,
      duration_minutes:
        section?.duration_minutes ?? "",
      marks: section?.marks ?? "",
      question_count:
        section?.question_count ?? "",
      questions_to_attempt:
        section?.questions_to_attempt ??
        "",
      randomize_questions:
        Boolean(
          section?.randomize_questions,
        ),
      status:
        section?.status || "active",
    });
  }, [
    open,
    section,
    defaultDisplayOrder,
  ]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const sectionNumber =
      form.section_number.trim();
    const title =
      form.title.trim();

    if (!sectionNumber) {
      setValidationError(
        "Section number is required.",
      );
      return;
    }

    if (!title) {
      setValidationError(
        "Section title is required.",
      );
      return;
    }

    const questionCount =
      optionalNumber(
        form.question_count,
      );

    const questionsToAttempt =
      optionalNumber(
        form.questions_to_attempt,
      );

    if (
      questionCount !== null &&
      questionsToAttempt !== null &&
      questionsToAttempt >
        questionCount
    ) {
      setValidationError(
        "Questions to attempt cannot exceed question count.",
      );
      return;
    }

    setValidationError("");

    await onSubmit({
      section_number:
        sectionNumber,
      title,
      section_type:
        form.section_type,
      description:
        form.description.trim() ||
        null,
      instructions:
        form.instructions.trim() ||
        null,
      display_order:
        Number(
          form.display_order || 0,
        ),
      duration_minutes:
        optionalNumber(
          form.duration_minutes,
        ),
      marks:
        optionalNumber(form.marks),
      question_count:
        questionCount,
      questions_to_attempt:
        questionsToAttempt,
      randomize_questions:
        form.randomize_questions,
      status: form.status,
    });
  }

  if (!open) {
    return null;
  }

  const visibleError =
    validationError || error;

  const inputClass =
    "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Assessment structure
            </p>

            <h3 className="mt-1 text-xl font-semibold text-slate-950">
              {mode === "edit"
                ? "Edit section"
                : "New section"}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {visibleError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {visibleError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Section number
              </span>
              <input
                value={
                  form.section_number
                }
                onChange={(event) =>
                  updateField(
                    "section_number",
                    event.target.value,
                  )
                }
                placeholder="A or 1"
                className={inputClass}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Title
              </span>
              <input
                value={form.title}
                onChange={(event) =>
                  updateField(
                    "title",
                    event.target.value,
                  )
                }
                placeholder="Multiple Choice"
                className={inputClass}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Section type
              </span>
              <select
                value={
                  form.section_type
                }
                onChange={(event) =>
                  updateField(
                    "section_type",
                    event.target.value,
                  )
                }
                className={inputClass}
              >
                <option value="standard">
                  Standard
                </option>
                <option value="instructions">
                  Instructions
                </option>
                <option value="question_pool">
                  Question pool
                </option>
                <option value="adaptive">
                  Adaptive
                </option>
                <option value="manual_review">
                  Manual review
                </option>
                <option value="break">
                  Break
                </option>
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Status
              </span>
              <select
                value={form.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value,
                  )
                }
                className={inputClass}
              >
                <option value="active">
                  Active
                </option>
                <option value="inactive">
                  Inactive
                </option>
                <option value="archived">
                  Archived
                </option>
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Display order
              </span>
              <input
                type="number"
                min="0"
                value={
                  form.display_order
                }
                onChange={(event) =>
                  updateField(
                    "display_order",
                    event.target.value,
                  )
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Duration in minutes
              </span>
              <input
                type="number"
                min="1"
                value={
                  form.duration_minutes
                }
                onChange={(event) =>
                  updateField(
                    "duration_minutes",
                    event.target.value,
                  )
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Marks
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.marks}
                onChange={(event) =>
                  updateField(
                    "marks",
                    event.target.value,
                  )
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Question count
              </span>
              <input
                type="number"
                min="0"
                value={
                  form.question_count
                }
                onChange={(event) =>
                  updateField(
                    "question_count",
                    event.target.value,
                  )
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Questions to attempt
              </span>
              <input
                type="number"
                min="0"
                value={
                  form.questions_to_attempt
                }
                onChange={(event) =>
                  updateField(
                    "questions_to_attempt",
                    event.target.value,
                  )
                }
                className={inputClass}
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Description
            </span>
            <textarea
              rows="3"
              value={form.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Candidate instructions
            </span>
            <textarea
              rows="4"
              value={form.instructions}
              onChange={(event) =>
                updateField(
                  "instructions",
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input
              type="checkbox"
              checked={
                form.randomize_questions
              }
              onChange={(event) =>
                updateField(
                  "randomize_questions",
                  event.target.checked,
                )
              }
              className="h-4 w-4"
            />

            <span className="text-sm font-semibold text-slate-800">
              Randomize assigned questions
            </span>
          </label>

          <footer className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : mode === "edit"
                  ? "Save changes"
                  : "Create section"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
