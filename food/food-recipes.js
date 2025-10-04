let db;

document.addEventListener("DOMContentLoaded", () => {
  initRecipeDB();
});

// Inicijalizacija baze za recepte
function initRecipeDB() {
  const request = indexedDB.open("glucoseDB", 2);

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('recipes')) {
      db.createObjectStore('recipes', { keyPath: 'id', autoIncrement: true });
    }
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    loadRecipes();
  };

  request.onerror = (event) => {
    console.error("Greška pri otvaranju baze za recepte:", event.target.error);
  };
}

// Učitavanje recepata i prikaz kao kartica
function loadRecipes() {
  const recipeList = document.getElementById("recipe-list");
  if (!recipeList) return;

  recipeList.innerHTML = "";
  const tx = db.transaction("recipes", "readonly");
  const store = tx.objectStore("recipes");

  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const item = cursor.value;
      const card = document.createElement("div");
      card.classList.add("recipe-card");
      card.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <div class="recipe-title">${item.title}</div>
        <div class="tags">${item.tags.map(t => `<div class="tag">${t}</div>`).join('')}</div>
        <div class="nutrition">
          <p>Kalorije: ${item.kcal}</p>
          <p>Ugljeni hidrati: ${item.carbs}g</p>
          <p>Proteini: ${item.protein}g</p>
          <p>Masti: ${item.fat}g</p>
          <p>GI: ${item.gi}</p>
        </div>
        <div class="ingredients"><strong>Sastojci:</strong> ${item.ingredients.join(', ')}</div>
        <div class="prep-steps"><strong>Način pripreme:</strong> ${item.preparation}</div>
      `;
      recipeList.appendChild(card);
      cursor.continue();
    }
  };
}
