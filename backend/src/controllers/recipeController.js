const Recipe = require("../models/Recipe");

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSearchQuery = (term) => {
  if (!term || typeof term !== "string") {
    return {};
  }

  const trimmedTerm = term.trim();
  if (!trimmedTerm) {
    return {};
  }

  const safeTerm = escapeRegex(trimmedTerm.slice(0, 100));
  const regex = new RegExp(safeTerm, "i");
  return {
    $or: [{ title: regex }, { description: regex }, { category: regex }],
  };
};

const buildRecipePayload = (payload) => ({
  title: payload.title,
  description: payload.description,
  category: payload.category,
  ingredients: Array.isArray(payload.ingredients) ? payload.ingredients : [],
  instructions: Array.isArray(payload.instructions) ? payload.instructions : [],
});

const buildRecipeUpdate = (payload) => {
  const update = {};

  if (typeof payload.title === "string") {
    update.title = payload.title;
  }
  if (typeof payload.description === "string") {
    update.description = payload.description;
  }
  if (typeof payload.category === "string") {
    update.category = payload.category;
  }
  if (Array.isArray(payload.ingredients)) {
    update.ingredients = payload.ingredients;
  }
  if (Array.isArray(payload.instructions)) {
    update.instructions = payload.instructions;
  }

  return update;
};

const formatValidationError = (error) =>
  error?.errors
    ? Object.values(error.errors).map((err) => err.message)
    : [error.message];

const listRecipes = async (req, res) => {
  try {
    const query = buildSearchQuery(req.query.search);
    const recipes = await Recipe.find(query).sort({ createdAt: -1 });
    return res.json(recipes);
  } catch (error) {
    console.error("Failed to fetch recipes:", error);
    return res.status(500).json({
      message: "Failed to fetch recipes.",
      details: error.message,
    });
  }
};

const getRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }
    return res.json(recipe);
  } catch (error) {
    const status = error.name === "CastError" ? 400 : 500;
    return res.status(status).json({
      message: "Unable to retrieve recipe.",
      details: error.message,
    });
  }
};

const createRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.create(buildRecipePayload(req.body));
    return res.status(201).json({ message: "Recipe created.", recipe });
  } catch (error) {
    const status = error.name === "ValidationError" ? 400 : 500;
    return res.status(status).json({
      message: "Invalid recipe payload.",
      details: formatValidationError(error),
    });
  }
};

const updateRecipe = async (req, res) => {
  try {
    const update = buildRecipeUpdate(req.body);
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }
    return res.json({ message: "Recipe updated.", recipe });
  } catch (error) {
    const status =
      error.name === "ValidationError" || error.name === "CastError" ? 400 : 500;
    return res.status(status).json({
      message: "Invalid recipe payload.",
      details: formatValidationError(error),
    });
  }
};

const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }
    return res.json({ message: "Recipe deleted." });
  } catch (error) {
    const status = error.name === "CastError" ? 400 : 500;
    return res.status(status).json({
      message: "Unable to delete recipe.",
      details: error.message,
    });
  }
};

module.exports = {
  listRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};
