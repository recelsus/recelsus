import fs from "node:fs/promises";
import { badgeGroups, languageCard } from "./badges.mjs";
import { organizations } from "./organizations.mjs";

const sourcePath = ".github/README.src.md";
const readmePath = "README.md";
const generatedNotice =
  "<!-- This file is generated from .github/README.src.md by GitHub Actions. Do not edit directly. -->";

function escapeListText(value) {
  return String(value || "No description provided.")
    .replace(/\s+/g, " ")
    .trim();
}

function renderImage(image, indent = "") {
  const width = image.width ? ` width="${image.width}"` : "";
  return `${indent}<img src="${image.src}" alt="${image.alt}"${width} />`;
}

function renderBadges() {
  const lines = [
    "<!-- badges:auto:start -->",
    "<table>",
    "  <tr>",
    '    <td valign="top" width="310">',
    renderImage(languageCard, "      "),
    "    </td>",
    '    <td valign="top">',
  ];

  badgeGroups.forEach((group, index) => {
    if (index > 0) {
      lines.push("      <br />");
    }

    lines.push(`      <sub><b>${group.label}</b></sub><br />`);
    lines.push(...group.badges.map((badge) => renderImage(badge, "      ")));
  });

  lines.push("    </td>", "  </tr>", "</table>", "<!-- badges:auto:end -->");

  return lines.join("\n");
}

const source = await fs.readFile(sourcePath, "utf8");

const organizationRows = organizations.map(
  (organization) => {
    const label = organization.label || organization.name;
    const url = organization.url || `https://github.com/${organization.name}`;
    return `- [${label}](${url}) - ${escapeListText(organization.description)}`;
  },
);

const generatedOrganizations = [
  "<!-- organizations:auto:start -->",
  ...organizationRows,
  "<!-- organizations:auto:end -->",
].join("\n");

const generatedBadgesBlockPattern =
  /<!-- badges:auto:start -->[\s\S]*?<!-- badges:auto:end -->/;
const generatedOrganizationsBlockPattern =
  /<!-- organizations:auto:start -->[\s\S]*?<!-- organizations:auto:end -->/;

if (!generatedBadgesBlockPattern.test(source)) {
  throw new Error("Auto-generated badges block was not found.");
}

if (!generatedOrganizationsBlockPattern.test(source)) {
  throw new Error("Auto-generated organizations block was not found.");
}

const body = source
  .replace(generatedBadgesBlockPattern, renderBadges())
  .replace(generatedOrganizationsBlockPattern, generatedOrganizations);
const nextReadme = `${generatedNotice}\n\n${body}`;

await fs.writeFile(readmePath, nextReadme);
