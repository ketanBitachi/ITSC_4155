// API interaction functions for Easy Kitchen
// const API_BASE_URL = 'http://localhost:8000';
// const MEAL_DB_API_URL = 'https://www.themealdb.com/api/json/v2/65232507';
// const MEAL_DB_API_URL = 'https://www.themealdb.com/api/json/v1/1';

// ==================== PANTRY API FUNCTIONS ====================

// Get user's saved ingredients from backend
async function getUserIngredients() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/pantry/`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Failed to get ingredients');
        }
        
        return data;
    } catch (error) {
        console.error('Get ingredients error:', error);
        throw error;
    }
}

// Add ingredient to user's pantry
async function addIngredient(ingredientName) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/pantry/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                ingredient_name: ingredientName
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Failed to add ingredient');
        }
        
        return data;
    } catch (error) {
        console.error('Add ingredient error:', error);
        throw error;
    }
}

// Remove ingredient from user's pantry
async function removeIngredient(ingredientId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/pantry/${ingredientId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok && response.status !== 204) {
            const data = await response.json();
            throw new Error(data.detail || 'Failed to remove ingredient');
        }
        
        return true;
    } catch (error) {
        console.error('Remove ingredient error:', error);
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
            return data.meals.map(item => item.strIngredient);
        }
        
        return [];
    } catch (error) {
        console.error('MealDB ingredients error:', error);
        return [];
    }
}

// Search recipes by ingredients from TheMealDB
async function searchRecipesByIngredients(ingredients) {
    try {
        let allRecipes = [];
        
        // Search for each ingredient
        for (const ingredient of ingredients) {
            const formattedIngredient = ingredient.toLowerCase().replace(/ /g, '_');
            
            const response = await fetch(`${MEAL_DB_API_URL}/filter.php?i=${formattedIngredient}`);
            const data = await response.json();
            
            if (data.meals) {
                data.meals.forEach(meal => {
                    meal.matchedIngredient = ingredient;
                });
                allRecipes = [...allRecipes, ...data.meals];
            }
        }
        
        // Remove duplicates (same meal might match multiple ingredients)
        const uniqueRecipes = Array.from(
            new Map(allRecipes.map(recipe => [recipe.idMeal, recipe])).values()
        );
        
        return uniqueRecipes;
    } catch (error) {
        console.error('Recipe search error:', error);
        return [];
    }
}

// Get detailed recipe information from TheMealDB
async function getRecipeDetails(recipeId) {
    try {
        const response = await fetch(`${MEAL_DB_API_URL}/lookup.php?i=${recipeId}`);
        const data = await response.json();
        
        if (!data.meals || data.meals.length === 0) {
            throw new Error('Recipe not found');
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
            tags: meal.strTags ? meal.strTags.split(',') : [],
            youtube: meal.strYoutube,
            ingredients: []
        };
        
        // Extract ingredients and measurements
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            
            if (ingredient && ingredient.trim() !== '') {
                formattedRecipe.ingredients.push({
                    name: ingredient,
                    measure: measure || 'As needed'
                });
            }
        }
        
        return formattedRecipe;
    } catch (error) {
        console.error('Recipe details error:', error);
        throw error;
    }
}

// Filter recipes by cooking method
async function applyCookingMethodFilter(recipes, methodFilter) {
    const recipesWithMethod = await Promise.all(
        recipes.map(async (recipe) => {
            try {
                const details = await getRecipeDetails(recipe.idMeal);
                return { 
                    ...recipe, 
                    cookingMethod: determineCookingMethod(details.instructions) 
                };
            } catch (error) {
                console.error(`Failed to get details for ${recipe.idMeal}`, error);
                return { 
                    ...recipe, 
                    cookingMethod: 'unknown' 
                };
            }
        })
    );

    // Filter based on selection
    if (methodFilter === 'all') return recipesWithMethod;
    
    return recipesWithMethod.filter(recipe => {
        if (methodFilter === 'both') {
            return recipe.cookingMethod === 'both';
        }
        return recipe.cookingMethod === methodFilter || recipe.cookingMethod === 'both';
    });
}

// Determine cooking method from recipe instructions
function determineCookingMethod(instructions) {
    const lowerInstructions = instructions.toLowerCase();
    
    const ovenKeywords = ['oven', 'bake', 'baking', 'roast', 'roasting', 'broil', 'broiling'];
    const stoveKeywords = ['stove', 'stovetop', 'pan', 'pot', 'skillet', 'saucepan', 'fry', 'frying', 'sauté', 'boil', 'boiling', 'simmer', 'simmering'];
    
    const hasOven = ovenKeywords.some(keyword => lowerInstructions.includes(keyword));
    const hasStove = stoveKeywords.some(keyword => lowerInstructions.includes(keyword));
    
    if (hasOven && hasStove) return 'both';
    if (hasOven) return 'oven';
    if (hasStove) return 'stove';
    return 'unknown';
}

// ---- expose functions to window for tests / non-module script usage ----
if (typeof window !== "undefined") {
  window.getUserIngredients = getUserIngredients;
  window.addIngredient = addIngredient;
  window.removeIngredient = removeIngredient;

  window.getAllIngredientsFromMealDB = getAllIngredientsFromMealDB;
  window.searchRecipesByIngredients = searchRecipesByIngredients;
  window.getRecipeDetails = getRecipeDetails;
  window.applyCookingMethodFilter = applyCookingMethodFilter;
  window.determineCookingMethod = determineCookingMethod;
}