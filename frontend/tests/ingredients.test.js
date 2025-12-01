// tests/ingredients.test.js
const fs = require("fs");
const path = require("path");

function loadPage(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf8");
  document.documentElement.innerHTML = html;
}

describe("ingredients.js UI flows", () => {
  beforeEach(() => {
    loadPage(path.join(process.cwd(), "ingredients.html"));

    // load helpers
    require(path.join(process.cwd(), "auth.js"));
    require(path.join(process.cwd(), "api.js"));

    jest.spyOn(global, "checkAuthStatus").mockReturnValue(true);

    jest
      .spyOn(global, "getUserIngredients")
      .mockResolvedValue([{ id: 1, ingredient_name: "Apple" }]);

    jest
      .spyOn(global, "getAllIngredientsFromMealDB")
      .mockResolvedValue(["Apple", "Banana", "Carrot"]);

    jest.spyOn(global, "addIngredient").mockResolvedValue({
      id: 2,
      ingredient_name: "Banana"
    });

    jest.spyOn(global, "removeIngredient").mockResolvedValue(true);

    jest.spyOn(global, "searchRecipesByIngredients").mockResolvedValue([
      {
        idMeal: "10",
        strMeal: "Banana Bread",
        strMealThumb: "x.jpg",
        matchedIngredient: "Banana"
      }
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
      ingredients: [{ name: "Banana", measure: "2" }]
    });

    require(path.join(process.cwd(), "ingredients.js"));
    document.dispatchEvent(new Event("DOMContentLoaded"));
  });

  test("loads saved ingredients into selected chips on page load", async () => {
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
      l => l.textContent.trim()
    );
    expect(labels).toEqual(expect.arrayContaining(["Apple", "Banana", "Carrot"]));

    const bananaCheckbox = [
      ...document.querySelectorAll('input[type="checkbox"]')
    ].find(c => c.value === "Banana");
    bananaCheckbox.click();

    const chipRow = document.getElementById("selectedChips");
    expect(chipRow.textContent).toMatch(/Banana/);
  });

  test("Save My Pantry adds and removes correctly", async () => {
    global.getUserIngredients
      .mockResolvedValueOnce([{ id: 1, ingredient_name: "Apple" }])
      .mockResolvedValueOnce([{ id: 1, ingredient_name: "Apple" }]);

    document.getElementById("loadIngredientsBtn").click();
    await Promise.resolve();
    await Promise.resolve();

    const banana = [...document.querySelectorAll('input[type="checkbox"]')].find(
      c => c.value === "Banana"
    );
    banana.checked = true;
    banana.dispatchEvent(new Event("change"));

    document.querySelectorAll(".accordion details").forEach(d => (d.open = true));
    const apple = [...document.querySelectorAll('input[type="checkbox"]')].find(
      c => c.value === "Apple"
    );
    if (apple) {
      apple.checked = false;
      apple.dispatchEvent(new Event("change"));
    }

    const saveBtn = document.getElementById("savePantryBtn");
    saveBtn.click();

    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    expect(global.addIngredient).toHaveBeenCalledWith("Banana");
    expect(global.removeIngredient).toHaveBeenCalledWith(1);
  });

  test("Find Recipes switches panel and shows details modal", async () => {
    const findBtn = document.getElementById("findRecipesBtn");
    findBtn.click();

    await Promise.resolve();
    await Promise.resolve();

    const card = document.querySelector(".recipe-card");
    expect(card).toBeTruthy();
    expect(card.textContent).toMatch(/Banana Bread/);

    card.querySelector(".btn.primary").click();
    await Promise.resolve();

    const modal = document.getElementById("recipeModal");
    expect(modal.style.display).toBe("block");
    expect(document.getElementById("recipeDetails").textContent).toMatch(
      /Ingredients/
    );
  });
});