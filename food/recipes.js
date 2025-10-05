// Učitavanje podataka iz recipes.json
fetch('recipes.json')
  .then(response => response.json())
  .then(data => {
    console.log(data);  // Provera da li su podaci pravilno učitani
    displayRecipes(data);  // Pozivanje funkcije za prikazivanje recepata
  })
  .catch(error => {
    console.error('Greška pri učitavanju JSON podataka:', error);
  });

// Funkcija za prikazivanje recepata
function displayRecipes(recipes) {
  const recipeContainer = document.getElementById('recipeContainer');
  recipeContainer.innerHTML = ''; // Očisti prethodne recepte

  // Prikazivanje svih recepata
  recipes.forEach(recipe => {
    const recipeCard = document.createElement('div');
    recipeCard.classList.add('recipe-card');

    // Kreiraj sliku i naziv recepta
    const recipeImage = document.createElement('img');
    recipeImage.src = recipe.slika;
    recipeImage.alt = recipe.naziv;

    const recipeDetails = document.createElement('div');
    recipeDetails.classList.add('recipe-details');
    const recipeTitle = document.createElement('h3');
    recipeTitle.textContent = recipe.naziv;

    // Dodaj kalorije i druge hranjive vrednosti
    const calories = document.createElement('p');
    calories.textContent = `Kalorije: ${recipe.kalorije} kcal`;

    // Prikazivanje tagova
    const tags = document.createElement('p');
    tags.textContent = `Tagovi: ${recipe.tag.join(', ')}`;

    // Dodaj dugme za detalje
    const detailsBtn = document.createElement('button');
    detailsBtn.classList.add('details-btn');
    detailsBtn.textContent = 'Više Detalja';
    detailsBtn.onclick = () => showDetails(recipe);

    // Dodaj sve elemente u karticu recepta
    recipeDetails.appendChild(recipeTitle);
    recipeDetails.appendChild(calories);
    recipeDetails.appendChild(tags);
    recipeDetails.appendChild(detailsBtn);

    recipeCard.appendChild(recipeImage);
    recipeCard.appendChild(recipeDetails);
    recipeContainer.appendChild(recipeCard);
  });
}

// Funkcija za prikazivanje detalja recepta
function showDetails(recipe) {
  const modal = document.getElementById('recipeModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalIngredients = document.getElementById('modalIngredients');
  const modalPreparation = document.getElementById('modalPreparation');

  modalTitle.textContent = recipe.naziv;
  modalIngredients.innerHTML = `<h3>Sastojci:</h3><ul>${recipe.sastojci.split('\n').map(item => `<li>${item}</li>`).join('')}</ul>`;
  modalPreparation.innerHTML = `<h3>Priprema:</h3><p>${recipe.priprema}</p>`;

  modal.style.display = 'block';  // Prikazivanje modala
}

// Funkcija za zatvaranje modala
function closeModal() {
  const modal = document.getElementById('recipeModal');
  modal.style.display = 'none';
}
