(function initCarousel() {
  const carouselItems = document.querySelectorAll('.carousel-item img');
  carouselItems.forEach(item => {
    // Smanjujemo dimenzije slika
    item.style.maxWidth = '100%';
    item.style.height = 'auto';
  });

  // Automatizovano pomeranje carousel-a
  let currentIndex = 0;
  const totalItems = carouselItems.length;
  const carousel = document.querySelector('#carousel');

  // Funkcija za pomeranje carousel-a
  function moveCarousel() {
    currentIndex = (currentIndex + 1) % totalItems;
    carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
  }

  // Pokrećemo pomeranje svakih 3 sekunde
  setInterval(moveCarousel, 3000);
})();
