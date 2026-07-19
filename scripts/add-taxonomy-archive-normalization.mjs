import fs from "node:fs";

const servicePath =
  process.argv[2];

if (!servicePath) {
  throw new Error(
    "AssessmentService.js path is required.",
  );
}

let source =
  fs.readFileSync(
    servicePath,
    "utf8",
  );

const methods = [
  {
    name:
      "updateAssessmentCategory",

    next:
      "deleteAssessmentCategory",

    label:
      "Assessment category",
  },
  {
    name:
      "updateAssessmentSubject",

    next:
      "deleteAssessmentSubject",

    label:
      "Assessment subject",
  },
  {
    name:
      "updateAssessmentTopic",

    next:
      "deleteAssessmentTopic",

    label:
      "Assessment topic",
  },
];

function getMethodRange(
  methodName,
  nextMethodName,
) {
  const startMarker =
    `  async ${methodName}(`;

  const endMarker =
    `  async ${nextMethodName}(`;

  const start =
    source.indexOf(
      startMarker,
    );

  const end =
    source.indexOf(
      endMarker,
      start + startMarker.length,
    );

  if (
    start === -1 ||
    end === -1
  ) {
    throw new Error(
      `Could not locate ${methodName}.`,
    );
  }

  return {
    start,
    end,
    text:
      source.slice(
        start,
        end,
      ),
  };
}

for (
  const method of methods
) {
  const range =
    getMethodRange(
      method.name,
      method.next,
    );

  if (
    range.text.includes(
      "updates.archived_at",
    )
  ) {
    continue;
  }

  const repositoryAnchor =
    "    return executeServiceOperation(";

  const anchorIndex =
    range.text.indexOf(
      repositoryAnchor,
    );

  if (
    anchorIndex === -1
  ) {
    throw new Error(
      `Could not find executeServiceOperation in ${method.name}.`,
    );
  }

  const archiveBlock = `
    if (
      updates.archived_at !==
      undefined
    ) {
      normalized.archived_at =
        normalizeOptionalText(
          updates.archived_at,
        );
    }

    if (
      updates.archived_by !==
      undefined
    ) {
      normalized.archived_by =
        normalizeIdentifier(
          updates.archived_by,
        );
    }

`;

  const updatedMethod =
    range.text.slice(
      0,
      anchorIndex,
    ) +
    archiveBlock +
    range.text.slice(
      anchorIndex,
    );

  source =
    source.slice(
      0,
      range.start,
    ) +
    updatedMethod +
    source.slice(
      range.end,
    );
}

const requiredReferences = [
  "updates.archived_at",
  "normalized.archived_at",
  "updates.archived_by",
  "normalized.archived_by",
];

for (
  const method of methods
) {
  const range =
    getMethodRange(
      method.name,
      method.next,
    );

  for (
    const reference of requiredReferences
  ) {
    if (
      !range.text.includes(
        reference,
      )
    ) {
      throw new Error(
        `${reference} missing from ${method.name}.`,
      );
    }
  }
}

if (
  !source
    .trimStart()
    .startsWith("import ")
) {
  throw new Error(
    "Refusing to write: service no longer begins with imports.",
  );
}

const exports =
  source.match(
    /export default AssessmentService;/g,
  ) ?? [];

if (
  exports.length !== 1
) {
  throw new Error(
    `Expected one default export; found ${exports.length}.`,
  );
}

fs.copyFileSync(
  servicePath,
  `${servicePath}.pre-taxonomy-archive-fix`,
);

fs.writeFileSync(
  servicePath,
  source,
  "utf8",
);

console.log(
  "Taxonomy archive normalization added.",
);