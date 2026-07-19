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
  name: "",
  code: "",
  description: "",
  display_order: "0",
  status: "active",

  parent_category_id: "",

  category_id: "",
  grade_level_from: "",
  grade_level_to: "",

  subject_id: "",
  parent_topic_id: "",
  learning_outcome: "",
};

function createFormValue({
  type,
  record,
  selectedCategoryId,
  selectedSubjectId,
}) {
  if (!record) {
    return {
      ...EMPTY_FORM,

      category_id:
        type === "subject"
          ? selectedCategoryId || ""
          : "",

      subject_id:
        type === "topic"
          ? selectedSubjectId || ""
          : "",
    };
  }

  return {
    ...EMPTY_FORM,

    name:
      record.name || "",

    code:
      record.code || "",

    description:
      record.description || "",

    display_order:
      String(
        record.display_order ?? 0,
      ),

    status:
      record.status || "active",

    parent_category_id:
      record.parent_category_id || "",

    category_id:
      record.category_id || "",

    grade_level_from:
      record.grade_level_from || "",

    grade_level_to:
      record.grade_level_to || "",

    subject_id:
      record.subject_id || "",

    parent_topic_id:
      record.parent_topic_id || "",

    learning_outcome:
      record.learning_outcome || "",
  };
}

function getEntityLabel(type) {
  if (type === "category") {
    return "category";
  }

  if (type === "subject") {
    return "subject";
  }

  return "topic";
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
      <FieldLabel required={required}>
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
      <FieldLabel required={required}>
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

export default function TaxonomyDialog({
  open,
  mode = "create",
  type = "category",

  record = null,

  categories = [],
  subjects = [],
  topics = [],

  selectedCategoryId = null,
  selectedSubjectId = null,

  loading = false,
  error = "",

  onClose,
  onSubmit,
}) {
  const [
    form,
    setForm,
  ] = useState(EMPTY_FORM);

  const [
    localError,
    setLocalError,
  ] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      createFormValue({
        type,
        record,
        selectedCategoryId,
        selectedSubjectId,
      }),
    );

    setLocalError("");
  }, [
    open,
    mode,
    type,
    record?.id,
    selectedCategoryId,
    selectedSubjectId,
  ]);

  const availableParentCategories =
    useMemo(
      () =>
        categories.filter(
          (category) =>
            category.id !== record?.id,
        ),
      [
        categories,
        record?.id,
      ],
    );

  const availableParentTopics =
    useMemo(
      () =>
        topics.filter(
          (topic) =>
            topic.id !== record?.id &&
            (
              !form.subject_id ||
              topic.subject_id ===
                form.subject_id
            ),
        ),
      [
        topics,
        record?.id,
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

    if (!form.name.trim()) {
      setLocalError(
        "Name is required.",
      );

      return;
    }

    if (!form.code.trim()) {
      setLocalError(
        "Code is required.",
      );

      return;
    }

    if (
      !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(
        form.code.trim(),
      )
    ) {
      setLocalError(
        "Code may contain only letters, numbers, underscores, and hyphens.",
      );

      return;
    }

    const displayOrder =
      Number(
        form.display_order,
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
      type === "topic" &&
      !form.subject_id
    ) {
      setLocalError(
        "A subject is required for every topic.",
      );

      return;
    }

    const commonPayload = {
      name:
        form.name.trim(),

      code:
        form.code.trim(),

      description:
        form.description.trim() ||
        null,

      display_order:
        displayOrder,

      status:
        form.status,
    };

    if (type === "category") {
      await onSubmit({
        ...commonPayload,

        parent_category_id:
          form.parent_category_id ||
          null,
      });

      return;
    }

    if (type === "subject") {
      await onSubmit({
        ...commonPayload,

        category_id:
          form.category_id ||
          null,

        grade_level_from:
          form.grade_level_from.trim() ||
          null,

        grade_level_to:
          form.grade_level_to.trim() ||
          null,
      });

      return;
    }

    await onSubmit({
      ...commonPayload,

      subject_id:
        form.subject_id,

      parent_topic_id:
        form.parent_topic_id ||
        null,

      learning_outcome:
        form.learning_outcome.trim() ||
        null,
    });
  }

  const displayedError =
    localError ||
    error;

  const entityLabel =
    getEntityLabel(type);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <section className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Assessment Taxonomy
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              {mode === "edit"
                ? `Edit ${entityLabel}`
                : `Create ${entityLabel}`}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Configure classification data
              used by assessment authoring.
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
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {displayedError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                {displayedError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Name"
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
                required
                value={form.code}
                onChange={(event) =>
                  updateField(
                    "code",
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
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value,
                  )
                }
                rows={3}
                className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            {type === "category" && (
              <SelectInput
                label="Parent category"
                value={
                  form.parent_category_id
                }
                onChange={(event) =>
                  updateField(
                    "parent_category_id",
                    event.target.value,
                  )
                }
              >
                <option value="">
                  No parent category
                </option>

                {availableParentCategories.map(
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
            )}

            {type === "subject" && (
              <>
                <SelectInput
                  label="Category"
                  value={form.category_id}
                  onChange={(event) =>
                    updateField(
                      "category_id",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    No category
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput
                    label="Grade level from"
                    value={
                      form.grade_level_from
                    }
                    onChange={(event) =>
                      updateField(
                        "grade_level_from",
                        event.target.value,
                      )
                    }
                    placeholder="Grade 1"
                  />

                  <TextInput
                    label="Grade level to"
                    value={
                      form.grade_level_to
                    }
                    onChange={(event) =>
                      updateField(
                        "grade_level_to",
                        event.target.value,
                      )
                    }
                    placeholder="Grade 12"
                  />
                </div>
              </>
            )}

            {type === "topic" && (
              <>
                <SelectInput
                  label="Subject"
                  required
                  value={form.subject_id}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        subject_id:
                          event.target.value,

                        parent_topic_id:
                          "",
                      }),
                    )
                  }
                >
                  <option value="">
                    Select a subject
                  </option>

                  {subjects.map(
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

                <SelectInput
                  label="Parent topic"
                  value={
                    form.parent_topic_id
                  }
                  onChange={(event) =>
                    updateField(
                      "parent_topic_id",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    No parent topic
                  </option>

                  {availableParentTopics.map(
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
                    className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Display order"
                type="number"
                min="0"
                step="1"
                value={form.display_order}
                onChange={(event) =>
                  updateField(
                    "display_order",
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
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

                <option value="archived">
                  Archived
                </option>
              </SelectInput>
            </div>
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
                : mode === "edit"
                  ? "Save changes"
                  : `Create ${entityLabel}`}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}