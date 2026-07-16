import fs from "node:fs/promises";
import { languageCardSource } from "./badges.mjs";

const outputPath = "assets/top-languages-by-repo.svg";

async function updateLanguageCard() {
  let response;

  try {
    response = await fetch(languageCardSource);
  } catch (error) {
    console.warn(`Skipping language card update: ${error.message}`);
    return;
  }

  if (!response.ok) {
    console.warn(`Skipping language card update: ${response.status}`);
    return;
  }

  const svg = await response.text();

  if (!svg.includes("<svg")) {
    console.warn("Skipping language card update: response is not SVG.");
    return;
  }

  await fs.mkdir("assets", { recursive: true });
  await fs.writeFile(outputPath, svg);
}

await updateLanguageCard();
