document.addEventListener("DOMContentLoaded", () => {
  const recipeModal = document.getElementById("recipeModal");
  const closeRecipeModal = document.getElementById("closeRecipeModal");
  const recipeContainer = document.getElementById("recipeContainer");

  // Funkcija za učitavanje recepata iz JSON-a
  fetch('recipes.json')
    .then(response => response.json())
    .then(recipes => {
      // Dinamičko kreiranje kartica za recepte
      recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.classList.add('recipe-card');
        card.setAttribute('data-id', recipe.naziv);

        card.innerHTML = `
          <div class="recipe-details">
            <h3>${recipe.naziv}</h3> <!-- Naziv recepta -->
            <p><strong>Cal:</strong> ${recipe.kalorije} kcal, <strong>UH:</strong> ${recipe.UH} g, <strong>Prot.:</strong> ${recipe.proteini} g, <strong>Masti:</strong> ${recipe.masti} g, <strong>GI:</strong> ${recipe.GI}</p> <!-- Nutritivne vrednosti -->
            <p>${recipe.tag.join(', ')}</p> <!-- Tagovi recepta -->
            <button class="details-btn">Više detalja</button> <!-- Dugme za otvaranje modala -->
          </div>
        `;

        // Uklanjamo sliku sa kartica
        const imageElement = card.querySelector('img');
        if (imageElement) imageElement.remove();

        // Dodajemo karticu u kontejner
        recipeContainer.appendChild(card);

        // Dodavanje event listener-a za "Više detalja" dugme
        card.querySelector('.details-btn').addEventListener('click', () => {
          openRecipeModal(recipe); // Otvaranje modala sa podacima za taj recept
        });
      });
    });

  // Funkcija za otvaranje modala sa podacima recepta
  function openRecipeModal(recipe) {
    document.getElementById("recipeTitle").textContent = recipe.naziv;
    document.getElementById("recipeIngredients").textContent = recipe.sastojci;
    document.getElementById("recipePreparation").textContent = recipe.priprema;
    document.getElementById("recipeImage").src = recipe.slika; // Dodajemo sliku u modal
    recipeModal.hidden = false; // Prikazujemo modal
  }

  // Zatvori modal
  closeRecipeModal.addEventListener("click", () => {
    recipeModal.hidden = true;
  });
});
