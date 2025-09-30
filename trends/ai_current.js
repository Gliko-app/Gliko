/* =================== AI Analiza — trenutna vrednost (modal odmah nakon unosa) =================== */
function aiAnalyze(glucose) {
  console.log("Unos glukoze:", glucose);  // Logovanje unosa glukoze
  
  // Provera da li je vrednost glukoze validna
  if (isNaN(glucose) || glucose <= 0) {
    showAItypingCurrentValue(["Molimo vas unesite validnu vrednost glukoze."]);
    return;
  }

  const date = byId('date').value.trim();
  const time = byId('time').value.trim();

  // Provera datuma
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {  // Proverava format: YYYY-MM-DD
    showAItypingCurrentValue(["Molimo vas unesite validan datum (format: YYYY-MM-DD)."]);
    return;
  }

  // Provera vremena
  if (!time || !/^\d{2}:\d{2}$/.test(time)) {  // Proverava format: HH:MM
    showAItypingCurrentValue(["Molimo vas unesite validno vreme (format: HH:MM)."]);
    return;
  }

  const referenceValues = {
    diabetic: {
      pre: { low: 4.4, high: 7.2 },
      post: { low: 3.9, high: 10.0 },
      bedtime: { low: 5.0, high: 8.3 }
    },
    healthy: {
      fasting: { low: 3.9, high: 5.5 },
      post: { low: 3.9, high: 7.8 }
    }
  };

  // Poređenje sa referentnim vrednostima
  let message = '';
  let reference = referenceValues.diabetic.pre; // Postavljamo vrednosti za "pre obrok" kao default

  // Ako je vreme obroka "post" ili "bedtime", ažuriramo referentne vrednosti
  if (filteredZone === 'post') {
    reference = referenceValues.diabetic.post;
  } else if (filteredZone === 'bedtime') {
    reference = referenceValues.diabetic.bedtime;
  }

  // Upoređivanje vrednosti glukoze sa referentnim vrednostima
  if (glucose < reference.low) {
    // Raznovrsni komentari za prenisku vrednost
    const lowComments = [
      'Vrednost šećera je preniska. Preporučujemo da se posavetujete sa svojim endokrinologom.',
      'Šećer je prenizak. Potrebno je prilagoditi unos hrane i pratiti stanje.',
      'Preporučujemo da povećate unos hrane, posebno ugljenih hidrata, i pratite nivo glukoze.',
      'Vrednost šećera je ispod normalnog opsega. Preporučujemo povećanje unosa hrane.'
    ];
    message = getRandomComment(lowComments);
  } else if (glucose <= reference.high) {
    // Raznovrsni komentari za odgovarajući opseg
    const normalComments = [
      'Vaš šećer je u odgovarajućem opsegu. Bravo, odlično kontrolisete svoj dijabetes!',
      'Vaš nivo glukoze je idealan. Održavajte dobar režim ishrane i fizičke aktivnosti.',
      'Kontrola glukoze je odlična. Nastavite sa trenutnim režimom!',
      'Vaš šećer je u normali. Održavajte dosadašnji režim ishrane i aktivnosti.'
    ];
    message = getRandomComment(normalComments);
  } else if (glucose <= 10.0) {
    // Raznovrsni komentari za povišeni šećer
    const highComments = [
      'Vaš šećer je povišen. Obratite pažnju na ishranu i fizičku aktivnost.',
      'Povišen šećer! Smanjite unos ugljenih hidrata i povećajte fizičku aktivnost.',
      'Vaša glukoza je iznad preporučenog opsega. Razmislite o promenama u ishrani i aktivnostima.',
      'Nivo šećera je malo viši. Razmislite o zdravijem režimu ishrane i redovnoj fizičkoj aktivnosti.'
    ];
    message = getRandomComment(highComments);
  } else if (glucose <= 13.3) {
    // Raznovrsni komentari za visoke vrednosti
    const veryHighComments = [
      'Vrednost šečera je previsoka. Preporučujemo da se posavetujete sa svojim endokrinologom.',
      'Vrlo visoka vrednost glukoze! Hitno se obratite svom lekaru radi saveta.',
      'Vaš nivo glukoze je veoma povišen. Posavetujte se sa lekarom za dalje korake.',
      'Vaš šećer je značajno povišen. Potrebno je da se obratite lekaru za savete.'
    ];
    message = getRandomComment(veryHighComments);
  } else {
    // Raznovrsni komentari za vrlo visoke vrednosti
    const criticalHighComments = [
      'Vrlo visoka vrednost glukoze. Hitno se obratite svom lekaru.',
      'Opasno visoka vrednost šećera! Preporučujemo hitan kontakt sa lekarom.',
      'Nivo glukoze je alarmantno visok. Potrebno je hitno delovanje, konsultujte lekara odmah.',
      'Vrlo visoke vrednosti glukoze. Obratite se lekaru što pre.'
    ];
    message = getRandomComment(criticalHighComments);
  }

  // Prikazivanje komentara u modalu odmah nakon unosa
  showAItypingCurrentValue([message]);
}

/* =================== Pomoćna funkcija za nasumičan odabir komentara =================== */
function getRandomComment(comments) {
  const randomIndex = Math.floor(Math.random() * comments.length);  // Nasumičan indeks
  return comments[randomIndex];  // Vraća nasumični komentar
}


/* =================== Pomoćna funkcija za trenutnu vrednost (modal odmah nakon unosa) =================== */
function showAItypingCurrentValue(lines) {
  const aiBody = byId('aiBody');
  aiBody.innerHTML = '';  // Očistiti prethodne poruke
  const aiModal = byId('aiModal');
  aiModal.hidden = false; // Otvoriti modal

  // Tipkanje poruka u modalu
  lines.forEach(async (line) => {
    await typeLine(line, aiBody);
  });

  // Dodajemo funkcionalnost za zatvaranje modala klikom na dugme "X"
  const closeModalBtn = byId('aiClose');
  closeModalBtn.addEventListener('click', () => {
    aiModal.hidden = true;  // Sakrijemo modal
  });
}

/* =================== Helper functions for typing effect =================== */
async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function typeLine(text, container){
  const line = document.createElement('div');
  container.appendChild(line);
  const caret = document.createElement('span'); caret.className='ai-caret'; caret.textContent='…';
  for(let i=0;i<text.length;i++){
    line.textContent = text.slice(0, i+1);
    line.appendChild(caret);
    await sleep(12 + Math.random()*18); // brzina kucanja
  }
  await sleep(350);
  caret.remove();
}

async function typeWrite(lines){
  const box = byId('aiBody');
  box.innerHTML = '';
  for(const ln of lines){
    await typeLine(ln, box);
  }
}
