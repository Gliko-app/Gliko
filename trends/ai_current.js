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
    message = 'Vrednost šećera je preniska. Preporučujemo da se posavetujete sa svojim endokrinologom.';
  } else if (glucose <= reference.high) {
    message = 'Vaš šećer je u odgovarajućem opsegu. Bravo, odlično kontrolisete svoj dijabetes!';
  } else if (glucose <= 10.0) {
    message = 'Vaš šećer je povišen.Obratite pažnju na ishranu i fizičku aktivnost.';
  } else if (glucose <= 13.3) {
    message = 'Vrednost šečera je previsoka. Preporučujemo da se posavetujete sa svojim endokrinologom.';
  } else {
    message = 'Vrlo visoka vrednost glukoze. Hitno se obratite svom lekaru.';
}


  // Prikazivanje komentara u modalu odmah nakon unosa
  showAItypingCurrentValue([message]);
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
