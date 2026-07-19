import {
  useState,
} from "react";

import {
  Archive,
  Pencil,
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  useAssessment,
} from "../../context";

import TaxonomyDialog from "./TaxonomyDialog";

function StatusBadge({
  status,
}) {
  const className =
    status === "active"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "inactive"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${className}`}
    >
      {status}
    </span>
  );
}

function TaxonomyColumn({
  title,
  description,

  items,
  selectedId,

  loading,
  error,

  canCreate,
  canEdit,

  addDisabled = false,

  onSelect,
  onRefresh,
  onCreate,
  onEdit,
  onArchive,
}) {
  return (
    <section className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-950">
              {title}
            </h3>

            <p className="mt-1 text-sm leading-5 text-slate-600">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {canCreate && (
            <button
              type="button"
              onClick={onCreate}
              disabled={addDisabled}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={15} />
              Add
            </button>
          )}

          {canEdit &&
            selectedId && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <Pencil size={15} />
                Edit
              </button>

              <button
                type="button"
                onClick={onArchive}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <Archive size={15} />
                Archive
              </button>
            </>
          )}
        </div>
      </header>

      {error && (
        <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {loading &&
        items.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              No records yet
            </p>
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                onSelect(item.id)
              }
              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                selectedId === item.id
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.code}
                  </p>

                  {item.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                      {item.description}
                    </p>
                  )}
                </div>

                <StatusBadge
                  status={item.status}
                />
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

export default function TaxonomyManager() {
  const {
    categories,
    subjects,
    topics,

    categoriesLoading,
    subjectsLoading,
    topicsLoading,

    categoriesError,
    subjectsError,
    topicsError,

    categoryMutationLoading,
    subjectMutationLoading,
    topicMutationLoading,

    categoryMutationError,
    subjectMutationError,
    topicMutationError,

    selectedCategoryId,
    selectedCategory,
    selectCategory,

    selectedSubjectId,
    selectedSubject,
    selectSubject,

    selectedTopicId,
    selectedTopic,
    selectTopic,

    refreshCategories,
    refreshSubjects,
    refreshTopics,

    createCategory,
    updateCategory,

    createSubject,
    updateSubject,

    createTopic,
    updateTopic,

    clearCategoryMutationError,
    clearSubjectMutationError,
    clearTopicMutationError,

    currentUserId,
    canAuthorAssessments,
  } = useAssessment();

  const [
    dialog,
    setDialog,
  ] = useState(null);

  const visibleSubjects =
    subjects;

  const visibleTopics =
    topics;

  function openDialog(
    type,
    mode,
  ) {
    if (type === "category") {
      clearCategoryMutationError?.();
    }

    if (type === "subject") {
      clearSubjectMutationError?.();
    }

    if (type === "topic") {
      clearTopicMutationError?.();
    }

    setDialog({
      type,
      mode,
    });
  }

  function closeDialog() {
    if (
      categoryMutationLoading ||
      subjectMutationLoading ||
      topicMutationLoading
    ) {
      return;
    }

    setDialog(null);
  }

  async function handleSubmit(
    payload,
  ) {
    const auditPayload = {
      ...payload,

      updated_by:
        currentUserId,
    };

    if (
      dialog.type === "category"
    ) {
      if (
        dialog.mode === "edit"
      ) {
        await updateCategory(
          selectedCategory.id,
          auditPayload,
        );
      } else {
        const created =
          await createCategory({
            ...auditPayload,

            created_by:
              currentUserId,
          });

        if (created?.id) {
          selectCategory(
            created.id,
          );
        }
      }
    }

    if (
      dialog.type === "subject"
    ) {
      if (
        dialog.mode === "edit"
      ) {
        await updateSubject(
          selectedSubject.id,
          auditPayload,
        );
      } else {
        const created =
          await createSubject({
            ...auditPayload,

            created_by:
              currentUserId,
          });

        if (created?.id) {
          selectSubject(
            created.id,
          );
        }
      }
    }

    if (
      dialog.type === "topic"
    ) {
      if (
        dialog.mode === "edit"
      ) {
        await updateTopic(
          selectedTopic.id,
          auditPayload,
        );
      } else {
        const created =
          await createTopic({
            ...auditPayload,

            created_by:
              currentUserId,
          });

        if (created?.id) {
          selectTopic(
            created.id,
          );
        }
      }
    }

    setDialog(null);
  }

  async function archiveRecord(
    type,
  ) {
    const record =
      type === "category"
        ? selectedCategory
        : type === "subject"
          ? selectedSubject
          : selectedTopic;

    if (!record) {
      return;
    }

    if (
      !window.confirm(
        `Archive "${record.name}"?`,
      )
    ) {
      return;
    }

    const updates = {
      status: "archived",

      archived_at:
        new Date().toISOString(),

      archived_by:
        currentUserId,

      updated_by:
        currentUserId,
    };

    if (type === "category") {
      await updateCategory(
        record.id,
        updates,
      );

      return;
    }

    if (type === "subject") {
      await updateSubject(
        record.id,
        updates,
      );

      return;
    }

    await updateTopic(
      record.id,
      updates,
    );
  }

  const dialogRecord =
    dialog?.type === "category"
      ? selectedCategory
      : dialog?.type === "subject"
        ? selectedSubject
        : selectedTopic;

  const dialogLoading =
    dialog?.type === "category"
      ? categoryMutationLoading
      : dialog?.type === "subject"
        ? subjectMutationLoading
        : topicMutationLoading;

  const dialogError =
    dialog?.type === "category"
      ? categoryMutationError
      : dialog?.type === "subject"
        ? subjectMutationError
        : topicMutationError;

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
          Assessment Configuration
        </p>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          Taxonomy
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Build the category, subject, and
          topic hierarchy used to classify
          assessment questions.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-3">
        <TaxonomyColumn
          title="Categories"
          description="Top-level assessment classifications."
          items={categories}
          selectedId={
            selectedCategoryId
          }
          loading={
            categoriesLoading
          }
          error={categoriesError}
          canCreate={
            canAuthorAssessments
          }
          canEdit={
            canAuthorAssessments
          }
          onSelect={
            selectCategory
          }
          onRefresh={
            refreshCategories
          }
          onCreate={() =>
            openDialog(
              "category",
              "create",
            )
          }
          onEdit={() =>
            openDialog(
              "category",
              "edit",
            )
          }
          onArchive={() =>
            archiveRecord(
              "category",
            )
          }
        />

        <TaxonomyColumn
          title="Subjects"
          description="Academic and non-academic subject areas."
          items={
            visibleSubjects
          }
          selectedId={
            selectedSubjectId
          }
          loading={
            subjectsLoading
          }
          error={subjectsError}
          canCreate={
            canAuthorAssessments
          }
          canEdit={
            canAuthorAssessments
          }
          onSelect={
            selectSubject
          }
          onRefresh={
            refreshSubjects
          }
          onCreate={() =>
            openDialog(
              "subject",
              "create",
            )
          }
          onEdit={() =>
            openDialog(
              "subject",
              "edit",
            )
          }
          onArchive={() =>
            archiveRecord(
              "subject",
            )
          }
        />

        <TaxonomyColumn
          title="Topics"
          description="Subject topics and learning outcomes."
          items={visibleTopics}
          selectedId={
            selectedTopicId
          }
          loading={topicsLoading}
          error={topicsError}
          canCreate={
            canAuthorAssessments
          }
          canEdit={
            canAuthorAssessments
          }
          addDisabled={false}
          onSelect={
            selectTopic
          }
          onRefresh={
            refreshTopics
          }
          onCreate={() =>
            openDialog(
              "topic",
              "create",
            )
          }
          onEdit={() =>
            openDialog(
              "topic",
              "edit",
            )
          }
          onArchive={() =>
            archiveRecord(
              "topic",
            )
          }
        />
      </div>

      <TaxonomyDialog
        open={Boolean(dialog)}
        mode={
          dialog?.mode ||
          "create"
        }
        type={
          dialog?.type ||
          "category"
        }
        record={
          dialog?.mode === "edit"
            ? dialogRecord
            : null
        }
        categories={categories}
        subjects={subjects}
        topics={topics}
        selectedCategoryId={
          selectedCategoryId
        }
        selectedSubjectId={
          selectedSubjectId
        }
        loading={dialogLoading}
        error={dialogError}
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
