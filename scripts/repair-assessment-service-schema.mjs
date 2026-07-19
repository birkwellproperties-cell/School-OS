import fs from "node:fs";

const servicePath =
  process.argv[2];

if (!servicePath) {
  throw new Error(
    "AssessmentService.js path is required.",
  );
}

const original =
  fs.readFileSync(
    servicePath,
    "utf8",
  );

let lines =
  original.split(/\r?\n/);

function indentation(line) {
  return (
    line.match(/^\s*/)?.[0]
      .length ?? 0
  );
}

function findExactProperty(
  propertyName,
) {
  return lines.findIndex(
    (line) =>
      line.trim() ===
      `${propertyName}:`,
  );
}

function findPropertyEnd(
  startIndex,
) {
  const startIndent =
    indentation(
      lines[startIndex],
    );

  for (
    let index =
      startIndex + 1;
    index < lines.length;
    index += 1
  ) {
    const line =
      lines[index];

    if (!line.trim()) {
      continue;
    }

    const currentIndent =
      indentation(line);

    if (
      currentIndent <=
      startIndent
    ) {
      return index;
    }
  }

  return lines.length;
}

function replaceProperty(
  propertyName,
  replacement,
  required = true,
) {
  const startIndex =
    findExactProperty(
      propertyName,
    );

  if (
    startIndex === -1
  ) {
    if (required) {
      throw new Error(
        `Property block not found: ${propertyName}`,
      );
    }

    return;
  }

  const endIndex =
    findPropertyEnd(
      startIndex,
    );

  lines.splice(
    startIndex,
    endIndex -
      startIndex,
    ...replacement,
  );
}

function findIfBlock(
  marker,
) {
  const markerIndex =
    lines.findIndex(
      (line) =>
        line.includes(
          marker,
        ),
    );

  if (
    markerIndex === -1
  ) {
    return null;
  }

  let startIndex =
    markerIndex;

  while (
    startIndex >= 0 &&
    lines[startIndex]
      .trim() !== "if ("
  ) {
    startIndex -= 1;
  }

  if (
    startIndex < 0
  ) {
    throw new Error(
      `Could not find if-block start for ${marker}`,
    );
  }

  let braceDepth = 0;
  let foundOpeningBrace =
    false;

  for (
    let index =
      startIndex;
    index < lines.length;
    index += 1
  ) {
    const line =
      lines[index];

    for (
      const character of line
    ) {
      if (
        character === "{"
      ) {
        braceDepth += 1;
        foundOpeningBrace =
          true;
      }

      if (
        character === "}"
      ) {
        braceDepth -= 1;
      }
    }

    if (
      foundOpeningBrace &&
      braceDepth === 0
    ) {
      return {
        startIndex,
        endIndex:
          index + 1,
      };
    }
  }

  throw new Error(
    `Could not find if-block end for ${marker}`,
  );
}

function replaceIfBlock(
  marker,
  replacement,
  required = true,
) {
  const block =
    findIfBlock(
      marker,
    );

  if (!block) {
    if (required) {
      throw new Error(
        `Update block not found: ${marker}`,
      );
    }

    return;
  }

  lines.splice(
    block.startIndex,
    block.endIndex -
      block.startIndex,
    ...replacement,
  );
}

replaceProperty(
  "language_code",
  [],
  false,
);

replaceIfBlock(
  "updates.language_code",
  [],
  false,
);

replaceProperty(
  "randomize_options",
  [],
  false,
);

replaceIfBlock(
  "updates.randomize_options",
  [],
  false,
);

replaceProperty(
  "marks_awarded",
  [
    "      score_fraction:",
    "        normalizeNumber(",
    "          payload.score_fraction ??",
    "            0,",
    "          {",
    "            label:",
    '              "Assessment question option score fraction",',
    "",
    "            minimum: 0,",
    "            maximum: 1,",
    "          },",
    "        ),",
    "",
  ],
);

replaceIfBlock(
  "updates.marks_awarded",
  [
    "    if (",
    "      updates.score_fraction !==",
    "      undefined",
    "    ) {",
    "      normalized.score_fraction =",
    "        normalizeNumber(",
    "          updates.score_fraction,",
    "          {",
    "            label:",
    '              "Assessment question option score fraction",',
    "",
    "            minimum: 0,",
    "            maximum: 1,",
    "          },",
    "        );",
    "    }",
  ],
);

const repaired =
  lines.join("\n");

const unsupported = [
  "payload.language_code",
  "updates.language_code",
  "normalized.language_code",
  "payload.randomize_options",
  "updates.randomize_options",
  "normalized.randomize_options",
  "payload.marks_awarded",
  "updates.marks_awarded",
  "normalized.marks_awarded",
].filter(
  (value) =>
    repaired.includes(value),
);

if (
  unsupported.length > 0
) {
  throw new Error(
    `Unsupported references remain: ${unsupported.join(", ")}`,
  );
}

if (
  !repaired
    .trimStart()
    .startsWith("import ")
) {
  throw new Error(
    "Refusing to write: service no longer begins with imports.",
  );
}

const exportMatches =
  repaired.match(
    /export default AssessmentService;/g,
  ) ?? [];

if (
  exportMatches.length !== 1
) {
  throw new Error(
    `Expected one default export; found ${exportMatches.length}.`,
  );
}

if (
  !repaired.includes(
    "payload.score_fraction",
  ) ||
  !repaired.includes(
    "updates.score_fraction",
  )
) {
  throw new Error(
    "score_fraction create/update handling was not created.",
  );
}

fs.copyFileSync(
  servicePath,
  `${servicePath}.pre-option-schema-fix`,
);

fs.writeFileSync(
  servicePath,
  repaired,
  "utf8",
);

console.log(
  "AssessmentService schema alignment completed.",
);