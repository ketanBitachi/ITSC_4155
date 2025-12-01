// tests/login.test.js
const fs = require("fs");
const path = require("path");

function loadPage(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf8");
  document.documentElement.innerHTML = html;
}

describe("login page basic DOM", () => {
  beforeEach(() => {
    loadPage(path.join(process.cwd(), "login.html"));
  });

  test("has a login form with email and password fields", () => {
    const form =
      document.getElementById("loginForm") || document.querySelector("form");
    expect(form).toBeTruthy();

    const emailInput =
      form.querySelector("#email") || form.querySelector("[name='email']");
    const passwordInput =
      form.querySelector("#password") ||
      form.querySelector("[name='password']");

    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
  });
});

// Small placeholder to keep the suite non-empty if you later add more tests
describe("login page", () => {
  test("placeholder test", () => {
    expect(true).toBe(true);
  });
});
