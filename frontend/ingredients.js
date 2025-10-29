// Ingredients management and UI functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!checkAuthStatus()) {
        return;
    }
    
    // Set year in footer
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // State variables
    let allIngredients = [];
    let selectedIngredients = new Set();
    let userSavedIngredients = [];
    
    // DOM elements
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
    
    // Navigation handlers
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
    
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    if (pantryBtn) {
        pantryBtn.addEventListener('click', () => {
            showPanel('ingredients');
        });
    }
    
    if (backToIngredientsBtn) {
        backToIngredientsBtn.addEventListener('click', () => {
            showPanel('ingredients');
        });
    }
    
    // Load user's saved ingredients on page load
    loadUserSavedIngredients();
    
    // Event listeners
    loadIngredientsBtn.addEventListener('click', loadAllIngredients);
    searchInput.addEventListener('input', filterIngredients);
    savePantryBtn.addEventListener('click', savePantry);
    findRecipesBtn.addEventListener('click', findRecipes);
    
    // Modal close handlers
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            recipeModal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', (event) => {
        if (event.target === recipeModal) {
            recipeModal.style.display = 'none';
        }
    });
    
    // ==================== FUNCTIONS ====================
    
    // Show/hide panels
    function showPanel(panelId) {
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(panelId).classList.add('active');
    }
    
    // Load user's saved ingredients
    async function loadUserSavedIngredients() {
        try {
            const savedIngredients = await getUserIngredients();
            userSavedIngredients = savedIngredients;
            
            // Add to selected set
            savedIngredients.forEach(ing => {
                selectedIngredients.add(ing.ingredient_name);
            });
            
            updateSelectedChips();
        } catch (error) {
            console.error('Failed to load saved ingredients:', error);
        }
    }
    
    // Load all ingredients from TheMealDB
    async function loadAllIngredients() {
        loadIngredientsBtn.disabled = true;
        loadIngredientsBtn.textContent = 'Loading...';
        ingredientsList.innerHTML = '<p class="loading">Loading ingredients...</p>';
        
        try {
            allIngredients = await getAllIngredientsFromMealDB();
            
            if (allIngredients.length === 0) {
                ingredientsList.innerHTML = '<p class="muted">Failed to load ingredients. Please try again.</p>';
                return;
            }
            
            renderIngredients(allIngredients);
            loadIngredientsBtn.textContent = 'Reload Ingredients';
        } catch (error) {
            console.error('Failed to load ingredients:', error);
            ingredientsList.innerHTML = '<p class="muted">Failed to load ingredients. Please try again.</p>';
        } finally {
            loadIngredientsBtn.disabled = false;
        }
    }
    
    // Render ingredients grouped alphabetically
    function renderIngredients(ingredients) {
        if (ingredients.length === 0) {
            ingredientsList.innerHTML = '<p class="muted">No ingredients found.</p>';
            return;
        }
        
        // Group by first letter
        const grouped = {};
        ingredients.forEach(ing => {
            const firstLetter = ing.charAt(0).toUpperCase();
            if (!grouped[firstLetter]) {
                grouped[firstLetter] = [];
            }
            grouped[firstLetter].push(ing);
        });
        
        // Sort and render
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
                checkbox.checked = selectedIngredients.has(ingredient);
                
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        selectedIngredients.add(ingredient);
                    } else {
                        selectedIngredients.delete(ingredient);
                    }
                    updateSelectedChips();
                });
                
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(' ' + ingredient));
                grid.appendChild(label);
            });
            
            accItem.appendChild(summary);
            accItem.appendChild(grid);
            ingredientsList.appendChild(accItem);
        });
    }
    
    // Filter ingredients based on search
    function filterIngredients() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            renderIngredients(allIngredients);
            return;
        }
        
        const filtered = allIngredients.filter(ing => 
            ing.toLowerCase().includes(searchTerm)
        );
        
        renderIngredients(filtered);
    }
    
    // Update selected chips display
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
                
                // Uncheck the checkbox if visible
                const checkbox = document.querySelector(`input[value="${ingredient}"]`);
                if (checkbox) {
                    checkbox.checked = false;
                }
                
                updateSelectedChips();
            });
            
            selectedChips.appendChild(chip);
        });
    }
    
    // Save pantry to backend
    async function savePantry() {
        if (selectedIngredients.size === 0) {
            alert('Please select at least one ingredient to save.');
            return;
        }
        
        savePantryBtn.disabled = true;
        savePantryBtn.textContent = 'Saving...';
        
        try {
            // Get current saved ingredients
            const currentSaved = await getUserIngredients();
            const currentSavedNames = new Set(currentSaved.map(ing => ing.ingredient_name));
            
            // Find ingredients to add and remove
            const toAdd = Array.from(selectedIngredients).filter(ing => !currentSavedNames.has(ing));
            const toRemove = currentSaved.filter(ing => !selectedIngredients.has(ing.ingredient_name));
            
            // Add new ingredients
            for (const ingredient of toAdd) {
                await addIngredient(ingredient);
            }
            
            // Remove deselected ingredients
            for (const ingredient of toRemove) {
                await removeIngredient(ingredient.id);
            }
            
            alert('Pantry saved successfully!');
            await loadUserSavedIngredients();
        } catch (error) {
            console.error('Failed to save pantry:', error);
            alert('Failed to save pantry. Please try again.');
        } finally {
            savePantryBtn.disabled = false;
            savePantryBtn.textContent = 'Save My Pantry';
        }
    }
    
    // Find recipes based on selected ingredients
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
            
            if (recipes.length === 0) {
                recipeResults.innerHTML = '<p class="muted">No recipes found with these ingredients. Try selecting different ingredients.</p>';
                return;
            }
            
            // Store the original recipes for filtering
            window.allFoundRecipes = recipes;
            
            // Default to showing all recipes initially
            displayRecipes(recipes);
            
            // Set up cooking method filter buttons
            setupCookingMethodFilters();
        } catch (error) {
            console.error('Failed to find recipes:', error);
            recipeResults.innerHTML = '<p class="muted">Failed to find recipes. Please try again.</p>';
        } finally {
            findRecipesBtn.disabled = false;
            findRecipesBtn.textContent = 'Find Recipes';
        }
    }
    
    // Display recipe cards
    function displayRecipes(recipes) {
        recipeResults.innerHTML = '';
        
        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            
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
                methodBadge.className = `method-badge method-${recipe.cookingMethod.toLowerCase()}`;
                methodBadge.textContent = recipe.cookingMethod;
                card.appendChild(methodBadge);
            }
            
            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn primary';
            viewBtn.textContent = 'View Recipe';
            viewBtn.addEventListener('click', () => viewRecipe(recipe.idMeal));
            
            card.appendChild(img);
            card.appendChild(name);
            card.appendChild(matchInfo);
            card.appendChild(viewBtn);
            
            recipeResults.appendChild(card);
        });
    }
    
    // Set up cooking method filter buttons
    function setupCookingMethodFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', async function() {
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Show loading state
                recipeResults.innerHTML = '<p class="loading">Filtering recipes...</p>';
                
                // Get selected method
                const methodFilter = this.getAttribute('data-method');
                
                try {
                    // Apply the cooking method filter
                    const filteredRecipes = await applyCookingMethodFilter(window.allFoundRecipes, methodFilter);
                    
                    if (filteredRecipes.length === 0) {
                        recipeResults.innerHTML = `<p class="muted">No recipes found using ${methodFilter} cooking method. Try a different filter.</p>`;
                        return;
                    }
                    
                    // Display filtered recipes
                    displayRecipes(filteredRecipes);
                } catch (error) {
                    console.error('Failed to filter recipes:', error);
                    recipeResults.innerHTML = '<p class="muted">Failed to filter recipes. Please try again.</p>';
                }
            });
        });
    }
    
    // View recipe details
    async function viewRecipe(recipeId) {
        recipeModal.style.display = 'block';
        recipeDetails.innerHTML = '<p class="loading">Loading recipe details...</p>';
        
        try {
            const recipe = await getRecipeDetails(recipeId);
            displayRecipeDetails(recipe);
        } catch (error) {
            console.error('Failed to load recipe details:', error);
            recipeDetails.innerHTML = '<p class="muted">Failed to load recipe details.</p>';
        }
    }
    
    // Display recipe details in modal
    function displayRecipeDetails(recipe) {
        let ingredientsList = '<ul class="ingredients-list">';
        recipe.ingredients.forEach(ing => {
            ingredientsList += `<li>${ing.name} - ${ing.measure}</li>`;
        });
        ingredientsList += '</ul>';
        
        const instructions = recipe.instructions.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
        
        recipeDetails.innerHTML = `
            <div class="recipe-header">
                <img src="${recipe.thumbnail}" alt="${recipe.name}">
                <div class="recipe-info">
                    <h2>${recipe.name}</h2>
                    <p><strong>Category:</strong> ${recipe.category}</p>
                    <p><strong>Cuisine:</strong> ${recipe.area}</p>
                    ${recipe.tags.length > 0 ? `<p><strong>Tags:</strong> ${recipe.tags.join(', ')}</p>` : ''}
                    ${recipe.youtube ? `<p><a href="${recipe.youtube}" target="_blank" class="btn outline">Watch on YouTube</a></p>` : ''}
                </div>
            </div>
            <div class="recipe-body">
                <h3>Ingredients</h3>
                ${ingredientsList}
                <h3>Instructions</h3>
                <div class="instructions">${instructions}</div>
            </div>
        `;
    }
});