const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const recipeRoutes = require("./routes/recipeRoutes");
const { connectToDatabase } = require("./DB/connection");
const { seedRecipesIfEmpty } = require("./DB/seed");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/recipebook";

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/recipes", recipeRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

connectToDatabase(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected.");
    try {
      const result = await seedRecipesIfEmpty();
      if (result.seeded) {
        console.log(`Seeded ${result.count} sample recipes.`);
      } else if (result.reason === "disabled") {
        console.log("Sample recipe seeding disabled by SEED_SAMPLE_DATA.");
      } else if (result.reason === "already-populated") {
        console.log(
          `Skipping sample seed; ${result.existingCount} recipes already exist.`
        );
      } else if (result.reason === "empty-sample") {
        console.log("Sample data file is empty; skipping seed.");
      }
    } catch (error) {
      console.error("Failed to seed sample recipes:", error);
    }
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}.`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
