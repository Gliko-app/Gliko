(function initCarousel() {
  const carousel = document.querySelector('#carousel');
  const carouselItems = document.querySelectorAll('.carousel-item');
  const dots = document.querySelectorAll('.dot');
  let currentIndex = 0;
  const totalItems = carouselItems.length;

  // Funkcija za pomeranje carousel-a
  function moveCarousel() {
    currentIndex = (currentIndex + 1) % totalItems;  // Prelazimo na sledeću sliku
    carousel.style.transition = "transform 0.5s ease";  // Animacija transformacije
    carousel.style.transform = `translateX(-${currentIndex * 100}%)`;  // Pomeri slike

    // Ažuriraj tackice
    updateDots();
  }

  // Funkcija za ažuriranje tackica
  function updateDots() {
    dots.forEach(dot => dot.classList.remove('active'));  // Ukloni active klasu sa svih tackica
    dots[currentIndex].classList.add('active');  // Dodaj active klasu na trenutnu tackicu
  }

  // Start carousel movement every 3 seconds
  setInterval(moveCarousel, 3000);  // Možeš promeniti interval ako želiš da se slike menjaju brže ili sporije

  // Dodavanje funkcionalnosti na klik tackica
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      currentIndex = parseInt(dot.getAttribute('data-index'));  // Postavi currentIndex na kliknutu tackicu
      carousel.style.transition = "transform 0.5s ease";  // Animacija transformacije
      carousel.style.transform = `translateX(-${currentIndex * 100}%)`;  // Pomeri carousel
      updateDots();  // Ažuriraj tackice
    });
  });

  // Inicijalizuj tackicu koja treba da bude aktivna
  updateDots();
})();
