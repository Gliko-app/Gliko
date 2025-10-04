document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnAddRecipe");
  let db;

  // Inicijalizacija IndexedDB sa povećanjem verzije na 3
  const request = indexedDB.open("glucoseDB", 3);  // Povećavamo verziju baze na 3

  request.onupgradeneeded = (e) => {
    db = e.target.result;

    // Kreiramo objekt store za 'recipes' ako ne postoji
    if (!db.objectStoreNames.contains("recipes")) {
      const objectStore = db.createObjectStore("recipes", { keyPath: "id", autoIncrement: true });
      objectStore.createIndex("title", "title", { unique: false });
      objectStore.createIndex("tags", "tags", { unique: false });
    }
  };

  request.onsuccess = (e) => {
    db = e.target.result;  // Baza je sada dostupna
  };

  request.onerror = (e) => {
    console.error("Greška pri otvaranju baze:", e.target.error);
  };

  btn.addEventListener("click", () => {
    const recipeTitle = document.getElementById("recipeTitle").value;
    const recipeTags = document.getElementById("recipeTags").value.split(",").map((t) => t.trim());
    const recipeImage = document.getElementById("recipeImage").files[0] ? document.getElementById("recipeImage").files[0].name : "default.jpg";
    const recipeKcal = document.getElementById("recipeKcal").value;
    const recipeCarbs = document.getElementById("recipeCarbs").value;
    const recipeProtein = document.getElementById("recipeProtein").value;
    const recipeFat = document.getElementById("recipeFat").value;
    const recipeGI = document.getElementById("recipeGI").value;
    const recipeIngredients = document.getElementById("recipeIngredients").value.split("\n").map(i => i.trim());
    const recipePreparation = document.getElementById("recipePreparation").value;

    // Provera da li su svi podaci uneseni
    if (!recipeTitle || !recipeTags || !recipeIngredients || !recipePreparation) {
      alert("Molimo unesite sve podatke.");
      return;
    }

    const newRecipe = {
      title: recipeTitle,
      tags: recipeTags,
      image: `https://gliko-app.github.io/Gliko/images/${recipeImage}`,  // Putanja do slike
      kcal: recipeKcal,
      carbs: recipeCarbs,
      protein: recipeProtein,
      fat: recipeFat,
      gi: recipeGI,
      ingredients: recipeIngredients,
      preparation: recipePreparation,
    };

    // Dodavanje recepta u IndexedDB
    const tx = db.transaction(["recipes"], "readwrite");
    const store = tx.objectStore("recipes");
    store.add(newRecipe).onsuccess = () => {
      alert("Recept je uspešno dodat!");
      btn.closest("form")?.reset?.(); // Resetovanje forme nakon unosa
    };
    store.add(newRecipe).onerror = (e) => {
      console.error("Greška pri dodavanju recepta:", e.target.error);
    };
  });
});
