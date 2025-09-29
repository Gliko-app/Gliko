document.addEventListener('DOMContentLoaded', function () {
  const tabs = document.querySelectorAll('.tab-btn');
  const sections = document.querySelectorAll('.tab-view');

  // Dodavanje funkcionalnosti za tabove
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Deaktiviraj sve tabove
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Prikazivanje odgovarajuće sekcije
      sections.forEach(section => {
        if (section.id === `tab-${tab.dataset.tab}`) {
          section.style.display = 'block';
          // Učitaj odgovarajući HTML fajl za tab
          loadTabContent(tab.dataset.tab);
        } else {
          section.style.display = 'none';
        }
      });
    });
  });

  // Učitavanje sadržaja za prvi tab na početku
  const firstTab = document.querySelector('.tab-btn.active');
  loadTabContent(firstTab.dataset.tab);
});

// Funkcija za dinamičko učitavanje sadržaja u tabove
function loadTabContent(tab) {
  const sectionId = `tab-${tab}`;
  const filePath = `/gliko/${tab}/${tab}.html`;  // Relativna putanja za HTML fajlove

  console.log(`Fetching: ${filePath}`);  // Provera putanje u konzoli

  // Proveravamo da li je sadržaj već učitan
  if (!document.getElementById(sectionId).innerHTML) {
    fetch(filePath)  // Učitavanje HTML fajlova
      .then(response => {
        console.log(`Response for ${filePath}: ${response.status}`);  // Dodajemo log za status
        if (!response.ok) {
          throw new Error(`Error fetching ${filePath}: ${response.statusText}`);
        }
        return response.text();  // Uzimamo tekstualni sadržaj odgovora
      })
      .then(data => {
        document.getElementById(sectionId).innerHTML = data;  // Prikazujemo sadržaj u tab-u
        console.log(`Loaded content for: ${filePath}`);  // Logujemo uspešno učitavanje
      })
      .catch(error => {
        console.error(`Failed to load content for ${filePath}:`, error);  // Logujemo grešku
        document.getElementById(sectionId).innerHTML = `<p>Error loading content for ${tab}.</p>`;
      });
  }
}
