export const AssessmentPermission =
  Object.freeze({
    VIEW:
      "assessments.view",

    CREATE:
      "assessments.create",

    EDIT:
      "assessments.edit",

    PUBLISH:
      "assessments.publish",

    ASSIGN:
      "assessments.assign",

    TAKE:
      "assessments.take",

    GRADE:
      "assessments.grade",

    REVIEW:
      "assessments.review",

    MANAGE:
      "assessments.manage",
  });

export const AssessmentReadPermissions =
  Object.freeze([
    AssessmentPermission.VIEW,
  ]);

export const AssessmentAuthoringPermissions =
  Object.freeze([
    AssessmentPermission.CREATE,
    AssessmentPermission.EDIT,
  ]);

export const AssessmentAdministrationPermissions =
  Object.freeze([
    AssessmentPermission.PUBLISH,
    AssessmentPermission.ASSIGN,
    AssessmentPermission.GRADE,
    AssessmentPermission.REVIEW,
    AssessmentPermission.MANAGE,
  ]);

export const AssessmentWritePermissions =
  Object.freeze([
    ...AssessmentAuthoringPermissions,
    ...AssessmentAdministrationPermissions,
  ]);