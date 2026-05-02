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

router.use(rateLimit);

router.get("/", listRecipes);
router.get("/:id", getRecipe);
router.post("/", createRecipe);
router.put("/:id", updateRecipe);
router.delete("/:id", deleteRecipe);

module.exports = router;
