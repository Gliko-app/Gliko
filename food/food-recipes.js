let db;

document.addEventListener("DOMContentLoaded", () => {
  initRecipesDB(); // Inicijalizacija baze za recepte
  loadRecipes(); // Učitavanje recepata odmah nakon inicijalizacije baze
});

// Inicijalizacija baze za recepte (recipesDB)
function initRecipesDB() {
  const request = indexedDB.open("recipesDB", 3); // Povećavamo verziju baze na 3

  request.onupgradeneeded = (e) => {
    db = e.target.result;

    // Ako objekat store za 'recipes' ne postoji, kreiraj ga
    if (!db.objectStoreNames.contains("recipes")) {
      const objectStore = db.createObjectStore("recipes", { keyPath: "id", autoIncrement: true });
      objectStore.createIndex("title", "title", { unique: false });
      objectStore.createIndex("tags", "tags", { unique: false });
    }
  };

  request.onsuccess = (e) => {
    db = e.target.result;  // Baza za recepte je sada dostupna
    console.log("RecipesDB baza je otvorena i povezana.");
    loadRecipes();  // Nakon što je baza otvorena, učitaj recepte
  };

  request.onerror = (e) => {
    console.error("Greška pri otvaranju RecipesDB:", e.target.error);
  };
}

// Funkcija za učitavanje recepata
function loadRecipes() {
  const recipeList = document.getElementById("recipe-list");
  if (!recipeList) return;

  recipeList.innerHTML = "";  // Očisti postojeće recepte
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
      cursor.continue(); // Nastavi sa učitavanjem sledećeg recepta
    }
  };
}

// Popuni bazu sa testnim receptima (ako još nisu uneti)
function populateTestData() {
  const request = indexedDB.open("recipesDB", 3);

  request.onsuccess = (e) => {
    db = e.target.result;

    const tx = db.transaction(["recipes"], "readwrite");
    const store = tx.objectStore("recipes");

    // Testni recepti
    const recipes = [
      {
        title: "Integralni hleb",
        tags: ["Low-GI", "Vegan"],
        image: "https://gliko-app.github.io/Gliko/images/recipe1.jpg",
        kcal: 200,
        carbs: 30,
        protein: 7,
        fat: 2,
        gi: 55,
        ingredients: ["300g integralnog brašna", "1 kašičica soli", "1 kašičica kvasca", "250ml tople vode"],
        preparation: "Pomešati sve sastojke, zamesiti testo, ostaviti da naraste, peći 40 minuta na 180°C."
      },
      {
        title: "Zeleni smoothie",
        tags: ["Low-GI", "Vegan"],
        image: "https://gliko-app.github.io/Gliko/images/recipe2.jpg",
        kcal: 150,
        carbs: 25,
        protein: 5,
        fat: 3,
        gi: 40,
        ingredients: ["1 banana", "100g špinata", "200ml kokosove vode"],
        preparation: "Sjediniti sve u blenderu i miksati dok ne postane glatko."
      },
      {
        title: "Pileći file sa povrćem",
        tags: ["Low-GI"],
        image: "https://gliko-app.github.io/Gliko/images/recipe3.jpg",
        kcal: 300,
        carbs: 15,
        protein: 35,
        fat: 10,
        gi: 30,
        ingredients: ["200g pilećeg fileta", "1 crvena paprika", "1 tikvica", "maslinovo ulje"],
        preparation: "Pileći file propržiti sa povrćem na maslinovom ulju."
      },
      {
        title: "Veganski burger",
        tags: ["Vegan", "Low-GI"],
        image: "https://gliko-app.github.io/Gliko/images/recipe4.jpg",
        kcal: 250,
        carbs: 35,
        protein: 15,
        fat: 8,
        gi: 40,
        ingredients: ["200g soje", "1 crni luk", "1 kašičica začina", "2 kašičice maslinovog ulja"],
        preparation: "Sjediniti soju, iseckan luk, začine i formirati pljeskavice. Pržiti na maslinovom ulju."
      },
      {
        title: "Salata od kinoe",
        tags: ["Vegan"],
        image: "https://gliko-app.github.io/Gliko/images/recipe5.jpg",
        kcal: 180,
        carbs: 30,
        protein: 7,
        fat: 5,
        gi: 45,
        ingredients: ["200g kinoe", "1 krastavac", "paradajz", "maslinovo ulje", "limun"],
        preparation: "Kuvati kinoju, ocediti, pomešati sa povrćem i začiniti maslinovim uljem i limunom."
      },
    ];

    // Dodajemo testne recepte u bazu
    recipes.forEach(recipe => {
      store.add(recipe).onsuccess = () => {
        console.log("Recept uspešno dodat:", recipe.title);
      };
      store.add(recipe).onerror = (e) => {
        console.error("Greška pri dodavanju recepta:", e.target.error);
      };
    });
  };
}

// Pozivanje funkcije za unos testnih podataka ako još nisu uneti
populateTestData();


