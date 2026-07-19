const LABELS =
  Object.freeze({
    draft: "Draft",
    review: "In Review",
    approved: "Approved",
    active: "Active",
    inactive: "Inactive",
    published: "Published",
    paused: "Paused",
    retired: "Retired",
    archived: "Archived",

    multiple_choice:
      "Multiple Choice",

    multiple_response:
      "Multiple Response",

    true_false:
      "True / False",

    fill_blank:
      "Fill in the Blank",

    short_answer:
      "Short Answer",

    essay:
      "Essay",

    numeric:
      "Numeric",

    matching:
      "Matching",

    ordering:
      "Ordering",

    file_upload:
      "File Upload",

    very_easy:
      "Very Easy",

    easy:
      "Easy",

    medium:
      "Medium",

    hard:
      "Hard",

    very_hard:
      "Very Hard",

    online:
      "Online",

    in_person:
      "In Person",

    uploaded_document:
      "Uploaded Document",

    external:
      "External",
  });

export function getAssessmentLabel(
  value,
  fallback = "Not set",
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  return (
    LABELS[value] ||
    String(value)
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase(),
      )
  );
}