"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import styles from "./page.module.css";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  ingredients: "",
  instructions: "",
};

export default function RecipeDashboard({ initialRecipes, apiBaseUrl }) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const canvasRef = useRef(null);

  const fetchRecipes = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/recipes`);
      if (!response.ok) {
        throw new Error(`Failed to load recipes (${response.status}).`);
      }
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f0f12");
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 2.6;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: "#ff9248" });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const keyLight = new THREE.DirectionalLight("#ffffff", 1);
    keyLight.position.set(2, 2, 3);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight("#ffffff", 0.4));

    const resizeRenderer = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resizeRenderer();
    window.addEventListener("resize", resizeRenderer);

    let frameId;
    const animate = () => {
      cube.rotation.x += 0.008;
      cube.rotation.y += 0.012;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resizeRenderer);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const parseIngredients = (value) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, quantity, unit] = line
          .split("|")
          .map((part) => part.trim());
        return {
          name,
          quantity: quantity || "",
          unit: unit || "",
        };
      })
      .filter((ingredient) => ingredient.name);

  const parseInstructions = (value) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "loading", message: "Saving recipe..." });

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        ingredients: parseIngredients(form.ingredients),
        instructions: parseInstructions(form.instructions),
      };

      const response = await fetch(`${apiBaseUrl}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Unable to create recipe (${response.status}).`);
      }

      setForm(emptyForm);
      setStatus({ type: "success", message: "Recipe saved." });
      await fetchRecipes();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleDelete = async (id) => {
    setStatus({ type: "loading", message: "Deleting recipe..." });
    try {
      const response = await fetch(`${apiBaseUrl}/recipes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Unable to delete recipe (${response.status}).`);
      }
      setStatus({ type: "success", message: "Recipe deleted." });
      await fetchRecipes();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>3D Recipe Book</p>
          <h1>Cook, curate, and visualize your recipes.</h1>
          <p className={styles.subtitle}>
            Build a personal recipe collection with structured ingredients and
            step-by-step instructions.
          </p>
        </div>
        <div className={styles.canvasCard}>
          <div ref={canvasRef} className={styles.canvas} />
          <p className={styles.canvasLabel}>
            Interactive Three.js preview
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.formCard}>
          <h2>Add a recipe</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <label>
              Title
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Spicy Chicken Curry"
                required
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="A rich and aromatic curry..."
                rows={3}
              />
            </label>
            <label>
              Category
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Dinner"
              />
            </label>
            <label>
              Ingredients (one per line: name | quantity | unit)
              <textarea
                name="ingredients"
                value={form.ingredients}
                onChange={handleChange}
                placeholder="Chicken | 500 | g"
                rows={4}
              />
            </label>
            <label>
              Instructions (one step per line)
              <textarea
                name="instructions"
                value={form.instructions}
                onChange={handleChange}
                placeholder="Heat oil in a pan"
                rows={4}
              />
            </label>
            <button type="submit" className={styles.primaryButton}>
              Save Recipe
            </button>
            {status.message && (
              <p className={`${styles.status} ${styles[status.type]}`}>
                {status.message}
              </p>
            )}
          </form>
        </section>

        <section className={styles.listCard}>
          <div className={styles.listHeader}>
            <h2>Recipe Library</h2>
            <span>{recipes.length} total</span>
          </div>
          <div className={styles.recipeList}>
            {recipes.length === 0 && (
              <p className={styles.emptyState}>
                No recipes yet. Add your first dish!
              </p>
            )}
            {recipes.map((recipe) => (
              <article key={recipe._id} className={styles.recipeItem}>
                <div>
                  <h3>{recipe.title}</h3>
                  <p>{recipe.description || "No description provided."}</p>
                  <div className={styles.meta}>
                    <span>{recipe.category || "Uncategorized"}</span>
                    <span>
                      {recipe.ingredients?.length || 0} ingredients
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => handleDelete(recipe._id)}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
