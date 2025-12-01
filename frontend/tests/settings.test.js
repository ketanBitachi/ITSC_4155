// tests/settings.test.js
const path = require("path");

describe("settings.js (dietary preferences page)", () => {
  let checkAuthStatusMock;
  let logoutUserMock;
  let getUserDietaryPreferencesMock;
  let saveUserDietaryPreferencesMock;

  const flush = () => new Promise((r) => setTimeout(r, 0));

  function buildDom() {
    document.body.innerHTML = `
      <header class="site-header">
        <nav class="top-nav">
          <button id="homeBtn">Home</button>
          <button id="dietBtn">Dietary</button>
          <button id="pantryBtn">My Pantry</button>
          <button id="logoutBtn">Logout</button>
        </nav>
      </header>
      <main>
        <section>
          <div id="dietaryOptions">
            <label><input type="checkbox" value="vegetarian"> Vegetarian</label>
            <label><input type="checkbox" value="vegan"> Vegan</label>
            <label><input type="checkbox" value="gluten-free"> Gluten Free</label>
          </div>
          <button id="saveDietPrefsBtn">Save</button>
          <span id="dietaryStatus"></span>
        </section>
      </main>
      <footer class="site-footer">
        <small>&copy; <span id="year"></span> Easy Kitchen</small>
      </footer>
    `;
  }

  beforeEach(async () => {
    buildDom();

    // fresh mocks for every test
    checkAuthStatusMock = jest.fn(() => true);
    logoutUserMock = jest.fn();
    getUserDietaryPreferencesMock = jest.fn().mockResolvedValue({
      preferences: ["vegetarian", "vegan"],
    });
    saveUserDietaryPreferencesMock = jest
      .fn()
      .mockResolvedValue({ preferences: [] });

    global.checkAuthStatus = checkAuthStatusMock;
    global.logoutUser = logoutUserMock;
    global.getUserDietaryPreferences = getUserDietaryPreferencesMock;
    global.saveUserDietaryPreferences = saveUserDietaryPreferencesMock;

    jest.resetModules();
    require(path.join(process.cwd(), "settings.js"));
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // let initial async load run
    await flush();
    await flush();
  });

  test("checks auth on load and fills in year", () => {
    expect(checkAuthStatusMock).toHaveBeenCalled();

    const yearSpan = document.getElementById("year");
    expect(yearSpan.textContent).toBe(String(new Date().getFullYear()));
  });

  test("loads saved dietary preferences and applies to checkboxes", async () => {
    // load already happened in beforeEach, just inspect UI
    const vegetarian = document.querySelector(
      '#dietaryOptions input[value="vegetarian"]'
    );
    const vegan = document.querySelector(
      '#dietaryOptions input[value="vegan"]'
    );
    const glutenFree = document.querySelector(
      '#dietaryOptions input[value="gluten-free"]'
    );

    expect(vegetarian.checked).toBe(true);
    expect(vegan.checked).toBe(true);
    expect(glutenFree.checked).toBe(false);

    const statusSpan = document.getElementById("dietaryStatus");
    expect(statusSpan.textContent).toBe("Loaded your saved preferences.");
  });

  test("save button sends selected preferences to backend and shows success", async () => {
    // choose vegan + gluten-free
    const vegan = document.querySelector(
      '#dietaryOptions input[value="vegan"]'
    );
    const glutenFree = document.querySelector(
      '#dietaryOptions input[value="gluten-free"]'
    );
    vegan.checked = true;
    glutenFree.checked = true;

    const saveBtn = document.getElementById("saveDietPrefsBtn");
    saveBtn.click();

    await flush();
    await flush();

    expect(saveUserDietaryPreferencesMock).toHaveBeenCalledWith([
      "vegan",
      "gluten-free",
    ]);

    const statusSpan = document.getElementById("dietaryStatus");
    expect(statusSpan.textContent).toBe("Preferences saved.");
  });

  test("save shows error status when backend fails", async () => {
    // make the NEXT call reject
    saveUserDietaryPreferencesMock.mockRejectedValueOnce(new Error("boom"));

    const saveBtn = document.getElementById("saveDietPrefsBtn");
    saveBtn.click();

    await flush();
    await flush();

    const statusSpan = document.getElementById("dietaryStatus");
    expect(statusSpan.textContent).toBe("Error saving preferences.");
  });

  test("nav + logout buttons update location / call logoutUser", () => {
    const homeBtn = document.getElementById("homeBtn");
    const pantryBtn = document.getElementById("pantryBtn");
    const dietBtn = document.getElementById("dietBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    homeBtn.click();
    expect(window.location.href.endsWith("index.html")).toBe(true);

    pantryBtn.click();
    expect(window.location.href.endsWith("ingredients.html")).toBe(true);

    dietBtn.click();
    expect(window.location.href.endsWith("settings.html")).toBe(true);

    logoutBtn.click();
    expect(logoutUserMock).toHaveBeenCalled();
  });
});
