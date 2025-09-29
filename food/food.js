// Kompresija slike (Pica.js)
(function initImageCompression() {
  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 500; // Max širina slike
        const maxHeight = 500; // Max visina slike
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
        canvas.width = image.width * ratio;
        canvas.height = image.height * ratio;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(callback, 'image/jpeg', 0.7); // Kompresija sa kvalitetom 0.7
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  window.compressImage = compressImage;
})();

// Carousel - inicijalizacija i smanjenje slika
(function initCarousel() {
  const carouselItems = document.querySelectorAll('.carousel-item img');
  carouselItems.forEach(item => {
    // Smanjujemo dimenzije slika
    item.style.maxWidth = '100%';
    item.style.height = 'auto';
  });
})();

// Kreiranje IndexedDB baze za recepte
let db;

(function initDB() {
  const req = indexedDB.open('recipeDB', 1);
  
  req.onupgradeneeded = function(e) {
    db = e.target.result;
    if (!db.objectStoreNames.contains('recipes')) {
      const store = db.createObjectStore('recipes', { keyPath: 'id', autoIncrement: true });
      store.createIndex('byTag', 'tags', { unique: false });
    }
  };

  req.onsuccess = function(e) {
    db = e.target.result;
  };
})();

// Dodavanje recepta u bazu
function addRecipe(recipeData) {
  const tx = db.transaction('recipes', 'readwrite');
  const store = tx.objectStore('recipes');
  store.add(recipeData);
  tx.oncomplete = () => {
    console.log('Recept uspešno dodat');
    loadRecipes(); // Ažuriramo prikaz recepata
  };
  tx.onerror = (err) => console.error('Greška pri dodavanju recepta:', err);
}

// Učitavanje recepata iz baze
function loadRecipes() {
  const tbody = document.querySelector('#recipeTabsContainer');
  tbody.innerHTML = ''; // Resetujemo sadržaj
  const tx = db.transaction('recipes');
  const store = tx.objectStore('recipes');
  const allRecipes = store.getAll();

  allRecipes.onsuccess = function(e) {
    e.target.result.forEach(recipe => {
      const recipeTab = document.createElement('div');
      recipeTab.classList.add('recipe-tab');
      recipeTab.innerHTML = `
        <h4>${recipe.name}</h4>
        <img src="${recipe.image}" alt="${recipe.name}" style="width: 100%; height: auto;">
        <p><strong>Sastojci:</strong> ${recipe.ingredients}</p>
        <p><strong>Tagovi:</strong> ${recipe.tags}</p>
      `;
      tbody.appendChild(recipeTab);
    });
  };
}

// Predefinisani tagovi i dodavanje check boxova za tagove
(function createTagCheckboxes() {
  const tags = [
    'Nizak_Glikemijski_Index', 'Bez_Glutena', 'Veganski', 
    'LCHF', 'Bez_Šećera'
  ];

  const tagContainer = document.getElementById('tagsContainer');
  tags.forEach(tag => {
    const label = document.createElement('label');
    label.classList.add('tag-checkbox');
    label.innerHTML = `
      <input type="checkbox" value="${tag}" /> ${tag}
    `;
    tagContainer.appendChild(label);
  });
})();

// Obrada forme za unos recepta
document.getElementById('recipeForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const name = document.getElementById('recipeName').value;
  const imageInput = document.getElementById('recipeImage');
  const ingredients = document.getElementById('ingredients').value;
  const selectedTags = Array.from(document.querySelectorAll('.tag-checkbox input:checked'))
                            .map(input => input.value);

  // Ako je slika priložena, kompresujemo je i čuvamo u lokalnom skladištu
  let imageUrl = '';
  if (imageInput.files && imageInput.files[0]) {
    compressImage(imageInput.files[0], (blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        imageUrl = reader.result;

        // Kreiranje objekta recepta
        const recipeData = {
          name,
          image: imageUrl,
          ingredients,
          tags: selectedTags.join(', ')  // Spajanje tagova u string
        };

        // Dodajemo recept u bazu
        addRecipe(recipeData);
      };
      reader.readAsDataURL(blob);
    });
  } else {
    alert('Molimo vas da unesete sliku recepta.');
  }

  // Resetujemo formu nakon unosa
  document.getElementById('recipeForm').reset();
});

// Pretraga recepata po imenu
document.getElementById('searchRecipe').addEventListener('input', function(event) {
  const searchTerm = event.target.value.toLowerCase();
  const recipeTabs = document.querySelectorAll('.recipe-tab');
  recipeTabs.forEach(tab => {
    const recipeName = tab.querySelector('h4').textContent.toLowerCase();
    if (recipeName.includes(searchTerm)) {
      tab.style.display = '';
    } else {
      tab.style.display = 'none';
    }
  });
});

// Inicijalno učitavanje recepata
window.addEventListener('load', loadRecipes);
