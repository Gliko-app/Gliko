document.addEventListener("DOMContentLoaded", function () {
    const recipeContainer = document.getElementById("recipeContainer");
    let recipes = [];

    // Funkcija za učitavanje CSV fajla
    function loadCSV(filePath) {
        fetch(filePath)
            .then(response => response.text())
            .then(data => {
                recipes = parseCSV(data);
                displayRecipes(recipes);
            })
            .catch(error => {
                console.error("Greška pri učitavanju CSV fajla:", error);
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
                // Popravljene putanje slika
                recipe.slika = `../images/${recipe.slika}`;  // Prilagodjeno za relativne putanje
                recipes.push(recipe);
            }
        }
        return recipes;
    }

    // Funkcija za prikaz recepata u karticama
    function displayRecipes(recipes) {
        recipeContainer.innerHTML = '';
        recipes.forEach(recipe => {
            const recipeCard = document.createElement("div");
            recipeCard.classList.add("recipe-card");

            recipeCard.innerHTML = `
                <div class="recipe-image">
                    <img src="${recipe.slika}" alt="${recipe.naziv}">
                </div>
                <div class="recipe-details">
                    <h3>${recipe.naziv}</h3>
                    <p>Kalorije: ${recipe.kalorije} kcal</p>
                    <p>Ugljeni hidrati: ${recipe.UH} g</p>
                    <p>Proteini: ${recipe.proteini} g</p>
                    <p>Masti: ${recipe.masti} g</p>
                    <p>GI: ${recipe.GI}</p>
                    <button class="details-btn" data-recipe='${JSON.stringify(recipe)}'>Više detalja</button>
                </div>
            `;
            recipeContainer.appendChild(recipeCard);

            // Detalji o receptu
            recipeCard.querySelector('.details-btn').addEventListener('click', function () {
                const details = JSON.parse(this.dataset.recipe);
                alert(`Sastojci: ${details.sastojci}\nPriprema: ${details.priprema}`);
            });
        });
    }

    // Učitaj CSV fajl sa podacima o receptima
    loadCSV("recipes.csv");
});
