document.addEventListener("DOMContentLoaded", () => {
  // Učitavanje JSON fajla
  fetch("recipes.json")
    .then((response) => response.json())
    .then((recipes) => {
      displayRecipes(recipes);
      setupTagFilter(recipes);
    })
    .catch((error) => {
      console.error("Greška pri učitavanju JSON podataka:", error);
    });
});

// Prikaz svih recepata
function displayRecipes(recipes) {
  const recipeContainer = document.getElementById("recipeContainer");
  recipeContainer.innerHTML = "";

  recipes.forEach((recipe) => {
    const card = document.createElement("div");
    card.classList.add("recipe-card");

    const img = document.createElement("img");
    img.src = recipe.slika;
    img.alt = recipe.naziv;

    const info = document.createElement("div");
    info.classList.add("recipe-info");

    const title = document.createElement("h3");
    title.textContent = recipe.naziv;

    const kcal = document.createElement("p");
    kcal.textContent = `Kalorije: ${recipe.kalorije} kcal`;

    const detailsBtn = document.createElement("button");
    detailsBtn.classList.add("details-btn");
    detailsBtn.textContent = "Više informacija";
    detailsBtn.onclick = () => showRecipeDetails(recipe);

    info.appendChild(title);
    info.appendChild(kcal);
    info.appendChild(detailsBtn);

    card.appendChild(img);
    card.appendChild(info);
    recipeContainer.appendChild(card);
  });
}

// Filter po tagovima
function setupTagFilter(recipes) {
  const buttons = document.querySelectorAll(".tag-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const tag = btn.getAttribute("data-tag");
      const filtered = recipes.filter(
        (r) => r.tag && r.tag.toLowerCase().includes(tag.toLowerCase())
      );
      displayRecipes(filtered);
    });
  });
}

// Detalji recepta
function showRecipeDetails(recipe) {
  const modal = document.createElement("div");
  modal.classList.add("recipe-details-modal");
  modal.innerHTML = `
    <div class="modal-inner">
      <h2>${recipe.naziv}</h2>
      <h3>Sastojci:</h3>
      <pre>${recipe.sastojci}</pre>
      <h3>Priprema:</h3>
      <p>${recipe.priprema}</p>
      <button class="close-btn">Zatvori</button>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector(".close-btn").onclick = () => modal.remove();
}
