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
    throw new Error(
      `Unable to read sample data from ${sampleDataPath}: ${error.message}`
    );
  }
};

const seedRecipesIfEmpty = async () => {
  if (process.env.SEED_SAMPLE_DATA === "false") {
    return { seeded: false, reason: "disabled" };
  }

  const existingCount = await Recipe.estimatedDocumentCount();
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
