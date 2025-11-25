// frontend/settings.js

document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuthStatus()) return;

  document.getElementById('year').textContent = new Date().getFullYear();

  const logoutBtn = document.getElementById('logoutBtn');
  const homeBtn = document.getElementById('homeBtn');
  const pantryBtn = document.getElementById('pantryBtn');
  const dietBtn = document.getElementById('dietBtn');
  const optionsContainer = document.getElementById('dietaryOptions');
  const saveBtn = document.getElementById('saveDietPrefsBtn');
  const statusSpan = document.getElementById('dietaryStatus');

  logoutBtn?.addEventListener('click', logoutUser);
  homeBtn?.addEventListener('click', () => (window.location.href = 'index.html'));
  pantryBtn?.addEventListener('click', () => (window.location.href = 'ingredients.html'));
  dietBtn?.addEventListener('click', () => (window.location.href = 'settings.html'));

  function showStatus(message) {
    if (!statusSpan) return;
    statusSpan.textContent = message;
    statusSpan.style.opacity = 1;
    setTimeout(() => {
      statusSpan.style.opacity = 0;
      statusSpan.textContent = "";
    }, 2500);
  }

  function getSelectedDietaryPreferences() {
    return Array.from(
      optionsContainer.querySelectorAll('input[type="checkbox"]:checked')
    ).map(cb => cb.value);
  }

  function applyPreferencesToUI(preferences) {
    const prefSet = new Set(preferences || []);
    optionsContainer
      .querySelectorAll('input[type="checkbox"]')
      .forEach(cb => {
        cb.checked = prefSet.has(cb.value);
      });
  }

  // ---- LOAD FROM BACKEND ON PAGE LOAD ----
  try {
    const data = await getUserDietaryPreferences(); // from api.js
    if (data && Array.isArray(data.preferences)) {
      applyPreferencesToUI(data.preferences);
      if (data.preferences.length > 0) {
        showStatus("Loaded your saved preferences.");
      }
    }
  } catch (err) {
    console.error("Error loading dietary preferences:", err);
    // No status needed here; silently fail is fine, or:
    // showStatus("Could not load preferences.");
  }

  // ---- SAVE TO BACKEND ON CLICK ----
  saveBtn.addEventListener('click', async () => {
    const selected = getSelectedDietaryPreferences();

    try {
      await saveUserDietaryPreferences(selected); // from api.js
      showStatus("Preferences saved.");
    } catch (err) {
      console.error("Error saving dietary preferences:", err);
      showStatus("Error saving preferences.");
    }
  });
});
