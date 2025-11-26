// === INGREDIENTS & RECIPE MANAGEMENT ===
document.addEventListener('DOMContentLoaded', function () {
    // --- AUTH CHECK ---
    if (!checkAuthStatus()) return;
    document.getElementById('year').textContent = new Date().getFullYear();

    // --- STATE VARIABLES ---
    let allIngredients = [];
    let selectedIngredients = new Set();
    let userSavedIngredients = [];
    let allFoundRecipes = []; // Store all recipes for filtering

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
    const dietBtn = document.getElementById('dietBtn');
    const favoritesBtn = document.getElementById('favoritesBtn');
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");

    // === PART 4: Restore persistence on page load ===
    const wasCleared = localStorage.getItem("filtersCleared") === "true";
    if (wasCleared) {
    clearFiltersBtn.disabled = true;
    }


    // make 100% sure modal is closed on load
    recipeModal?.classList.remove('open');

    // --- NAVIGATION ---
    logoutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
    });
    homeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'index.html';
    });
    pantryBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        showPanel('ingredients');
    });
    favoritesBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        showPanel('pastRecipesSection');
        await loadFavorites();
    });
    backToIngredientsBtn?.addEventListener('click', () => showPanel('ingredients'));
    dietBtn?.addEventListener('click', () => { window.location.href = 'settings.html'; });

    // --- INITIAL LOAD ---
    loadUserSavedIngredients();

    // --- EVENT LISTENERS ---
    loadIngredientsBtn.addEventListener('click', loadAllIngredients);
    searchInput.addEventListener('input', filterIngredients);
    savePantryBtn.addEventListener('click', savePantry);
    findRecipesBtn.addEventListener('click', findRecipes);
    clearFiltersBtn?.addEventListener("click", clearAllFilters);


    // --- MODAL HANDLING ---
    const closeModal = document.querySelector('.close-modal');
    closeModal?.addEventListener('click', () => recipeModal?.classList.remove('open'));

    window.addEventListener('click', (e) => {
        if (e.target === recipeModal) {
            recipeModal.classList.remove('open');
        }
    });

    // ==================== FUNCTIONS ====================

    // --- Panel Switcher ---
    function showPanel(panelId) {
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

        const target = document.getElementById(panelId);
        if (!target) return;
        target.classList.add('active');

        if (panelId !== 'recipes') {
            recipeModal?.classList.remove('open');
        }

        if (panelId === 'groceryListSection') {
            window.location.hash = '#groceries';
        } else if (window.location.hash === '#groceries') {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // --- Load User's Saved Ingredients ---
    async function loadUserSavedIngredients() {
        try {
            const savedIngredients = await getUserIngredients();
            userSavedIngredients = savedIngredients;
            savedIngredients.forEach(ing =>
                selectedIngredients.add(ing.ingredient_name.toLowerCase())
            );
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
            const currentSavedNames = new Set(
                currentSaved.map(ing => ing.ingredient_name.toLowerCase())
            );
            const toAdd = Array.from(selectedIngredients).filter(
                ing => !currentSavedNames.has(ing)
            );
            const toRemove = currentSaved.filter(
                ing => !selectedIngredients.has(ing.ingredient_name.toLowerCase())
            );

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
    async function findRecipes() {
        if (selectedIngredients.size === 0) {
            alert('Please select at least one ingredient first.');
            return;
        }

        // move user into the Recipes panel
        showPanel('recipes');

        findRecipesBtn.disabled = true;
        findRecipesBtn.textContent = 'Searching...';
        recipeResults.innerHTML = '<p class="loading">Finding recipes for you...</p>';

        try {
            // 1) Get the user's dietary preferences from backend
            let prefsArray = [];
            try {
                const prefData = await getUserDietaryPreferences(); // from api.js
                prefsArray = prefData?.preferences || [];
                console.log("Using dietary preferences:", prefsArray);
            } catch (err) {
                console.warn(
                    "Could not load dietary preferences; proceeding without filter.",
                    err
                );
            }

            // 2) Call recipe search with ingredients + preferences array
            const recipes = await searchRecipesByIngredients(
                Array.from(selectedIngredients),
                prefsArray
            );

            if (!recipes.length) {
                recipeResults.innerHTML =
                    '<p class="muted">No recipes found. Try selecting different ingredients or changing your dietary preferences.</p>';
                return;
            }

            // Store all recipes for filtering
            allFoundRecipes = recipes;
            window.allFoundRecipes = recipes;

            displayRecipes(recipes);
            setupCookingMethodFilters();
        } catch (err) {
            console.error('Failed to find recipes:', err);
            recipeResults.innerHTML =
                '<p class="muted">Failed to find recipes. Please try again.</p>';
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

            const img = document.createElement('img');
            img.src = recipe.strMealThumb;
            img.alt = recipe.strMeal;

            const name = document.createElement('h4');
            name.textContent = recipe.strMeal;

            const matchInfo = document.createElement('p');
            matchInfo.className = 'muted small';
            matchInfo.textContent = `Matched: ${recipe.matchedIngredient}`;

            const checkboxLabel = document.createElement('label');
            checkboxLabel.className = 'ingredient-item';
            checkboxLabel.style.margin = '0 16px 12px';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = recipe.idMeal;
            checkbox.classList.add('recipe-checkbox');

            checkboxLabel.append(checkbox, document.createTextNode('  Add to grocery list'));

            // Heart (Favorite) button
            const heartBtn = document.createElement('button');
            heartBtn.className = 'heart-btn';
            heartBtn.setAttribute('aria-label', 'Toggle Favorite');
            heartBtn.title = 'Save to Favorites';

            const isFav = window.favoriteIds?.has?.(recipe.idMeal);
            if (isFav) heartBtn.classList.add('favorite');
            heartBtn.textContent = isFav ? '♥' : '♡';

            heartBtn.addEventListener('click', async () => {
                heartBtn.disabled = true;
                try {
                    if (heartBtn.classList.contains('favorite')) {
                        await removeFavorite(recipe.idMeal);
                        heartBtn.classList.remove('favorite');
                        heartBtn.textContent = '♡';
                        window.favoriteIds?.delete?.(recipe.idMeal);
                    } else {
                        const detail = await getRecipeDetails(recipe.idMeal);
                        await addFavorite(detail);
                        heartBtn.classList.add('favorite');
                        heartBtn.textContent = '♥';
                        if (!window.favoriteIds) window.favoriteIds = new Set();
                        window.favoriteIds.add(recipe.idMeal);
                    }
                } catch (e) {
                    console.error('Favorite toggle failed:', e);
                    alert('Could not update favorite. Please try again.');
                } finally {
                    heartBtn.disabled = false;
                }
            });

            const viewBtn = document.createElement('button');
            viewBtn.className = 'view-recipe-btn';
            viewBtn.textContent = 'View Recipe';
            viewBtn.addEventListener('click', () => viewRecipe(recipe.idMeal));

            card.append(img, name, matchInfo, checkboxLabel, heartBtn, viewBtn);
            recipeResults.appendChild(card);
        });
    }

    // --- Setup Cooking Method Filters ---
    function setupCookingMethodFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');

        filterButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                clearFiltersBtn.disabled = false;
                localStorage.setItem("filtersCleared", "false");
                
                const filterValue = e.target.dataset.filter;

                recipeResults.innerHTML = '<p class="loading">Filtering recipes...</p>';

                try {
                    const filteredRecipes = await applyCookingMethodFilter(
                        allFoundRecipes,
                        filterValue
                    );

                    if (filteredRecipes.length === 0) {
                        recipeResults.innerHTML =
                            '<p class="muted">No recipes found for this cooking method.</p>';
                    } else {
                        displayRecipes(filteredRecipes);
                    }
                } catch (error) {
                    console.error('Filter error:', error);
                    recipeResults.innerHTML =
                        '<p class="muted">Error filtering recipes. Please try again.</p>';
                }
            });
        });
    }

    // --- View Recipe Modal ---
    async function viewRecipe(recipeId) {
        if (!recipeModal) return;

        recipeModal.classList.add('open');
        window.scrollTo({ top: 0, behavior: 'smooth' });

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
            if (selectedIngredients.has(ing.name.toLowerCase())) {
                haveList.push(`${ing.name} - ${ing.measure}`);
            } else {
                missingList.push(`${ing.name} - ${ing.measure}`);
            }
        });

        const ingredientsHTML = `
            <div class="ingredients-columns">
                <div class="ingredients-column">
                    <h4>✅ You Have</h4>
                    ${
                        haveList.length
                            ? `<ul>${haveList.map(i => `<li>${i}</li>`).join('')}</ul>`
                            : '<p class="muted">No matching ingredients in your pantry.</p>'
                    }
                </div>
                <div class="ingredients-column">
                    <h4>❌ Missing Ingredients</h4>
                    ${
                        missingList.length
                            ? `<ul>${missingList.map(i => `<li>${i}</li>`).join('')}</ul>`
                            : '<p class="muted">You have everything you need!</p>'
                    }
                </div>
            </div>
        `;

        const instructions = recipe.instructions.replace(/\r?\n/g, '<br>');

        recipeDetails.innerHTML = `
            <div class="recipe-header">
                <img src="${recipe.thumbnail}" alt="${recipe.name}">
                <div class="recipe-info">
                    <p class="pill">Recipe Detail</p>
                    <h2>${recipe.name}</h2>
                    <p><strong>Category:</strong> ${recipe.category}</p>
                    <p><strong>Cuisine:</strong> ${recipe.area}</p>
                    ${
                        recipe.tags?.length
                            ? `<p><strong>Tags:</strong> ${recipe.tags.join(', ')}</p>`
                            : ''
                    }
                    ${
                        recipe.youtube
                            ? `<a href="${recipe.youtube}" target="_blank" class="btn outline small-btn">Watch on YouTube</a>`
                            : ''
                    }
                </div>
            </div>

            <div class="recipe-body">
                <section class="section-block">
                    <h3>Ingredients</h3>
                    ${ingredientsHTML}
                </section>

                <section class="section-block">
                    <h3>Instructions</h3>
                    <div class="instructions">
                        ${instructions}
                    </div>
                </section>
            </div>
        `;

        localStorage.setItem("currentMissingIngredients", JSON.stringify(missingList));
    }

    // --- Grocery List Navigation ---
    document.getElementById("goToGroceryBtn")?.addEventListener("click", handleGoToGroceryList);

    document.getElementById("backToRecipesBtn")?.addEventListener("click", () => {
        showPanel("recipes");
    });

    async function handleGoToGroceryList() {
        const selectedRecipeIds = Array.from(
            document.querySelectorAll(".recipe-checkbox:checked")
        ).map(cb => parseInt(cb.value));

        if (!selectedRecipeIds.length) {
            alert("Please select at least one recipe before generating a grocery list.");
            return;
        }

        try {
            const recipes = await Promise.all(
                selectedRecipeIds.map(id => getRecipeDetails(id))
            );

            const combinedMissing = [];

            recipes.forEach(recipe => {
                const ingredients = recipe.ingredients || [];

                ingredients.forEach(ing => {
                    const hasIt = selectedIngredients.has(ing.name.toLowerCase());
                    if (!hasIt) {
                        combinedMissing.push(`${ing.name} - ${ing.measure}`);
                    }
                });
            });

            if (!combinedMissing.length) {
                alert("You already have all the ingredients for these recipes!");
            }

            localStorage.setItem(
                "currentMissingIngredients",
                JSON.stringify(combinedMissing)
            );

            showPanel("groceryListSection");

            const generateBtn = document.getElementById("generateListBtn");
            generateBtn?.click();
        } catch (error) {
            console.error("Failed to build grocery list:", error);
            alert("Sorry, something went wrong while building your grocery list.");
        }
    }

    // --- Auto-Open Grocery List Section ---
    if (window.location.hash === "#groceries") {
        document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
        document.getElementById("groceryListSection").classList.add("active");
        recipeModal?.classList.remove("open");
    } else {
        showPanel("ingredients");
    }
    // --- Clear all Filters section ---
    function clearAllFilters() {
        // Reset UI buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove("active");
            if (btn.dataset.filter === "all") {
                btn.classList.add("active");
            }
        });
    
        // Reset recipes to full list
        displayRecipes(allFoundRecipes);
    
        // Disable Clear Filters button
        clearFiltersBtn.disabled = true;
    
        // Persist cleared state
        localStorage.setItem("filtersCleared", "true");
    }
    
});
