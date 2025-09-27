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
  const bar = document.querySelector('.tabs-bar');
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
let calYear = null, calMonth = null, lastItems = [];

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

  // Calendar arrows
  const prev = byId('calPrev'), next = byId('calNext');
  if (prev) prev.onclick = ()=> shiftCalendar(-1);
  if (next) next.onclick = ()=> shiftCalendar(1);
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
      // kalendar
      lastItems = items;
      refreshCalendar(items);
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

/* =================== Kalendar =================== */
function refreshCalendar(all){
  const cont = byId('calendar');
  const title = byId('calTitle');
  if (!cont || !title) return;

  if (calYear === null || calMonth === null){
    const now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
  }

  const first = new Date(calYear, calMonth, 1);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  title.textContent = first.toLocaleString('sr-RS', { month: 'long', year: 'numeric' });

  const hasDate = new Set((all || []).map(r => normalizeDate(r.date)));

  cont.innerHTML = '';
  const startOffset = (first.getDay() + 6) % 7; // Mon=0
  for (let i = 0; i < startOffset; i++){
    const empty = document.createElement('div');
    empty.className = 'cell';
    empty.style.visibility = 'hidden';
    cont.appendChild(empty);
  }
  for (let d = 1; d <= daysInMonth; d++){
    const iso = `${first.getFullYear()}-${pad2(first.getMonth()+1)}-${pad2(d)}`;
    const el = document.createElement('div');
    el.className = 'cell' + (hasDate.has(iso) ? ' mark' : '');
    el.textContent = d;
    cont.appendChild(el);
  }
}
function shiftCalendar(step){
  if (calYear === null || calMonth === null){
    const now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
  }
  calMonth += step;
  if (calMonth < 0){ calMonth = 11; calYear--; }
  if (calMonth > 11){ calMonth = 0; calYear++; }
  refreshCalendar(lastItems);
}

/* =================== AI Analiza — uz referentne opsege =================== */
/*
  Referentni opsezi (mmol/L) u nastavku su zasnovani na ADA/MedlinePlus smernicama
  za odrasle sa dijabetesom (preprandijal 4.4–7.2; 1–2h posle obroka <10.0; pred spavanje 5.0–8.3)
  i na tipičnim normalnim vrednostima za zdrave osobe (fasting 3.9–5.5; 2h posle <7.8).
  Ovo NIJE personalizovan savet; uvek proveriti sa lekarom.
*/
const REF = {
  diabetic: {
    pre: { low: 4.4, high: 7.2 },        // pre obroka
    post: { low: 0,   high: 10.0 },      // 1–2h posle obroka
    bedtime: { low: 5.0, high: 8.3 }     // pred spavanje / noć
  },
  healthy: {
    fasting: { low: 3.9, high: 5.5 },    // posle noći/ pre doručka
    post: { low: 0,   high: 7.8 }        // 2h posle obroka
  }
};

// heuristika: pre ili posle obroka
function inferMealContext(list){
  const txt = (list.map(x=>(x.comment||'').toLowerCase()).join(' ')+' ');
  const preHits = (txt.match(/\bpre\b|\bpre doru|pre ruč|pre vec|pre več/g)||[]).length;
  const postHits = (txt.match(/\bposle\b|sati posle|2 sata posle|sat posle/g)||[]).length;

  // default: jutro -> pre (fasting); noc -> bedtime; ostalo -> post
  if(filteredZone==='jutro') return 'pre';
  if(filteredZone==='noc') return 'bedtime';
  if(postHits>preHits) return 'post';
  if(preHits>postHits) return 'pre';
  return (filteredZone==='vece' ? 'bedtime' : 'post');
}

function aiAnalyze(){
  const st = db.transaction('entries').objectStore('entries');
  const items = [];
  st.openCursor().onsuccess = e=>{
    const c=e.target.result;
    if(c){ items.push(c.value); c.continue(); }
    else{
      const filtered = items.filter(filterPredicate);
      const arr = filtered.map(x=>x.glucose).filter(x=>!isNaN(x));
      if(!arr.length){ showAI("Nema dovoljno podataka za analizu za izabrani opseg/filtre."); return; }

      const avg=(arr.reduce((a,b)=>a+b,0)/arr.length), min=Math.min(...arr), max=Math.max(...arr);
      const inRange = arr.filter(v=>v>=4 && v<=10).length/arr.length*100;

      const zoneName = filteredZone ? (
        filteredZone==='jutro'?'jutru':
        filteredZone==='prepodne'?'pre podne':
        filteredZone==='popodne'?'popodne':
        filteredZone==='vece'?'uveče':'noću'
      ) : 'odabranom periodu';

      // meal context
      const ctx = inferMealContext(filtered); // 'pre' | 'post' | 'bedtime'
      const refDia = ctx==='bedtime' ? REF.diabetic.bedtime : (ctx==='pre' ? REF.diabetic.pre : REF.diabetic.post);
      const refHealthy = ctx==='pre'
        ? REF.healthy.fasting
        : REF.healthy.post;

      // Odstupanja
      const highCut = refDia.high;
      const lowCut = refDia.low || 0;
      const tooHigh = arr.some(v=> v>highCut + 1e-9);
      const tooLow = arr.some(v=> v<lowCut - 1e-9);

      let txt = `Vaše ${
        filteredZone ? `vrednosti ${zoneName}` : 'vrednosti'
      } (${filtered.length} merenja):\n` +
      `• Raspon: ${min.toFixed(1)} – ${max.toFixed(1)} mmol/L\n` +
      `• Prosek: ${avg.toFixed(1)} mmol/L\n` +
      `• U opsegu 4–10 mmol/L: ${inRange.toFixed(0)}%\n\n`;

      txt += `Referentno (osobe sa dijabetesom, ${ctx==='pre'?'pre obroka':ctx==='post'?'1–2h posle obroka':'pred spavanje'}): `;
      if(ctx==='post'){
        txt += `≤ ${refDia.high.toFixed(1)} mmol/L\n`;
      }else{
        txt += `${refDia.low.toFixed(1)} – ${refDia.high.toFixed(1)} mmol/L\n`;
      }

      txt += `Referentno (zdrave osobe, ${ctx==='pre'?'posle noći / pre doručka':'2h posle obroka'}): `;
      if(ctx==='post'){
        txt += `≤ ${refHealthy.high.toFixed(1)} mmol/L\n`;
      }else{
        txt += `${refHealthy.low.toFixed(1)} – ${refHealthy.high.toFixed(1)} mmol/L\n`;
      }

      if(tooHigh || tooLow){
        txt += `\nPreporuka: primećena su odstupanja ${tooHigh?'(povišene) ':''}${tooLow?'(snižene) ':''}vrednosti. `;
        txt += `Pitanje za lekara:\n`;
        if(tooHigh){
          txt += `• Šta može biti uzrok povišenih vrednosti u ${zoneName} i da li treba prilagoditi terapiju ili obroke?\n`;
        }
        if(tooLow){
          txt += `• Kako sprečiti rizik od hipoglikemije u ${zoneName} i da li je potrebna korekcija doze/užina?\n`;
        }
      }else{
        txt += `\nTrenutni podaci su u okviru referentnih granica za odabrani kontekst.`;
      }
      txt += `\n\nOvo nije medicinski savet.`;
      showAI(txt);
    }
  };
}
function showAI(text){ byId('aiBody').textContent = text; byId('aiModal').hidden = false; }
