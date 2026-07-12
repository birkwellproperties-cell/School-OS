// src/platform/auth/AuthBootstrap.js

function createEmptyBootstrap() {
  return {
    authenticated: false,
    accessStatus: "unauthenticated",
    user: null,
    profile: null,

    organizationMemberships: [],
    schoolMemberships: [],
    campusAssignments: [],

    currentOrganizationMembership: null,
    currentSchoolMembership: null,
    currentCampusAssignment: null,

    organizationId: null,
    schoolId: null,
    campusId: null,
  };
}

function throwQueryError(operation, error) {
  if (!error) return;

  const bootstrapError = new Error(
    error.message || `Unable to ${operation}.`,
  );

  bootstrapError.name = "AuthBootstrapError";
  bootstrapError.operation = operation;
  bootstrapError.code = error.code || null;
  bootstrapError.details = error.details || null;
  bootstrapError.hint = error.hint || null;

  throw bootstrapError;
}

function selectCurrentWorkspace({
  organizationMemberships,
  schoolMemberships,
  campusAssignments,
}) {
  const currentCampusAssignment =
    campusAssignments.find((assignment) => assignment.is_primary) ||
    campusAssignments[0] ||
    null;

  const currentSchoolMembership = currentCampusAssignment
    ? schoolMemberships.find(
        (membership) =>
          membership.school_id === currentCampusAssignment.school_id,
      ) || null
    : schoolMemberships[0] || null;

  const preferredOrganizationId =
    currentCampusAssignment?.organization_id ||
    currentSchoolMembership?.organization_id ||
    organizationMemberships[0]?.organization_id ||
    null;

  const currentOrganizationMembership =
    organizationMemberships.find(
      (membership) =>
        membership.organization_id === preferredOrganizationId,
    ) ||
    organizationMemberships[0] ||
    null;

  return {
    currentOrganizationMembership,
    currentSchoolMembership,
    currentCampusAssignment,
  };
}

function determineAccessStatus({
  profile,
  organizationMemberships,
  schoolMemberships,
  campusAssignments,
}) {
  if (!profile) {
    return "profile_missing";
  }

  if (profile.account_status !== "active") {
    return `profile_${profile.account_status}`;
  }

  if (organizationMemberships.length === 0) {
    return "organization_membership_missing";
  }

  if (schoolMemberships.length === 0) {
    return "school_membership_missing";
  }

  if (campusAssignments.length === 0) {
    return "campus_assignment_missing";
  }

  return "ready";
}

export async function bootstrapAuth(supabase) {
  if (!supabase) {
    throw new Error(
      "A configured Supabase client is required to bootstrap authentication.",
    );
  }

  const emptyBootstrap = createEmptyBootstrap();

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  throwQueryError("load the authenticated user", userError);

  const user = userData?.user || null;

  if (!user) {
    return emptyBootstrap;
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      [
        "id",
        "full_name",
        "preferred_name",
        "email",
        "phone",
        "avatar_url",
        "locale",
        "timezone",
        "account_status",
        "last_active_at",
        "created_at",
        "updated_at",
      ].join(","),
    )
    .eq("id", user.id)
    .maybeSingle();

  throwQueryError("load the authenticated profile", profileError);

  /*
   * A missing or inactive profile must not be allowed to continue
   * into tenant queries as an authorized SchoolOS workspace user.
   */
  if (!profile || profile.account_status !== "active") {
    return {
      ...emptyBootstrap,
      authenticated: true,
      user,
      profile,
      accessStatus: profile
        ? `profile_${profile.account_status}`
        : "profile_missing",
    };
  }

  const [
    organizationMembershipResult,
    schoolMembershipResult,
    campusAssignmentResult,
  ] = await Promise.all([
    supabase
      .from("organization_memberships")
      .select(
        [
          "id",
          "organization_id",
          "profile_id",
          "membership_status",
          "invited_at",
          "joined_at",
          "created_at",
          "updated_at",
        ].join(","),
      )
      .eq("profile_id", user.id)
      .eq("membership_status", "active")
      .order("joined_at", {
        ascending: true,
        nullsFirst: false,
      }),

    supabase
      .from("school_memberships")
      .select(
        [
          "id",
          "organization_id",
          "school_id",
          "profile_id",
          "membership_status",
          "invited_at",
          "joined_at",
          "created_at",
          "updated_at",
        ].join(","),
      )
      .eq("profile_id", user.id)
      .eq("membership_status", "active")
      .order("joined_at", {
        ascending: true,
        nullsFirst: false,
      }),

    supabase
      .from("campus_assignments")
      .select(
        [
          "id",
          "organization_id",
          "school_id",
          "campus_id",
          "profile_id",
          "is_primary",
          "assignment_status",
          "start_date",
          "end_date",
          "created_at",
          "updated_at",
        ].join(","),
      )
      .eq("profile_id", user.id)
      .eq("assignment_status", "active")
      .lte("start_date", new Date().toISOString().slice(0, 10))
      .or(
        `end_date.is.null,end_date.gte.${new Date()
          .toISOString()
          .slice(0, 10)}`,
      )
      .order("is_primary", {
        ascending: false,
      })
      .order("start_date", {
        ascending: true,
      }),
  ]);

  throwQueryError(
    "load organization memberships",
    organizationMembershipResult.error,
  );

  throwQueryError(
    "load school memberships",
    schoolMembershipResult.error,
  );

  throwQueryError(
    "load campus assignments",
    campusAssignmentResult.error,
  );

  const organizationMemberships =
    organizationMembershipResult.data || [];

  const activeOrganizationIds = new Set(
    organizationMemberships.map(
      (membership) => membership.organization_id,
    ),
  );

  const schoolMemberships = (
    schoolMembershipResult.data || []
  ).filter((membership) =>
    activeOrganizationIds.has(membership.organization_id),
  );

  const activeSchoolIds = new Set(
    schoolMemberships.map(
      (membership) => membership.school_id,
    ),
  );

  const campusAssignments = (
    campusAssignmentResult.data || []
  ).filter(
    (assignment) =>
      activeOrganizationIds.has(assignment.organization_id) &&
      activeSchoolIds.has(assignment.school_id),
  );

  const {
    currentOrganizationMembership,
    currentSchoolMembership,
    currentCampusAssignment,
  } = selectCurrentWorkspace({
    organizationMemberships,
    schoolMemberships,
    campusAssignments,
  });

  const accessStatus = determineAccessStatus({
    profile,
    organizationMemberships,
    schoolMemberships,
    campusAssignments,
  });

  return {
    authenticated: true,
    accessStatus,
    user,
    profile,

    organizationMemberships,
    schoolMemberships,
    campusAssignments,

    currentOrganizationMembership,
    currentSchoolMembership,
    currentCampusAssignment,

    organizationId:
      currentOrganizationMembership?.organization_id || null,

    schoolId:
      currentSchoolMembership?.school_id || null,

    campusId:
      currentCampusAssignment?.campus_id || null,
  };
}
