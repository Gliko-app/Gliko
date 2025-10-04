document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnAddRecipe");
  let db;
  
  const request = indexedDB.open("glucoseDB", 2);

  request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("recipes")) {
      db.createObjectStore("recipes", { keyPath: "id", autoIncrement: true });
    }
  };

  request.onsuccess = (e) => {
    db = e.target.result;
  };

  request.onerror = (e) => {
    console.error("Greška pri otvaranju baze:", e.target.error);
  };

  btn.addEventListener("click", () => {
    const recipeTitle = document.getElementById("recipeTitle").value;
    const recipeTags = document.getElementById("recipeTags").value.split(",").map((t) => t.trim());
    const recipeImage = document.getElementById("recipeImage").files[0] ? document.getElementById("recipeImage").files[0].name : "default.jpg";  // Putanja slike
    const recipeKcal = document.getElementById("recipeKcal").value;
    const recipeCarbs = document.getElementById("recipeCarbs").value;
    const recipeProtein = document.getElementById("recipeProtein").value;
    const recipeFat = document.getElementById("recipeFat").value;
    const recipeGI = document.getElementById("recipeGI").value;
    const recipeIngredients = document.getElementById("recipeIngredients").value.split("\n").map(i => i.trim());  // Sastojci
    const recipePreparation = document.getElementById("recipePreparation").value;  // Način pripreme

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
      btn.closest("form")?.reset?.();
    };
    store.add(newRecipe).onerror = (e) => {
      console.error("Greška pri dodavanju recepta:", e.target.error);
    };
  });
});
