import {
  useMemo,
  useState,
} from "react";

import {
  Archive,
  BookOpenCheck,
  CheckCircle2,
  CircleAlert,
  CirclePause,
  Clock3,
  FileCheck2,
  GraduationCap,
  ListChecks,
  Pencil,
  Rocket,
  Target,
} from "lucide-react";

import {
  useAssessment,
} from "../../context";

import TemplateDialog from "./TemplateDialog";
import TemplateSectionDialog from "./TemplateSectionDialog";
import TemplateQuestionDialog from "./TemplateQuestionDialog";
import TemplateQuestionPanel from "./TemplateQuestionPanel";
import TemplateSectionsPanel from "./TemplateSectionsPanel";
import TemplateStatusBadge from "./TemplateStatusBadge";
import TemplateTable from "./TemplateTable";
import TemplateToolbar from "./TemplateToolbar";

function formatLabel(value) {
  if (!value) {
    return "Not configured";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function formatNumber(
  value,
  fallback = "Not configured",
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function getReadinessChecks(template) {
  if (!template) {
    return [];
  }

  const totalMarks =
    Number(template.total_marks);

  const passingMarks =
    Number(template.passing_marks);

  return [
    {
      key: "name",
      label: "Assessment title",
      ready: Boolean(
        String(
          template.name || "",
        ).trim(),
      ),
      message:
        "Add a clear assessment title.",
    },
    {
      key: "identifier",
      label: "Assessment code",
      ready: Boolean(
        String(
          template.code ||
            template.template_number ||
            "",
        ).trim(),
      ),
      message:
        "Add an assessment code or template number.",
    },
    {
      key: "type",
      label: "Assessment type",
      ready: Boolean(
        template.assessment_type,
      ),
      message:
        "Select an assessment type.",
    },
    {
      key: "delivery",
      label: "Delivery mode",
      ready: Boolean(
        template.delivery_mode,
      ),
      message:
        "Select a delivery mode.",
    },
    {
      key: "duration",
      label: "Duration",
      ready:
        Number(
          template.duration_minutes,
        ) > 0,
      message:
        "Set the assessment duration.",
    },
    {
      key: "marks",
      label: "Total marks",
      ready:
        Number.isFinite(totalMarks) &&
        totalMarks > 0,
      message:
        "Set a total mark greater than zero.",
    },
    {
      key: "passing",
      label: "Passing marks",
      ready:
        Number.isFinite(passingMarks) &&
        passingMarks >= 0 &&
        Number.isFinite(totalMarks) &&
        passingMarks <= totalMarks,
      message:
        "Set passing marks between zero and total marks.",
    },
    {
      key: "instructions",
      label: "Candidate instructions",
      ready: Boolean(
        String(
          template.instructions || "",
        ).trim(),
      ),
      message:
        "Add instructions for candidates.",
    },
  ];
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <Icon size={19} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>

          <p className="mt-1 truncate text-lg font-semibold text-slate-950">
            {value}
          </p>

          {detail && (
            <p className="mt-1 text-xs text-slate-500">
              {detail}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export default function TemplateBuilder() {
  const {
    templates,
    templateResult,
    templateFilters,

    templatesLoading,
    templatesError,

    selectedTemplateId,
    selectedTemplate,
    selectTemplate,

    templateSections,
    sectionsLoading,
    sectionsError,

    selectedTemplateSectionId,
    selectedTemplateSection,
    selectTemplateSection,

    templateQuestions,
    templateQuestionsLoading,
    templateQuestionsError,
    templateQuestionMutationLoading,
    templateQuestionMutationError,
    refreshTemplateQuestions,
    addTemplateQuestion,
    deleteTemplateQuestion,
    clearTemplateQuestionMutationError,

    questions,
    questionsLoading,
    refreshQuestions,

    refreshTemplateSections,
    createTemplateSection,
    updateTemplateSection,
    deleteTemplateSection,

    updateTemplateFilters,
    resetTemplateFilters,
    refreshTemplates,

    createTemplate,
    updateTemplate,
    deleteTemplate,

    publishTemplate,
    pauseTemplate,
    retireTemplate,

    templateMutationLoading,
    sectionMutationLoading,
    lifecycleLoading,

    templateMutationError,
    sectionMutationError,
    lifecycleError,

    clearTemplateMutationError,
    clearSectionMutationError,
    clearLifecycleError,

    assessmentBanks,
    categories,
    subjects,

    currentUserId,
    canCreateAssessments,
    canEditAssessments,
    canManageAssessmentLifecycle,
  } = useAssessment();

  const [
    dialogMode,
    setDialogMode,
  ] = useState(null);

  const [
    sectionDialogMode,
    setSectionDialogMode,
  ] = useState(null);

  const [
    questionDialogOpen,
    setQuestionDialogOpen,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState("");

  const selectedTemplateFallback =
    useMemo(
      () =>
        selectedTemplate ||
        templates.find(
          (template) =>
            template.id ===
            selectedTemplateId,
        ) ||
        null,
      [
        selectedTemplate,
        templates,
        selectedTemplateId,
      ],
    );

  const readinessChecks =
    useMemo(
      () =>
        getReadinessChecks(
          selectedTemplateFallback,
        ),
      [selectedTemplateFallback],
    );

  const readinessSummary =
    useMemo(() => {
      const readyCount =
        readinessChecks.filter(
          (check) => check.ready,
        ).length;

      const totalCount =
        readinessChecks.length;

      return {
        readyCount,
        totalCount,
        complete:
          totalCount > 0 &&
          readyCount === totalCount,
        percentage:
          totalCount > 0
            ? Math.round(
                (readyCount /
                  totalCount) *
                  100,
              )
            : 0,
      };
    }, [readinessChecks]);

  const templateStatus =
    String(
      selectedTemplateFallback?.status ||
        "draft",
    )
      .trim()
      .toLowerCase();

  const activeSectionCount =
    templateSections.filter(
      (section) =>
        String(section.status || "active")
          .trim()
          .toLowerCase() === "active",
    ).length;

  const selectedSectionQuestions =
    useMemo(
      () =>
        templateQuestions.filter(
          (templateQuestion) =>
            templateQuestion.section_id ===
            selectedTemplateSectionId,
        ),
      [
        templateQuestions,
        selectedTemplateSectionId,
      ],
    );

  const publishableQuestionCount =
    templateQuestions.filter(
      (templateQuestion) => {
        const status =
          String(
            templateQuestion.question?.status ||
              "",
          )
            .trim()
            .toLowerCase();

        return (
          status === "approved" ||
          status === "active"
        );
      },
    ).length;

  const publishDisabled =
    templateMutationLoading ||
    sectionMutationLoading ||
    lifecycleLoading ||
    !readinessSummary.complete ||
    activeSectionCount === 0 ||
    publishableQuestionCount === 0 ||
    templateStatus === "published" ||
    templateStatus === "active";

  const busy =
    templateMutationLoading ||
    sectionMutationLoading ||
    lifecycleLoading;

  function clearErrors() {
    setActionError("");
    clearTemplateMutationError?.();
    clearSectionMutationError?.();
    clearTemplateQuestionMutationError?.();
    clearLifecycleError?.();
  }

  function openCreateDialog() {
    clearErrors();
    setDialogMode("create");
  }

  function openEditDialog() {
    if (!selectedTemplateFallback) {
      return;
    }

    clearErrors();
    setDialogMode("edit");
  }

  function closeDialog() {
    if (templateMutationLoading) {
      return;
    }

    clearErrors();
    setDialogMode(null);
  }

  async function handleSave(payload) {
    clearErrors();

    try {
      if (dialogMode === "edit") {
        await updateTemplate(
          selectedTemplateFallback.id,
          {
            ...payload,
            updated_by:
              currentUserId,
          },
        );
      } else {
        const created =
          await createTemplate({
            ...payload,
            owner_id:
              currentUserId,
            created_by:
              currentUserId,
            updated_by:
              currentUserId,
          });

        if (created?.id) {
          selectTemplate(
            created.id,
          );
        }
      }

      setDialogMode(null);
    } catch (error) {
      setActionError(
        error?.message ||
          "Unable to save the assessment.",
      );

      throw error;
    }
  }

  function openCreateSectionDialog() {
    if (!selectedTemplateFallback) {
      return;
    }

    clearErrors();
    setSectionDialogMode("create");
  }

  function openEditSectionDialog(section = null) {
    const targetSection =
      section ||
      selectedTemplateSection;

    if (!targetSection) {
      return;
    }

    selectTemplateSection(
      targetSection.id,
    );

    clearErrors();
    setSectionDialogMode("edit");
  }

  function closeSectionDialog() {
    if (sectionMutationLoading) {
      return;
    }

    clearErrors();
    setSectionDialogMode(null);
  }

  function normalizePositiveIntegerOrNull(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isInteger(number) ||
    number <= 0
  ) {
    return null;
  }

  return number;
}

function normalizeSectionPayload(payload = {}) {
  return {
    ...payload,

    template_id:
      selectedTemplateFallback?.id,

    maximum_score:
      payload.maximum_score ??
      payload.marks ??
      null,

    questions_to_display:
      normalizePositiveIntegerOrNull(
        payload.questions_to_display ??
        payload.questions_to_attempt
      ),

    shuffle_questions:
      Boolean(
        payload.shuffle_questions ??
        payload.randomize_questions
      ),

    updated_by: currentUserId,
  };
}

  async function handleSaveSection(payload) {
    if (!selectedTemplateFallback) {
      return;
    }

    clearErrors();

    try {
      const normalizedPayload =
        normalizeSectionPayload(payload);

      if (
        sectionDialogMode === "edit" &&
        selectedTemplateSection
      ) {
        await updateTemplateSection(
          selectedTemplateSection.id,
          normalizedPayload,
        );
      } else {
        const created =
          await createTemplateSection({
            ...normalizedPayload,
            created_by: currentUserId,
          });

        if (created?.id) {
          selectTemplateSection(
            created.id,
          );
        }
      }

      setSectionDialogMode(null);
      await refreshTemplateSections();
    } catch (error) {
      setActionError(
        error?.message ||
          "Unable to save the assessment section.",
      );

      throw error;
    }
  }

  async function handleDeleteSection(section = null) {
    const targetSection =
      section ||
      selectedTemplateSection;

    if (!targetSection) {
      return;
    }

    const confirmed =
      window.confirm(
        `Archive section "${targetSection.title}"?`,
      );

    if (!confirmed) {
      return;
    }

    clearErrors();

    try {
      await deleteTemplateSection(
        targetSection.id,
        currentUserId,
      );
    } catch (error) {
      setActionError(
        error?.message ||
          "Unable to archive the assessment section.",
      );
    }
  }

  async function openQuestionDialog() {
    if (!selectedTemplateSection) {
      setActionError(
        "Select an assessment section before adding questions.",
      );
      return;
    }

    clearErrors();

    try {
      await refreshQuestions({
        page: 1,
        pageSize: 250,
        statuses: [
          "approved",
          "active",
        ],
      });
    } catch {
      // The dialog can still use questions already loaded in context.
    }

    setQuestionDialogOpen(true);
  }

  function closeQuestionDialog() {
    if (templateQuestionMutationLoading) {
      return;
    }

    clearErrors();
    setQuestionDialogOpen(false);
  }

  async function handleAddQuestions(
    questionIds,
  ) {
    if (
      !selectedTemplateFallback ||
      !selectedTemplateSection
    ) {
      return;
    }

    clearErrors();

    try {
      const startingOrder =
        selectedSectionQuestions.reduce(
          (
            maximum,
            templateQuestion,
          ) =>
            Math.max(
              maximum,
              Number(
                templateQuestion.display_order ??
                  -1,
              ),
            ),
          -1,
        ) + 1;

      for (
        let index = 0;
        index < questionIds.length;
        index += 1
      ) {
        await addTemplateQuestion({
          template_id:
            selectedTemplateFallback.id,

          section_id:
            selectedTemplateSection.id,

          question_id:
            questionIds[index],

          display_order:
            startingOrder + index,

          required: true,

          created_by:
            currentUserId,

          updated_by:
            currentUserId,
        });
      }

      await refreshTemplateQuestions(
        null,
        selectedTemplateFallback.id,
        selectedTemplateSection.id,
      );

      setQuestionDialogOpen(false);
    } catch (error) {
      setActionError(
        error?.message ||
          "Unable to add questions to the assessment section.",
      );

      throw error;
    }
  }

  async function handleDeleteTemplateQuestion(
    templateQuestion,
  ) {
    if (!templateQuestion) {
      return;
    }

    const title =
      templateQuestion.question?.title ||
      templateQuestion.question?.question_number ||
      "this question";

    const confirmed =
      window.confirm(
        `Remove "${title}" from this assessment section?`,
      );

    if (!confirmed) {
      return;
    }

    clearErrors();

    try {
      await deleteTemplateQuestion(
        templateQuestion.id,
        currentUserId,
      );

      await refreshTemplateQuestions(
        null,
        selectedTemplateFallback?.id,
        selectedTemplateSection?.id,
      );
    } catch (error) {
      setActionError(
        error?.message ||
          "Unable to remove the question from the assessment section.",
      );
    }
  }

  async function runAction(
    action,
    confirmationMessage = "",
  ) {
    if (!selectedTemplateFallback) {
      return;
    }

    if (
      confirmationMessage &&
      !window.confirm(
        confirmationMessage,
      )
    ) {
      return;
    }

    clearErrors();

    try {
      await action(
        selectedTemplateFallback.id,
      );
    } catch (error) {
      setActionError(
        error?.message ||
          "Unable to complete the assessment action.",
      );
    }
  }

  async function handlePublish() {
    if (!readinessSummary.complete) {
      setActionError(
        "Complete every readiness requirement before publishing this assessment.",
      );
      return;
    }

    if (activeSectionCount === 0) {
      setActionError(
        "Add at least one active assessment section before publishing.",
      );
      return;
    }

    if (publishableQuestionCount === 0) {
      setActionError(
        "Add at least one approved or active question before publishing.",
      );
      return;
    }

    await runAction(
      publishTemplate,
      `Publish "${selectedTemplateFallback.name}"? Candidates may be able to use it once assigned.`,
    );
  }

  async function handlePause() {
    await runAction(
      pauseTemplate,
      `Pause "${selectedTemplateFallback.name}"?`,
    );
  }

  async function handleRetire() {
    await runAction(
      retireTemplate,
      `Retire "${selectedTemplateFallback.name}"? Retired assessments should no longer be assigned.`,
    );
  }

  async function handleDelete() {
    if (!selectedTemplateFallback) {
      return;
    }

    const confirmed =
      window.confirm(
        `Archive "${selectedTemplateFallback.name}"? This removes it from the active workspace.`,
      );

    if (!confirmed) {
      return;
    }

    clearErrors();

    try {
      await deleteTemplate(
        selectedTemplateFallback.id,
        currentUserId,
      );
    } catch (error) {
      setActionError(
        error?.message ||
          "Unable to archive the assessment.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
          Assessment authoring
        </p>

        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          Assessment Builder
        </h2>

        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Create assessments, configure
          delivery and scoring rules,
          validate publishing readiness,
          and manage the complete assessment
          lifecycle.
        </p>
      </header>

      <TemplateToolbar
        filters={templateFilters}
        loading={templatesLoading}
        canCreate={
          canCreateAssessments
        }
        onChange={
          updateTemplateFilters
        }
        onReset={
          resetTemplateFilters
        }
        onRefresh={() =>
          refreshTemplates()
        }
        onCreate={
          openCreateDialog
        }
      />

      {selectedTemplateFallback && (
        <>
          <section className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
            <div className="border-b border-blue-100 bg-blue-50 px-5 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                      Selected assessment
                    </p>

                    <TemplateStatusBadge
                      status={
                        selectedTemplateFallback.status
                      }
                    />
                  </div>

                  <h3 className="mt-2 text-xl font-semibold text-slate-950">
                    {selectedTemplateFallback.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {selectedTemplateFallback.template_number ||
                      selectedTemplateFallback.code ||
                      "Assessment number pending"}
                  </p>

                  {selectedTemplateFallback.description && (
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                      {selectedTemplateFallback.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {canEditAssessments && (
                    <>
                      <button
                        type="button"
                        onClick={
                          openEditDialog
                        }
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Pencil size={16} />
                        Edit details
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleDelete
                        }
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Archive size={16} />
                        Archive
                      </button>
                    </>
                  )}

                  {canManageAssessmentLifecycle && (
                    <>
                      <button
                        type="button"
                        onClick={
                          handlePublish
                        }
                        disabled={
                          publishDisabled
                        }
                        title={
                          readinessSummary.complete
                            ? "Publish assessment"
                            : "Complete all readiness checks before publishing"
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Rocket size={16} />
                        Publish
                      </button>

                      <button
                        type="button"
                        onClick={
                          handlePause
                        }
                        disabled={
                          busy ||
                          templateStatus ===
                            "paused"
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CirclePause
                          size={16}
                        />
                        Pause
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleRetire
                        }
                        disabled={
                          busy ||
                          templateStatus ===
                            "retired"
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FileCheck2
                          size={16}
                        />
                        Retire
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={GraduationCap}
                label="Assessment type"
                value={formatLabel(
                  selectedTemplateFallback.assessment_type,
                )}
                detail={formatLabel(
                  selectedTemplateFallback.audience_type,
                )}
              />

              <SummaryCard
                icon={Clock3}
                label="Duration"
                value={
                  selectedTemplateFallback.duration_minutes
                    ? `${selectedTemplateFallback.duration_minutes} minutes`
                    : "Not configured"
                }
                detail={formatLabel(
                  selectedTemplateFallback.delivery_mode,
                )}
              />

              <SummaryCard
                icon={Target}
                label="Total marks"
                value={formatNumber(
                  selectedTemplateFallback.total_marks,
                )}
                detail={`Passing: ${formatNumber(
                  selectedTemplateFallback.passing_marks,
                )}`}
              />

              <SummaryCard
                icon={BookOpenCheck}
                label="Version"
                value={`Version ${formatNumber(
                  selectedTemplateFallback.version_number,
                  1,
                )}`}
                detail={
                  selectedTemplateFallback.grade_level
                    ? `Grade ${selectedTemplateFallback.grade_level}`
                    : "Grade not configured"
                }
              />
            </div>
          </section>

          <TemplateSectionsPanel
            template={selectedTemplateFallback}
            sections={templateSections}
            loading={sectionsLoading}
            error={sectionsError}
            mutationError={sectionMutationError}
            busy={sectionMutationLoading}
            canEdit={canEditAssessments}
            selectedSectionId={
              selectedTemplateSectionId
            }
            onSelect={
              selectTemplateSection
            }
            onCreate={
              openCreateSectionDialog
            }
            onEdit={
              openEditSectionDialog
            }
            onDelete={
              handleDeleteSection
            }
            onRefresh={() =>
              refreshTemplateSections()
            }
          />

          <TemplateQuestionPanel
            template={selectedTemplateFallback}
            section={selectedTemplateSection}
            questions={selectedSectionQuestions}
            loading={templateQuestionsLoading}
            mutationLoading={templateQuestionMutationLoading}
            error={templateQuestionsError}
            mutationError={templateQuestionMutationError}
            canEdit={
              canCreateAssessments ||
              canEditAssessments
            }
            onAdd={openQuestionDialog}
            onDelete={
              handleDeleteTemplateQuestion
            }
            onRefresh={() =>
              refreshTemplateQuestions(
                null,
                selectedTemplateFallback.id,
                selectedTemplateSectionId,
              )
            }
          />

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ListChecks
                    size={20}
                    className="text-blue-600"
                  />

                  <h3 className="text-lg font-semibold text-slate-950">
                    Publishing readiness
                  </h3>
                </div>

                <p className="mt-1 text-sm text-slate-600">
                  {readinessSummary.readyCount} of{" "}
                  {readinessSummary.totalCount} requirements completed.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-2.5 w-40 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{
                      width: `${readinessSummary.percentage}%`,
                    }}
                  />
                </div>

                <span className="text-sm font-semibold text-slate-700">
                  {readinessSummary.percentage}%
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {readinessChecks.map(
                (check) => (
                  <div
                    key={check.key}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                      check.ready
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    {check.ready ? (
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-emerald-600"
                      />
                    ) : (
                      <CircleAlert
                        size={18}
                        className="mt-0.5 shrink-0 text-amber-600"
                      />
                    )}

                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          check.ready
                            ? "text-emerald-900"
                            : "text-amber-900"
                        }`}
                      >
                        {check.label}
                      </p>

                      <p
                        className={`mt-0.5 text-xs ${
                          check.ready
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {check.ready
                          ? "Configured"
                          : check.message}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>

            <div
              className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 ${
                activeSectionCount > 0
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              {activeSectionCount > 0 ? (
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />
              ) : (
                <CircleAlert
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-600"
                />
              )}

              <div>
                <p
                  className={`text-sm font-semibold ${
                    activeSectionCount > 0
                      ? "text-emerald-900"
                      : "text-amber-900"
                  }`}
                >
                  Active assessment section
                </p>

                <p
                  className={`mt-0.5 text-xs ${
                    activeSectionCount > 0
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {activeSectionCount > 0
                    ? `${activeSectionCount} active section${
                        activeSectionCount === 1
                          ? ""
                          : "s"
                      } configured.`
                    : "Add at least one active section before publishing."}
                </p>
              </div>
            </div>

            <div
              className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 ${
                publishableQuestionCount > 0
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              {publishableQuestionCount > 0 ? (
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />
              ) : (
                <CircleAlert
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-600"
                />
              )}

              <div>
                <p
                  className={`text-sm font-semibold ${
                    publishableQuestionCount > 0
                      ? "text-emerald-900"
                      : "text-amber-900"
                  }`}
                >
                  Approved assessment question
                </p>

                <p
                  className={`mt-0.5 text-xs ${
                    publishableQuestionCount > 0
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {publishableQuestionCount > 0
                    ? `${publishableQuestionCount} approved or active question${
                        publishableQuestionCount === 1
                          ? ""
                          : "s"
                      } attached.`
                    : "Add at least one approved or active question before publishing."}
                </p>
              </div>
            </div>

            {readinessSummary.complete ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                This assessment has completed
                all Phase 1 publishing
                requirements.
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                Complete the highlighted
                requirements before publishing.
              </div>
            )}
          </section>
        </>
      )}

      {(templatesError ||
        sectionsError ||
        templateQuestionsError ||
        templateMutationError ||
        sectionMutationError ||
        templateQuestionMutationError ||
        lifecycleError ||
        actionError) && (
        <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">
            {actionError ||
              lifecycleError ||
              templateQuestionMutationError ||
              sectionMutationError ||
              templateMutationError ||
              templateQuestionsError ||
              sectionsError ||
              templatesError}
          </p>
        </section>
      )}

      <TemplateTable
        templates={templates}
        result={templateResult}
        loading={templatesLoading}
        selectedTemplateId={
          selectedTemplateId
        }
        onSelect={
          selectTemplate
        }
        onPageChange={(page) =>
          updateTemplateFilters({
            page,
          })
        }
      />

      <TemplateDialog
        open={Boolean(dialogMode)}
        mode={
          dialogMode ||
          "create"
        }
        template={
          dialogMode === "edit"
            ? selectedTemplateFallback
            : null
        }
        banks={assessmentBanks}
        categories={categories}
        subjects={subjects}
        loading={
          templateMutationLoading
        }
        error={
          templateMutationError
        }
        onClose={closeDialog}
        onSubmit={handleSave}
      />

      <TemplateSectionDialog
        open={Boolean(
          sectionDialogMode,
        )}
        mode={
          sectionDialogMode ||
          "create"
        }
        section={
          sectionDialogMode === "edit"
            ? selectedTemplateSection
            : null
        }
        defaultDisplayOrder={
          templateSections.length
        }
        loading={
          sectionMutationLoading
        }
        error={
          sectionMutationError
        }
        onClose={
          closeSectionDialog
        }
        onSubmit={
          handleSaveSection
        }
      />

      <TemplateQuestionDialog
        open={questionDialogOpen}
        section={selectedTemplateSection}
        questions={questions}
        attachedQuestionIds={
          selectedSectionQuestions.map(
            (templateQuestion) =>
              templateQuestion.question_id,
          )
        }
        loading={
          templateQuestionMutationLoading ||
          questionsLoading
        }
        error={
          templateQuestionMutationError
        }
        onClose={
          closeQuestionDialog
        }
        onSubmit={
          handleAddQuestions
        }
      />
    </div>
  );
}
