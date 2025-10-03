document.addEventListener("DOMContentLoaded", () => {
  // --- Carousel za reklame ---
  const slides = document.querySelectorAll('.image-slide');
  let currentSlide = 0;

  // Funkcija za promenu slajdova
  function showNextSlide() {
    // Sakrij prethodni slajd
    slides[currentSlide].classList.remove('active');

    // Pređi na sledeći slajd
    currentSlide = (currentSlide + 1) % slides.length;

    // Prikazivanje sledećeg slajda
    slides[currentSlide].classList.add('active');
  }

  // Početni prikaz prve slike
  slides[currentSlide].classList.add('active');

  // Postavi interval za promenu slajdova (3 sekunde)
  setInterval(showNextSlide, 6000);

  // --- AI savet ---
  const aiModal = document.getElementById("aiModal");
  const aiClose = document.getElementById("aiClose");
  const aiAdvice = document.getElementById("aiAdvice");
  const btnAnalyzeGlucose = document.getElementById("aiButton");

  // Funkcija za generisanje AI saveta na osnovu glukoze
  function generateAdvice(trend) {
    let advice = "";
    if (trend === "high") {
      advice = "Preporučujemo vegan ishranu. Fokusirajte se na biljnu ishranu kako biste stabilizovali nivo glukoze.";
    } else if (trend === "medium") {
      advice = "Preporučujemo low-GI ishranu. Uključite integralne žitarice i povrće u ishranu.";
    } else {
      advice = "Preporučujemo gluten-free ishranu. Uključite više voća, povrća i proteina.";
    }

    aiAdvice.textContent = advice;  // Prikazivanje saveta
  }

  // Funkcija za analizu glukoze i trendova (poziva analizu u trends.html)
  function aiAnalyzeTable() {
    // Pretpostavljamo da se ovde koristi trend glukoze: "high", "medium", "low"
    const trend = "high"; // Ovdje biste trebali povezati sa stvarnim podacima iz trends.html
    generateAdvice(trend);
  }

  // Dugme za otvaranje AI saveta
  btnAnalyzeGlucose.addEventListener("click", function() {
    aiModal.hidden = false;  // Otvoriti modal
    aiAnalyzeTable();  // Generisati savete odmah
  });

  // Zatvoriti modal za AI savete
  aiClose.addEventListener("click", () => {
    aiModal.hidden = true;  // Zatvoriti modal
  });
});
