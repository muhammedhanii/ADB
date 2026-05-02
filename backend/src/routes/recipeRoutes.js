const express = require("express");
const rateLimit = require("../middleware/rateLimit");
const {
  listRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} = require("../controllers/recipeController");

const router = express.Router();

router.get("/", rateLimit, listRecipes);
router.get("/:id", rateLimit, getRecipe);
router.post("/", rateLimit, createRecipe);
router.put("/:id", rateLimit, updateRecipe);
router.delete("/:id", rateLimit, deleteRecipe);

module.exports = router;
