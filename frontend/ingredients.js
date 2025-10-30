// === INGREDIENTS & RECIPE MANAGEMENT ===
document.addEventListener('DOMContentLoaded', function () {
    // --- AUTH CHECK ---
    if (!checkAuthStatus()) return;
    document.getElementById('year').textContent = new Date().getFullYear();

    // --- STATE VARIABLES ---
    let allIngredients = [];
    let selectedIngredients = new Set();
    let userSavedIngredients = [];

    // --- DOM ELEMENTS ---
    const loadIngredientsBtn = document.getElementById('loadIngredientsBtn');
    const searchInput = document.getElementById('searchInput');
    const ingredientsList = document.getElementById('ingredientsList');
    const selectedChips = document.getElementById('selectedChips');
    const selectedSection = document.getElementById('selectedIngredientsSection');
    const savePantryBtn = document.getElementById('savePantryBtn');
    const findRecipesBtn = document.getElementById('findRecipesBtn');
    const backToIngredientsBtn = document.getElementById('backToIngredientsBtn');
    const recipeResults = document.getElementById('recipeResults');
    const recipeModal = document.getElementById('recipeModal');
    const recipeDetails = document.getElementById('recipeDetails');
    const logoutBtn = document.getElementById('logoutBtn');
    const homeBtn = document.getElementById('homeBtn');
    const pantryBtn = document.getElementById('pantryBtn');

    // --- NAVIGATION ---
    logoutBtn?.addEventListener('click', logoutUser);
    homeBtn?.addEventListener('click', () => (window.location.href = 'index.html'));
    pantryBtn?.addEventListener('click', () => showPanel('ingredients'));
    backToIngredientsBtn?.addEventListener('click', () => showPanel('ingredients'));

    // --- INITIAL LOAD ---
    loadUserSavedIngredients();

    // --- EVENT LISTENERS ---
    loadIngredientsBtn.addEventListener('click', loadAllIngredients);
    searchInput.addEventListener('input', filterIngredients);
    savePantryBtn.addEventListener('click', savePantry);
    findRecipesBtn.addEventListener('click', findRecipes);

    // --- MODAL HANDLING ---
    const closeModal = document.querySelector('.close-modal');
    closeModal?.addEventListener('click', () => (recipeModal.style.display = 'none'));
    window.addEventListener('click', (e) => {
        if (e.target === recipeModal) recipeModal.style.display = 'none';
    });

    // ==================== FUNCTIONS ====================

    // --- Panel Switcher ---
    function showPanel(panelId) {
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.getElementById(panelId).classList.add('active');
    }

    // --- Load User's Saved Ingredients ---
    async function loadUserSavedIngredients() {
        try {
            const savedIngredients = await getUserIngredients();
            userSavedIngredients = savedIngredients;
            savedIngredients.forEach(ing => selectedIngredients.add(ing.ingredient_name.toLowerCase()));
            updateSelectedChips();
        } catch (err) {
            console.error('Failed to load saved ingredients:', err);
        }
    }

    // --- Load Ingredients from MealDB ---
    async function loadAllIngredients() {
        loadIngredientsBtn.disabled = true;
        loadIngredientsBtn.textContent = 'Loading...';
        ingredientsList.innerHTML = '<p class="loading">Loading ingredients...</p>';

        try {
            allIngredients = await getAllIngredientsFromMealDB();
            if (!allIngredients.length) {
                ingredientsList.innerHTML = '<p class="muted">Failed to load ingredients. Please try again.</p>';
                return;
            }
            renderIngredients(allIngredients);
            loadIngredientsBtn.textContent = 'Reload Ingredients';
        } catch (err) {
            console.error('Failed to load ingredients:', err);
            ingredientsList.innerHTML = '<p class="muted">Failed to load ingredients. Please try again.</p>';
        } finally {
            loadIngredientsBtn.disabled = false;
        }
    }

    // --- Render Ingredients Alphabetically ---
    function renderIngredients(ingredients) {
        if (!ingredients.length) {
            ingredientsList.innerHTML = '<p class="muted">No ingredients found.</p>';
            return;
        }

        const grouped = {};
        ingredients.forEach(ing => {
            const firstLetter = ing.charAt(0).toUpperCase();
            if (!grouped[firstLetter]) grouped[firstLetter] = [];
            grouped[firstLetter].push(ing);
        });

        const sortedLetters = Object.keys(grouped).sort();
        ingredientsList.innerHTML = '';

        sortedLetters.forEach(letter => {
            const accItem = document.createElement('details');
            accItem.className = 'acc-item';

            const summary = document.createElement('summary');
            summary.textContent = `${letter} (${grouped[letter].length})`;

            const grid = document.createElement('div');
            grid.className = 'grid';

            grouped[letter].sort().forEach(ingredient => {
                const label = document.createElement('label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = ingredient;
                checkbox.checked = selectedIngredients.has(ingredient.toLowerCase());

                checkbox.addEventListener('change', e => {
                    if (e.target.checked) selectedIngredients.add(ingredient.toLowerCase());
                    else selectedIngredients.delete(ingredient.toLowerCase());
                    updateSelectedChips();
                });

                label.append(checkbox, document.createTextNode(' ' + ingredient));
                grid.appendChild(label);
            });

            accItem.append(summary, grid);
            ingredientsList.appendChild(accItem);
        });
    }

    // --- Search Filter ---
    function filterIngredients() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filtered = searchTerm
            ? allIngredients.filter(ing => ing.toLowerCase().includes(searchTerm))
            : allIngredients;
        renderIngredients(filtered);
    }

    // --- Selected Chips Display ---
    function updateSelectedChips() {
        selectedChips.innerHTML = '';
        if (selectedIngredients.size === 0) {
            selectedSection.style.display = 'none';
            return;
        }

        selectedSection.style.display = 'block';
        Array.from(selectedIngredients).sort().forEach(ingredient => {
            const chip = document.createElement('span');
            chip.className = 'chip';
            chip.innerHTML = `${ingredient} <button aria-label="Remove">×</button>`;
            chip.querySelector('button').addEventListener('click', () => {
                selectedIngredients.delete(ingredient);
                const checkbox = document.querySelector(`input[value="${ingredient}"]`);
                if (checkbox) checkbox.checked = false;
                updateSelectedChips();
            });
            selectedChips.appendChild(chip);
        });
    }

    // --- Save Pantry to Backend ---
    async function savePantry() {
        if (selectedIngredients.size === 0) {
            alert('Please select at least one ingredient to save.');
            return;
        }

        savePantryBtn.disabled = true;
        savePantryBtn.textContent = 'Saving...';

        try {
            const currentSaved = await getUserIngredients();
            const currentSavedNames = new Set(currentSaved.map(ing => ing.ingredient_name.toLowerCase()));
            const toAdd = Array.from(selectedIngredients).filter(ing => !currentSavedNames.has(ing));
            const toRemove = currentSaved.filter(ing => !selectedIngredients.has(ing.ingredient_name.toLowerCase()));

            for (const ing of toAdd) await addIngredient(ing);
            for (const ing of toRemove) await removeIngredient(ing.id);

            alert('Pantry saved successfully!');
            await loadUserSavedIngredients();
        } catch (err) {
            console.error('Failed to save pantry:', err);
            alert('Failed to save pantry. Please try again.');
        } finally {
            savePantryBtn.disabled = false;
            savePantryBtn.textContent = 'Save My Pantry';
        }
    }

    // --- Find Recipes ---
    let allFoundRecipes = []; // Store all recipes for filtering
    
    async function findRecipes() {
        if (selectedIngredients.size === 0) {
            alert('Please select at least one ingredient first.');
            return;
        }

        findRecipesBtn.disabled = true;
        findRecipesBtn.textContent = 'Searching...';
        showPanel('recipes');
        recipeResults.innerHTML = '<p class="loading">Finding recipes for you...</p>';

        try {
            const recipes = await searchRecipesByIngredients(Array.from(selectedIngredients));
            if (!recipes.length) {
                recipeResults.innerHTML = '<p class="muted">No recipes found. Try selecting different ingredients.</p>';
                return;
            }
            
            // Store all recipes for filtering
            allFoundRecipes = recipes;
            window.allFoundRecipes = recipes; // Make available globally
            
            displayRecipes(recipes);
            setupCookingMethodFilters(); // Setup filter functionality
        } catch (err) {
            console.error('Failed to find recipes:', err);
            recipeResults.innerHTML = '<p class="muted">Failed to find recipes. Please try again.</p>';
        } finally {
            findRecipesBtn.disabled = false;
            findRecipesBtn.textContent = 'Find Recipes';
        }
    }

    // --- Display Recipe Cards ---
    function displayRecipes(recipes) {
        recipeResults.innerHTML = '';

        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = recipe.idMeal;
            checkbox.classList.add('recipe-checkbox');
            checkbox.style.marginRight = '10px';

            const img = document.createElement('img');
            img.src = recipe.strMealThumb;
            img.alt = recipe.strMeal;

            const name = document.createElement('h3');
            name.textContent = recipe.strMeal;

            const matchInfo = document.createElement('p');
            matchInfo.className = 'muted small';
            matchInfo.textContent = `Matched: ${recipe.matchedIngredient}`;

            // Add cooking method badge if available
            if (recipe.cookingMethod) {
                const methodBadge = document.createElement('span');
                methodBadge.className = `cooking-method-badge ${recipe.cookingMethod}`;
                methodBadge.textContent = recipe.cookingMethod === 'both' ? 'Oven + Stove' : 
                                        recipe.cookingMethod.charAt(0).toUpperCase() + recipe.cookingMethod.slice(1);
                card.appendChild(methodBadge);
            }

            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn primary';
            viewBtn.textContent = 'View Recipe';
            viewBtn.addEventListener('click', () => viewRecipe(recipe.idMeal));

            card.append(checkbox, img, name, matchInfo, viewBtn);
            recipeResults.appendChild(card);
        });
    }

    // --- Setup Cooking Method Filters ---
    function setupCookingMethodFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                const filterValue = e.target.dataset.filter;
                
                // Show loading
                recipeResults.innerHTML = '<p class="loading">Filtering recipes...</p>';
                
                try {
                    // Apply filter
                    const filteredRecipes = await applyCookingMethodFilter(allFoundRecipes, filterValue);
                    
                    if (filteredRecipes.length === 0) {
                        recipeResults.innerHTML = '<p class="muted">No recipes found for this cooking method.</p>';
                    } else {
                        displayRecipes(filteredRecipes);
                    }
                } catch (error) {
                    console.error('Filter error:', error);
                    recipeResults.innerHTML = '<p class="muted">Error filtering recipes. Please try again.</p>';
                }
            });
        });
    }

    // --- View Recipe Modal ---
    async function viewRecipe(recipeId) {
        recipeModal.style.display = 'block';
        recipeDetails.innerHTML = '<p class="loading">Loading recipe details...</p>';
        try {
            const recipe = await getRecipeDetails(recipeId);
            displayRecipeDetails(recipe);
        } catch (err) {
            console.error('Failed to load recipe details:', err);
            recipeDetails.innerHTML = '<p class="muted">Failed to load recipe details.</p>';
        }
    }

    // --- Enhanced Recipe Modal with "Have" & "Missing" ---
    function displayRecipeDetails(recipe) {
        const ingredients = recipe.ingredients || [];
        const haveList = [];
        const missingList = [];

        ingredients.forEach(ing => {
            if (selectedIngredients.has(ing.name.toLowerCase())) haveList.push(`${ing.name} - ${ing.measure}`);
            else missingList.push(`${ing.name} - ${ing.measure}`);
        });

        const ingredientsHTML = `
          <div class="ingredients-section">
            <h4>✅ You Have:</h4>
            ${haveList.length ? `<ul>${haveList.map(i => `<li>${i}</li>`).join('')}</ul>` : '<p class="muted">No matching ingredients in pantry.</p>'}
            <h4>❌ Missing Ingredients:</h4>
            ${missingList.length ? `<ul class="missing">${missingList.map(i => `<li>${i}</li>`).join('')}</ul>` : '<p class="muted">You have all ingredients!</p>'}
          </div>
        `;

        const instructions = recipe.instructions.replace(/\r?\n/g, '<br>');

        recipeDetails.innerHTML = `
            <div class="recipe-header">
                <img src="${recipe.thumbnail}" alt="${recipe.name}">
                <div class="recipe-info">
                    <h2>${recipe.name}</h2>
                    <p><strong>Category:</strong> ${recipe.category}</p>
                    <p><strong>Cuisine:</strong> ${recipe.area}</p>
                    ${recipe.tags?.length ? `<p><strong>Tags:</strong> ${recipe.tags.join(', ')}</p>` : ''}
                    ${recipe.youtube ? `<p><a href="${recipe.youtube}" target="_blank" class="btn outline">Watch on YouTube</a></p>` : ''}
                </div>
            </div>
            <div class="recipe-body">
                <h3>Ingredients</h3>
                ${ingredientsHTML}
                <h3>Instructions</h3>
                <div class="instructions">${instructions}</div>
            </div>
        `;

        localStorage.setItem("currentMissingIngredients", JSON.stringify(missingList));
    }

    // --- Grocery List Navigation ---
    document.getElementById("goToGroceryBtn")?.addEventListener("click", () => {
        const selectedRecipeIds = Array.from(document.querySelectorAll('.recipe-checkbox:checked')).map(cb => parseInt(cb.value));
        if (!selectedRecipeIds.length) {
            alert("Please select at least one recipe before generating a grocery list.");
            return;
        }
        localStorage.setItem("selectedRecipeIds", JSON.stringify(selectedRecipeIds));
        showPanel("groceryListSection");
    });

    // --- Auto-Open Grocery List Section ---
    if (window.location.hash === '#groceries') {
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.getElementById('groceryListSection').classList.add('active');
    }
});