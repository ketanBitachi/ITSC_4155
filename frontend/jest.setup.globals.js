// -------- Global test setup (runs BEFORE any test files) --------
global.API_BASE_URL = "http://localhost:8000";
global.MEAL_DB_API_URL = "https://mealdb.test/api/json/v2/TEST";

// Minimal localStorage mock
class LocalStorageMock {
  constructor() { this.store = {}; }
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
  clear() { this.store = {}; }
}
global.localStorage = new LocalStorageMock();

// Make window point to the global object
Object.defineProperty(global, "window", { value: global, writable: true, configurable: true });

// Mock a navigation-safe location object so setting href won’t throw in jsdom
const mockLocation = {
  href: "http://localhost/",
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn()
};
Object.defineProperty(global, "location", { value: mockLocation, writable: true, configurable: true });

// Fetch + alert stubs (tests will mock fetch responses)
global.fetch = jest.fn();
global.alert = jest.fn();

// ---- DOM helpers that jsdom doesn't implement ----
// scrollIntoView is used in ingredients.js and onboarding.js;
// provide a no-op so tests don't crash.
if (typeof window !== "undefined" && window.HTMLElement) {
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  }
}