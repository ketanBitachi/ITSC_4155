document.addEventListener('DOMContentLoaded', () => {
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

  // Load saved prefs
  const savedPrefs = JSON.parse(localStorage.getItem('dietaryPreferences') || '[]');
  if (savedPrefs.length) {
    optionsContainer
      .querySelectorAll('input[type="checkbox"]')
      .forEach(cb => {
        if (savedPrefs.includes(cb.value)) cb.checked = true;
      });
    statusSpan.textContent = 'Loaded your saved preferences.';
  }

  saveBtn.addEventListener('click', () => {
    const selected = Array.from(
      optionsContainer.querySelectorAll('input[type="checkbox"]:checked')
    ).map(cb => cb.value);

    localStorage.setItem('dietaryPreferences', JSON.stringify(selected));
    statusSpan.textContent = 'Preferences saved.';
    setTimeout(() => (statusSpan.textContent = ''), 2500);
  });
});