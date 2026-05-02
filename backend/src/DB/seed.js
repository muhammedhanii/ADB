const fs = require("fs/promises");
const path = require("path");
const Recipe = require("../models/Recipe");

const sampleDataPath = path.resolve(
  __dirname,
  "../../../database/sample_data.json"
);

const loadSampleRecipes = async () => {
  try {
    const raw = await fs.readFile(sampleDataPath, "utf8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      throw new Error("Sample data file must contain an array of recipes.");
    }
    return data;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Sample data file not found at ${sampleDataPath}.`, {
        cause: error,
      });
    }
    if (error instanceof SyntaxError) {
      throw new Error(
        `Sample data file contains invalid JSON: ${error.message}`,
        { cause: error }
      );
    }
    throw new Error(
      `Unable to read sample data from ${sampleDataPath}: ${error.message}`,
      { cause: error }
    );
  }
};

const isSeedingDisabled = () => {
  const rawValue = process.env.SEED_SAMPLE_DATA;
  if (rawValue === undefined) {
    return false;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return ["false", "0", "no", "off"].includes(normalized);
};

const seedRecipesIfEmpty = async () => {
  if (isSeedingDisabled()) {
    return { seeded: false, reason: "disabled" };
  }

  const existingCount = await Recipe.countDocuments();
  if (existingCount > 0) {
    return { seeded: false, reason: "already-populated", existingCount };
  }

  const recipes = await loadSampleRecipes();
  if (recipes.length === 0) {
    return { seeded: false, reason: "empty-sample" };
  }

  const inserted = await Recipe.insertMany(recipes);
  return { seeded: true, count: inserted.length };
};

module.exports = { seedRecipesIfEmpty };
