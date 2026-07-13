import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();

const sourceMark = path.join(
  root,
  "public",
  "brand",
  "schoolos-mark-primary.svg",
);

const iconsDirectory = path.join(root, "public", "icons");
const socialDirectory = path.join(root, "public", "social");

await fs.mkdir(iconsDirectory, { recursive: true });
await fs.mkdir(socialDirectory, { recursive: true });

const markBuffer = await fs.readFile(sourceMark);

async function renderIcon({
  filename,
  size,
  padding = 0,
  background = null,
}) {
  const innerSize = size - padding * 2;

  const mark = await sharp(markBuffer)
    .resize(innerSize, innerSize, {
      fit: "contain",
    })
    .png()
    .toBuffer();

  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background:
        background || {
          r: 0,
          g: 0,
          b: 0,
          alpha: 0,
        },
    },
  });

  await canvas
    .composite([
      {
        input: mark,
        left: padding,
        top: padding,
      },
    ])
    .png()
    .toFile(path.join(iconsDirectory, filename));
}

await renderIcon({
  filename: "favicon-16x16.png",
  size: 16,
});

await renderIcon({
  filename: "favicon-32x32.png",
  size: 32,
});

await renderIcon({
  filename: "apple-touch-icon.png",
  size: 180,
  padding: 18,
  background: "#0D1B2A",
});

await renderIcon({
  filename: "android-chrome-192x192.png",
  size: 192,
  padding: 18,
  background: "#1D4ED8",
});

await renderIcon({
  filename: "android-chrome-512x512.png",
  size: 512,
  padding: 48,
  background: "#1D4ED8",
});

await renderIcon({
  filename: "pwa-maskable-192x192.png",
  size: 192,
  padding: 36,
  background: "#0D1B2A",
});

await renderIcon({
  filename: "pwa-maskable-512x512.png",
  size: 512,
  padding: 96,
  background: "#0D1B2A",
});

const markBase64 = markBuffer.toString("base64");

const openGraphSvg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="1200"
  height="630"
  viewBox="0 0 1200 630"
>
  <defs>
    <linearGradient
      id="background"
      x1="0"
      y1="0"
      x2="1200"
      y2="630"
      gradientUnits="userSpaceOnUse"
    >
      <stop offset="0" stop-color="#0D1B2A" />
      <stop offset="0.5" stop-color="#172554" />
      <stop offset="1" stop-color="#1D4ED8" />
    </linearGradient>

    <linearGradient
      id="word"
      x1="260"
      y1="0"
      x2="720"
      y2="0"
      gradientUnits="userSpaceOnUse"
    >
      <stop offset="0" stop-color="#3B82F6" />
      <stop offset="1" stop-color="#60A5FA" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#background)" />

  <circle
    cx="1040"
    cy="100"
    r="250"
    fill="#3B82F6"
    opacity="0.13"
  />

  <circle
    cx="150"
    cy="560"
    r="280"
    fill="#7C3AED"
    opacity="0.14"
  />

  <image
    href="data:image/svg+xml;base64,${markBase64}"
    x="70"
    y="105"
    width="235"
    height="235"
  />

  <text
    x="335"
    y="220"
    fill="#FFFFFF"
    font-family="Arial, Helvetica, sans-serif"
    font-size="78"
    font-weight="800"
    letter-spacing="-3"
  >
    School
  </text>

  <text
    x="590"
    y="220"
    fill="url(#word)"
    font-family="Arial, Helvetica, sans-serif"
    font-size="78"
    font-weight="800"
    letter-spacing="-3"
  >
    OS
  </text>

  <text
    x="338"
    y="268"
    fill="#BFDBFE"
    font-family="Arial, Helvetica, sans-serif"
    font-size="21"
    font-weight="700"
    letter-spacing="8"
  >
    ENTERPRISE
  </text>

  <text
    x="72"
    y="420"
    fill="#FFFFFF"
    font-family="Arial, Helvetica, sans-serif"
    font-size="54"
    font-weight="800"
  >
    One platform.
  </text>

  <text
    x="72"
    y="482"
    fill="#93C5FD"
    font-family="Arial, Helvetica, sans-serif"
    font-size="54"
    font-weight="800"
  >
    Every institution.
  </text>

  <text
    x="72"
    y="544"
    fill="#FFFFFF"
    font-family="Arial, Helvetica, sans-serif"
    font-size="54"
    font-weight="800"
  >
    Limitless potential.
  </text>

  <text
    x="860"
    y="560"
    fill="#DBEAFE"
    font-family="Arial, Helvetica, sans-serif"
    font-size="22"
    font-weight="600"
  >
    by TAVARO GROUP
  </text>
</svg>
`;

await sharp(Buffer.from(openGraphSvg))
  .png()
  .toFile(
    path.join(
      socialDirectory,
      "schoolos-open-graph.png",
    ),
  );

console.log("SchoolOS production brand assets generated.");
