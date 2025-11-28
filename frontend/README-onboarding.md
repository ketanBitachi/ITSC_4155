# Easy Kitchen Onboarding Tour

This guided tour introduces new users to the primary features in Easy Kitchen: Pantry, Recipes, Favorites, Grocery List, and Dietary Preferences.

## How It Works

- After a successful login, the app stores your identifier in `localStorage` as `currentUser`.
- On first visit to `ingredients.html`, if `tourCompleted:<currentUser>` is not set, a welcome modal appears.
- The tour highlights elements sequentially:
  1. `#pantryBtn` – My Pantry
  2. `#findRecipesBtn` – Find Recipes
  3. `.heart-btn` – Like a recipe (heart button)
  4. `#favoritesBtn` – View Favorites
  5. `#goToGroceryBtn` – Generate Grocery List
  6. `#dietBtn` – Dietary (Dietary page)
- You can navigate with Next/Back/Skip. Press `Enter` for Next and `Esc` to Skip.

## Restarting the Tour

- Open the Home page (`index.html`) and click the `Start Onboarding` button.
- This clears `tourCompleted:<currentUser>` and restarts the tour.

## Files

- `onboarding.css` – Scoped styles for the tour overlay, tooltip, and modal.
- `onboarding.js` – Tour logic, state, and event handling.

## Favorites and Heart Button

- On recipe cards, the heart button (`.heart-btn`) lets you save or unsave a recipe to your Favorites.
- Clicking the heart updates the UI state and persists the favorite via `/api/favorites` using `addFavorite`/`removeFavorite` in `api.js`.
- The Favorites list is available via the `Favorites` button (`#favoritesBtn`) on `ingredients.html`. It loads from the backend and also caches recent favorites in `localStorage` under `favoriteCache` for smoother UX.
- If the heart step appears before any recipes are loaded, the tour will attempt to trigger `Find Recipes` automatically; if no recipe cards render, it will skip the heart step.

## Accessibility

- Welcome modal uses `role="dialog"` and traps focus between its action buttons.
- Tooltips and highlights avoid blocking page interactions where possible.

## Notes

- The tour stores completion status per user: `tourCompleted:<username-or-email>`.
- CSS and JS are only loaded on `ingredients.html` and the Dietary page (`settings.html`) to avoid affecting other pages.
