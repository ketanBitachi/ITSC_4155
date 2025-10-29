document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateListBtn');
    const saveBtn = document.getElementById('saveListBtn');
    const exportBtn = document.getElementById('exportListBtn');
    const groceryListContainer = document.getElementById('groceryList');
  
    let currentList = [];
  
    // --- Load user's grocery list on page load ---
    loadUserGroceryList();
  
    // --- USER STORY 5.2: Generate Grocery List ---
    generateBtn.addEventListener('click', async () => {
      // ✅ Get missing ingredients from localStorage
      let missingIngredients = JSON.parse(localStorage.getItem("currentMissingIngredients") || "[]");
  
      if (!missingIngredients.length) {
        alert('No missing ingredients found. Please view a recipe first.');
        return;
      }
  
      // ✅ Deduplicate and update state
      missingIngredients = [...new Set(missingIngredients)];
      currentList = missingIngredients;
  
      // ✅ Display list
      displayGroceryList(currentList);
  
      // ✅ Store locally
      localStorage.setItem("currentMissingIngredients", JSON.stringify(currentList));
  
      // ✅ Save to backend (optional immediate sync)
      try {
        const response = await fetch(`${API_BASE_URL}/api/grocery-list/save`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ grocery_list: currentList }),
        });
        const data = await response.json();
        console.log('Saved grocery list:', data);
      } catch (err) {
        console.error('Error saving grocery list:', err);
      }
    });
  
    // --- USER STORY 5.3: Save Grocery List Manually ---
    saveBtn.addEventListener('click', async () => {
        if (!currentList.length) {
          alert('Generate a grocery list first.');
          return;
        }
  
      try {
        const response = await fetch(`${API_BASE_URL}/api/grocery-list/save`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ grocery_list: currentList }),
        });
        const data = await response.json();
          alert(data.message || 'Grocery list saved!');
          
          // ✅ Save locally for Home page detection
    localStorage.setItem("currentMissingIngredients", JSON.stringify(currentList));
      
      } catch (err) {
        console.error('Error saving grocery list:', err);
        alert('Could not save grocery list.');
      }
    });
  
    // --- Export Grocery List to PDF ---
    exportBtn.addEventListener('click', () => {
      if (!currentList.length) {
        alert('Generate a grocery list first.');
        return;
      }
  
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
  
      doc.setFontSize(16);
      doc.text('🛒 Easy Kitchen Grocery List', 10, 15);
  
      doc.setFontSize(12);
      let y = 30;
      currentList.forEach((item, index) => {
        doc.text(`${index + 1}. ${item}`, 10, y);
        y += 8;
        if (y > 270) { // handles long lists
          doc.addPage();
          y = 20;
        }
      });
  
      doc.save('Grocery_List.pdf');
    });
  
    // --- Display Grocery List ---
    function displayGroceryList(items) {
      groceryListContainer.innerHTML = '';
      if (!items.length) {
        groceryListContainer.innerHTML = '<p>🎉 You already have all ingredients!</p>';
        return;
      }
  
      const ul = document.createElement('ul');
      items.forEach(name => {
        const li = document.createElement('li');
        li.textContent = name.charAt(0).toUpperCase() + name.slice(1);
        ul.appendChild(li);
      });
      groceryListContainer.appendChild(ul);
    }
  
    // --- Load saved grocery list for logged-in user ---
    async function loadUserGroceryList() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/grocery-list`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });
  
        const data = await response.json();
        if (data.grocery_list && data.grocery_list.length > 0) {
          currentList = data.grocery_list;
          displayGroceryList(currentList);
        } else {
          groceryListContainer.innerHTML = '<p>No grocery list found. Generate one to get started!</p>';
        }
      } catch (err) {
        console.error('Error loading grocery list:', err);
        groceryListContainer.innerHTML = '<p class="muted">Error loading grocery list.</p>';
      }
    }
  });
  