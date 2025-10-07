document.addEventListener("DOMContentLoaded", () => {
  let db;

  const request = indexedDB.open("therapyDB", 2);

  request.onupgradeneeded = (event) => {
    db = event.target.result;

    // Kreiraj object store za navike i terapiju
    if (!db.objectStoreNames.contains("habits")) {
      db.createObjectStore("habits", { keyPath: "id", autoIncrement: true });
    }
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

  // Funkcija za unos dnevnih navika
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

    const transaction = db.transaction("habits", "readwrite");
    const objectStore = transaction.objectStore("habits");
    objectStore.clear();  // Očisti prethodne navike
    objectStore.add(habits);

    transaction.oncomplete = () => {
      alert("Navike su sačuvane!");
      loadHabits(); // Ažuriraj tabelu sa navikama
    };
  });

  // Funkcija za učitavanje navika u tabelu
  function loadHabits() {
    const tbody = document.querySelector("#habitsTable tbody");
    tbody.innerHTML = "";

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
    const medicineName = document.getElementById("therapyName").value;
    const dosage = document.getElementById("therapyDosage").value;
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
      setMedicineReminder(medicineName, dosage, period);  // Kreiraj podsetnik
    };
  });

  // Kreiranje podsetnika
  function setMedicineReminder(name, dosage, period) {
    const now = new Date();
    const reminderTime = new Date(now);

    // Definišemo vreme za podsetnik na osnovu perioda
    if (period === "doručak") reminderTime.setHours(9, 0, 0, 0);
    else if (period === "ručak") reminderTime.setHours(14, 0, 0, 0);
    else if (period === "večera") reminderTime.setHours(20, 0, 0, 0);
    else if (period === "spavanje") reminderTime.setHours(23, 0, 0, 0);

    // Ako je vreme prošlo, postavi podsetnik za sutra
    if (reminderTime <= now) reminderTime.setDate(reminderTime.getDate() + 1);

    const timeout = reminderTime - now;

    // Notifikacija korisniku
    setTimeout(() => {
      alert(`Podsetnik za "${name}" — doza: ${dosage} je zakazan za ${reminderTime.toLocaleTimeString()}`);
    }, timeout);
  }
});
