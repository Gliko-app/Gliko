// Učitavanje podataka iz recipes.json
fetch('recipes.json')
  .then(response => response.json())
  .then(data => {
    displayRecipes(data);
  })
  .catch(error => {
    console.error('Greška pri učitavanju JSON podataka:', error);
  });

// Funkcija za prikazivanje recepata
function displayRecipes(recipes) {
  const recipeContainer = document.getElementById('recipeContainer');
  recipeContainer.innerHTML = '';

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
  const details = document.createElement('div');
  details.classList.add('recipe-details-popup');
  details.innerHTML = `
    <h2>${recipe.naziv}</h2>
    <h3>Sastojci:</h3>
    <ul>
      ${recipe.sastojci.map(item => `<li>${item}</li>`).join('')}
    </ul>
    <h3>Priprema:</h3>
    <p>${recipe.priprema}</p>
  `;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Zatvori';
  closeBtn.onclick = () => details.remove();
  details.appendChild(closeBtn);

  document.body.appendChild(details);
}
