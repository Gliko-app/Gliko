const form = document.getElementById('recipeForm');
const listContainer = document.getElementById('recipeList');
const downloadBtn = document.getElementById('downloadJson');

let recipes = [];
let editIndex = null;

// Dodavanje ili izmena recepta
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const naziv = document.getElementById('naziv').value.trim();
  const slika = document.getElementById('slika').value.trim();
  const kalorije = parseFloat(document.getElementById('kalorije').value);
  const UH = parseFloat(document.getElementById('UH').value);
  const proteini = parseFloat(document.getElementById('proteini').value);
  const masti = parseFloat(document.getElementById('masti').value);
  const GI = parseFloat(document.getElementById('GI').value);
  const sastojci = document.getElementById('sastojci').value.trim();
  const priprema = document.getElementById('priprema').value.trim();

  const tagovi = Array.from(document.querySelectorAll('input[name="tag"]:checked'))
                      .map(el => el.value);

  const recipe = { naziv, slika, tag: tagovi, kalorije, UH, proteini, masti, GI, sastojci, priprema };

  if (editIndex !== null) {
    recipes[editIndex] = recipe;
    editIndex = null;
  } else {
    recipes.push(recipe);
  }

  form.reset();
  renderRecipes();
});

// Prikaz svih recepata
function renderRecipes() {
  listContainer.innerHTML = '';
  if (recipes.length === 0) {
    listContainer.innerHTML = '<p>Nema unetih recepata.</p>';
    return;
  }

  recipes.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'recipe-item';
    div.innerHTML = `
      <strong>${r.naziv}</strong><br>
      <small>${r.tag.join(', ') || '(bez tagova)'}</small><br>
      Kalorije: ${r.kalorije} | UH: ${r.UH}g | Proteini: ${r.proteini}g | Masti: ${r.masti}g<br>
      <button class="edit-btn" data-index="${i}">✏️ Uredi</button>
      <button class="delete-btn" data-index="${i}">🗑️ Obriši</button>
      <hr>
    `;
    listContainer.appendChild(div);
  });

  // Dugmad za brisanje i uređivanje
  document.querySelectorAll('.edit-btn').forEach(btn =>
    btn.addEventListener('click', (e) => editRecipe(e.target.dataset.index))
  );
  document.querySelectorAll('.delete-btn').forEach(btn =>
    btn.addEventListener('click', (e) => deleteRecipe(e.target.dataset.index))
  );
}

// Uređivanje recepta
function editRecipe(index) {
  const r = recipes[index];
  document.getElementById('naziv').value = r.naziv;
  document.getElementById('slika').value = r.slika;
  document.getElementById('kalorije').value = r.kalorije;
  document.getElementById('UH').value = r.UH;
  document.getElementById('proteini').value = r.proteini;
  document.getElementById('masti').value = r.masti;
  document.getElementById('GI').value = r.GI;
  document.getElementById('sastojci').value = r.sastojci;
  document.getElementById('priprema').value = r.priprema;

  // čekiraj postojeće tagove
  document.querySelectorAll('input[name="tag"]').forEach(el => {
    el.checked = r.tag.includes(el.value);
  });

  editIndex = index;
}

// Brisanje recepta
function deleteRecipe(index) {
  if (confirm(`Obrisati recept "${recipes[index].naziv}"?`)) {
    recipes.splice(index, 1);
    renderRecipes();
  }
}

// Preuzimanje JSON fajla
downloadBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recipes.json';
  a.click();
  URL.revokeObjectURL(url);
});
