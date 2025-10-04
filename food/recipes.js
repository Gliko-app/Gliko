document.addEventListener("DOMContentLoaded", function () {
    const recipeContainer = document.getElementById("recipeContainer");
    const tagButtons = document.querySelectorAll(".tag-btn");
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

                // Ispravljanje putanja slika
                recipe.slika = `../images/${recipe.slika}`;

                // Ako nema tagova, postavljamo tag kao prazan niz
                recipe.tag = recipe.tag ? recipe.tag.split(';').map(tag => tag.trim()) : [];

                recipes.push(recipe);
            }
        }
        return recipes;
    }

    // Funkcija za prikaz recepata u karticama
    function displayRecipes(recipes) {
        recipeContainer.innerHTML = '';  // Očistimo prethodni sadržaj
        recipes.forEach(recipe => {
            const recipeCard = document.createElement("div");
            recipeCard.classList.add("recipe-card");

            // Ako nema tagova, tagovi neće biti prikazani u HTML-u
            const tags = recipe.tag.length > 0 ? `<p>Tagovi: ${recipe.tag.join(' / ')}</p>` : "";

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
                    ${tags}
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

    // Filtriranje recepata prema tagovima kada se klikne na jedan od tabova
    tagButtons.forEach(button => {
        button.addEventListener("click", function () {
            const tag = this.dataset.tag;
            const filteredRecipes = recipes.filter(recipe => recipe.tag.includes(tag));
            displayRecipes(filteredRecipes);

            // Dodajemo aktivni stil na selektovani tab
            tagButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
        });
    });

    // Učitaj CSV fajl sa podacima o receptima
    loadCSV("recipes.csv");
});
