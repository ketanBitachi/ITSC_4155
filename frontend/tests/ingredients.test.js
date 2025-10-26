// tests/ingredients.test.js
const fs = require("fs");
const path = require("path");

function loadPage(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf8");
  document.documentElement.innerHTML = html;
}

describe("ingredients.js UI flows", () => {
  beforeEach(() => {
    // Fresh DOM from the actual page
    loadPage(path.join(process.cwd(), "ingredients.html"));

    // Load helpers first so functions are on window/global
    require(path.join(process.cwd(), "auth.js"));
    require(path.join(process.cwd(), "api.js"));

    // Allow page to proceed as "authenticated"
    jest.spyOn(global, "checkAuthStatus").mockReturnValue(true);

    // Pantry + MealDB defaults (tests can override per-case)
    jest
      .spyOn(global, "getUserIngredients")
      .mockResolvedValue([{ id: 1, ingredient_name: "Apple" }]); // initial saved pantry

    jest
      .spyOn(global, "getAllIngredientsFromMealDB")
      .mockResolvedValue(["Apple", "Banana", "Carrot"]);

    jest.spyOn(global, "addIngredient").mockResolvedValue({
      id: 2,
      ingredient_name: "Banana",
    });

    jest.spyOn(global, "removeIngredient").mockResolvedValue(true);

    jest
      .spyOn(global, "searchRecipesByIngredients")
      .mockResolvedValue([
        {
          idMeal: "10",
          strMeal: "Banana Bread",
          strMealThumb: "x.jpg",
          matchedIngredient: "Banana",
        },
      ]);

    jest.spyOn(global, "getRecipeDetails").mockResolvedValue({
      id: "10",
      name: "Banana Bread",
      category: "Dessert",
      area: "American",
      instructions: "Mix\nBake",
      thumbnail: "x.jpg",
      tags: ["Sweet"],
      youtube: "",
      ingredients: [{ name: "Banana", measure: "2" }],
    });

    // Load page script and fire DOMContentLoaded manually
    require(path.join(process.cwd(), "ingredients.js"));
    document.dispatchEvent(new Event("DOMContentLoaded"));
  });

  test("loads saved ingredients into selected chips on page load", async () => {
    // let loadUserSavedIngredients finish
    await Promise.resolve();
    await Promise.resolve();

    const chips = document.querySelectorAll("#selectedChips .chip");
    expect(chips.length).toBe(1);
    expect(chips[0].textContent).toMatch(/Apple/);
  });

  test("Load All Ingredients renders accordion and selection chips update", async () => {
    document.getElementById("loadIngredientsBtn").click();
    await Promise.resolve();
    await Promise.resolve();

    const labels = [...document.querySelectorAll(".accordion .grid label")].map(
      (l) => l.textContent.trim()
    );
    expect(labels).toEqual(
      expect.arrayContaining(["Apple", "Banana", "Carrot"])
    );

    // select Banana
    const bananaCheckbox = [
      ...document.querySelectorAll('input[type="checkbox"]'),
    ].find((c) => c.value === "Banana");
    bananaCheckbox.click();

    // chip should appear
    const chipRow = document.getElementById("selectedChips");
    expect(chipRow.textContent).toMatch(/Banana/);
  });

  test("Save My Pantry adds and removes correctly", async () => {
    // For this test, save flow calls getUserIngredients() twice:
    //  1) initial page load (already handled in beforeEach)
    //  2) inside savePantry() to compute the diff
    // Make sure the second call ALSO returns Apple so it can be removed
    global.getUserIngredients
      .mockResolvedValueOnce([{ id: 1, ingredient_name: "Apple" }]) // initial (loadUserSavedIngredients)
      .mockResolvedValueOnce([{ id: 1, ingredient_name: "Apple" }]); // savePantry() diff

    // Render ingredient list
    document.getElementById("loadIngredientsBtn").click();
    await Promise.resolve();
    await Promise.resolve();

    // Select Banana (new)
    const banana = [...document.querySelectorAll('input[type="checkbox"]')].find(
      (c) => c.value === "Banana"
    );
    banana.checked = true;
    banana.dispatchEvent(new Event("change"));

    // Deselect Apple (previously saved)
    const apple = [...document.querySelectorAll('input[type="checkbox"]')].find(
      (c) => c.value === "Apple"
    );
    // Apple will only be present if its group is open; ensure all <details> are open
    document.querySelectorAll(".accordion details").forEach((d) => (d.open = true));
    if (apple) {
      apple.checked = false;
      apple.dispatchEvent(new Event("change"));
    }

    // Save
    const saveBtn = document.getElementById("savePantryBtn");
    saveBtn.click();

    // Flush async work (awaits inside savePantry())
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(global.addIngredient).toHaveBeenCalledWith("Banana");
    expect(global.removeIngredient).toHaveBeenCalledWith(1); // remove Apple by id
  });

  test("Find Recipes switches panel and shows details modal", async () => {
    const findBtn = document.getElementById("findRecipesBtn");
    findBtn.click();

    await Promise.resolve();
    await Promise.resolve();

    const card = document.querySelector(".recipe-card");
    expect(card).toBeTruthy();
    expect(card.textContent).toMatch(/Banana Bread/);

    // open modal
    card.querySelector(".btn.primary").click();
    await Promise.resolve();
    const modal = document.getElementById("recipeModal");
    expect(modal.style.display).toBe("block");
    expect(document.getElementById("recipeDetails").textContent).toMatch(
      /Ingredients/
    );
  });
});