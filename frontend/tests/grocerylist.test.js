// tests/grocerylist.test.js
const path = require("path");

describe("grocerylist.js", () => {
  function buildDom() {
    document.body.innerHTML = `
      <main>
        <section id="grocery">
          <div id="groceryList"></div>
          <div class="grocery-actions">
            <button id="generateListBtn">Generate</button>
            <button id="saveListBtn">Save</button>
            <button id="exportListBtn">Export</button>
          </div>
        </section>
      </main>
    `;
  }

  beforeEach(() => {
    buildDom();
    localStorage.clear();
    global.alert.mockClear();

    // jsPDF stub lives on window / global
    delete global.jspdf;
    delete global.jsPDF;
  });

  function initScript() {
    // load script and run DOMContentLoaded handler
    jest.resetModules();
    require(path.join(process.cwd(), "grocerylist.js"));
    document.dispatchEvent(new Event("DOMContentLoaded"));
  }

  test("on load: renders saved list if present", () => {
    localStorage.setItem(
      "savedGroceryList",
      JSON.stringify(["Milk", "Eggs"])
    );

    initScript();

    const list = document.getElementById("groceryList");
    expect(list.textContent).toMatch(/Milk/);
    expect(list.textContent).toMatch(/Eggs/);
  });

  test("on load: falls back to currentMissingIngredients when no saved list", () => {
    localStorage.setItem(
      "currentMissingIngredients",
      JSON.stringify(["Bread", "Butter"])
    );

    initScript();

    const list = document.getElementById("groceryList");
    expect(list.textContent).toMatch(/Bread/);
    expect(list.textContent).toMatch(/Butter/);
  });

  test("Generate button uses currentMissingIngredients and alerts when empty", () => {
    initScript();

    const generateBtn = document.getElementById("generateListBtn");
    generateBtn.click();

    const list = document.getElementById("groceryList");
    expect(list.textContent).toMatch(/No grocery list found yet/i);
    expect(global.alert).toHaveBeenCalledWith(
      expect.stringContaining("No ingredients found")
    );
  });

  test("Generate button populates list when missing ingredients exist", () => {
    localStorage.setItem(
      "currentMissingIngredients",
      JSON.stringify(["Tomato", "Onion"])
    );

    initScript();

    const generateBtn = document.getElementById("generateListBtn");
    generateBtn.click();

    const list = document.getElementById("groceryList");
    expect(list.textContent).toMatch(/Tomato/);
    expect(list.textContent).toMatch(/Onion/);
    expect(global.alert).not.toHaveBeenCalled();
  });

  test("Save button warns when no items in DOM", () => {
    initScript();

    const saveBtn = document.getElementById("saveListBtn");
    saveBtn.click();

    expect(global.alert).toHaveBeenCalledWith(
      expect.stringContaining("Generate your grocery list before saving")
    );
    expect(localStorage.getItem("savedGroceryList")).toBeNull();
  });

  test("Save button stores current list in localStorage", () => {
    localStorage.setItem(
      "currentMissingIngredients",
      JSON.stringify(["Tomato"])
    );

    initScript();

    // make sure list exists
    document.getElementById("generateListBtn").click();

    const saveBtn = document.getElementById("saveListBtn");
    saveBtn.click();

    const stored = JSON.parse(
      localStorage.getItem("savedGroceryList") || "[]"
    );
    expect(stored).toEqual(["Tomato"]);
    expect(global.alert).toHaveBeenCalledWith(
      expect.stringContaining("Grocery list saved")
    );
  });

  test("Export button warns if no items in DOM", () => {
    initScript();

    const exportBtn = document.getElementById("exportListBtn");
    exportBtn.click();

    expect(global.alert).toHaveBeenCalledWith(
      expect.stringContaining("Generate your grocery list before exporting")
    );
  });

  test("Export uses jsPDF when available", () => {
    initScript();

    // create a list in DOM
    const list = document.getElementById("groceryList");
    list.innerHTML = "<ul><li>Milk</li><li>Eggs</li></ul>";

    const saveMock = jest.fn();
    const docInstance = {
      setFontSize: jest.fn(),
      text: jest.fn(),
      addPage: jest.fn(),
      save: saveMock
    };

    // jsPDF namespace on window
    global.jspdf = {
      jsPDF: jest.fn(() => docInstance)
    };

    const exportBtn = document.getElementById("exportListBtn");
    exportBtn.click();

    expect(global.jspdf.jsPDF).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalledWith("grocery-list.pdf");
  });

  test("Export alerts when jsPDF is missing", () => {
    initScript();

    const list = document.getElementById("groceryList");
    list.innerHTML = "<ul><li>Milk</li></ul>";

    const exportBtn = document.getElementById("exportListBtn");
    exportBtn.click();

    expect(global.alert).toHaveBeenCalledWith(
      expect.stringContaining("PDF library (jsPDF) is not loaded")
    );
  });
});