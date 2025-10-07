document.addEventListener("DOMContentLoaded", () => {
  let db;

  // Otvoriti bazu za navike i terapiju
  const request = indexedDB.open("therapyDB", 2);  // Koristimo therapyDB za terapije

  // Kreiramo obje baze ako ne postoje
  request.onupgradeneeded = (event) => {
    db = event.target.result;

    // Kreiraj objekat store za navike
    if (!db.objectStoreNames.contains("habits")) {
      db.createObjectStore("habits", { keyPath: "id", autoIncrement: true });
    }

    // Kreiraj objekat store za terapije
    if (!db.objectStoreNames.contains("medicines")) {
      const store = db.createObjectStore("medicines", { keyPath: "id", autoIncrement: true });
      store.createIndex("medicineName", "medicineName", { unique: false });
      store.createIndex("dosage", "dosage", { unique: false });
      store.createIndex("period", "period", { unique: false });
    }
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    console.log("Baza je otvorena!");
  };

  // Funkcija za unos navika
  document.getElementById("saveHabits").addEventListener("click", () => {
    const wakeTime = document.getElementById("wakeTime").value;
    const breakfastTime = document.getElementById("breakfastTime").value;
    const lunchTime = document.getElementById("lunchTime").value;
    const dinnerTime = document.getElementById("dinnerTime").value;
    const sleepTime = document.getElementById("sleepTime").value;

    if (!wakeTime || !breakfastTime || !lunchTime || !dinnerTime || !sleepTime) {
      alert("Molimo unesite sva vremena.");
      return;
    }

    const habits = {
      wakeTime,
      breakfastTime,
      lunchTime,
      dinnerTime,
      sleepTime
    };

    // Kreiranje transakcije za IndexedDB
    const transaction = db.transaction("habits", "readwrite");
    const objectStore = transaction.objectStore("habits");
    objectStore.clear();  // Očisti prethodne podatke
    objectStore.add(habits);

    transaction.oncomplete = () => {
      alert("Navike su sačuvane!");
      loadHabits();  // Ažuriraj tabelu sa novim podacima
    };

    transaction.onerror = () => {
      alert("Došlo je do greške prilikom čuvanja podataka.");
    };
  });

  // Funkcija za učitavanje navika u tabelu
  function loadHabits() {
    const tbody = document.querySelector("#habitsTable tbody");
    tbody.innerHTML = "";  // Očistiti prethodni sadržaj

    const transaction = db.transaction("habits", "readonly");
    const objectStore = transaction.objectStore("habits");
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
      const habits = event.target.result;
      if (habits.length > 0) {
        const h = habits[0];
        const rows = [
          { name: "Buđenje", time: h.wakeTime, icon: "🌅" },
          { name: "Doručak", time: h.breakfastTime, icon: "🍳" },
          { name: "Ručak", time: h.lunchTime, icon: "🍛" },
          { name: "Večera", time: h.dinnerTime, icon: "🍽️" },
          { name: "Spavanje", time: h.sleepTime, icon: "🛏️" }
        ];

        rows.forEach(r => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${r.name}</td>
            <td>${r.time}</td>
            <td>${r.icon}</td>
          `;
          tbody.appendChild(tr);
        });
      }
    };
  }

  // Funkcija za unos terapije
  document.getElementById("addTherapy").addEventListener("click", () => {
    const medicineName = document.getElementById("therapyName").value.trim();
    const dosage = document.getElementById("therapyDosage").value.trim();
    const period = document.getElementById("therapyPeriod").value;

    if (!medicineName || !dosage || !period) {
      alert("Molimo unesite sve podatke o terapiji.");
      return;
    }

    const transaction = db.transaction("medicines", "readwrite");
    const objectStore = transaction.objectStore("medicines");
    objectStore.add({ medicineName, dosage, period });

    transaction.oncomplete = () => {
      alert("Terapija je sačuvana!");
      loadTherapies();  // Ažuriraj tabelu sa terapijama
    };

    transaction.onerror = () => {
      alert("Došlo je do greške prilikom čuvanja terapije.");
    };
  });

  // Funkcija za učitavanje terapija u tabelu
  function loadTherapies() {
    const tbody = document.querySelector("#therapyTable tbody");
    tbody.innerHTML = "";  // Očistiti prethodni sadržaj

    const transaction = db.transaction("medicines", "readonly");
    const objectStore = transaction.objectStore("medicines");
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
      const therapies = event.target.result;

      // Sortiraj terapije po vremenu (jutro, obrok, večera)
      const sortedTherapies = therapies.sort((a, b) => {
        const order = { "doručak": 1, "ručak": 2, "večera": 3, "spavanje": 4 };
        return order[a.period] - order[b.period];
      });

      sortedTherapies.forEach((therapy) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${therapy.medicineName}</td>
          <td>${therapy.dosage}</td>
          <td>${therapy.period}</td>
          <td><button class="action-btn" data-id="${therapy.id}">🔔 Napravi podsetnik</button></td>
        `;
        tbody.appendChild(tr);
      });

      // Dodajemo event listener za dugme podsetnika
      document.querySelectorAll(".action-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = parseInt(btn.getAttribute("data-id"));
          createReminder(id); // Kreiraj podsetnik za lek
        });
      });
    };
  }
});
