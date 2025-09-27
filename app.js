/* =================== Excel-like Tabs & Header Tuning =================== */
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.tab-btn');
  if(!btn) return;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b===btn));
  const key = btn.dataset.tab;
  ['trend','food','therapy'].forEach(k=>{
    const el = document.getElementById('tab-'+k);
    if(!el) return;
    el.hidden = (k!==key);
    el.classList.toggle('active', k===key);
  });
  window.scrollTo({top:0, behavior:'smooth'});
});

/* Veći natpisi bez ikonice u tabbaru + sakrij page title ispod */
(function tuneTopBar(){
  const labels = {trend:'Trendovi', food:'Ishrana', therapy:'Terapija'};
  document.querySelectorAll('.tab-btn').forEach(b=>{
    const k = b.dataset.tab;
    if(labels[k]) b.textContent = labels[k];
    b.style.fontSize = '18px';
    b.style.fontWeight = '700';
  });
  document.querySelectorAll('.page-title').forEach(el=> el.style.display = 'none');
})();

/* =================== DB & State =================== */
let db, chart;
let filteredZone = null, filteredStart = null, filteredEnd = null;

/* Open DB */
(function initDB(){
  const req = indexedDB.open('glucoseDB', 2);
  req.onupgradeneeded = (e)=>{
    db = e.target.result;
    if(!db.objectStoreNames.contains('entries')){
      db.createObjectStore('entries', {keyPath:'id', autoIncrement:true});
    }
  };
  req.onsuccess = (e)=>{ db = e.target.result; initUI(); initChart(); loadEntries(); };
})();

/* =================== UI init =================== */
function byId(id){ return document.getElementById(id); }

function initUI(){
  // actions
  byId('btnAdd').onclick = addEntry;
  byId('btnImport').onclick = importCSV;
  byId('btnExport').onclick = exportCSV;
  byId('btnClear').onclick = clearAll;

  byId('btnApplyRange').onclick = applyDateFilters;
  byId('btnResetRange').onclick = resetFilter;

  document.querySelectorAll('.chip-row .chip').forEach(b=>{
    b.addEventListener('click', ()=>{
      filteredZone = b.dataset.zone || null;
      loadEntries();
    });
  });

  // AI modal
  byId('btnAI').onclick = aiAnalyze;
  const aiClose = byId('aiClose'); if (aiClose) aiClose.onclick = ()=> byId('aiModal').hidden = true;
}

/* =================== Helpers date/time =================== */
function pad2(n){ return String(n).padStart(2,'0'); }
function normalizeDate(dateStr){
  if(!dateStr) return '';
  const s = dateStr.trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if(m) return `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(m) return `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;
  const dt = new Date(s);
  if(!isNaN(dt.getTime())) return `${dt.getFullYear()}-${pad2(dt.getMonth()+1)}-${pad2(dt.getDate())}`;
  return s;
}
function normalizeTime(t){
  if(!t) return '';
  const s = t.trim().replace('.',':');
  const m = s.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/);
  return m ? `${pad2(m[1])}:${pad2(m[2])}` : s;
}
function displayDate(d){
  const iso = normalizeDate(d);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return d;
  const [y,m,dd] = iso.split('-');
  return `${parseInt(dd,10)}.${parseInt(m,10)}.${y}`;
}
function toTs(e){
  const d = normalizeDate(e.date);
  const t = normalizeTime(e.time||'00:00');
  return new Date(`${d}T${t}`).getTime();
}
function getZoneLabel(hourStr){
  const h = parseInt(hourStr,10);
  if(h>=6 && h<9) return 'jutro';
  if(h>=9 && h<12) return 'prepodne';
  if(h>=12 && h<17) return 'popodne';   // promena: “popodne”
  if(h>=17 && h<22) return 'vece';
  return 'noc';
}

/* =================== CRUD Entries =================== */
function addEntry(){
  const date = byId('date').value;
  const time = byId('time').value;
  const glucose = parseFloat(byId('glucose').value);
  const comment = (byId('comment').value || '').trim();
  const emojis = Array.from(document.querySelectorAll('.emoji-row input:checked')).map(x=>x.value).join(' ');

  if(!date || !time || isNaN(glucose)){ alert('Datum, vreme i glukoza su obavezni.'); return; }

  const entry = { date, time, glucose, comment, emojis, zone: getZoneLabel(time.split(':')[0]) };
  const tx = db.transaction('entries','readwrite');
  tx.objectStore('entries').add(entry);
  tx.oncomplete = ()=>{
    byId('glucose').value = ''; byId('comment').value = '';
    document.querySelectorAll('.emoji-row input').forEach(i=> i.checked=false);
    loadEntries();
  };
}

function loadEntries(){
  const tbody = document.querySelector('#logTable tbody'); tbody.innerHTML='';
  const st = db.transaction('entries').objectStore('entries');
  const items = [];
  st.openCursor().onsuccess = (e)=>{
    const c = e.target.result;
    if(c){ items.push({id:c.key, ...c.value}); c.continue(); }
    else{
      items.sort((a,b)=> toTs(b)-toTs(a));               // tabela: novije → starije
      const filtered = items.filter(filterPredicate);
      // tabela
      filtered.forEach(r=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${displayDate(r.date)}</td><td>${normalizeTime(r.time)}</td><td>${r.glucose}</td><td>${(r.comment||'')}${r.emojis?' '+r.emojis:''}</td>`;
        tbody.appendChild(tr);
      });
      // graf (ASC levo→desno)
      const asc = [...filtered].sort((a,b)=> toTs(a)-toTs(b));
      chart.data.labels = asc.map(r=> `${displayDate(r.date)} ${normalizeTime(r.time)}`);
      chart.data.datasets[0].data = asc.map(r=> r.glucose);
      chart.update();
      // statistike
      updateStats(filtered);
    }
  };
}

/* =================== Filteri =================== */
function filterPredicate(e){
  if(filteredZone && e.zone!==filteredZone) return false;
  const d = normalizeDate(e.date);
  if(filteredStart && d<filteredStart) return false;
  if(filteredEnd && d>filteredEnd) return false;
  return true;
}
function applyDateFilters(){
  const s = byId('startDate').value, e = byId('endDate').value;
  filteredStart = s? normalizeDate(s): null;
  filteredEnd = e? normalizeDate(e): null;
  loadEntries();
}
function resetFilter(){
  filteredZone = null; filteredStart = null; filteredEnd = null;
  const s = byId('startDate'); const e = byId('endDate');
  if(s) s.value=''; if(e) e.value='';
  loadEntries();
}

/* =================== Statistike =================== */
function updateStats(list){
  const elAvg = byId('statAvg'), elMin = byId('statMin'), elMax = byId('statMax');
  if(!list.length){ elAvg.textContent='—'; elMin.textContent='—'; elMax.textContent='—'; return; }
  const vals = list.map(x=>x.glucose).filter(x=> typeof x==='number' && !isNaN(x));
  const avg = (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
  const min = Math.min(...vals).toFixed(1);
  const max = Math.max(...vals).toFixed(1);
  elAvg.textContent = avg; elMin.textContent = min; elMax.textContent = max;
}

/* =================== CSV Import/Export/Clear =================== */
function importCSV(){
  const f = byId('fileInput').files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = e=>{
    const text = e.target.result;
    const lines = text.split(/\r?\n/).filter(Boolean);
    const start = lines[0].toLowerCase().startsWith('date') ? 1 : 0;
    const tx = db.transaction('entries','readwrite'); const st = tx.objectStore('entries');
    for(let i=start;i<lines.length;i++){
      // "date,time,glucose,comment"
      let parts = lines[i].match(/^(.*?),(.*?),(.*?),(.*)$/);
      if(!parts) parts = lines[i].split(',');
      else parts = [parts[1],parts[2],parts[3],parts[4]];
      const date=(parts[0]||'').trim(), time=(parts[1]||'').trim(), glucose=parseFloat((parts[2]||'').trim());
      let comment=(parts.slice(3).join(',')||'').trim(); comment = comment.replace(/^"|"$/g,'');
      if(date && time && !isNaN(glucose)){
        st.add({ date, time, glucose, comment, emojis:'', zone:getZoneLabel(time.split(':')[0]) });
      }
    }
    tx.oncomplete = loadEntries;
  };
  r.readAsText(f);
}
function exportCSV(){
  const st = db.transaction('entries').objectStore('entries');
  const rows = [];
  st.openCursor().onsuccess = e=>{
    const c = e.target.result;
    if(c){ const r=c.value; const comm=((r.comment||'')+(r.emojis?(' '+r.emojis):'')); rows.push(`${r.date},${r.time},${r.glucose},"${comm.replace(/"/g,'""')}"`); c.continue(); }
    else{
      const csv = "date,time,glucose,comment\n"+rows.join('\n');
      const blob = new Blob([csv],{type:'text/csv'}); const a=document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'dnevnik_glukoze.csv'; a.click();
    }
  };
}
function clearAll(){
  const req = indexedDB.deleteDatabase('glucoseDB');
  req.onsuccess = ()=> location.reload();
}

/* =================== Chart =================== */
function initChart(){
  const ctx = byId('glucoseChart').getContext('2d');
  chart = new Chart(ctx, {
    type:'line',
    data:{ labels:[], datasets:[{ label:'Glukoza (mmol/L)', data:[], fill:false, tension:.3 }] },
    options:{ scales:{ y:{ beginAtZero:true, suggestedMax:20 } } }
  });
}

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

/* Funkcija za analizu trendova u poslednjih 7 dana */
function analyzeTrendLast7Days(filtered, zone) {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const filteredLast7 = filtered.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= sevenDaysAgo && entryDate <= today;
  });

  // Ako nema podataka za poslednjih 7 dana, vraćamo praznu poruku
  if (filteredLast7.length === 0) {
    return ["Nema dovoljno podataka za analizu trenda u poslednjih 7 dana."];
  }

  // Analiziramo vrednosti u poslednjih 7 dana
  const values = filteredLast7.map(entry => entry.glucose);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);

  // Praćenje promene između svake vrednosti (opadanje ili rast)
  let trend = "stabilno";
  let lastChange = 0; // 0: stabilno, 1: rast, -1: pad

  // Hronološki analiza promena
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) {
      lastChange = 1; // rast
    } else if (values[i] < values[i - 1]) {
      lastChange = -1; // pad
    }
  }

  if (lastChange === 1) {
    trend = "rast";
  } else if (lastChange === -1) {
    trend = "pad";
  }

  // Kreiramo odgovor na osnovu trenda
  const lines = [
    `${ICON.pin} U poslednjih 7 dana, vrednosti za zonu ${zone} su se kretale od ${min.toFixed(1)} do ${max.toFixed(1)} mmol/L.`
  ];

  // Dajemo savet na osnovu trenda
  if (trend === "rast") {
    lines.push(`${ICON.warn} Vrednosti rastu. Preporučujemo da pratite ishranu, fizičku aktivnost i izbegavate unos previše ugljenih hidrata kasno uveče.`);
  } else if (trend === "pad") {
    lines.push(`${ICON.ok} Vrednosti opadaju. To je odličan znak! Nastavite sa dosadašnjim režimom ishrane i fizičke aktivnosti.`);
  } else {
    lines.push(`${ICON.ok} Vrednosti su stabilne. Održavajte trenutnu rutinu.`);
  }

  return lines;
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
        const trendLines = analyzeTrendLast7Days(filtered, filteredZone);  // Analiziraj trend u poslednjih 7 dana za zonu
        lines.push(...trendLines);
      } else { // Celodnevna analiza — segmentacija
        const seg = segmentByDayPart(filtered);

        const blocks = [
          {key: 'morning', label: `${ICON.jutro} Jutarnji (06–09)`, ctx: 'pre', refDia: REF.diabetic.pre, refHealthy: REF.healthy.fasting},
          {key: 'postLunch', label: `${ICON.dan} Posle ručka (15–17)`, ctx: 'post', refDia: REF.diabetic.post, refHealthy: REF.healthy.post},
          {key: 'evening', label: `${ICON.vece} Večernji (17–22)`, ctx: 'post', refDia: REF.diabetic.post, refHealthy: REF.healthy.post}
        ];

        lines.push(`${ICON.pin} Analiza po delovima dana:`);

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
