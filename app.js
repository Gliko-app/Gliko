let db;
let chart;
let filteredZone = null;

window.onload = function () {
  initDB();
  initChart();
  document.getElementById("commentSelect").addEventListener("change", commentChanged);
};

function initDB() {
  const request = indexedDB.open("glucoseDB", 2);
  request.onupgradeneeded = function (e) {
  db = e.target.result;
  if (!db.objectStoreNames.contains("entries")) {
    db.createObjectStore("entries", { keyPath: "id", autoIncrement: true });
  }
  if (!db.objectStoreNames.contains("recipes")) {
    db.createObjectStore("recipes", { keyPath: "id", autoIncrement: true });
  }
  if (!db.objectStoreNames.contains("therapy")) {
    db.createObjectStore("therapy", { keyPath: "id", autoIncrement: true });
  }
    db = e.target.result;
    db.createObjectStore("entries", { keyPath: "id", autoIncrement: true });
  };
  request.onsuccess = function (e) {
    db = e.target.result;
    loadEntries();
  };
}

function commentChanged() {
  const sel = document.getElementById("commentSelect");
  const input = document.getElementById("comment");
  input.style.display = sel.value === "custom" ? "inline-block" : "none";
}

function getTimeZoneLabel(hour) {
  if (hour >= 6 && hour < 9) return "jutro";
  if (hour >= 9 && hour < 12) return "prepodne";
  if (hour >= 12 && hour < 17) return "podne";
  if (hour >= 17 && hour < 22) return "vece";
  return "noc";
}

function addEntry() {
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const glucose = parseFloat(document.getElementById("glucose").value);
  let comment = document.getElementById("commentSelect").value;
  if (comment === "custom") comment = document.getElementById("comment").value;

  const emojis = Array.from(document.querySelectorAll(".emoji-select input:checked"))
                      .map(c => c.value).join(" ");

  const entry = {
    date, time, glucose, comment, emojis,
    zone: getTimeZoneLabel(parseInt(time.split(":")[0]))
  };

  const tx = db.transaction("entries", "readwrite");
  const store = tx.objectStore("entries");
  store.add(entry);
  tx.oncomplete = () => loadEntries();
}

function loadEntries() {
  const tbody = document.querySelector("#logTable tbody");
  tbody.innerHTML = "";
  const store = db.transaction("entries").objectStore("entries");
  const entries = [];

  store.openCursor().onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      entries.push({ id: cursor.key, ...cursor.value });
      cursor.continue();
    } else {
      // Sort reverse chrono
      entries.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
      entries.forEach(addRow);
      updateChart(entries);
      updateCalendar(entries);
    }
  };
}

function addRow(entry) {
  if (filteredZone && entry.zone !== filteredZone) return;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${entry.date}</td>
    <td>${entry.time}</td>
    <td>${entry.glucose}</td>
    <td>${entry.comment} ${entry.emojis || ""}</td>
  `;
  document.querySelector("#logTable tbody").appendChild(tr);
}

function filterBy(zone) {
  filteredZone = zone;
  loadEntries();
}

function resetFilter() {
  filteredZone = null;
  loadEntries();
}

function clearAll() {
  const req = indexedDB.deleteDatabase("glucoseDB");
  req.onsuccess = () => location.reload();
}

function importCSV() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const lines = e.target.result.split("\n").slice(1);
    const tx = db.transaction("entries", "readwrite");
    const store = tx.objectStore("entries");

    lines.forEach(line => {
      const [date, time, glucose, comment] = line.split(",");
      if (date && time && glucose) {
        store.add({
          date, time, glucose: parseFloat(glucose),
          comment, emojis: "", zone: getTimeZoneLabel(parseInt(time.split(":")[0]))
        });
      }
    });
    tx.oncomplete = () => loadEntries();
  };
  reader.readAsText(file);
}

function exportCSV() {
  const store = db.transaction("entries").objectStore("entries");
  const entries = [];
  store.openCursor().onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      entries.push(cursor.value);
      cursor.continue();
    } else {
      let csv = "date,time,glucose,comment\n";
      entries.forEach(e => {
        csv += `${e.date},${e.time},${e.glucose},"${e.comment} ${e.emojis || ""}"\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "dnevnik_glukoze.csv";
      link.click();
    }
  };
}

function initChart() {
  const ctx = document.getElementById("glucoseChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Glukoza (mmol/L)",
        data: [],
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, max: 20 }
      }
    }
  });
}

function updateChart(entries) {
  const labels = entries.map(e => `${e.date} ${e.time}`);
  const data = entries.map(e => e.glucose);
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.update();
}

/* =================== Tabs (UI skeleton) =================== */
function showTab(key){
  const map = { trend: "tab-trend", food: "tab-food", therapy: "tab-therapy" };
  const id = map[key] || "tab-trend";
  ["tab-trend","tab-food","tab-therapy"].forEach(sec => {
    const el = document.getElementById(sec);
    if (!el) return;
    if (sec === id) { el.hidden = false; el.classList.add("active"); }
    else { el.hidden = true; el.classList.remove("active"); }
  });
  document.querySelectorAll(".tabbar .tablink").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === key);
  });
  try{ window.scrollTo({top:0, behavior:"smooth"}); }catch(e){}
}

(function(){
  const bar = document.getElementById("tabbar");
  if (bar){
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest(".tablink");
      if (!btn) return;
      showTab(btn.dataset.tab);
    });
  }
  showTab("trend");
})();


/* =================== Recipes (minimal) =================== */
function addRecipe(){
  const title = (document.getElementById('recTitle')||{}).value || '';
  const carbs = parseFloat((document.getElementById('recCarbs')||{}).value || '0');
  const tags  = ((document.getElementById('recTags')||{}).value || '').split(',').map(s=>s.trim()).filter(Boolean);
  if(!title) { alert('Naziv je obavezan'); return; }
  const tx = db.transaction('recipes','readwrite');
  tx.objectStore('recipes').add({ title, carbs_g: isNaN(carbs)?null:carbs, tags });
  tx.oncomplete = renderRecipes;
}
function renderRecipes(){
  const q = ((document.getElementById('recQuery')||{}).value || '').toLowerCase();
  const ul = document.getElementById('recipesList'); if(!ul) return;
  ul.innerHTML = '';
  const tx = db.transaction('recipes');
  const store = tx.objectStore('recipes');
  const all = [];
  store.openCursor().onsuccess = e => {
    const c = e.target.result;
    if(c){ all.push({id:c.key, ...c.value}); c.continue(); }
    else {
      const filtered = all.filter(r => {
        const inTitle = (r.title||'').toLowerCase().includes(q);
        const inTags = (r.tags||[]).some(t => (t||'').toLowerCase().includes(q));
        return !q || inTitle || inTags;
      }).sort((a,b)=> (a.title||'').localeCompare(b.title||''));
      filtered.forEach(r => {
        const li = document.createElement('li'); li.className='card';
        li.innerHTML = `<h4>${r.title}</h4>
          <div class="muted">Ugljeni hidrati: <b>${r.carbs_g ?? '—'}</b> g</div>
          <div class="row">${(r.tags||[]).map(t=>`<span class="tag">${t}</span>`).join(' ')}</div>
          <div class="actions">
            <button class="small" onclick="deleteRecipe(${r.id})">🗑️ Obriši</button>
          </div>`;
        ul.appendChild(li);
      });
    }
  };
}
function deleteRecipe(id){
  const tx = db.transaction('recipes','readwrite');
  tx.objectStore('recipes').delete(id);
  tx.oncomplete = renderRecipes;
}
function seedRecipes(){
  const samples = [
    {title:'Omlet sa povrćem', carbs_g:4, tags:['doručak','low-carb']},
    {title:'Pileća salata', carbs_g:8, tags:['ručak','low-GI']},
    {title:'Losos i brokoli', carbs_g:5, tags:['večera','omega-3']},
  ];
  const tx = db.transaction('recipes','readwrite');
  const st = tx.objectStore('recipes');
  samples.forEach(s => st.add(s));
  tx.oncomplete = renderRecipes;
}
function exportRecipes(){
  const tx = db.transaction('recipes');
  const st = tx.objectStore('recipes');
  const rows = [];
  st.openCursor().onsuccess = e => {
    const c = e.target.result;
    if(c){ const r=c.value; rows.push([r.title, r.carbs_g ?? '', (r.tags||[]).join('|')].join(',')); c.continue(); }
    else {
      const csv = "title,carbs_g,tags\n" + rows.join("\n");
      const blob = new Blob([csv], {type:'text/csv'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'recipes.csv';
      a.click();
    }
  };
}
function importRecipes(){
  const f = document.getElementById('recipesFile').files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = e => {
    const lines = e.target.result.split(/\r?\n/).filter(Boolean);
    const start = lines[0].toLowerCase().startsWith('title') ? 1 : 0;
    const tx = db.transaction('recipes','readwrite'); const st = tx.objectStore('recipes');
    for(let i=start;i<lines.length;i++){
      const [title, carbs, tags] = lines[i].split(',');
      if(title) st.add({ title: title.trim(), carbs_g: carbs? parseFloat(carbs): null, tags: (tags||'').split('|').map(s=>s.trim()).filter(Boolean) });
    }
    tx.oncomplete = renderRecipes;
  };
  r.readAsText(f);
}


/* =================== Therapy (minimal) =================== */
function addTherapy(){
  const name = (document.getElementById('thName')||{}).value || '';
  const dose = parseFloat((document.getElementById('thDose')||{}).value || '0');
  const unit = (document.getElementById('thUnit')||{}).value || '';
  const times = (document.getElementById('thTimes')||{}).value || '';
  if(!name) { alert('Naziv je obavezan'); return; }
  const tx = db.transaction('therapy','readwrite');
  tx.objectStore('therapy').add({ name, dose: isNaN(dose)?null:dose, unit, times, active:true });
  tx.oncomplete = renderTherapy;
}
function renderTherapy(){
  const ul = document.getElementById('therapyList'); if(!ul) return;
  ul.innerHTML = '';
  const tx = db.transaction('therapy');
  const st = tx.objectStore('therapy');
  const all = [];
  st.openCursor().onsuccess = e => {
    const c = e.target.result;
    if(c){ all.push({id:c.key, ...c.value}); c.continue(); }
    else {
      all.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
      all.forEach(t => {
        const li = document.createElement('li'); li.className='card';
        li.innerHTML = `<h4>${t.name}</h4>
          <div class="muted">Doza: <b>${t.dose ?? '—'} ${t.unit || ''}</b></div>
          <div class="muted">Vreme: ${t.times || '—'}</div>
          <div class="actions">
            <button class="small" onclick="toggleTherapy(${t.id}, ${!t.active})">${t.active?'⏸️ Isključi':'▶️ Uključi'}</button>
            <button class="small" onclick="deleteTherapy(${t.id})">🗑️ Obriši</button>
          </div>`;
        ul.appendChild(li);
      });
    }
  };
}
function toggleTherapy(id, active){
  const tx = db.transaction('therapy','readwrite');
  const st = tx.objectStore('therapy');
  const req = st.get(id);
  req.onsuccess = () => {
    const v = req.result; if(!v) return;
    v.active = active;
    st.put(v).onsuccess = renderTherapy;
  };
}
function deleteTherapy(id){
  const tx = db.transaction('therapy','readwrite');
  tx.objectStore('therapy').delete(id);
  tx.oncomplete = renderTherapy;
}
function seedTherapy(){
  const samples = [
    {name:'Metformin', dose:500, unit:'mg', times:'08:00,20:00', active:true},
    {name:'Vitaminski kompleks', dose:1, unit:'tbl', times:'09:00', active:true},
  ];
  const tx = db.transaction('therapy','readwrite');
  const st = tx.objectStore('therapy');
  samples.forEach(s => st.add(s));
  tx.oncomplete = renderTherapy;
}
function exportTherapy(){
  const tx = db.transaction('therapy');
  const st = tx.objectStore('therapy');
  const rows = [];
  st.openCursor().onsuccess = e => {
    const c = e.target.result;
    if(c){ const t=c.value; rows.push([t.name, t.dose ?? '', t.unit || '', t.times || '', t.active?1:0].join(',')); c.continue(); }
    else {
      const csv = "name,dose,unit,times,active\n" + rows.join("\n");
      const blob = new Blob([csv], {type:'text/csv'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'therapy.csv';
      a.click();
    }
  };
}
function importTherapy(){
  const f = document.getElementById('therapyFile').files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = e => {
    const lines = e.target.result.split(/\r?\n/).filter(Boolean);
    const start = lines[0].toLowerCase().startsWith('name') ? 1 : 0;
    const tx = db.transaction('therapy','readwrite'); const st = tx.objectStore('therapy');
    for(let i=start;i<lines.length;i++){
      const [name, dose, unit, times, active] = lines[i].split(',');
      if(name) st.add({ name: name.trim(), dose: dose? parseFloat(dose): null, unit: (unit||'').trim(), times: (times||'').trim(), active: active=='1' });
    }
    tx.oncomplete = renderTherapy;
  };
  r.readAsText(f);
}
