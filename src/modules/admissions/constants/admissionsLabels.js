function humanizeStatus(value) {
  if (!value) return "";

  return value
    .split("_")
    .filter(Boolean)
    .map(
      (segment) =>
        segment.charAt(0).toUpperCase() +
        segment.slice(1),
    )
    .join(" ");
}

export function getAdmissionStatusLabel(status) {
  return humanizeStatus(status);
}

export function getAdmissionPriorityLabel(priority) {
  return humanizeStatus(priority);
}

export function getAdmissionDecisionLabel(decision) {
  return humanizeStatus(decision);
}
