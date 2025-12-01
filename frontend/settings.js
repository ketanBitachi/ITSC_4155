// settings.js — Dietary Preferences page

// Ensure we don't register multiple DOMContentLoaded handlers across test reruns
if (document.__settingsDomReadyHandler) {
  document.removeEventListener("DOMContentLoaded", document.__settingsDomReadyHandler);
}

document.__settingsDomReadyHandler = async () => {
  // --- AUTH CHECK + YEAR ---
  if (typeof checkAuthStatus === "function") {
    if (!checkAuthStatus()) return;
  }

  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = String(new Date().getFullYear());
  }

  // --- DOM ELEMENTS ---
  const dietaryOptions = document.getElementById("dietaryOptions");
  const vegetarian =
    dietaryOptions?.querySelector('input[value="vegetarian"]') || null;
  const vegan = dietaryOptions?.querySelector('input[value="vegan"]') || null;
  const glutenFree =
    dietaryOptions?.querySelector(
      'input[value="gluten-free"], input[value="gluten_free"]'
    ) || null;
  const saveBtn =
    document.getElementById("saveDietPrefsBtn") ||
    document.getElementById("saveDietaryBtn");
  const statusSpan = document.getElementById("dietaryStatus");

  const homeBtn = document.getElementById("homeBtn");
  const pantryBtn = document.getElementById("pantryBtn");
  const dietBtn = document.getElementById("dietBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // --- NAVIGATION / LOGOUT ---
  homeBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "index.html";
  });

  pantryBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "ingredients.html";
  });

  dietBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "settings.html";
  });

  logoutBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof logoutUser === "function") {
      logoutUser();
    }
  });

  // --- LOAD SAVED PREFERENCES ---
  if (
    typeof getUserDietaryPreferences === "function" &&
    vegetarian &&
    vegan &&
    glutenFree
  ) {
    try {
      const data = await getUserDietaryPreferences();
      // tests mock this as { preferences: [...] }
      const prefs = Array.isArray(data?.preferences) ? data.preferences : [];
      const normalized = new Set(
        prefs.map((p) => String(p).replace(/_/g, "-").toLowerCase())
      );

      vegetarian.checked = normalized.has("vegetarian");
      vegan.checked = normalized.has("vegan");
      glutenFree.checked = normalized.has("gluten-free");

      if (statusSpan) {
        statusSpan.textContent = "Loaded your saved preferences.";
      }
    } catch (err) {
      console.error("Failed to load dietary preferences:", err);
      if (statusSpan) {
        statusSpan.textContent = "Could not load saved preferences.";
      }
    }
  }

  // --- SAVE BUTTON HANDLER ---
  if (saveBtn && vegetarian && vegan && glutenFree) {
    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (statusSpan) statusSpan.textContent = "";

      const payload = [];
      if (vegetarian.checked) payload.push("vegetarian");
      if (vegan.checked) payload.push("vegan");
      if (glutenFree.checked) payload.push("gluten-free");

      // Vegan already implies vegetarian, so avoid sending both
      if (payload.includes("vegan")) {
        const filtered = payload.filter((p) => p !== "vegetarian");
        payload.length = 0;
        payload.push(...filtered);
      }

      if (typeof saveUserDietaryPreferences !== "function") return;

      try {
        await saveUserDietaryPreferences(payload);
        if (statusSpan) {
          statusSpan.textContent = "Preferences saved.";
        }
      } catch (err) {
        console.error("Failed to save preferences:", err);
        if (statusSpan) {
          statusSpan.textContent = "Error saving preferences.";
        }
      }
    });
  }
};

document.addEventListener("DOMContentLoaded", document.__settingsDomReadyHandler);
