import RecipeDashboard from "./recipe-dashboard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const getRecipes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/recipes`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    return response.json();
  } catch {
    return [];
  }
};

export default async function Home() {
  const recipes = await getRecipes();
  return (
    <RecipeDashboard
      initialRecipes={recipes}
      apiBaseUrl={API_BASE_URL}
    />
  );
}
