import {
  useCallback,
  useMemo,
} from "react";

import {
  useAuth,
} from "../../../platform/auth";

import {
  useAuthorization,
} from "../../../platform/authorization";

import {
  AssessmentPermission,
} from "../constants";

import {
  createAssessmentService,
} from "../services";

import {
  AssessmentContext,
} from "./AssessmentContext";

import {
  useAssessmentBankState,
} from "./useAssessmentBankState";

import {
  useAssessmentTaxonomyState,
} from "./useAssessmentTaxonomyState";

import {
  useAssessmentQuestionState,
} from "./useAssessmentQuestionState";

import {
  useAssessmentTemplateState,
} from "./useAssessmentTemplateState";

export default function AssessmentProvider({
  children,
}) {
  const {
    user,
    workspaceReady,
    organizationId,
    schoolId,
    campusId,
  } = useAuth();

  const {
    authorizationReady,
    hasPermission,
  } = useAuthorization();

  const canViewAssessments =
    hasPermission(
      AssessmentPermission.VIEW,
    );

  const canCreateAssessments =
    hasPermission(
      AssessmentPermission.CREATE,
    );

  const canEditAssessments =
    hasPermission(
      AssessmentPermission.EDIT,
    );

  const canPublishAssessments =
    hasPermission(
      AssessmentPermission.PUBLISH,
    );

  const canAssignAssessments =
    hasPermission(
      AssessmentPermission.ASSIGN,
    );

  const canTakeAssessments =
    hasPermission(
      AssessmentPermission.TAKE,
    );

  const canGradeAssessments =
    hasPermission(
      AssessmentPermission.GRADE,
    );

  const canReviewAssessments =
    hasPermission(
      AssessmentPermission.REVIEW,
    );

  const canManageAssessments =
    hasPermission(
      AssessmentPermission.MANAGE,
    );

  const canAuthorAssessments =
    canCreateAssessments ||
    canEditAssessments ||
    canManageAssessments;

  const canManageAssessmentLifecycle =
    canPublishAssessments ||
    canManageAssessments;

  const service =
    useMemo(() => {
      if (
        !workspaceReady ||
        !organizationId ||
        !schoolId
      ) {
        return null;
      }

      return createAssessmentService({
        scope: {
          organizationId,
          schoolId,
          campusId,
        },
      });
    }, [
      workspaceReady,
      organizationId,
      schoolId,
      campusId,
    ]);

  const bankState =
    useAssessmentBankState({
      service,
      workspaceReady,
      authorizationReady,
      canViewAssessments,

      canCreateAssessments,
      canEditAssessments,
    });

  const taxonomyState =
    useAssessmentTaxonomyState({
      service,
      workspaceReady,
      authorizationReady,
      canViewAssessments,

      canCreateAssessments,
      canEditAssessments,
    });

  const questionState =
    useAssessmentQuestionState({
      service,
      workspaceReady,
      authorizationReady,
      canViewAssessments,

      canCreateAssessments,
      canEditAssessments,
    });

  const templateState =
    useAssessmentTemplateState({
      service,
      workspaceReady,
      authorizationReady,
      canViewAssessments,

      canCreateAssessments,
      canEditAssessments,

      canPublishAssessments:
        canManageAssessmentLifecycle,
    });

  const refreshAssessmentCenter =
    useCallback(async () => {
      if (
        !service ||
        !workspaceReady ||
        !authorizationReady ||
        !canViewAssessments
      ) {
        return null;
      }

      const [
        banks,
        taxonomy,
        questions,
        templates,
      ] = await Promise.all([
        bankState
          .refreshAssessmentBanks(),

        taxonomyState
          .refreshTaxonomy(),

        questionState
          .refreshQuestions(),

        templateState
          .refreshTemplates(),
      ]);

      return {
        banks,
        taxonomy,
        questions,
        templates,
      };
    }, [
      service,
      workspaceReady,
      authorizationReady,
      canViewAssessments,

      bankState,
      taxonomyState,
      questionState,
      templateState,
    ]);

  const resetAssessmentCenter =
    useCallback(() => {
      bankState
        .resetAssessmentBanks();

      taxonomyState
        .resetTaxonomy();

      questionState
        .resetQuestions();

      templateState
        .resetTemplates();
    }, [
      bankState,
      taxonomyState,
      questionState,
      templateState,
    ]);

  const assessmentsLoading =
    bankState
      .assessmentBanksLoading ||
    taxonomyState
      .taxonomyLoading ||
    questionState
      .questionsLoading ||
    templateState
      .templateLoading;

  const assessmentsError =
    bankState
      .assessmentBanksError ||
    taxonomyState
      .taxonomyError ||
    questionState
      .questionsError ||
    templateState
      .templateError ||
    "";

  const assessmentsReady =
    workspaceReady &&
    authorizationReady &&
    canViewAssessments &&
    Boolean(service) &&
    bankState
      .assessmentBanksReady &&
    taxonomyState
      .taxonomyReady &&
    questionState
      .questionsReady &&
    templateState
      .templateReady &&
    !assessmentsLoading &&
    !assessmentsError;

  const value =
    useMemo(
      () => ({
        service,

        currentUserId:
          user?.id ||
          null,

        workspaceReady,
        authorizationReady,

        organizationId,
        schoolId,
        campusId,

        assessmentsReady,
        assessmentsLoading,
        assessmentsError,

        canViewAssessments,
        canCreateAssessments,
        canEditAssessments,
        canPublishAssessments,
        canAssignAssessments,
        canTakeAssessments,
        canGradeAssessments,
        canReviewAssessments,
        canManageAssessments,

        canAuthorAssessments,
        canManageAssessmentLifecycle,

        refreshAssessmentCenter,
        resetAssessmentCenter,

        ...bankState,
        ...taxonomyState,
        ...questionState,
        ...templateState,
      }),
      [
        service,
        user,

        workspaceReady,
        authorizationReady,

        organizationId,
        schoolId,
        campusId,

        assessmentsReady,
        assessmentsLoading,
        assessmentsError,

        canViewAssessments,
        canCreateAssessments,
        canEditAssessments,
        canPublishAssessments,
        canAssignAssessments,
        canTakeAssessments,
        canGradeAssessments,
        canReviewAssessments,
        canManageAssessments,

        canAuthorAssessments,
        canManageAssessmentLifecycle,

        refreshAssessmentCenter,
        resetAssessmentCenter,

        bankState,
        taxonomyState,
        questionState,
        templateState,
      ],
    );

  return (
    <AssessmentContext.Provider
      value={value}
    >
      {children}
    </AssessmentContext.Provider>
  );
}
