document.addEventListener("DOMContentLoaded", () => {
  // --- Modal za reklame ---
  const adModal = document.getElementById("adModal");
  const adClose = document.getElementById("adClose");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const slides = document.querySelectorAll(".image-slide");
  let currentSlide = 0;

  // Funkcija za prikazivanje trenutne slike u modalu
  function showSlide(index) {
    if (index >= slides.length) currentSlide = 0; // Ako pređemo preko broja slika, vratimo na prvu
    if (index < 0) currentSlide = slides.length - 1; // Ako idemo unazad, idemo na poslednju sliku
    
    const offset = -100 * currentSlide;
    document.querySelector(".modal-body").style.transform = `translateX(${offset}%)`;
  }

  // Dugme za sledeću sliku
  nextBtn.addEventListener("click", () => {
    currentSlide++;
    showSlide(currentSlide);
  });

  // Dugme za prethodnu sliku
  prevBtn.addEventListener("click", () => {
    currentSlide--;
    showSlide(currentSlide);
  });

  // Otvorite modal sa reklamama automatski
  adModal.hidden = false;

  // Zatvorite modal za reklame
  adClose.addEventListener("click", () => {
    adModal.hidden = true;
  });
});


  // Zatvoriti modal za reklame
  adClose.addEventListener("click", () => {
    adModal.hidden = true;
  });

  // --- AI Saveti ---
  const aiModal = document.getElementById("aiModal");
  const aiClose = document.getElementById("aiClose");
  const aiAdvice = document.getElementById("aiAdvice");
  const btnAnalyzeGlucose = document.getElementById("btnAnalyzeGlucose");

  // Funkcija za generisanje AI saveta na osnovu glukoze
  function generateAdvice(glucose) {
    let advice = "";
    if (glucose < 5.5) {
      advice = "Vaša glukoza je niska, preporučujemo unos ugljenih hidrata sa niskim GI, kao što su integralni hleb ili ovsen porridge.";
    } else if (glucose >= 5.5 && glucose <= 7.2) {
      advice = "Vaša glukoza je u optimalnom opsegu, držite balans između proteina i povrća.";
    } else if (glucose > 7.2 && glucose <= 10) {
      advice = "Vaša glukoza je povišena, pokušajte da smanjite unos ugljenih hidrata i jedite više vlakana.";
    } else {
      advice = "Vrlo visoka glukoza! Preporučujemo konsultaciju sa lekarom za precizne savete.";
    }

    // Postepeno prikazivanje saveta, slovo po slovo
    aiAdvice.textContent = "";
    let i = 0;
    let interval = setInterval(() => {
      aiAdvice.textContent += advice.charAt(i);
      i++;
      if (i === advice.length) {
        clearInterval(interval);
        // Nakon prikaza saveta, dodajemo preporuke za recepte
        aiAdvice.textContent += "\n\nPreporučujemo sledeće recepte za vas:";
        setTimeout(() => {
          aiAdvice.textContent += "\n- Low-GI Smoothie\n- Vegan Salata\n- Integralni hleb";
        }, 1000);
      }
    }, 50);  // Brzina prikaza slova
  }

  // Dugme za otvaranje AI saveta
  btnAnalyzeGlucose.addEventListener("click", function() {
    aiModal.hidden = false;
    generateAdvice(6.5); // Ovdje se koristi primer sa glukozom 6.5 mmol/L, može se povezati sa stvarnim podacima
  });

  // Zatvoriti modal za AI savete
  aiClose.addEventListener("click", () => {
    aiModal.hidden = true;
  });

  // --- Pretraga recepata ---
  document.getElementById("searchRecipe").addEventListener("input", function() {
    const searchTerm = this.value.toLowerCase();
    const recipes = document.querySelectorAll(".recipe-card");

    recipes.forEach(recipe => {
      const title = recipe.querySelector("h4").textContent.toLowerCase();
      const tags = recipe.querySelector("p").textContent.toLowerCase();
      if (title.includes(searchTerm) || tags.includes(searchTerm)) {
        recipe.style.display = "block";
      } else {
        recipe.style.display = "none";
      }
    });
  });

  // --- Prikaz recepata ---
  // Funkcija za učitavanje recepata iz IndexedDB
  function loadRecipes() {
    const recipeContainer = document.getElementById("recipeContainer");
    recipeContainer.innerHTML = "";  // Očisti prethodno prikazane recepte

    const transaction = db.transaction("recipes", "readonly");
    const objectStore = transaction.objectStore("recipes");
    const request = objectStore.getAll();  // Dobijamo sve recepte

    request.onsuccess = () => {
      const recipes = request.result;
      recipes.forEach(recipe => {
        let recipeCard = `
          <div class="recipe-card">
            <img src="${recipe.image}" alt="${recipe.title}" style="width:100%; height:auto;">
            <h4>${recipe.title}</h4>
            <p>Tagovi: ${recipe.tags.join(", ")}</p>
            <p>Kalorije: ${recipe.kcal} kcal</p>
            <p>Ugljeni hidrati: ${recipe.carbs}g</p>
            <p>Proteini: ${recipe.protein}g</p>
            <p>Masti: ${recipe.fat}g</p>
            <p>GI: ${recipe.gi}</p>
          </div>
        `;
        recipeContainer.innerHTML += recipeCard;  // Dodaj recept u DOM
      });
    };
  }

  // Početno učitavanje recepata
  loadRecipes();
});
