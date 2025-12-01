// tests/onboarding.test.js
const path = require("path");

describe("onboarding.js", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <header class="site-header">
        <nav class="top-nav">
          <button class="link" id="homeBtn">Home</button>
          <button class="link" id="dietBtn">Dietary</button>
          <button class="link" id="pantryBtn">My Pantry</button>
        </nav>
      </header>
      <main>
        <section id="ingredients" class="panel active">
          <button id="findRecipesBtn">Find Recipes</button>
        </section>
        <section id="recipes" class="panel">
          <button id="goToGroceryBtn">Generate Grocery List</button>
        </section>
      </main>`;

    localStorage.clear();
    localStorage.setItem("currentUser", "tester");
  });

  test("shows welcome modal for first-time user", () => {
    require(path.join(process.cwd(), "onboarding.js"));
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const modal = document.querySelector(".onboarding-modal");
    expect(modal).not.toBeNull();
    expect(modal.classList.contains("open")).toBe(true);
  });

  test("Let's Go starts tour and displays ring + tooltip", () => {
    require(path.join(process.cwd(), "onboarding.js"));
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const startBtn = document.querySelector(
      '.onboarding-modal [data-act="start"]'
    );
    startBtn.click();

    const ring = document.querySelector(".onboarding-ring");
    const tip = document.querySelector(".onboarding-tooltip");

    expect(ring.classList.contains("onboarding-hidden")).toBe(false);
    expect(tip.classList.contains("onboarding-hidden")).toBe(false);
  });

  test("Skip marks tour as completed", () => {
    require(path.join(process.cwd(), "onboarding.js"));
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const skipBtn = document.querySelector(
      '.onboarding-modal [data-act="skip"]'
    );
    skipBtn.click();

    expect(localStorage.getItem("tourCompleted:tester")).toBe("true");
  });

  test("restart clears completion and starts tour", () => {
    require(path.join(process.cwd(), "onboarding.js"));
    document.dispatchEvent(new Event("DOMContentLoaded"));

    document
      .querySelector('.onboarding-modal [data-act="skip"]')
      .click();
    expect(localStorage.getItem("tourCompleted:tester")).toBe("true");

    global.onboarding.restart();
    const ring = document.querySelector(".onboarding-ring");

    expect(localStorage.getItem("tourCompleted:tester")).toBeNull();
    expect(ring.classList.contains("onboarding-hidden")).toBe(false);
  });
});