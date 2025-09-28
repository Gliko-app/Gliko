/* =================== Excel-like Tabs & Header Tuning =================== */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
  const key = btn.dataset.tab;
  ['trend', 'food', 'therapy'].forEach(k => {
    const el = document.getElementById('tab-' + k);
    if (!el) return;
    el.hidden = (k !== key);
    el.classList.toggle('active', k === key);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* =================== DB & State =================== */
let db, chart;
let filteredZone = null, filteredStart = null, filteredEnd = null;

/* Open DB */
(function initDB() {
  const req = indexedDB.open('glucoseDB', 2);
  req.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains('entries')) {
      db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
    }
  };
  req.onsuccess = (e) => { db = e.target.result; initUI(); initChart(); loadEntries(); };
})();

/* =================== UI init =================== */
function byId(id) { return document.getElementById(id); }

function initUI() {
  // actions
  byId('btnAdd').onclick = addEntry;
  byId('btnImport').onclick = importCSV;
  byId('btnExport').onclick = exportCSV;
  byId('btnClear').onclick = clearAll;

  byId('btnApplyRange').onclick = applyDateFilters;
  byId('btnResetRange').onclick = resetFilter;

  document.querySelectorAll('.chip-row .chip').forEach(b => {
    b.addEventListener('click', () => {
      filteredZone = b.dataset.zone || null;
      loadEntries();
    });
  });

  // AI modal
  byId('btnAI').onclick = aiAnalyze;  // Povezivanje sa AI analizom
  const aiClose = byId('aiClose'); if (aiClose) aiClose.onclick = () => byId('aiModal').hidden = true;
}

/* =================== Helpers date/time =================== */
function pad2(n) { return String(n).padStart(2, '0'); }
function normalizeDate(dateStr) {
  if (!dateStr) return '';
  const s = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
  return s;
}
function normalizeTime(t) {
  if (!t) return '';
  const s = t.trim().replace('.', ':');
  const m = s.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/);
  return m ? `${pad2(m[1])}:${pad2(m[2])}` : s;
}
function displayDate(d) {
  const iso = normalizeDate(d);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return d;
  const [y, m, dd] = iso.split('-');
  return `${parseInt(dd, 10)}.${parseInt(m, 10)}.${y}`;
}
function toTs(e) {
  const d = normalizeDate(e.date);
  const t = normalizeTime(e.time || '00:00');
  return new Date(`${d}T${t}`).getTime();
}
function getZoneLabel(hourStr) {
  const h = parseInt(hourStr, 10);
  if (h >= 6 && h < 9) return 'jutro';
  if (h >= 9 && h < 12) return 'prepodne';
  if (h >= 12 && h < 17) return 'popodne';   // promena: “popodne”
  if (h >= 17 && h < 22) return 'vece';
  return 'noc';
}

/* =================== CRUD Entries =================== */
function addEntry() {
  const date = byId('date').value;
  const time = byId('time').value;
  const glucose = parseFloat(byId('glucose').value);
  const comment = (byId('comment').value || '').trim();
  const emojis = Array.from(document.querySelectorAll('.emoji-row input:checked')).map(x => x.value).join(' ');

  if (!date || !time || isNaN(glucose)) { alert('Datum, vreme i glukoza su obavezni.'); return; }

  const entry = { date, time, glucose, comment, emojis, zone: getZoneLabel(time.split(':')[0]) };
  const tx = db.transaction('entries', 'readwrite');
  tx.objectStore('entries').add(entry);
  tx.oncomplete = () => {
    byId('glucose').value = ''; byId('comment').value = '';
    document.querySelectorAll('.emoji-row input').forEach(i => i.checked = false);
    loadEntries();

    // Pokrećemo analizu odmah nakon unosa
    aiAnalyze();  // Pozivanje analize i prikazivanje modala
  };
}

function loadEntries() {
  const tbody = document.querySelector('#logTable tbody'); tbody.innerHTML = '';
  const st = db.transaction('entries').objectStore('entries');
  const items = [];
  st.openCursor().onsuccess = (e) => {
    const c = e.target.result;
    if (c) { items.push({ id: c.key, ...c.value }); c.continue(); }
    else {
      items.sort((a, b) => toTs(b) - toTs(a));               // tabela: novije → starije
      const filtered = items.filter(filterPredicate);
      // tabela
      filtered.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${displayDate(r.date)}</td><td>${normalizeTime(r.time)}</td><td>${r.glucose}</td><td>${(r.comment || '')}${r.emojis ? ' ' + r.emojis : ''}</td>`;
        tbody.appendChild(tr);
      });
      // graf (ASC levo→desno)
      const asc = [...filtered].sort((a, b) => toTs(a) - toTs(b));
      chart.data.labels = asc.map(r => `${displayDate(r.date)} ${normalizeTime(r.time)}`);
      chart.data.datasets[0].data = asc.map(r => r.glucose);
      chart.update();
      // statistike
      updateStats(filtered);
    }
  };
}

/* =================== AI Analiza =================== */

// Ovde zamenjujemo analizu na proseku sa analizom trenda

function statsAndTrend(arr){
  if (!arr.length) return null;
  const values = arr.map(x => x.glucose).filter(v => !isNaN(v));
  if (!values.length) return null;

  // Linearni trend: y ~ a + b * i (praćenje hronološkog reda podataka)
  const xs = values.map((_, i) => i + 1); // Koristimo hronološki redosled
  const xmean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const ymean = values.reduce((a, b) => a + b, 0) / values.length;

  let num = 0, den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - xmean) * (values[i] - ymean);
    den += (xs[i] - xmean) ** 2;
  }
  const slope = den ? num / den : 0; // Promena po merenju, ovo je linijski trend (nagib)

  // Izračunavanje minimuma, maksimuma i proseka
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return { avg, min, max, slope, n: values.length };
}

function aiAnalyze() {
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

      const s = statsAndTrend(filtered);
      if (!s) {
        showAItyping(["Nema dovoljno numeričkih merenja za izabrani filter."]);
        return;
      }

      const tooHigh = s.avg > 7.2 + 1e-9; // Dijabetes - visoki šećer
      const tooLow = s.avg < 4.4 - 1e-9;  // Dijabetes - niski šećer

      lines.push(`${ICON.pin} Vaše vrednosti: raspon ${s.min.toFixed(1)}–${s.max.toFixed(1)} mmol/L, prosečno ${s.avg.toFixed(1)} mmol/L.`);
      lines.push(`Trend: ${s.slope > 0.1 ? 'Rast' : s.slope < -0.1 ? 'Opadanje' : 'Stabilno'}`);

      if (tooHigh || tooLow) {
        lines.push(`${ICON.doctor} Razmotrite razgovor sa lekarom (i nutricionistom za prilagođavanje obroka).`);
      } else {
        lines.push(`${ICON.ok} Vaše vrednosti su u okviru ciljeva za ovaj period.`);
      }

      showAItyping(lines);
    }
  };
}

function showAItyping(lines){
  byId('aiModal').hidden = false;
  typeWrite(lines);
}

function typeWrite(lines){
  const box = byId('aiBody');
  box.innerHTML = '';
  lines.forEach(line => {
    const div = document.createElement('div');
    div.textContent = line;
    box.appendChild(div);
  });
}
