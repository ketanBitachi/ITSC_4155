// Onboarding tour for first-time users
(function () {
  const TOUR_KEY_PREFIX = "tourCompleted:";
  const DEFAULT_USER_KEY = "__global__";
  const steps = [
    {
      id: "pantry",
      selector: "#pantryBtn",
      title: "My Pantry",
      text: "Select the ingredients you have and save your pantry.",
    },
    {
      id: "recipes",
      selector: "#findRecipesBtn",
      title: "Find Recipes",
      text: "Use your pantry to find matching recipes.",
    },
    {
      id: "grocery",
      selector: "#goToGroceryBtn",
      title: "Grocery List",
      text: "Generate a list of missing ingredients to shop.",
    },
    {
      id: "settings",
      selector: "#dietBtn",
      title: "Dietary",
      text: "Adjust dietary preferences on the Dietary page for better filtering.",
    },
  ];

  const state = {
    userId: null,
    currentStep: -1,
    ringEl: null,
    tipEl: null,
    modalEl: null,
    prevActivePanel: null,
  };

  function getCurrentUserId() {
    const u = localStorage.getItem("currentUser");
    if (u && String(u).trim()) return String(u).trim();
    // Fallback to a global key so tour still runs without a stored user
    return DEFAULT_USER_KEY;
  }

  function isCompleted(userId) {
    if (!userId) return false;
    return localStorage.getItem(TOUR_KEY_PREFIX + userId) === "true";
  }

  function markCompleted(userId) {
    if (!userId) return;
    localStorage.setItem(TOUR_KEY_PREFIX + userId, "true");
  }

  function clearCompleted(userId) {
    if (!userId) return;
    localStorage.removeItem(TOUR_KEY_PREFIX + userId);
  }

  function ensureVisible(target) {
    // If target is inside a hidden panel, temporarily activate it
    if (target && target.offsetParent === null) {
      const panel = target.closest(".panel");
      if (panel) {
        const previouslyActive = document.querySelector(".panel.active");
        state.prevActivePanel = previouslyActive || state.prevActivePanel;
        document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
        panel.classList.add("active");
      }
    }
  }

  function positionTipAndRing(target) {
    const rect = target.getBoundingClientRect();
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    state.ringEl.style.top = `${rect.top + scrollY - 8}px`;
    state.ringEl.style.left = `${rect.left + scrollX - 8}px`;
    state.ringEl.style.width = `${rect.width + 16}px`;
    state.ringEl.style.height = `${rect.height + 16}px`;

    // Try to place tooltip below, else above
    const belowTop = rect.bottom + 10 + scrollY;
    const aboveTop = rect.top - 10 - state.tipEl.offsetHeight + scrollY;
    const left = rect.left + scrollX;
    const rightSpace = window.innerWidth - rect.right;

    state.tipEl.style.top = `${belowTop + state.tipEl.offsetHeight < scrollY + window.innerHeight ? belowTop : Math.max(aboveTop, scrollY + 8)}px`;
    state.tipEl.style.left = `${rightSpace < 340 ? Math.max(left - 20, scrollX + 8) : left}px`;
  }

  function renderStep() {
    const step = steps[state.currentStep];
    if (!step) {
      completeTour();
      return;
    }
    const target = document.querySelector(step.selector);
    if (!target) {
      // Missing element: skip to next
      nextStep();
      return;
    }
    ensureVisible(target);
    document.documentElement.setAttribute("data-onboarding-active", "true");
    state.ringEl.classList.remove("onboarding-hidden");
    state.tipEl.classList.remove("onboarding-hidden");
    state.tipEl.querySelector("h4").textContent = step.title;
    state.tipEl.querySelector("p").textContent = step.text;
    positionTipAndRing(target);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function nextStep() {
    state.currentStep += 1;
    renderStep();
  }

  function prevStep() {
    state.currentStep = Math.max(0, state.currentStep - 1);
    renderStep();
  }

  function completeTour() {
    markCompleted(state.userId);
    cleanupUI();
    // restore previous active panel if applicable
    if (state.prevActivePanel) {
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      state.prevActivePanel.classList.add("active");
    }
  }

  function skipTour() {
    markCompleted(state.userId);
    cleanupUI();
  }

  function restartTour() {
    clearCompleted(state.userId);
    startTour();
  }

  function cleanupUI() {
    document.documentElement.removeAttribute("data-onboarding-active");
    state.ringEl.classList.add("onboarding-hidden");
    state.tipEl.classList.add("onboarding-hidden");
    closeWelcomeModal();
    window.removeEventListener("resize", handleReposition);
    window.removeEventListener("scroll", handleReposition, true);
    document.removeEventListener("keydown", handleKeyNav, true);
  }

  function handleReposition() {
    const step = steps[state.currentStep];
    if (!step) return;
    const target = document.querySelector(step.selector);
    if (target) positionTipAndRing(target);
  }

  function handleKeyNav(e) {
    if (document.documentElement.getAttribute("data-onboarding-active") !== "true") return;
    if (e.key === "Enter") {
      e.preventDefault();
      nextStep();
    } else if (e.key === "Escape") {
      e.preventDefault();
      skipTour();
    }
  }

  function createUI() {
    // Ring
    const ring = document.createElement("div");
    ring.className = "onboarding-ring onboarding-hidden";
    document.body.appendChild(ring);
    state.ringEl = ring;

    // Tooltip
    const tip = document.createElement("div");
    tip.className = "onboarding-tooltip onboarding-hidden";
    tip.innerHTML = `
      <h4></h4>
      <p></p>
      <div class="actions">
        <button type="button" class="onboarding-btn" data-act="back">Back</button>
        <button type="button" class="onboarding-btn primary" data-act="next">Next</button>
        <button type="button" class="onboarding-btn" data-act="skip">Skip</button>
      </div>
    `;
    document.body.appendChild(tip);
    state.tipEl = tip;

    tip.addEventListener("click", (e) => {
      const act = e.target?.getAttribute && e.target.getAttribute("data-act");
      if (!act) return;
      if (act === "back") prevStep();
      if (act === "next") nextStep();
      if (act === "skip") skipTour();
    });

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    document.addEventListener("keydown", handleKeyNav, true);
  }

  function createWelcomeModal() {
    const modal = document.createElement("div");
    modal.className = "onboarding-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "onboarding-welcome-title");
    modal.innerHTML = `
      <div class="modal-content">
        <h3 id="onboarding-welcome-title">Welcome to Easy Kitchen</h3>
        <p>We\'ll give you a quick tour: Pantry → Recipes → Grocery → Dietary.</p>
        <div class="actions">
          <button type="button" class="onboarding-btn" data-act="skip">Skip</button>
          <button type="button" class="onboarding-btn primary" data-act="start">Let\'s Go</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    state.modalEl = modal;

    const startBtn = modal.querySelector('[data-act="start"]');
    const skipBtn = modal.querySelector('[data-act="skip"]');
    // Focus trap between two buttons
    modal.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const focusable = [skipBtn, startBtn];
      const idx = focusable.indexOf(document.activeElement);
      e.preventDefault();
      if (e.shiftKey) {
        focusable[(idx - 1 + focusable.length) % focusable.length].focus();
      } else {
        focusable[(idx + 1) % focusable.length].focus();
      }
    });

    startBtn.addEventListener("click", () => {
      closeWelcomeModal();
      startTour();
    });
    skipBtn.addEventListener("click", () => {
      skipTour();
    });
  }

  function openWelcomeModal() {
    if (!state.modalEl) createWelcomeModal();
    state.modalEl.classList.add("open");
    const startBtn = state.modalEl.querySelector('[data-act="start"]');
    startBtn?.focus();
  }

  function closeWelcomeModal() {
    state.modalEl?.classList.remove("open");
  }

  function startTour() {
    state.currentStep = 0;
    renderStep();
  }

  function maybeStartTour() {
    state.userId = getCurrentUserId();
    // Only auto-start on ingredients page for first-time users
    const onIngredients = !!document.getElementById("ingredients");
    if (!onIngredients) return;
    const intent = localStorage.getItem("onboardingIntent");
    if (intent) {
      localStorage.removeItem("onboardingIntent");
      openWelcomeModal();
      return;
    }
    if (!isCompleted(state.userId)) {
      openWelcomeModal();
    }
  }

  function wireRestartButton() {
    if (state._startBtnWired) return;
    function handleStartOnboardingClick(e) {
      const btn = e.target?.closest && e.target.closest('#startOnboardingBtn');
      if (!btn) return;
      state.userId = getCurrentUserId();
      if (!isLoggedIn()) {
        alert("Please login first to start the tour.");
        return;
      }
      const onIngredients = !!document.getElementById("ingredients");
      if (!onIngredients) {
        localStorage.setItem("onboardingIntent", "restart");
        window.location.href = "ingredients.html";
        return;
      }
      restartTour();
    }
    document.addEventListener('click', handleStartOnboardingClick);
    state._startBtnWired = true;
  }

  function init() {
    createUI();
    createWelcomeModal();
    wireRestartButton();
  }

  // Public API for tests / manual usage
  const api = {
    start: startTour,
    restart: restartTour,
    isCompleted: () => isCompleted(getCurrentUserId()),
    maybeStartTour,
  };
  if (typeof window !== "undefined") window.onboarding = api;

  document.addEventListener("DOMContentLoaded", () => {
    init();
    maybeStartTour();
  });
})();
  function isLoggedIn() {
    const token = localStorage.getItem("authToken");
    const expiry = localStorage.getItem("tokenExpiry");
    return !!(token && expiry && new Date() < new Date(expiry));
  }