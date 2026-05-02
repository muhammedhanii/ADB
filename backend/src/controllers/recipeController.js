const Recipe = require("../models/Recipe");

const buildSearchQuery = (term) => {
  if (!term) {
    return {};
  }

  const regex = new RegExp(term, "i");
  return {
    $or: [{ title: regex }, { description: regex }, { category: regex }],
  };
};

const listRecipes = async (req, res) => {
  try {
    const query = buildSearchQuery(req.query.search);
    const recipes = await Recipe.find(query).sort({ createdAt: -1 });
    return res.json(recipes);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch recipes." });
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
    return res.status(400).json({ message: "Invalid recipe id." });
  }
};

const createRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      ingredients: req.body.ingredients || [],
      instructions: req.body.instructions || [],
    });
    return res.status(201).json({ message: "Recipe created.", recipe });
  } catch (error) {
    return res.status(400).json({ message: "Invalid recipe payload." });
  }
};

const updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }
    return res.json({ message: "Recipe updated.", recipe });
  } catch (error) {
    return res.status(400).json({ message: "Invalid recipe payload." });
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
    return res.status(400).json({ message: "Invalid recipe id." });
  }
};

module.exports = {
  listRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};
