let db;
let filteredZone = "";  // Definišemo promenljivu za zonu (jutro, popodne, itd.)
let filteredStart = ""; // Početni datum za filtriranje
let filteredEnd = "";   // Krajnji datum za filtriranje

document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll('.image-slide');
  let currentSlide = 0;

  // Funkcija za promenu slajdova
  function showNextSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }

  // Početni prikaz prve slike
  slides[currentSlide].classList.add('active');

  // Postavi interval za promenu slajdova (3 sekunde)
  setInterval(showNextSlide, 3000);

  // --- AI savet ---
  const aiModal = document.getElementById("aiModal");
  const aiClose = document.getElementById("aiClose");
  const aiAdvice = document.getElementById("aiAdvice");
  const btnAnalyzeGlucose = document.getElementById("aiButton");

  // Proveravamo da li je dugme za analizu dostupno
  if (btnAnalyzeGlucose) {
    btnAnalyzeGlucose.addEventListener("click", function() {
      aiModal.hidden = false;  // Prikazujemo modal
      aiAnalyzeTable();  // Pokrećemo analizu odmah
    });
  } else {
    console.error("Dugme za analizu nije pronađeno.");
  }

  // Zatvori modal za AI savete
  if (aiClose) {
    aiClose.addEventListener("click", () => {
      aiModal.hidden = true;
    });
  }


  // Inicijalizacija IndexedDB
  const request = indexedDB.open("glucoseDB", 2);

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('entries')) {
      const objectStore = db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
      objectStore.createIndex('date', 'date', { unique: false });
      objectStore.createIndex('glucose', 'glucose', { unique: false });
    }
  };

  request.onsuccess = (event) => {
    db = event.target.result;  // db objekat je sada dostupan
    console.log("IndexedDB baza je otvorena i povezana.");
  };

  request.onerror = (event) => {
    console.error("Greška pri otvaranju IndexedDB baze:", event.target.error);
  };

  // Funkcija za analizu glukoze i trendova
  function aiAnalyzeTable() {
    if (!db) {
      console.error("IndexedDB nije još otvoren.");
      return;
    }

    const st = db.transaction('entries').objectStore('entries');
    const items = [];
    st.openCursor().onsuccess = (e) => {
      const c = e.target.result;
      if (c) {
        items.push(c.value);
        c.continue();
      } else {
        // Filtriranje unosa prema zoni i datumu
        console.log("Podaci iz baze:", items); // Log podataka koji su učitani
        const filtered = items.filter(entry => {
          console.log("Filtrirani unos:", entry);  // Log svakog unosa
          return (filteredZone ? entry.zone === filteredZone : true) &&
                 (filteredStart ? new Date(entry.date) >= new Date(filteredStart) : true) &&
                 (filteredEnd ? new Date(entry.date) <= new Date(filteredEnd) : true);
        });

        console.log("Filtrirani podaci:", filtered); // Log filtriranih podataka

        if (!filtered.length) {
          showAItypingAnalysis(["Nema dovoljno podataka za analizu sa trenutnim filtrima."]);
          return;
        }

        // Izračunavanje trenda
        const trend = getTrend(filtered);
        console.log("Izračunat trend:", trend); // Log trenda
        generateAdvice(trend);  // Generisanje saveta na osnovu trenda
      }
    };
  }

  // Funkcija za analizu trenda glukoze
  function getTrend(entries) {
    if (entries.length < 2) return "stable";  // Ako je manje od dva unosa, trend je stabilan

    let trend = "stable";  // Početni trend

    // Prolazimo kroz sve unose i upoređujemo vrednosti glukoze
    for (let i = 1; i < entries.length; i++) {
      const currentGlucose = entries[i].glucose;
      const previousGlucose = entries[i - 1].glucose;

      if (currentGlucose > previousGlucose) {
        trend = "up";  // Glukoza raste
      } else if (currentGlucose < previousGlucose) {
        trend = "down"; // Glukoza opada
      } else {
        trend = "stable"; // Glukoza stagnira
      }
    }

    return trend;  // Vraćamo trend
  }

  // Funkcija za generisanje AI saveta na osnovu trenda
  function generateAdvice(trend) {
    let advice = "";
    console.log("Generisanje saveta za trend:", trend);  // Log trenda za generisanje saveta

    if (trend === "up") {
      advice = "Vaš nivo glukoze je u porastu.Preporučujemo da korigujete ishranu. Fokusirajte se na ishranu sa više povrća kako biste stabilizovali nivo glukoze.";
    } else if (trend === "stable") {
      advice = "Trend glukoze je stabilan.Preporučujemo ishranu obrocima sa niskim GI. Uključite integralne žitarice i povrće u ishranu.";
    } else if (trend === "down") {
      advice = "Vrednosti glukoze opadaju.Samo nastavite sa zdravim navikama, preporučujemo ishranuobrocima sa niskim GI. Uključite više voća, povrća i proteina.";
    } else {
      advice = "Trend nije prepoznat."; // U slučaju da nije prepoznat trend
    }

    if (aiAdvice) {
      aiAdvice.innerHTML = advice;  // Postavljanje saveta u modal
      console.log("Savet postavljen u modal.");  // Log kada je savet postavljen
    }

    if (aiModal) {
      aiModal.hidden = false;  // Uveravamo se da je modal otvoren
      console.log("Modal je otvoren.");  // Log kada je modal otvoren
    }
  }

});

