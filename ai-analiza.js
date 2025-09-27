/* =================== AI Analiza — referentni opsezi =================== */
// Referentni opsezi za dijabetes i zdrave osobe
const REF = {
  diabetic: {
    pre: { low: 4.4, high: 7.2 },        // pre obroka
    post: { low: 3.9,   high: 10.0 },      // 1–2h posle obroka
    bedtime: { low: 5.0, high: 8.3 }     // pred spavanje
  },
  healthy: {
    fasting: { low: 3.9, high: 5.5 },    // posle noći / pre doručka
    post: { low: 3.9,   high: 7.8 }        // 2h posle obroka
  }
};

// Dodatne ikone i etikete za AI
const ICON = {
  jutro: "🌅",
  dan: "☀️",
  vece: "🌇",
  pin: "📌",
  warn: "⚠️",
  ok: "✅",
  doctor: "👉"
};

// Funkcija za određivanje pozdrava na osnovu vremena
function greeting(){
  const h = new Date().getHours();
  if(h >= 6 && h < 12) return "Dobro jutro";
  if(h >= 12 && h < 18) return "Dobar dan";
  if(h >= 18 || h < 6) return "Dobro veče";
  return "Zdravo";
}

// Funkcija za analizu obroka (pre, posle, pred spavanje)
function inferMealContext(list, forcedZone){
  const txt = (list.map(x=>(x.comment||'').toLowerCase()).join(' ')+' ');
  const preHits = (txt.match(/\bpre\b|\bpre doru|pre ruč|pre vec|pre več/g)||[]).length;
  const postHits = (txt.match(/\bposle\b|sati posle|2 sata posle|sat posle/g)||[]).length;
  if(forcedZone === 'jutro') return 'pre';
  if(forcedZone === 'noc' || forcedZone === 'vece') return 'bedtime';
  if(postHits > preHits) return 'post';
  if(preHits > postHits) return 'pre';
  return (forcedZone === 'vece' ? 'bedtime' : 'post');
}

// Podela dana na segmente: jutro, popodne, veče
function segmentByDayPart(list){
  const parts = {
    morning: list.filter(x => { const h = +x.time.split(':')[0]; return h >= 6 && h < 9; }),
    postLunch: list.filter(x => { const h = +x.time.split(':')[0]; return h >= 15 && h < 17; }),
    evening: list.filter(x => { const h = +x.time.split(':')[0]; return h >= 17 && h < 22; })
  };
  return parts;
}

// Funkcija koja izračunava osnovne statistike i trend
function statsAndTrend(arr){
  if (!arr.length) return null;
  const values = arr.map(x => x.glucose).filter(v => !isNaN(v));
  if (!values.length) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values), max = Math.max(...values);

  // Linearni trend: y ~ a + b * i
  const xs = values.map((_, i) => i + 1);
  const xmean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const ymean = avg;
  let num = 0, den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - xmean) * (values[i] - ymean);
    den += (xs[i] - xmean) ** 2;
  }
  const slope = den ? num / den : 0; // Promena po merenju
  return { avg, min, max, slope, n: values.length };
}

// Lepa etiketa za zonu (jutro, popodne, večer)
function zoneToText(z){
  return z === 'jutro' ? 'jutru' :
         z === 'prepodne' ? 'pre podne' :
         z === 'popodne' ? 'popodne' :
         z === 'vece' ? 'uveče' : 'noću';
}

// Funkcija koja pravi animirani tekst za AI analizu
function injectAIStyles(){
  if (document.getElementById('ai-typing-style')) return;
  const css = `
    #aiBody{white-space:pre-wrap; font-size:15px; line-height:1.4}
    .ai-caret{display:inline-block; animation:blink 1s step-end infinite}
    @keyframes blink{50%{opacity:0}}
  `;
  const st = document.createElement('style'); st.id='ai-typing-style'; st.textContent = css;
  document.head.appendChild(st);
}

// Funkcija za simulaciju kucanja u AI modalu
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

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

/* Glavni AI ulaz */
function aiAnalyze(){
  const st = db.transaction('entries').objectStore('entries');
  const items = [];
  st.openCursor().onsuccess = e => {
    const c = e.target.result;
    if (c) { items.push(c.value); c.continue(); }
    else {
      const filtered = items.filter(filterPredicate);
      if (!filtered.length) {
        showAItyping(["Zdravo! Nema dovoljno podataka za analizu za izabrani opseg/filtre."]);
        return;
      }

      const hello = greeting() + " 👋";
      const lines = [hello];

      if (filteredZone) { // Analiza aktivne zone
        const ctx = inferMealContext(filtered, filteredZone); // 'pre'|'post'|'bedtime'
        const refDia = ctx === 'bedtime' ? REF.diabetic.bedtime : (ctx === 'pre' ? REF.diabetic.pre : REF.diabetic.post);
        const refHealthy = ctx === 'pre' ? REF.healthy.fasting : REF.healthy.post;

        const s = statsAndTrend(filtered);
        if (!s) {
          showAItyping(["Nema dovoljno numeričkih merenja za izabrani filter."]);
          return;
        }

        const tooHigh = s.avg > refDia.high + 1e-9;
        const tooLow = refDia.low ? s.avg < refDia.low - 1e-9 : false;

        lines.push(`${ICON.pin} Vaše vrednosti ${zoneToText(filteredZone)} (${s.n} merenja): raspon ${s.min.toFixed(1)}–${s.max.toFixed(1)} mmol/L, prosečno ${s.avg.toFixed(1)} mmol/L.`);
        lines.push(`   Referentno (dijabetes, ${ctx === 'pre' ? 'pre obroka' : ctx === 'post' ? '1–2h posle obroka' : 'pred spavanje'}): ${ctx === 'post' ? `≤ ${refDia.high.toFixed(1)}` : `${refDia.low.toFixed(1)}–${refDia.high.toFixed(1)}`} mmol/L.`);
        lines.push(`   Referentno (zdravi, ${ctx === 'pre' ? 'posle noći / pre doručka' : '2h posle obroka'}): ${ctx === 'post' ? `≤ ${refHealthy.high.toFixed(1)}` : `${refHealthy.low.toFixed(1)}–${refHealthy.high.toFixed(1)}`} mmol/L.`);

        // Trend
        if (s.slope > 0.1) lines.push(`${ICON.warn} Uočen je trend rasta u poslednjim merenjima.`);
        if (s.slope < -0.1) lines.push(`${ICON.ok} Vrednosti opadaju — odličan napredak!`);

        if (tooHigh || tooLow) {
          if (filteredZone === 'jutro' && (tooHigh || s.max > refDia.high)) {
            lines.push(`   ℹ️ Mogući “dawn phenomenon”: jutarnji hormoni (kortizol, hormon rasta) mogu podizati šećer. Obratite pažnju na kasne obroke bogate UH, san, hidrataciju i kratku šetnju posle večere.`);
          }
          lines.push(`${ICON.doctor} Razmotrite razgovor sa lekarom (i nutricionistom za prilagođavanje obroka).`);
        } else {
          lines.push(`${ICON.ok} U okviru ste ciljeva za ovaj period/kontekst.`);
        }

      } else { // Celodnevna analiza — segmentacija
        const seg = segmentByDayPart(filtered);

        const blocks = [
          {key:'morning', label:`${ICON.jutro} Jutarnji (06–09)`, ctx:'pre', refDia:REF.diabetic.pre, refHealthy:REF.healthy.fasting},
          {key:'postLunch', label:`${ICON.dan} Posle ručka (15–17)`, ctx:'post', refDia:REF.diabetic.post, refHealthy:REF.healthy.post},
          {key:'evening', label:`${ICON.vece} Večernji (17–22)`, ctx:'post', refDia:REF.diabetic.post, refHealthy:REF.healthy.post}
        ];

        lines.push(`${ICON.pin} Analiza po delovima dana (bez uključenih filtera):`);

        for (const b of blocks) {
          const arr = seg[b.key];
          const s = statsAndTrend(arr || []);
          if (!s) { lines.push(`• ${b.label}: nema merenja.`); continue; }
          const tooHigh = s.avg > b.refDia.high + 1e-9;
          const tooLow = b.refDia.low ? s.avg < b.refDia.low - 1e-9 : false;

          lines.push(`• ${b.label}: raspon ${s.min.toFixed(1)}–${s.max.toFixed(1)} mmol/L, prosek ${s.avg.toFixed(1)}.`);

          if (s.slope > 0.1) lines.push(`   ${ICON.warn} Trend rasta u ovom periodu.`);
          if (s.slope < -0.1 && s.avg >= b.refHealthy.low && s.avg <= b.refHealthy.high) lines.push(`   ${ICON.ok} Vrednosti opadaju i u zdravom su opsegu — bravo!`);

          if (b.key === 'morning' && (tooHigh || s.max > b.refDia.high)) {
            lines.push(`   ℹ️ Mogući “dawn phenomenon”: jutarnji hormoni (kortizol, hormon rasta) mogu podizati šećer. Obratite pažnju na kasne obroke bogate UH, san, hidrataciju i kratku šetnju uveče.`);
          }
          if (tooHigh || tooLow) {
            lines.push(`   ${ICON.doctor} Ako se ovakav obrazac nastavi, konsultujte lekara; pokažite mu grafik i vrednosti iz aplikacije.`);
          }
        }
      }

      lines.push(`\nNapomena: Ovo nije medicinski savet.`);

      showAItyping(lines);
    }
  };
}

function showAItyping(lines){
  byId('aiModal').hidden = false;
  typeWrite(lines);
}
