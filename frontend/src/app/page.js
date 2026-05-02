import RecipeDashboard from "./recipe-dashboard";

const PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const SERVER_API_BASE_URL =
  process.env.SERVER_API_BASE_URL || PUBLIC_API_BASE_URL;

const getRecipes = async () => {
  try {
    const response = await fetch(`${SERVER_API_BASE_URL}/recipes`, {
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
      apiBaseUrl={PUBLIC_API_BASE_URL}
    />
  );
}
