// Carousel - inicijalizacija i smanjenje slika
(function initCarousel() {
  const carouselItems = document.querySelectorAll('.carousel-item img');
  carouselItems.forEach(item => {
    // Smanjujemo dimenzije slika
    item.style.maxWidth = '100%';
    item.style.height = 'auto';
  });
})();
