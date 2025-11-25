// === GROCERY LIST LOGIC ===
document.addEventListener("DOMContentLoaded", function () {
  const listContainer = document.getElementById("groceryList");
  const generateBtn = document.getElementById("generateListBtn");
  const saveBtn = document.getElementById("saveListBtn");
  const exportBtn = document.getElementById("exportListBtn");

  // If this page doesn't have a grocery list section, do nothing
  if (!listContainer) return;

  // Helpers
  function renderGroceryList(items) {
    if (!items || !items.length) {
      listContainer.innerHTML =
        '<p class="muted">No grocery list found yet. Open a recipe, select it, then click <strong>Generate Grocery List</strong>.</p>';
      return;
    }

    listContainer.innerHTML = `
      <ul>
        ${items.map(i => `<li>${i}</li>`).join("")}
      </ul>
    `;
  }

  function getCurrentListFromDOM() {
    return Array.from(listContainer.querySelectorAll("li")).map(li =>
      li.textContent.trim()
    );
  }

  // --- Generate List from localStorage.currentMissingIngredients ---
  generateBtn?.addEventListener("click", function () {
    const missing = JSON.parse(
      localStorage.getItem("currentMissingIngredients") || "[]"
    );

    if (!missing.length) {
      renderGroceryList([]);
      alert("No ingredients found. Go back, select at least one recipe, and try again.");
      return;
    }

    renderGroceryList(missing);
  });

  // --- Save List (to localStorage for now) ---
  saveBtn?.addEventListener("click", function () {
    const items = getCurrentListFromDOM();
    if (!items.length) {
      alert("Generate your grocery list before saving.");
      return;
    }

    localStorage.setItem("savedGroceryList", JSON.stringify(items));
    alert("Grocery list saved!");
  });

  // --- Export List to PDF using jsPDF ---
  exportBtn?.addEventListener("click", function () {
    const items = getCurrentListFromDOM();
    if (!items.length) {
      alert("Generate your grocery list before exporting.");
      return;
    }

    const jsPdfNamespace = window.jspdf || window.jsPDF;
    const jsPDF = jsPdfNamespace && jsPdfNamespace.jsPDF
      ? jsPdfNamespace.jsPDF
      : jsPdfNamespace;

    if (!jsPDF) {
      alert("PDF library (jsPDF) is not loaded.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Easy Kitchen – Grocery List", 14, 20);

    doc.setFontSize(12);
    let y = 30;
    items.forEach(item => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`• ${item}`, 14, y);
      y += 7;
    });

    doc.save("grocery-list.pdf");
  });

  // --- On load: show saved list (if any), otherwise currentMissingIngredients ---
  const saved = JSON.parse(localStorage.getItem("savedGroceryList") || "[]");
  if (saved.length) {
    renderGroceryList(saved);
  } else {
    const current = JSON.parse(
      localStorage.getItem("currentMissingIngredients") || "[]"
    );
    renderGroceryList(current);
  }
});
