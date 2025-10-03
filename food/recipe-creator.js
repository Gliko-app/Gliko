document.addEventListener("DOMContentLoaded", () => {
  const btnAddRecipe = document.getElementById("btnAddRecipe");

  // Funkcija za otvaranje IndexedDB baze
  let db;
  const request = indexedDB.open("glucoseDB", 2);

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('recipes')) {
      const objectStore = db.createObjectStore('recipes', { keyPath: 'id', autoIncrement: true });
      objectStore.createIndex('title', 'title', { unique: false });
      objectStore.createIndex('tags', 'tags', { unique: false });
    }
  };

  request.onsuccess = (event) => {
    db = event.target.result;  // db objekat je sada dostupan
    console.log("IndexedDB baza je otvorena i povezana.");
  };

  request.onerror = (event) => {
    console.error("Greška pri otvaranju IndexedDB baze:", event.target.error);
  };

  // Funkcija za dodavanje recepta u bazu
  btnAddRecipe.addEventListener("click", () => {
    const recipeTitle = document.getElementById("recipeTitle").value;
    const recipeTags = document.getElementById("recipeTags").value.split(",").map(tag => tag.trim());
    const recipeImage = document.getElementById("recipeImage").files[0] ? document.getElementById("recipeImage").files[0].name : "default.jpg";  // Za sada koristi default sliku ako nije učitana
    const recipeKcal = document.getElementById("recipeKcal").value;
    const recipeCarbs = document.getElementById("recipeCarbs").value;
    const recipeProtein = document.getElementById("recipeProtein").value;
    const recipeFat = document.getElementById("recipeFat").value;
    const recipeGI = document.getElementById("recipeGI").value;
    const recipeIngredients = document.getElementById("recipeIngredients").value.split("\n").map(ingredient => ingredient.trim());
    const recipePreparation = document.getElementById("recipePreparation").value;

    // Provera da li su svi podaci ispravno uneseni
    if (!recipeTitle || !recipeTags || !recipeIngredients || !recipePreparation) {
      alert("Molimo unesite sve podatke.");
      return;
    }

    // Dodavanje recepta u IndexedDB
    const newRecipe = {
      title: recipeTitle,
      tags: recipeTags,
      image: `https://gliko-app.github.io/Gliko/images/${recipeImage}`,  // Putanja do slike na GitHub-u
      kcal: recipeKcal,
      carbs: recipeCarbs,
      protein: recipeProtein,
      fat: recipeFat,
      gi: recipeGI,
      ingredients: recipeIngredients,
      preparation: recipePreparation
    };

    const transaction = db.transaction(["recipes"], "readwrite");
    const objectStore = transaction.objectStore("recipes");

    const requestAdd = objectStore.add(newRecipe);
    requestAdd.onsuccess = () => {
      alert("Recept je uspešno dodat!");
      // Očistimo formu nakon uspešnog unosa
      document.getElementById("recipeTitle").value = "";
      document.getElementById("recipeTags").value = "";
      document.getElementById("recipeImage").value = "";
      document.getElementById("recipeKcal").value = "";
      document.getElementById("recipeCarbs").value = "";
      document.getElementById("recipeProtein").value = "";
      document.getElementById("recipeFat").value = "";
      document.getElementById("recipeGI").value = "";
      document.getElementById("recipeIngredients").value = "";
      document.getElementById("recipePreparation").value = "";
    };

    requestAdd.onerror = (event) => {
      console.error("Greška prilikom dodavanja recepta:", event.target.error);
    };
  });
});
