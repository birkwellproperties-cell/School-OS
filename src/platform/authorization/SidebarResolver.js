function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasRequiredLicense(item, licensedModules) {
  if (!item.license) {
    return true;
  }

  return licensedModules.has(item.license);
}

function hasRequiredFeature(item, enabledFeatures) {
  if (!item.featureFlag) {
    return true;
  }

  return enabledFeatures.has(item.featureFlag);
}

function hasRequiredPermission(item, authorization) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  } = authorization;

  if (item.permission) {
    return hasPermission(item.permission);
  }

  if (
    Array.isArray(item.anyPermissions) &&
    item.anyPermissions.length > 0
  ) {
    return hasAnyPermission(item.anyPermissions);
  }

  if (
    Array.isArray(item.allPermissions) &&
    item.allPermissions.length > 0
  ) {
    return hasAllPermissions(item.allPermissions);
  }

  return true;
}

function compareNavigationItems(left, right) {
  const leftOrder =
    Number.isFinite(left.order)
      ? left.order
      : Number.MAX_SAFE_INTEGER;

  const rightOrder =
    Number.isFinite(right.order)
      ? right.order
      : Number.MAX_SAFE_INTEGER;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return left.label.localeCompare(right.label);
}

export function resolveNavigation({
  items,
  authorization,
  licensedModules = [],
  enabledFeatures = [],
}) {
  const normalizedItems = normalizeArray(items);

  const licensedModuleSet = new Set(
    normalizeArray(licensedModules),
  );

  const enabledFeatureSet = new Set(
    normalizeArray(enabledFeatures),
  );

  return normalizedItems
    .filter((item) => item && item.path && item.label)
    .filter((item) => item.enabled !== false)
    .filter((item) =>
      hasRequiredLicense(
        item,
        licensedModuleSet,
      ),
    )
    .filter((item) =>
      hasRequiredFeature(
        item,
        enabledFeatureSet,
      ),
    )
    .filter((item) =>
      hasRequiredPermission(
        item,
        authorization,
      ),
    )
    .sort(compareNavigationItems);
}

export function groupNavigation(items) {
  const groups = new Map();

  normalizeArray(items).forEach((item) => {
    const group =
      item.group || "General";

    if (!groups.has(group)) {
      groups.set(group, []);
    }

    groups.get(group).push(item);
  });

  return Array.from(groups.entries()).map(
    ([label, groupItems]) => ({
      label,
      items: groupItems.sort(
        compareNavigationItems,
      ),
    }),
  );
}
