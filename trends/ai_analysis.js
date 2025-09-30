/* =================== AI Analiza — analiza cele tabele =================== */
function aiAnalyzeTable() {
  const st = db.transaction('entries').objectStore('entries');
  const items = [];
  st.openCursor().onsuccess = (e) => {
    const c = e.target.result;
    if (c) {
      items.push(c.value);
      c.continue();
    } else {
      const filtered = items.filter(filterPredicate);  // Filtriranje unosa prema zonama ili datumu

      if (!filtered.length) {
        showAItypingAnalysis(["Zdravo! Nema dovoljno podataka za analizu za izabrani opseg/filtre."]);
        return;
      }

      const lines = [];
      const avg = getAverage(filtered);
      const trend = getTrend(filtered);  // Sada pozivamo getTrend()

      // Dodavanje analize
      lines.push("Analiza cele tabele:");
      lines.push(`Prosečna vrednost glukoze: ${avg.toFixed(1)} mmol/L`);
      lines.push(`Trend glukoze: ${trend === 'up' ? "Raste" : (trend === 'down' ? "Opada" : "Stagnira")}`);

      // Prosečne vrednosti za različite delove dana (jutro, dan, veče, noć)
      const avgMorning = getAverageForZone(filtered, 'jutro');
      const avgDay = getAverageForZone(filtered, 'popodne');
      const avgEvening = getAverageForZone(filtered, 'vece');
      const avgNight = getAverageForZone(filtered, 'noc');  // Dodajemo prosečnu vrednost za "noć"

      // Dodavanje analize za delove dana
      lines.push(`Prosečna jutarnja vrednost glukoze: ${avgMorning.toFixed(1)} mmol/L`);
      if (avgMorning > 7.2) {
        lines.push(getRandomComment(["Mogući “dawn phenomenon”: jutarnji hormoni (kortizol, hormon rasta) mogu podizati šećer. Obratite pažnju na kasne obroke bogate UH, san, hidrataciju i uvedite kratku šetnju posle večere.",
                                    "Jutarnje vrednosti su povišene, može biti povezan sa sporo sagorevanjem ugljenih hidrata tokom noći. Razmislite o promenama u ishrani."]));
      }

      lines.push(`Prosečna dnevna vrednost glukoze: ${avgDay.toFixed(1)} mmol/L`);
      if (avgDay > 7.2) {
        lines.push(getRandomComment(["Dnevni nivo je povišen. Smanjite unos UH, razmotrite razgovor sa lekarom / nutricionistom za prilagođavanje obroka.",
                                     "Dnevna vrednost je iznad preporučenog. Povećajte fizičku aktivnost i obratite pažnju na unos hrane."]));
      }

      lines.push(`Prosečna večernja vrednost glukoze: ${avgEvening.toFixed(1)} mmol/L`);
      if (avgEvening > 7.2) {
        lines.push(getRandomComment(["Večernji nivo je povišen. Razmislite o prilagođavanju večere i večernje fizičke aktivnosti.",
                                     "Večernje vrednosti su visoke, posvetite pažnju laganoj večeri i umerenom unosu ugljenih hidrata."]));
      }

      // Analiza za period "noć"
      lines.push(`Prosečna noćna vrednost glukoze: ${avgNight.toFixed(1)} mmol/L`);
      if (avgNight > 7.2) {
        lines.push(getRandomComment(["Noćni nivo je povišen. Razmislite o prilagođavanju večere, smanjenju unosa ugljenih hidrata i unosu manje količine tečnosti pre spavanja. Ako se obrazac nastavi, konsultujte lekara.",
                                     "Noćne vrednosti su iznad normalnog opsega. Posvetite pažnju manjem unosu hrane pred spavanje."]));
      }

      showAItypingAnalysis(lines);
    }
  };
}

/* =================== Pomoćne funkcije za analizu cele tabele po delovima dana =================== */

// Funkcija koja računa prosečnu vrednost za određenu zonu
function getAverage(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.glucose, 0);
  return total / entries.length;
}

// Funkcija koja računa trend glukoze
function getTrend(entries) {
  if (entries.length < 2) return "stable";  // Ako je manje od dva unosa, nema trenda

  let trend = "stable";  // Početna vrednost trend-a

  // Prolazimo kroz sve unose i upoređujemo svaka dva uzastopna unosa
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

  return trend;  // Na kraju vraćamo poslednji trend koji smo detektovali
}

// Funkcija koja računa prosečnu vrednost za određenu zonu
function getAverageForZone(entries, zone) {
  const zoneEntries = entries.filter(entry => entry.zone === zone);
  if (zoneEntries.length === 0) return 0;  // Ako nema unosa za tu zonu, vraćamo 0
  const total = zoneEntries.reduce((sum, entry) => sum + entry.glucose, 0);
  return total / zoneEntries.length;
}

/* =================== Pomoćna funkcija za nasumičan odabir komentara =================== */
function getRandomComment(comments) {
  const randomIndex = Math.floor(Math.random() * comments.length);  // Nasumičan indeks
  return comments[randomIndex];  // Vraća nasumični komentar
}

/* =================== Pomoćna funkcija za prikazivanje analize u modal prozoru =================== */
function showAItypingAnalysis(lines) {
  const aiBody = byId('aiBody');
  aiBody.innerHTML = '';  // Očistiti prethodne poruke
  const aiModal = byId('aiModal');
  aiModal.hidden = false; // Otvoriti modal

  // Tipkanje poruka u modalu red po red
  (async () => {
    for (const line of lines) {
      await typeLine(line, aiBody);  // Kuca red po red
    }
  })();

  // Zatvoriti modal ako je potrebno
  const closeModalBtn = byId('aiClose');
  closeModalBtn.addEventListener('click', () => {
    aiModal.hidden = true;
  });
}
