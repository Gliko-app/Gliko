document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("recipeForm");
  const list = document.getElementById("recipeList");
  const exportBtn = document.getElementById("exportBtn");

  // Učitaj postojeće recepte iz localStorage
  let recipes = JSON.parse(localStorage.getItem("recipes")) || [];

  const saveToLocal = () => {
    localStorage.setItem("recipes", JSON.stringify(recipes, null, 2));
  };

  const renderRecipes = () => {
    list.innerHTML = "";
    recipes.forEach((r, i) => {
      const card = document.createElement("div");
      card.className = "recipe-card";

      card.innerHTML = `
        <img src="${r.slika}" alt="${r.naziv}" />
        <div class="recipe-info">
          <h3>${r.naziv}</h3>
          <p><strong>${r.kalorije}</strong> kcal — UH: ${r.UH}g, Proteini: ${r.proteini}g, Masti: ${r.masti}g</p>
          <p><em>Tagovi:</em> ${r.tag.join(", ")}</p>
          <button onclick="editRecipe(${i})">✏️ Uredi</button>
          <button onclick="deleteRecipe(${i})">🗑️ Obriši</button>
        </div>
      `;
      list.appendChild(card);
    });
  };

  form.addEventListener("submit", e => {
    e.preventDefault();

    const naziv = document.getElementById("naziv").value;
    const slika = document.getElementById("slika").value;
    const kalorije = +document.getElementById("kalorije").value;
    const UH = +document.getElementById("UH").value;
    const proteini = +document.getElementById("proteini").value;
    const masti = +document.getElementById("masti").value;
    const GI = +document.getElementById("GI").value;
    const sastojci = document.getElementById("sastojci").value;
    const priprema = document.getElementById("priprema").value;
    const tag = Array.from(document.querySelectorAll("#tagovi input:checked")).map(cb => cb.value);

    recipes.push({ naziv, slika, tag, kalorije, UH, proteini, masti, GI, sastojci, priprema });
    saveToLocal();
    renderRecipes();
    form.reset();
  });

  exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recipes.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  window.deleteRecipe = index => {
    recipes.splice(index, 1);
    saveToLocal();
    renderRecipes();
  };

  window.editRecipe = index => {
    const r = recipes[index];
    document.getElementById("naziv").value = r.naziv;
    document.getElementById("slika").value = r.slika;
    document.getElementById("kalorije").value = r.kalorije;
    document.getElementById("UH").value = r.UH;
    document.getElementById("proteini").value = r.proteini;
    document.getElementById("masti").value = r.masti;
    document.getElementById("GI").value = r.GI;
    document.getElementById("sastojci").value = r.sastojci;
    document.getElementById("priprema").value = r.priprema;

    document.querySelectorAll("#tagovi input").forEach(cb => {
      cb.checked = r.tag.includes(cb.value);
    });

    recipes.splice(index, 1);
    saveToLocal();
    renderRecipes();
  };

  renderRecipes();
});
