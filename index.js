// Funkcija za prebacivanje između tabova
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;

  // Aktiviranje odgovarajuće dugmadi za tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));

  const key = btn.dataset.tab;
  // Prebacivanje između tabova
  ['trend', 'food', 'therapy'].forEach(k => {
    const el = document.getElementById('tab-' + k);
    if (!el) return;
    el.hidden = (k !== key);  // Prikazuje samo izabrani tab
    el.classList.toggle('active', k === key);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });  // Pomeri stranicu na vrh
});

// Funkcija za učitavanje sadržaja svakog taba
function loadTabContent(tabId, url) {
  fetch(url)  // Fetch metodom učitavamo sadržaj iz URL-a
    .then(response => response.text())  // Preuzimamo HTML kao tekst
    .then(html => {
      document.getElementById(tabId).innerHTML = html;  // Učitani sadržaj ubacujemo u odgovarajući tab
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
