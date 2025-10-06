let db;

document.addEventListener("DOMContentLoaded", () => {
  // Inicijalizacija IndexedDB baze
  const request = indexedDB.open("therapyDB", 1);

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains("therapies")) {
      const objectStore = db.createObjectStore("therapies", { keyPath: "id", autoIncrement: true });
      objectStore.createIndex("drugName", "drugName", { unique: false });
      objectStore.createIndex("dosage", "dosage", { unique: false });
      objectStore.createIndex("occasion", "occasion", { unique: false });
      objectStore.createIndex("time", "time", { unique: false });
    }
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    console.log("Baza terapija je otvorena!");
    loadTherapies();  // Učitavanje terapija odmah
  };

  // Dodavanje novog unosa terapije
  document.getElementById("btnAddTherapy").addEventListener("click", () => {
    const drugName = document.getElementById("drugName").value.trim();
    const dosage = document.getElementById("dosage").value.trim();
    const occasion = document.getElementById("occasion").value;
    const time = {
      dorucak: document.getElementById("timeBreakfast").value,
      rucak: document.getElementById("timeLunch").value,
      vecera: document.getElementById("timeDinner").value,
      spavanje: document.getElementById("timeSleep").value
    };

    // Obavezna polja
    if (!drugName || !dosage || (!time.dorucak && !time.rucak && !time.vecera && !time.spavanje)) {
      alert("Sva polja su obavezna!");
      return;
    }

    const therapy = { drugName, dosage, occasion, time };

    const transaction = db.transaction("therapies", "readwrite");
    const objectStore = transaction.objectStore("therapies");
    objectStore.add(therapy);

    transaction.oncomplete = () => {
      console.log("Terapija dodata");
      loadTherapies();  // Ažuriranje tabele sa novim unosom
      resetForm();  // Resetovanje forme
    };
  });

  // Funkcija za učitavanje svih terapija iz baze
  function loadTherapies() {
    const tbody = document.querySelector("#therapyTable tbody");
    tbody.innerHTML = "";

    const transaction = db.transaction("therapies", "readonly");
    const objectStore = transaction.objectStore("therapies");
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
      const therapies = event.target.result;
      therapies.forEach((therapy) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${therapy.drugName}</td>
          <td>${therapy.dosage}</td>
          <td>${therapy.occasion}</td>
          <td>${therapy.time.dorucak || ''} / ${therapy.time.rucak || ''} / ${therapy.time.vecera || ''} / ${therapy.time.spavanje || ''}</td>
        `;
        tbody.appendChild(tr);
      });
    };
  }

  // Funkcija za resetovanje forme
  function resetForm() {
    document.getElementById("drugName").value = "";
    document.getElementById("dosage").value = "";
    document.getElementById("occasion").value = "jutro";
    document.getElementById("timeBreakfast").value = "";
    document.getElementById("timeLunch").value = "";
    document.getElementById("timeDinner").value = "";
    document.getElementById("timeSleep").value = "";
  }

  // Prikazivanje satnice samo kad je obrok označen
  document.querySelectorAll('.therapy-options input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      const timeInputGroup = document.getElementById(`${this.id}Time`);
      if (this.checked) {
        timeInputGroup.classList.remove('hidden');
      } else {
        timeInputGroup.classList.add('hidden');
      }
    });
  });
});

