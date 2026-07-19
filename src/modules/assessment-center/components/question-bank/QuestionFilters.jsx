const QUESTION_TYPES = [
  {
    value: "",
    label: "All question types",
  },
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
  {
    value: "",
    label: "All difficulties",
  },
  {
    value: "very_easy",
    label: "Very easy",
  },
  {
    value: "easy",
    label: "Easy",
  },
  {
    value: "medium",
    label: "Medium",
  },
  {
    value: "hard",
    label: "Hard",
  },
  {
    value: "very_hard",
    label: "Very hard",
  },
];

const STATUSES = [
  {
    value: "",
    label: "All statuses",
  },
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "review",
    label: "Review",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "paused",
    label: "Paused",
  },
  {
    value: "retired",
    label: "Retired",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

function SelectField({
  label,
  value,
  onChange,
  children,
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  );
}

export default function QuestionFilters({
  filters,
  banks,
  categories,
  subjects,
  topics,
  onChange,
  onReset,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SelectField
          label="Question bank"
          value={filters.bankId}
          onChange={(event) =>
            onChange({
              bankId:
                event.target.value,
            })
          }
        >
          <option value="">
            All banks
          </option>

          {banks.map((bank) => (
            <option
              key={bank.id}
              value={bank.id}
            >
              {bank.name}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Category"
          value={filters.categoryId}
          onChange={(event) =>
            onChange({
              categoryId:
                event.target.value,

              subjectId: "",
              topicId: "",
            })
          }
        >
          <option value="">
            All categories
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
        </SelectField>

        <SelectField
          label="Subject"
          value={filters.subjectId}
          onChange={(event) =>
            onChange({
              subjectId:
                event.target.value,

              topicId: "",
            })
          }
        >
          <option value="">
            All subjects
          </option>

          {subjects
            .filter(
              (subject) =>
                !filters.categoryId ||
                subject.category_id ===
                  filters.categoryId,
            )
            .map((subject) => (
              <option
                key={subject.id}
                value={subject.id}
              >
                {subject.name}
              </option>
            ))}
        </SelectField>

        <SelectField
          label="Topic"
          value={filters.topicId}
          onChange={(event) =>
            onChange({
              topicId:
                event.target.value,
            })
          }
        >
          <option value="">
            All topics
          </option>

          {topics
            .filter(
              (topic) =>
                !filters.subjectId ||
                topic.subject_id ===
                  filters.subjectId,
            )
            .map((topic) => (
              <option
                key={topic.id}
                value={topic.id}
              >
                {topic.name}
              </option>
            ))}
        </SelectField>

        <SelectField
          label="Question type"
          value={filters.questionType}
          onChange={(event) =>
            onChange({
              questionType:
                event.target.value,
            })
          }
        >
          {QUESTION_TYPES.map(
            (option) => (
              <option
                key={
                  option.value ||
                  "all"
                }
                value={option.value}
              >
                {option.label}
              </option>
            ),
          )}
        </SelectField>

        <SelectField
          label="Difficulty"
          value={filters.difficulty}
          onChange={(event) =>
            onChange({
              difficulty:
                event.target.value,
            })
          }
        >
          {DIFFICULTIES.map(
            (option) => (
              <option
                key={
                  option.value ||
                  "all"
                }
                value={option.value}
              >
                {option.label}
              </option>
            ),
          )}
        </SelectField>

        <SelectField
          label="Status"
          value={filters.status}
          onChange={(event) =>
            onChange({
              status:
                event.target.value,
            })
          }
        >
          {STATUSES.map(
            (option) => (
              <option
                key={
                  option.value ||
                  "all"
                }
                value={option.value}
              >
                {option.label}
              </option>
            ),
          )}
        </SelectField>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onReset}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Reset filters
          </button>
        </div>
      </div>
    </section>
  );
}