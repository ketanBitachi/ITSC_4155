// API interaction functions for Easy Kitchen
// NOTE: API_BASE_URL and MEAL_DB_API_URL are defined in config.js
// Example (in config.js):
//   const API_BASE_URL = "http://localhost:8000";
//   const MEAL_DB_API_URL = "https://www.themealdb.com/api/json/v1/1";

// ==================== PANTRY API FUNCTIONS ====================

// Get user's saved ingredients from backend
async function getUserIngredients() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pantry/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to get ingredients");
    }

    return data;
  } catch (error) {
    console.error("Get ingredients error:", error);
    throw error;
  }
}

// Add ingredient to user's pantry
async function addIngredient(ingredientName) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pantry/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ingredient_name: ingredientName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to add ingredient");
    }

    return data;
  } catch (error) {
    console.error("Add ingredient error:", error);
    throw error;
  }
}

// Remove ingredient from user's pantry
async function removeIngredient(ingredientId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pantry/${ingredientId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to remove ingredient");
    }

    return true;
  } catch (error) {
    console.error("Remove ingredient error:", error);
    throw error;
  }
}

// ==================== THEMEALDB API FUNCTIONS ====================

// Get all available ingredients from TheMealDB
async function getAllIngredientsFromMealDB() {
  try {
    const response = await fetch(`${MEAL_DB_API_URL}/list.php?i=list`);
    const data = await response.json();

    if (data && data.meals) {
      return data.meals.map((item) => item.strIngredient);
    }

    return [];
  } catch (error) {
    console.error("MealDB ingredients error:", error);
    return [];
  }
}

// Get detailed recipe information from TheMealDB
async function getRecipeDetails(recipeId) {
  try {
    const response = await fetch(
      `${MEAL_DB_API_URL}/lookup.php?i=${recipeId}`
    );
    const data = await response.json();

    if (!data.meals || data.meals.length === 0) {
      throw new Error("Recipe not found");
    }

    const meal = data.meals[0];

    // Format the recipe data
    const formattedRecipe = {
      id: meal.idMeal,
      name: meal.strMeal,
      category: meal.strCategory,
      area: meal.strArea,
      instructions: meal.strInstructions,
      thumbnail: meal.strMealThumb,
      tags: meal.strTags ? meal.strTags.split(",") : [],
      youtube: meal.strYoutube,
      ingredients: [],
    };

    // Extract ingredients and measurements
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];

      if (ingredient && ingredient.trim() !== "") {
        formattedRecipe.ingredients.push({
          name: ingredient,
          measure: measure || "As needed",
        });
      }
    }

    return formattedRecipe;
  } catch (error) {
    console.error("Recipe details error:", error);
    throw error;
  }
}

// ==================== PREFERENCE NORMALIZATION HELPERS ====================

/**
 * Normalize any preferences input into a plain array of strings.
 * Accepts:
 *   - ["vegan", "gluten_free"]
 *   - { preferences: ["vegan"] }
 *   - "vegan"
 *   - weird objects -> uses Object.values(...)
 */
function normalizePreferencesInput(preferencesInput) {
  if (!preferencesInput) return [];

  // Already an array
  if (Array.isArray(preferencesInput)) {
    return preferencesInput;
  }

  // If it's a string, wrap it
  if (typeof preferencesInput === "string") {
    return [preferencesInput];
  }

  // Common case: backend returns { preferences: [...] }
  if (
    preferencesInput &&
    Array.isArray(preferencesInput.preferences)
  ) {
    return preferencesInput.preferences;
  }

  // Fallback: if it's an object, try Object.values
  if (typeof preferencesInput === "object") {
    const vals = Object.values(preferencesInput);
    // If values contain another array as first element, unwrap once
    if (vals.length === 1 && Array.isArray(vals[0])) {
      return vals[0];
    }
    return vals;
  }

  return [];
}

/**
 * Turn preferences input into a Set of lowercased preference strings.
 */
function getPreferenceSet(preferencesInput) {
  const arr = normalizePreferencesInput(preferencesInput);
  return new Set(arr.map((p) => String(p).toLowerCase()));
}

// ==================== DIETARY FILTER HELPERS ====================

/**
 * Check whether a recipe is allowed under given preferences
 * ONLY by looking at the recipe name (strMeal).
 *
 * @param {Object} recipe - object from TheMealDB filter.php (has strMeal, idMeal, etc.)
 * @param {string[]|Object|Set} preferencesInput
 * @returns {boolean}
 */
function isRecipeNameAllowedForPreferences(recipe, preferencesInput) {
  const prefs =
    preferencesInput instanceof Set
      ? preferencesInput
      : getPreferenceSet(preferencesInput);

  if (prefs.size === 0) return true; // no prefs -> everything allowed

  const name = (recipe.strMeal || "").toLowerCase();

  // ---------- VEGAN ----------
  if (prefs.has("vegan")) {
    const nonVeganNameKeywords = [
      // meats
      "beef",
      "steak",
      "burger",
      "meatball",
      "pork",
      "ham",
      "bacon",
      "sausage",
      "lamb",
      "mutton",
      "goat",
      "duck",
      "turkey",
      "chicken",
      "wings",
      // fish & seafood
      "fish",
      "salmon",
      "tuna",
      "prawn",
      "shrimp",
      "crab",
      "lobster",
      "anchovy",
      "anchovies",
      // egg/dairy
      "egg",
      "omelette",
      "eggs",
      "cheese",
      "cream",
      "milk",
      "butter",
      "yogurt",
      "yoghurt",
      // misc animal-based
      "honey",
    ];

    const hasNonVeganName = nonVeganNameKeywords.some((k) =>
      name.includes(k)
    );
    if (hasNonVeganName) return false;
  }

  // ---------- VEGETARIAN ----------
  if (prefs.has("vegetarian")) {
    const nonVegetarianNameKeywords = [
      "beef",
      "steak",
      "burger",
      "meatball",
      "pork",
      "ham",
      "bacon",
      "sausage",
      "lamb",
      "mutton",
      "goat",
      "duck",
      "turkey",
      "chicken",
      "wings",
      "fish",
      "salmon",
      "tuna",
      "prawn",
      "shrimp",
      "crab",
      "lobster",
      "anchovy",
      "anchovies",
    ];

    const hasNonVegetarianName = nonVegetarianNameKeywords.some((k) =>
      name.includes(k)
    );
    if (hasNonVegetarianName) return false;
  }

  // ---------- GLUTEN-FREE (very rough, name-based only) ----------
  if (prefs.has("gluten_free")) {
    const glutenNameKeywords = [
      "bread",
      "burger bun",
      "bun",
      "pasta",
      "spaghetti",
      "noodle",
      "ramen",
      "lasagna",
      "pie",
      "pizza",
      "cake",
      "cookie",
      "biscuit",
      "tart",
      "sandwich",
    ];
    const hasGlutenName = glutenNameKeywords.some((k) =>
      name.includes(k)
    );
    if (hasGlutenName) return false;
  }

  // ---------- DAIRY-FREE (name-based) ----------
  if (prefs.has("dairy_free")) {
    const dairyNameKeywords = [
      "cheese",
      "cream",
      "creamy",
      "al fredo", // catch "alfredo"
      "milk",
      "yogurt",
      "yoghurt",
      "butter",
      "mac and cheese",
    ];
    const hasDairyName = dairyNameKeywords.some((k) =>
      name.includes(k)
    );
    if (hasDairyName) return false;
  }

  // ---------- NUT-FREE (name-based) ----------
  if (prefs.has("nut_free")) {
    const nutNameKeywords = [
      "walnut",
      "hazelnut",
      "almond",
      "peanut",
      "cashew",
      "pecan",
      "pistachio",
      "macadamia",
      "brazil nut",
      "pine nut",
      "chestnut",
      " nut ",
      " nuts",
    ];
    const hasNutName = nutNameKeywords.some((k) =>
      name.includes(k)
    );
    if (hasNutName) return false;
  }

  return true;
}

/**
 * Check whether a recipe is allowed under the given dietary preferences
 * using a brute-force approach on ingredient names and category.
 *
 * @param {Object} details - The detailed recipe object from getRecipeDetails
 * @param {string[]|Object|Set} preferencesInput
 * @returns {boolean}
 */
function isRecipeAllowedForPreferences(details, preferencesInput) {
  const prefs =
    preferencesInput instanceof Set
      ? preferencesInput
      : getPreferenceSet(preferencesInput);

  if (prefs.size === 0) return true; // no prefs -> everything allowed

  const ingredientNames = (details.ingredients || []).map((ing) =>
    (ing.name || "").toLowerCase()
  );
  const categoryText = (details.category || "").toLowerCase();
  const combinedText =
    ingredientNames.join(" ") + " " + categoryText;

  // ---------------- VEGAN ----------------
  if (prefs.has("vegan")) {
    const nonVeganKeywords = [
      // generic meat
      "meat",
      "steak",
      "mince",
      "minced",
      "ground beef",
      "meatball",
      "meatballs",
      // beef / pork / lamb etc.
      "beef",
      "veal",
      "pork",
      "ham",
      "bacon",
      "rib",
      "ribs",
      "sausage",
      "salami",
      "prosciutto",
      "chorizo",
      "lamb",
      "mutton",
      "goat",
      "duck",
      "goose",
      "turkey",
      "chicken",
      "wings",
      "drumstick",
      "breast",
      // fish & seafood
      "fish",
      "salmon",
      "tuna",
      "cod",
      "haddock",
      "sardine",
      "anchovy",
      "anchovies",
      "prawn",
      "shrimp",
      "crab",
      "lobster",
      "clam",
      "mussel",
      "oyster",
      "seafood",
      // eggs & egg products
      "egg",
      "eggs",
      "mayonnaise",
      "mayo",
      // dairy
      "milk",
      "cheese",
      "mozzarella",
      "cheddar",
      "parmesan",
      "cream",
      "butter",
      "ghee",
      "yogurt",
      "yoghurt",
      "custard",
      "kefir",
      "whey",
      "casein",
      // other animal
      "gelatin",
      "gelatine",
      "honey",
      "lard",
      "tallow",
    ];

    const hasNonVegan = nonVeganKeywords.some((k) =>
      combinedText.includes(k)
    );
    if (hasNonVegan) return false;
  }

  // ---------------- VEGETARIAN ----------------
  if (prefs.has("vegetarian")) {
    const nonVegetarianKeywords = [
      "meat",
      "steak",
      "mince",
      "minced",
      "ground beef",
      "meatball",
      "meatballs",
      "beef",
      "veal",
      "pork",
      "ham",
      "bacon",
      "rib",
      "ribs",
      "sausage",
      "salami",
      "prosciutto",
      "chorizo",
      "lamb",
      "mutton",
      "goat",
      "duck",
      "goose",
      "turkey",
      "chicken",
      "wings",
      "drumstick",
      "breast",
      "fish",
      "salmon",
      "tuna",
      "cod",
      "haddock",
      "sardine",
      "anchovy",
      "anchovies",
      "prawn",
      "shrimp",
      "crab",
      "lobster",
      "clam",
      "mussel",
      "oyster",
      "seafood",
      "gelatin",
      "gelatine",
    ];

    const hasNonVegetarian = nonVegetarianKeywords.some((k) =>
      combinedText.includes(k)
    );
    if (hasNonVegetarian) return false;
  }

  // ---------------- GLUTEN-FREE ----------------
  if (prefs.has("gluten_free")) {
    const glutenKeywords = [
      "wheat",
      "barley",
      "rye",
      "spelt",
      "bulgur",
      "semolina",
      "triticale",
      "farro",
      "kamut",
      "oats",
      "flour",
      "all-purpose flour",
      "plain flour",
      "self raising",
      "self-raising",
      "bread",
      "baguette",
      "roll",
      "bap",
      "pita",
      "tortilla",
      "naan",
      "focaccia",
      "pasta",
      "spaghetti",
      "lasagna",
      "noodle",
      "udon",
      "ramen",
      "macaroni",
      "couscous",
      "cracker",
      "breadcrumbs",
      "panko",
      "biscuit",
      "cookie",
      "cake",
      "pastry",
      "pastries",
      "pie crust",
      "shortcrust",
    ];

    const hasGluten = glutenKeywords.some((k) =>
      combinedText.includes(k)
    );
    if (hasGluten) return false;
  }

  // ---------------- DAIRY-FREE ----------------
  if (prefs.has("dairy_free")) {
    const dairyKeywords = [
      "milk",
      "whole milk",
      "skimmed milk",
      "semi-skimmed",
      "cheese",
      "mozzarella",
      "cheddar",
      "parmesan",
      "feta",
      "halloumi",
      "ricotta",
      "cream",
      "double cream",
      "single cream",
      "heavy cream",
      "whipping cream",
      "butter",
      "ghee",
      "yogurt",
      "yoghurt",
      "kefir",
      "custard",
      "whey",
      "casein",
      "condensed milk",
      "evaporated milk",
      "buttermilk",
    ];

    const hasDairy = dairyKeywords.some((k) =>
      combinedText.includes(k)
    );
    if (hasDairy) return false;
  }

  // ---------------- NUT-FREE ----------------
  if (prefs.has("nut_free")) {
    const nutKeywords = [
      "almond",
      "walnut",
      "hazelnut",
      "cashew",
      "pecan",
      "peanut",
      "groundnut",
      "pistachio",
      "macadamia",
      "brazil nut",
      "pine nut",
      "chestnut",
      " nut ",
      " nuts",
    ];

    const hasNut = nutKeywords.some((k) =>
      combinedText.includes(k)
    );
    if (hasNut) return false;
  }

  return true;
}

// ==================== MAIN SEARCH: INGREDIENTS + PREFERENCES ====================

async function searchRecipesByIngredients(ingredients, preferencesInput = []) {
  try {
    if (!ingredients || !ingredients.length) return [];

    let allRecipes = [];

    // 1) Search for each ingredient using TheMealDB filter API
    for (const ingredient of ingredients) {
      const formattedIngredient = ingredient.toLowerCase().replace(/ /g, "_");

      const response = await fetch(
        `${MEAL_DB_API_URL}/filter.php?i=${encodeURIComponent(
          formattedIngredient
        )}`
      );
      const data = await response.json();

      if (data.meals) {
        data.meals.forEach((meal) => {
          // Track matched ingredient(s) for the UI
          if (!meal.matchedIngredient) {
            meal.matchedIngredient = ingredient;
          } else if (!meal.matchedIngredient.includes(ingredient)) {
            meal.matchedIngredient += `, ${ingredient}`;
          }
        });
        allRecipes = allRecipes.concat(data.meals);
      }
    }

    // 2) Deduplicate recipes by idMeal
    const uniqueRecipes = Array.from(
      new Map(allRecipes.map((recipe) => [recipe.idMeal, recipe])).values()
    );

    // 3) Normalize preferences once and build a Set
    const prefSet = getPreferenceSet(preferencesInput);

    // If no preferences, just return everything
    if (prefSet.size === 0) {
      return uniqueRecipes;
    }

    // 4) Apply both name-based and ingredient-based filters (brute force)
    const filtered = [];
    for (const recipe of uniqueRecipes) {
      // Quick name check first
      if (!isRecipeNameAllowedForPreferences(recipe, prefSet)) {
        continue;
      }

      // Then pull full details and look at ingredients + category
      try {
        const details = await getRecipeDetails(recipe.idMeal);
        if (!isRecipeAllowedForPreferences(details, prefSet)) {
          continue;
        }
        filtered.push(recipe);
      } catch (err) {
        console.error(
          "Failed to fetch details for preference filter on recipe",
          recipe.idMeal,
          err
        );
        // If details fail, safest is to skip the recipe
      }
    }

    return filtered;
  } catch (error) {
    console.error("Recipe search error:", error);
    return [];
  }
}

// ==================== COOKING METHOD FILTER FUNCTIONS ====================

// Determine cooking method from recipe instructions
function determineCookingMethod(instructions) {
  const lowerInstructions = instructions.toLowerCase();

  const ovenKeywords = [
    "oven",
    "bake",
    "baking",
    "roast",
    "roasting",
    "broil",
    "broiling",
  ];
  const stoveKeywords = [
    "stove",
    "stovetop",
    "pan",
    "pot",
    "skillet",
    "saucepan",
    "fry",
    "frying",
    "sauté",
    "saute",
    "boil",
    "boiling",
    "simmer",
    "simmering",
  ];

  const hasOven = ovenKeywords.some((keyword) =>
    lowerInstructions.includes(keyword)
  );
  const hasStove = stoveKeywords.some((keyword) =>
    lowerInstructions.includes(keyword)
  );

  if (hasOven && hasStove) return "both";
  if (hasOven) return "oven";
  if (hasStove) return "stove";
  return "unknown";
}

// Apply cooking method filter to recipes
async function applyCookingMethodFilter(recipes, methodFilter) {
  const recipesWithMethod = await Promise.all(
    recipes.map(async (recipe) => {
      try {
        const details = await getRecipeDetails(recipe.idMeal);
        return {
          ...recipe,
          cookingMethod: determineCookingMethod(details.instructions),
        };
      } catch (error) {
        console.error(`Failed to get details for ${recipe.idMeal}`, error);
        return {
          ...recipe,
          cookingMethod: "unknown",
        };
      }
    })
  );

  if (methodFilter === "all") return recipesWithMethod;

  return recipesWithMethod.filter((recipe) => {
    if (methodFilter === "both") {
      return recipe.cookingMethod === "both";
    }
    return (
      recipe.cookingMethod === methodFilter ||
      recipe.cookingMethod === "both"
    );
  });
}

// Sort recipes by various criteria
function sortRecipes(recipes, sortBy = "name") {
  const sortedRecipes = [...recipes];

  switch (sortBy) {
    case "name":
      return sortedRecipes.sort((a, b) => a.strMeal.localeCompare(b.strMeal));
    case "cookingMethod":
      return sortedRecipes.sort((a, b) => {
        const methodOrder = { oven: 1, stove: 2, both: 3, unknown: 4 };
        return (
          (methodOrder[a.cookingMethod] || 4) -
          (methodOrder[b.cookingMethod] || 4)
        );
      });
    default:
      return sortedRecipes;
  }
}

// ==================== PREFERENCES API HELPERS ====================

// Decode the current user ID either from localStorage.userId or from JWT
function getCurrentUserId() {
  // 1) Try localStorage.userId (if you ever set it there)
  const rawId = localStorage.getItem("userId");
  if (rawId) {
    const parsed = parseInt(rawId, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  // 2) Fallback: try to decode JWT "authToken" and read user_id or sub
  const token = localStorage.getItem("authToken");
  if (token) {
    const parts = token.split(".");
    if (parts.length === 3) {
      try {
        const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);

        if (payload.user_id != null) {
          const parsed = parseInt(payload.user_id, 10);
          if (!Number.isNaN(parsed)) {
            return parsed;
          }
        }
        if (payload.sub != null) {
          const parsed = parseInt(payload.sub, 10);
          if (!Number.isNaN(parsed)) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn("Failed to decode JWT payload to extract user_id:", e);
      }
    }
  }

  // 3) No user ID available
  return null;
}

// Load preferences for the current authenticated user
async function getUserDietaryPreferences() {
  const url = `${API_BASE_URL}/api/preferences/me`;

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  // In tests, fetch may be a loose mock; treat missing responses as "no prefs".
  if (!response) {
    return { preferences: [] };
  }

  if (!response.ok) {
    const text = typeof response.text === "function" ? await response.text() : "";
    console.error("getUserDietaryPreferences failed:", response.status, text);
    throw new Error(
      `Failed to load dietary preferences (status ${response.status})`
    );
  }

  // { preferences: [...] }
  return await response.json();
}

// Save preferences for the current authenticated user
async function saveUserDietaryPreferences(preferences) {
  const url = `${API_BASE_URL}/api/preferences`;

  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ preferences: preferences || [] }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("saveUserDietaryPreferences failed:", response.status, text);
    throw new Error(
      `Failed to save dietary preferences (status ${response.status})`
    );
  }

  // { preferences: [...] }
  return await response.json();
}

// Example: recommended recipes endpoint from your backend (if you wire it up)
async function getRecommendedRecipes() {
  const response = await fetch(`${API_BASE_URL}/api/recipes/recommendations`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("getRecommendedRecipes failed:", response.status, text);
    throw new Error(`Failed to load recipes (status ${response.status})`);
  }

  return await response.json(); // { category, preferences_used, meals: [...] }
}

// ---- expose functions to window for tests / non-module script usage ----
async function getFavorites() {
    const res = await fetch(`${API_BASE_URL}/api/favorites`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to load favorites');
    return data;
}

async function addFavorite(recipeDetail) {
    const res = await fetch(`${API_BASE_URL}/api/favorites/${recipeDetail.id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ recipe_json: recipeDetail })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to add favorite');
    return data;
}

async function removeFavorite(recipeId) {
    const res = await fetch(`${API_BASE_URL}/api/favorites/${recipeId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!res.ok && res.status !== 204) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to remove favorite');
    }
    return true;
}
if (typeof window !== "undefined") {
  window.getUserIngredients = getUserIngredients;
  window.addIngredient = addIngredient;
  window.removeIngredient = removeIngredient;

  window.getAllIngredientsFromMealDB = getAllIngredientsFromMealDB;
  window.searchRecipesByIngredients = searchRecipesByIngredients;
  window.getRecipeDetails = getRecipeDetails;

  window.applyCookingMethodFilter = applyCookingMethodFilter;
  window.determineCookingMethod = determineCookingMethod;
  window.sortRecipes = sortRecipes;

  window.getCurrentUserId = getCurrentUserId;
  window.getUserDietaryPreferences = getUserDietaryPreferences;
  window.saveUserDietaryPreferences = saveUserDietaryPreferences;
  window.getRecommendedRecipes = getRecommendedRecipes;

  window.isRecipeAllowedForPreferences = isRecipeAllowedForPreferences;
  window.isRecipeNameAllowedForPreferences = isRecipeNameAllowedForPreferences;

  window.getFavorites = getFavorites;
  window.addFavorite = addFavorite;
  window.removeFavorite = removeFavorite;
}
