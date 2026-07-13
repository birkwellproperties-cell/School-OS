export const AdmissionsPermission = Object.freeze({
  VIEW: "applications.view",
  CREATE: "applications.create",
  EDIT: "applications.edit",
  REVIEW: "applications.review",
  APPROVE: "applications.approve",
  ENROLL: "applications.enroll",
});

export const AdmissionsReadPermissions = Object.freeze([
  AdmissionsPermission.VIEW,
]);

export const AdmissionsWritePermissions = Object.freeze([
  AdmissionsPermission.CREATE,
  AdmissionsPermission.EDIT,
  AdmissionsPermission.REVIEW,
  AdmissionsPermission.APPROVE,
  AdmissionsPermission.ENROLL,
]);
