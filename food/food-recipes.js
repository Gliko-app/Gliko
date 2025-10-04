let db;

document.addEventListener("DOMContentLoaded", () => {
  initRecipeDB();
  populateTestData();  // Popuniti bazu sa testnim podacima
});

// Inicijalizacija baze za recepte
function initRecipeDB() {
  const request = indexedDB.open("glucoseDB", 3);  // Povećavamo verziju baze na 3

  request.onupgradeneeded = (e) => {
    db = e.target.result;

    // Kreiramo objekat store za 'recipes' ako ne postoji
    if (!db.objectStoreNames.contains("recipes")) {
      const objectStore = db.createObjectStore("recipes", { keyPath: "id", autoIncrement: true });
      objectStore.createIndex("title", "title", { unique: false });
      objectStore.createIndex("tags", "tags", { unique: false });
    }
  };

  request.onsuccess = (e) => {
    db = e.target.result;  // Baza je sada dostupna
    console.log("IndexedDB baza je otvorena i povezana.");
  };

  request.onerror = (e) => {
    console.error("Greška pri otvaranju baze:", e.target.error);
  };
}

// Funkcija za popunjavanje baze sa testnim podacima
function populateTestData() {
  const request = indexedDB.open("glucoseDB", 3);

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
      {
        title: "Tofu stir fry",
        tags: ["Vegan"],
        image: "https://gliko-app.github.io/Gliko/images/recipe6.jpg",
        kcal: 200,
        carbs: 18,
        protein: 15,
        fat: 12,
        gi: 35,
        ingredients: ["200g tofua", "1 crvena paprika", "1 crni luk", "soja sos"],
        preparation: "Pržiti tofu sa povrćem, dodati soja sos i promešati."
      },
      {
        title: "Čokoladni puding",
        tags: ["Gluten-Free"],
        image: "https://gliko-app.github.io/Gliko/images/recipe7.jpg",
        kcal: 250,
        carbs: 25,
        protein: 6,
        fat: 12,
        gi: 60,
        ingredients: ["200ml sojinog mleka", "2 kašičice kakao praha", "1 kašičica vanile"],
        preparation: "Pomiješati sve sastojke i kuvati dok se ne zgusne."
      },
      {
        title: "Piletina u limunu",
        tags: ["Gluten-Free"],
        image: "https://gliko-app.github.io/Gliko/images/recipe8.jpg",
        kcal: 350,
        carbs: 8,
        protein: 40,
        fat: 18,
        gi: 35,
        ingredients: ["300g pilećeg fileta", "1 limun", "2 kašičice maslinovog ulja"],
        preparation: "Pržiti pileći file sa limunovim sokom i maslinovim uljem."
      },
      {
        title: "Salata od brokolija",
        tags: ["Gluten-Free", "Vegan"],
        image: "https://gliko-app.github.io/Gliko/images/recipe9.jpg",
        kcal: 120,
        carbs: 20,
        protein: 8,
        fat: 3,
        gi: 25,
        ingredients: ["200g brokolija", "1 šargarepa", "1 kašičica maslinovog ulja"],
        preparation: "Kuvati brokoli i šargarepu, ocediti i preliti sa maslinovim uljem."
      }
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
