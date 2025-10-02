// Inicijalizacija IndexedDB
let db;
const request = indexedDB.open("recipesDB", 1);

// Kreiranje objektnog store-a za recepte ako ne postoji
request.onupgradeneeded = (event) => {
  db = event.target.result;
  if (!db.objectStoreNames.contains("recipes")) {
    const objectStore = db.createObjectStore("recipes", { keyPath: "id", autoIncrement: true });
    objectStore.createIndex("title", "title", { unique: false });
  }
};

// Kada je IndexedDB uspešno otvoren
request.onsuccess = (event) => {
  db = event.target.result;
};

// Funkcija za dodavanje recepta u IndexedDB
document.getElementById("btnAddRecipe").addEventListener("click", function() {
  const title = document.getElementById("recipeTitle").value;
  const tags = document.getElementById("recipeTags").value.split(",");
  const image = document.getElementById("recipeImage").files[0];
  const kcal = document.getElementById("recipeKcal").value;
  const carbs = document.getElementById("recipeCarbs").value;
  const protein = document.getElementById("recipeProtein").value;
  const fat = document.getElementById("recipeFat").value;
  const gi = document.getElementById("recipeGI").value;

  // Provera da li su svi podaci uneti
  if (!title || !tags || !kcal || !carbs || !protein || !fat || !gi) {
    alert("Molimo vas popunite sve obavezne podatke.");
    return;
  }

  // Kreiranje recepta objekta
  const recipe = {
    title,
    tags,
    image: image ? URL.createObjectURL(image) : '', // Privremeni URL za prikazivanje slike
    kcal,
    carbs,
    protein,
    fat,
    gi
  };

  // Spremi recept u IndexedDB
  const transaction = db.transaction("recipes", "readwrite");
  const objectStore = transaction.objectStore("recipes");
  objectStore.add(recipe);

  transaction.oncomplete = () => {
    alert("Recept je uspešno sačuvan!");
    // Očisti formu nakon unosa
    document.getElementById("recipeTitle").value = '';
    document.getElementById("recipeTags").value = '';
    document.getElementById("recipeImage").value = '';
    document.getElementById("recipeKcal").value = '';
    document.getElementById("recipeCarbs").value = '';
    document.getElementById("recipeProtein").value = '';
    document.getElementById("recipeFat").value = '';
    document.getElementById("recipeGI").value = '';
  };

  transaction.onerror = (event) => {
    console.error("Došlo je do greške prilikom čuvanja recepta:", event);
    alert("Greška prilikom čuvanja recepta. Pokušajte ponovo.");
  };
});
