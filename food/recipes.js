function displayRecipes(recipes) {
  // Pronaći sve tagove za pretragu
  const tagButtons = document.querySelectorAll('.tag-btn');

  // Pronaći container za recepta
  const recipeContainer = document.getElementById('recipeContainer');
  recipeContainer.innerHTML = ''; // Očistiti prethodne rezultate

  recipes.forEach(recipe => {
    // Ako tag nije niz, pretvaramo ga u niz
    const tags = Array.isArray(recipe.tag) ? recipe.tag : recipe.tag.split(';');

    // Kreirati HTML za recept
    const recipeElement = document.createElement('div');
    recipeElement.classList.add('recipe-card');

    recipeElement.innerHTML = `
      <img src="${recipe.slika}" alt="${recipe.naziv}">
      <div class="recipe-details">
        <h3>${recipe.naziv}</h3>
        <p>Kalorije: ${recipe.kalorije}</p>
        <p>UH: ${recipe.UH}</p>
        <p>Proteini: ${recipe.proteini}</p>
        <p>Masti: ${recipe.masti}</p>
        <p>GI: ${recipe.GI}</p>
        <p class="tags">${tags.join(', ')}</p>
        <button class="details-btn">Više detalja</button>
      </div>
    `;

    // Dodati recept na stranicu
    recipeContainer.appendChild(recipeElement);
  });
}
