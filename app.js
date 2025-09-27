/* ============== Tabs (excel-style) ============== */
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

/* ============== DB & State ============== */
let db, chart;
let filteredZone = null, filteredStart = null, filteredEnd = null;

// open DB v2 (entries store + future stores)
(function initDB(){
  const req = indexedDB.open('glucoseDB', 2);
  req.onupgradeneeded = (e)=>{
    db = e.target.result;
    if(!db.objectStoreNames.contains('entries')){
      db.createObjectStore('entries', {keyPath:'id', autoIncrement:true});
    }
  };
  req.onsuccess = (e)=>{ db = e.target.result; initUI(); loadEntries(); };
})();

/* ============== UI init ============== */
function initUI(){
  // buttons
  document.getElementById('btnAdd').onclick = addEntry;
  document.getElementById('btnImport').onclick = importCSV;
  document.getElementById('btnExport').onclick = exportCSV;
  document.getElementById('btnClear').onclick = clearAll;

  document.getElementById('btnApplyRange').onclick = applyDateFilters;
  document.getElementById('btnResetRange').onclick = resetFilter;

  document.querySelectorAll('.chip-row .chip').forEach(b=>{
    b.addEventListener('click', ()=>{
      filteredZone = b.dataset.zone || null;
      loadEntries();
    });
  });

  document.getElementById('btnAI').onclick = aiAnalyze;
  document.getElementById('aiClose').onclick = ()=>document.getElementById('aiModal').hidden = true;

  // calendar nav
  document.getElementById('calPrev').onclick = ()=>{ shiftCalendar(-1); };
  document.getElementById('calNext').onclick = ()=>{ shiftCalendar(1); };

  // chart
  const ctx = document.getElementById('glucoseChart').getContext('2d');
  chart = new Chart(ctx, {
    type:'line',
    data:{ labels:[], datasets:[{label:'Glukoza (mmol/L)', data:[], fill:false, tension:.3}] },
    options:{ scales:{ y:{ beginAtZero:true, suggestedMax:20 } } }
  });
}

/* ============== Helpers za datum/vreme ============== */
function pad2(n){ return String(n).padStart(2,'0'); }
function normalizeDate(dateStr){
  if(!dateStr) return '';
  const s = dateStr.trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if(m) return `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(m) return `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;
  const dt = new Date(s); if(!isNaN(dt)) return `${dt.getFullYear()}-${pad2(dt.getMonth()+1)}-${pad2(dt.getDate())}`;
  return s;
}
function displayDate(d){
  const iso = normalizeDate(d);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return d;
  const [y,m,dd] = iso.split('-');
  return `${parseInt(dd,10)}.${parseInt(m,10)}.${y}`;
}
function normalizeTime(t){
  if(!t) return '';
  const s = t.trim().replace('.',':');
  const m = s.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/);
  if(!m) return s;
  return `${pad2(m[1])}:${pad2(m[2])}`;
}
function toTs(e){
  const d = normalizeDate(e.date);
  const t = normalizeTime(e.time||'00:00');
  return new Date(`${d}T${t}`).getTime();
}
function getZoneLabel(hour){
  const h = parseInt(hour,10);
  if(h>=6 && h<9) return 'jutro';
  if(h>=9 && h<12) return 'prepodne';
  if(h>=12 && h<17) return 'popodne';   // promena: “popodne”
  if(h>=17 && h<22) return 'vece';
  return 'noc';
}

/* ============== CRUD Entries ============== */
function addEntry(){
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const glucose = parseFloat(document.getElementById('glucose').value);
  const comment = document.getElementById('comment').value || '';

  const emojis = Array.from(document.querySelectorAll('.emoji-row input:checked')).map(x=>x.value).join(' ');
  if(!date || !time || isNaN(glucose)){ alert('Datum, vreme i glukoza su obavezni.'); return; }

  const entry = {
    date, time, glucose, comment, emojis,
    zone: getZoneLabel(time.split(':')[0])
  };
  const tx = db.transaction('entries','readwrite');
  tx.objectStore('entries').add(entry);
  tx.oncomplete = ()=>{ clearEmoji(); loadEntries(); };
}
function clearEmoji(){ document.querySelectorAll('.emoji-row input').forEach(i=> i.checked=false); }

function loadEntries(){
  const tbody = document.querySelector('#logTable tbody'); tbody.innerHTML='';
  const store = db.transaction('entries').objectStore('entries');
  const items = [];
  store.openCursor().onsuccess = (e)=>{
    const c = e.target.result;
    if(c){ items.push({id:c.key, ...c.value}); c.continue(); }
    else{
      items.sort((a,b)=> toTs(b)-toTs(a)); // tabela: noviji prvi
      const filtered = items.filter(filterPredicate);
      // tabela
      filtered.forEach(addRow);
      // chart (ASC levo->desno)
      const asc = [...filtered].sort((a,b)=> toTs(a)-toTs(b));
      chart.data.labels = asc.map(r=> `${displayDate(r.date)} ${normalizeTime(r.time)}`);
      chart.data.datasets[0].data = asc.map(r=> r.glucose);
      chart.update();
      // stat
      updateStats(filtered);
      // kalendar
      refreshCalendar(items);
    }
  };
}
function addRow(r){
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${displayDate(r.date)}</td><td>${normalizeTime(r.time)}</td><td>${r.glucose}</td><td>${(r.comment||'')}${r.emojis?' '+r.emojis:''}</td>`;
  document.querySelector('#logTable tbody').appendChild(tr);
}

/* ============== Filteri ============== */
function filterPredicate(e){
  if(filteredZone && e.zone!==filteredZone) return false;
  const d = normalizeDate(e.date);
  if(filteredStart && d<filteredStart) return false;
  if(filteredEnd && d>filteredEnd) return false;
  return true;
}
function applyDateFilters(){
  const s = document.getElementById('startDate').value;
  const ee = document.getElementById('endDate').value;
  filteredStart = s? normalizeDate(s): null;
  filteredEnd = ee? normalizeDate(ee): null;
  loadEntries();
}
function resetFilter(){
  filteredZone = null; filteredStart = null; filteredEnd = null;
  const s = document.getElementById('startDate'); const e = document.getElementById('endDate');
  if(s) s.value=''; if(e) e.value='';
  loadEntries();
}

/* ============== Statistike ============== */
function updateStats(list){
  if(!list.length){ document.getElementById('statAvg').textContent='—'; document.getElementById('statMin').textContent='—'; document.getElementById('statMax').textContent='—'; return; }
  const arr = list.map(x=>x.glucose).filter(x=>typeof x==='number' && !isNaN(x));
  const avg = (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1);
  const min = Math.min(...arr).toFixed(1);
  const max = Math.max(...arr).toFixed(1);
  document.getElementById('statAvg').textContent = avg;
  document.getElementById('statMin').textContent = min;
  document.getElementById('statMax').textContent = max;
}

/* ============== CSV Import/Export/Clear ============== */
function importCSV(){
  const f = document.getElementById('fileInput').files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = e=>{
    const text = e.target.result;
    const lines = text.split(/\r?\n/).filter(Boolean);
    const start = lines[0].toLowerCase().startsWith('date') ? 1 : 0;
    const tx = db.transaction('entries','readwrite'); const st = tx.objectStore('entries');
    for(let i=start;i<lines.length;i++){
      // date,time,glucose,comment...
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

/* ============== AI analiza (lokalna) ============== */
function aiAnalyze(){
  // koristi trenutno filtrirane unose
  const st = db.transaction('entries').objectStore('entries');
  const items = [];
  st.openCursor().onsuccess = e=>{
    const c=e.target.result;
    if(c){ items.push(c.value); c.continue(); }
    else{
      const filtered = items.filter(filterPredicate);
      const arr = filtered.map(x=>x.glucose).filter(x=>!isNaN(x));
      if(!arr.length){ showAI("Nema dovoljno podataka za analizu."); return; }
      const avg=(arr.reduce((a,b)=>a+b,0)/arr.length), min=Math.min(...arr), max=Math.max(...arr);
      let assessment = `Prosečna vrednost: ${avg.toFixed(1)} mmol/L\nNajniža: ${min.toFixed(1)}\nNajviša: ${max.toFixed(1)}\n`;
      // jednostavni “time-in-range” (4–10 mmol/L)
      const inRange = arr.filter(v=>v>=4 && v<=10).length/arr.length*100;
      assessment += `U opsegu (4–10): ${inRange.toFixed(0)}%\n`;
      if(avg>10 || max>13) assessment += `\nNapomena: vrednosti su povišene — razmotrite konsultaciju sa lekarom.\n`;
      if(avg<4 || min<3.5) assessment += `\nNapomena: vrednosti su snižene — razmotrite konsultaciju sa lekarom.\n`;
      assessment += `\nOvo nije medicinski savet.`;
      showAI(assessment);
    }
  };
}
function showAI(text){
  document.getElementById('aiBody').textContent = text;
  document.getElementById('aiModal').hidden = false;
}

/* ============== Jednostavan kalendar ============== */
let calYear, calMonth; // 0-11
function refreshCalendar(all){
  if(calYear==null){ const now=new Date(); calYear=now.getFullYear(); calMonth=now.getMonth(); }
  const cont=document.getElementById('calendar'); cont.innerHTML='';
  const first=new Date(calYear,calMonth,1);
  const days=new Date(calYear,calMonth+1,0).getDate();
  document.getElementById('calTitle').textContent = first.toLocaleString('sr-RS',{month:'long', year:'numeric'});
  // mapiraj datume sa unosima
  const set = new Set(all.map(x=> normalizeDate(x.date)));
  // prazan offset
  const startOffset = (first.getDay()+6)%7; // pon=0
  for(let i=0;i<startOffset;i++){ const d=document.createElement('div'); d.className='cell'; d.style.visibility='hidden'; cont.appendChild(d); }
  for(let d=1; d<=days; d++){
    const iso = `${first.getFullYear()}-${pad2(first.getMonth()+1)}-${pad2(d)}`;
    const el=document.createElement('div'); el.className='cell'+(set.has(iso)?' mark':''); el.textContent=d;
    cont.appendChild(el);
  }
}
function shiftCalendar(step){
  if(calYear==null){ const now=new Date(); calYear=now.getFullYear(); calMonth=now.getMonth(); }
  calMonth += step;
  if(calMonth<0){ calMonth=11; calYear--; }
  if(calMonth>11){ calMonth=0; calYear++; }
  // re-render sa poslednjim podacima
  const st = db.transaction('entries').objectStore('entries'); const items=[];
  st.openCursor().onsuccess = e=>{ const c=e.target.result; if(c){ items.push(c.value); c.continue(); } else refreshCalendar(items); };
}
