document.addEventListener("DOMContentLoaded", () => {
  const recipeContainer = document.getElementById("recipeContainer");
  const tagButtons = document.querySelectorAll(".tag-btn");

  // Učitavanje JSON-a
  fetch("recipes.json")
    .then((response) => {
      if (!response.ok) throw new Error("Ne mogu učitati JSON fajl");
      return response.json();
    })
    .then((recipes) => {
      displayRecipes(recipes);
      setupTagFiltering(recipes);
    })
    .catch((error) => {
      console.error("Greška pri učitavanju JSON podataka:", error);
    });

  // Funkcija za prikaz recepata
  function displayRecipes(recipes) {
    recipeContainer.innerHTML = "";

    if (!recipes || recipes.length === 0) {
      recipeContainer.innerHTML = "<p>Nema dostupnih recepata.</p>";
      return;
    }

    recipes.forEach((recipe) => {
      const card = document.createElement("div");
      card.classList.add("recipe-card");

      const img = document.createElement("img");
      img.src = recipe.slika || "../images/no-image.jpg";
      img.alt = recipe.naziv;

      const details = document.createElement("div");
      details.classList.add("recipe-details");

      const title = document.createElement("h3");
      title.textContent = recipe.naziv;

      const kcal = document.createElement("p");
      kcal.textContent = `Kalorije: ${recipe.kalorije} kcal`;

      const macros = document.createElement("p");
      macros.textContent = `UH: ${recipe.UH}g | Proteini: ${recipe.proteini}g | Masti: ${recipe.masti}g`;

      // Dugme za prikaz detalja
      const btn = document.createElement("button");
      btn.textContent = "🍽️ Više informacija";
      btn.classList.add("details-btn");
      btn.addEventListener("click", () => showDetails(recipe));

      details.appendChild(title);
      details.appendChild(kcal);
      details.appendChild(macros);
      details.appendChild(btn);

      card.appendChild(img);
      card.appendChild(details);
      recipeContainer.appendChild(card);
    });
  }

  // Prikaz detalja recepta u modalu
  function showDetails(recipe) {
    const modal = document.createElement("div");
    modal.classList.add("modal");

    modal.innerHTML = `
      <div class="modal-content">
        <h2>${recipe.naziv}</h2>
        <p><strong>Kalorije:</strong> ${recipe.kalorije} kcal</p>
        <p><strong>UH:</strong> ${recipe.UH}g | <strong>Proteini:</strong> ${recipe.proteini}g | <strong>Masti:</strong> ${recipe.masti}g</p>
        <h3>Sastojci:</h3>
        <pre>${recipe.sastojci}</pre>
        <h3>Priprema:</h3>
        <pre>${recipe.priprema}</pre>
        <button class="close-modal">Zatvori</button>
      </div>
    `;

    modal.querySelector(".close-modal").addEventListener("click", () => modal.remove());
    document.body.appendChild(modal);
  }

  // Funkcija za filtriranje po tagovima
  function setupTagFiltering(recipes) {
    tagButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        tagButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const tag = btn.dataset.tag;
        if (tag === "all") {
          displayRecipes(recipes);
        } else {
          const filtered = recipes.filter((r) => r.tag && r.tag.includes(tag));
          displayRecipes(filtered);
        }
      });
    });
  }
});
