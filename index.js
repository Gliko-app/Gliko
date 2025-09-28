<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Gliko — Glavni Tabovi</title>

  <link rel="manifest" href="manifest.json">
  <link rel="icon" href="icon-192.png" type="image/png"/>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="stylesheet" href="style.css"/>
</head>
<body>
  <!-- Navigacija sa svim tabovima -->
  <nav class="tabs-bar">
    <button class="tab-btn active" data-tab="trend">Trendovi</button>
    <button class="tab-btn" data-tab="food">Ishrana</button>
    <button class="tab-btn" data-tab="therapy">Terapija</button>
  </nav>

  <main id="tabs-root">
    <!-- TAB: TRENDOVI -->
    <section id="tab-trend" class="tab-view active">
      <!-- Sadržaj za Trendove, učitavamo iz trends.html -->
    </section>

    <!-- TAB: ISHRANA -->
    <section id="tab-food" class="tab-view">
      <!-- Sadržaj za Ishranu, učitavamo iz food.html -->
    </section>

    <!-- TAB: TERAPIJA -->
    <section id="tab-therapy" class="tab-view">
      <!-- Sadržaj za Terapiju, učitavaćemo kad bude razvijen -->
    </section>
  </main>

  <!-- Linkovi ka JS fajlovima -->
  <script src="trends.js"></script>  <!-- Dodajemo trends.js -->
  <script src="food.js"></script>    <!-- Dodajemo food.js -->
  <script src="index.js"></script>   <!-- Ovaj JS fajl upravlja prebacivanjem između tabova -->

  <script>
    // Funkcija za učitavanje sadržaja svakog taba
    function loadTabContent(tabId, url) {
      fetch(url)
        .then(response => response.text())
        .then(html => {
          document.getElementById(tabId).innerHTML = html;
        })
        .catch(err => {
          console.error('Greška pri učitavanju sadržaja:', err);
        });
    }

    // Na učitavanju stranice učitaj sadržaj za svaki tab
    window.addEventListener('DOMContentLoaded', () => {
      loadTabContent('tab-trend', 'trends.html');  // Učitavamo sadržaj za Trendove
      loadTabContent('tab-food', 'food.html');    // Učitavamo sadržaj za Ishranu
      // Terapija će biti dodata kasnije, možeš dodati fajl kad bude spreman
      // loadTabContent('tab-therapy', 'therapy.html');  
    });

    // Funkcija za prebacivanje između tabova
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;

      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));

      const key = btn.dataset.tab;
      ['trend', 'food', 'therapy'].forEach(k => {
        const el = document.getElementById('tab-' + k);
        if (!el) return;
        el.hidden = (k !== key);  // Prikazuje samo izabrani tab
        el.classList.toggle('active', k === key);
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  </script>

</body>
</html>
