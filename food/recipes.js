// Učitavanje JSON podataka
fetch('recipes.json')
  .then(response => response.json())
  .then(data => displayRecipes(data))
  .catch(error => console.error('Greška pri učitavanju JSON podataka:', error));

function displayRecipes(recipes) {
  const container = document.getElementById('recipeContainer');
  container.innerHTML = '';

  recipes.forEach(recipe => {
    const card = document.createElement('div');
    card.className = 'recipe-card';

    const img = document.createElement('img');
    img.src = recipe.slika;
    img.alt = recipe.naziv;

    const title = document.createElement('h3');
    title.textContent = recipe.naziv;

    const tags = document.createElement('div');
    tags.className = 'recipe-tags';
    tags.textContent = (recipe.tag || '').replace(/;/g, ' | ');

    const kcal = document.createElement('p');
    kcal.textContent = `Kalorije: ${recipe.kalorije} kcal`;

    const btn = document.createElement('button');
    btn.textContent = 'Više informacija';

    const details = document.createElement('div');
    details.className = 'recipe-details';
    details.innerHTML = `
      <h4>Sastojci:</h4>
      <ul>${recipe.sastojci.split('\n').map(line => `<li>${line.trim()}</li>`).join('')}</ul>
      <h4>Priprema:</h4>
      <p>${recipe.priprema}</p>
    `;

    btn.addEventListener('click', () => {
      details.style.display = details.style.display === 'block' ? 'none' : 'block';
    });

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(tags);
    card.appendChild(kcal);
    card.appendChild(btn);
    card.appendChild(details);

    container.appendChild(card);
  });
}
