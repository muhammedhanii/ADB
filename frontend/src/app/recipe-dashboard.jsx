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
  const [editingId, setEditingId] = useState(null);
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
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0.3, 0.2, 3.1);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const bookGroup = new THREE.Group();

    const coverGeometry = new THREE.BoxGeometry(1.6, 1.1, 0.22);
    const coverMaterial = new THREE.MeshStandardMaterial({
      color: "#e85d42",
      metalness: 0.2,
      roughness: 0.45,
    });
    const cover = new THREE.Mesh(coverGeometry, coverMaterial);
    bookGroup.add(cover);

    const pagesGeometry = new THREE.BoxGeometry(1.46, 0.98, 0.14);
    const pagesMaterial = new THREE.MeshStandardMaterial({
      color: "#f5efe6",
      roughness: 0.9,
    });
    const pages = new THREE.Mesh(pagesGeometry, pagesMaterial);
    pages.position.z = 0.02;
    bookGroup.add(pages);

    const spineGeometry = new THREE.BoxGeometry(0.22, 1.06, 0.24);
    const spineMaterial = new THREE.MeshStandardMaterial({
      color: "#8a3b2f",
      roughness: 0.6,
    });
    const spine = new THREE.Mesh(spineGeometry, spineMaterial);
    spine.position.x = -0.69;
    bookGroup.add(spine);

    const ribbonGeometry = new THREE.BoxGeometry(0.04, 0.75, 0.02);
    const ribbonMaterial = new THREE.MeshStandardMaterial({
      color: "#ffb86b",
      roughness: 0.4,
    });
    const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
    ribbon.position.set(0.5, -0.05, 0.11);
    bookGroup.add(ribbon);

    bookGroup.rotation.y = -0.4;
    bookGroup.rotation.x = 0.15;
    scene.add(bookGroup);

    const keyLight = new THREE.DirectionalLight("#ffffff", 1.2);
    keyLight.position.set(3, 2.5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight("#ffd7b1", 0.6);
    fillLight.position.set(-2, 1.5, 2);
    scene.add(fillLight);

    scene.add(new THREE.AmbientLight("#ffffff", 0.35));

    const resizeRenderer = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resizeRenderer();
    window.addEventListener("resize", resizeRenderer);

    let frameId;
    const animate = (time) => {
      const t = time * 0.001;
      bookGroup.rotation.y += 0.005;
      bookGroup.rotation.x = 0.12 + Math.sin(t * 1.2) * 0.04;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };
    animate(0);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resizeRenderer);
      coverGeometry.dispose();
      coverMaterial.dispose();
      pagesGeometry.dispose();
      pagesMaterial.dispose();
      spineGeometry.dispose();
      spineMaterial.dispose();
      ribbonGeometry.dispose();
      ribbonMaterial.dispose();
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

  const formatIngredients = (ingredients) => {
    if (!Array.isArray(ingredients)) {
      return "";
    }

    return ingredients
      .map((ingredient) =>
        [ingredient.name, ingredient.quantity, ingredient.unit]
          .filter((value) => value && String(value).trim())
          .join(" | ")
      )
      .join("\n");
  };

  const formatInstructions = (instructions) => {
    if (!Array.isArray(instructions)) {
      return "";
    }
    return instructions.filter(Boolean).join("\n");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isEditing = Boolean(editingId);
    setStatus({
      type: "loading",
      message: isEditing ? "Updating recipe..." : "Saving recipe...",
    });

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        ingredients: parseIngredients(form.ingredients),
        instructions: parseInstructions(form.instructions),
      };

      const response = await fetch(
        isEditing ? `${apiBaseUrl}/recipes/${editingId}` : `${apiBaseUrl}/recipes`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Unable to ${isEditing ? "update" : "create"} recipe (${response.status}).`
        );
      }

      setForm(emptyForm);
      setEditingId(null);
      setStatus({
        type: "success",
        message: isEditing ? "Recipe updated." : "Recipe saved.",
      });
      await fetchRecipes();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleEdit = (recipe) => {
    setEditingId(recipe._id);
    setForm({
      title: recipe.title || "",
      description: recipe.description || "",
      category: recipe.category || "",
      ingredients: formatIngredients(recipe.ingredients),
      instructions: formatInstructions(recipe.instructions),
    });
    setStatus({ type: "idle", message: "" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setStatus({ type: "idle", message: "" });
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
          <h2>{editingId ? "Edit recipe" : "Add a recipe"}</h2>
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
            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryButton}>
                {editingId ? "Update Recipe" : "Save Recipe"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
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
                <div className={styles.recipeActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => handleEdit(recipe)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => handleDelete(recipe._id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
