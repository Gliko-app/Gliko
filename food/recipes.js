document.addEventListener("DOMContentLoaded", function () {
    const recipeContainer = document.getElementById("recipeContainer");
    const searchInput = document.getElementById("recipeSearch");
    let recipes = [];

    // Funkcija za učitavanje CSV fajla
    function loadCSV(filePath) {
        fetch(filePath)
            .then(response => response.text())
            .then(data => {
                recipes = parseCSV(data);
                displayRecipes(recipes);
            });
    }

    // Funkcija za parsiranje CSV podataka
    function parseCSV(data) {
        const lines = data.split("\n");
        const headers = lines[0].split(",");
        const recipes = [];

        for (let i = 1; i < lines.length; i++) {
            const currentLine = lines[i].split(",");
            if (currentLine.length === headers.length) {
                let recipe = {};
                for (let j = 0; j < headers.length; j++) {
                    recipe[headers[j].trim()] = currentLine[j].trim();
                }
                recipes.push(recipe);
            }
        }
        return recipes;
    }

    // Funkcija za prikaz recepata
    function displayRecipes(recipes) {
        recipeContainer.innerHTML = '';
        recipes.forEach(recipe => {
            const recipeCard = document.createElement("div");
            recipeCard.classList.add("recipe-card");

            recipeCard.innerHTML = `
                <img src="${recipe.slika}" alt="${recipe.naziv}">
                <h3>${recipe.naziv}</h3>
                <p>Tag: ${recipe.tag}</p>
                <p>Kalorije: ${recipe.kalorije} kcal</p>
                <button class="details-btn" data-recipe='${JSON.stringify(recipe)}'>Više detalja</button>
            `;
            recipeContainer.appendChild(recipeCard);

            // Detalji o receptu
            recipeCard.querySelector('.details-btn').addEventListener('click', function () {
                const details = JSON.parse(this.dataset.recipe);
                alert(`Sastojci: ${details.sastojci}\nPriprema: ${details.priprema}`);
            });
        });
    }

    // Pretraga recepata
    searchInput.addEventListener("input", function () {
        const searchQuery = this.value.toLowerCase();
        const filteredRecipes = recipes.filter(recipe => recipe.naziv.toLowerCase().includes(searchQuery));
        displayRecipes(filteredRecipes);
    });

    // Učitaj CSV fajl sa podacima o receptima
    loadCSV("recipes.csv");
});
