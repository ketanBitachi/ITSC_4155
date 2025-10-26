const path = require("path");

describe("api.js", () => {
  beforeAll(() => {
    // auth helpers used by pantry functions
    require(path.join(process.cwd(), "auth.js"));
    // load api
    require(path.join(process.cwd(), "api.js"));
  });

  test("getAllIngredientsFromMealDB returns mapped ingredients", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        meals: [{ strIngredient: "Apple" }, { strIngredient: "Banana" }]
      })
    });
    const res = await global.getAllIngredientsFromMealDB();
    expect(res).toEqual(["Apple", "Banana"]);
  });

  test("searchRecipesByIngredients merges and de-dupes by idMeal", async () => {
    // two ingredients return overlapping meals
    fetch
      .mockResolvedValueOnce({ json: async () => ({ meals: [{ idMeal: "1", strMeal: "A", strMealThumb: "t" }] }) })
      .mockResolvedValueOnce({ json: async () => ({ meals: [{ idMeal: "1", strMeal: "A", strMealThumb: "t" }, { idMeal: "2", strMeal: "B", strMealThumb: "t" }] }) });

    const res = await global.searchRecipesByIngredients(["chicken", "rice"]);
    expect(res.map(r => r.idMeal)).toEqual(["1", "2"]);
    // matchedIngredient was set at least on some record
    expect(res[0].matchedIngredient).toBeDefined();
  });

  test("getRecipeDetails formats ingredients + meta", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        meals: [{
          idMeal: "5",
          strMeal: "Dish",
          strCategory: "Cat",
          strArea: "Area",
          strInstructions: "Step1\nStep2",
          strMealThumb: "img",
          strTags: "Quick,Dinner",
          strYoutube: "y",
          strIngredient1: "Salt", strMeasure1: "1 tsp",
          strIngredient2: "Pepper", strMeasure2: "1/2 tsp",
          strIngredient3: "", strMeasure3: ""
        }]
      })
    });

    const out = await global.getRecipeDetails("5");
    expect(out.name).toBe("Dish");
    expect(out.ingredients.length).toBe(2);
    expect(out.tags).toEqual(["Quick", "Dinner"]);
  });

  test("Pantry API functions pass auth headers and payloads", async () => {
    localStorage.setItem("authToken", "tok");
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ([{ id: 1, ingredient_name: "Apple" }]) }) // get
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2, ingredient_name: "Milk" }) })   // add
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });                      // delete

    const list = await global.getUserIngredients();
    expect(list[0].ingredient_name).toBe("Apple");

    const added = await global.addIngredient("Milk");
    expect(added.ingredient_name).toBe("Milk");
    expect(fetch.mock.calls[1][1].headers.Authorization).toContain("Bearer");

    const ok = await global.removeIngredient(2);
    expect(ok).toBe(true);
  });
});