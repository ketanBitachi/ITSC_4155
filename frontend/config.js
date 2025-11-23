// Centralized frontend configuration for Easy Kitchen
// Adjust URLs as needed for your local or deployed environment

const API_BASE_URL = "http://localhost:8000";
const MEAL_DB_API_URL = "https://www.themealdb.com/api/json/v1/1";

// Expose to window for non-module scripts/tests if needed
if (typeof window !== "undefined") {
  window.API_BASE_URL = API_BASE_URL;
  window.MEAL_DB_API_URL = MEAL_DB_API_URL;
}