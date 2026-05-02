const mongoose = require("mongoose");

const IngredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: String, trim: true },
    unit: { type: String, trim: true },
  },
  { _id: false }
);

const RecipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, trim: true },
    ingredients: { type: [IngredientSchema], default: [] },
    instructions: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipe", RecipeSchema);
