import fs from "node:fs/promises";
import { badgeGroups, languageCard } from "./badges.mjs";
import { owner, projects } from "./projects.mjs";

const sourcePath = ".github/README.src.md";
const readmePath = "README.md";
const generatedNotice =
  "<!-- This file is generated from .github/README.src.md by GitHub Actions. Do not edit directly. -->";

const token = process.env.GITHUB_TOKEN;
const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

if (token) {
  headers.Authorization = `Bearer ${token}`;
}

async function fetchDescription(repo) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${repo}: ${response.status}`);
  }

  const data = await response.json();
  return data.description || "";
}

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

const projectDetails = await Promise.all(
  projects.map(async (project) => {
    const description = await fetchDescription(project.repo);

    return {
      ...project,
      description,
    };
  }),
);

const listRows = projectDetails.map(
  (project) =>
    `- [${project.name}](https://github.com/${owner}/${project.repo}) - ${escapeListText(project.description)}`,
);

const generatedList = [
  "<!-- projects:auto:start -->",
  ...listRows,
  "<!-- projects:auto:end -->",
].join("\n");

const generatedBadgesBlockPattern =
  /<!-- badges:auto:start -->[\s\S]*?<!-- badges:auto:end -->/;
const generatedProjectsBlockPattern =
  /<!-- projects:auto:start -->[\s\S]*?<!-- projects:auto:end -->/;

if (!generatedBadgesBlockPattern.test(source)) {
  throw new Error("Auto-generated badges block was not found.");
}

if (!generatedProjectsBlockPattern.test(source)) {
  throw new Error("Auto-generated projects block was not found.");
}

const body = source
  .replace(generatedBadgesBlockPattern, renderBadges())
  .replace(generatedProjectsBlockPattern, generatedList);
const nextReadme = `${generatedNotice}\n\n${body}`;

await fs.writeFile(readmePath, nextReadme);
