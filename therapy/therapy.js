document.addEventListener("DOMContentLoaded", () => {
  let db;

  // Otvorite bazu za navike i terapije
  const request = indexedDB.open("therapyDB", 1);

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    
    if (!db.objectStoreNames.contains("habits")) {
      const habitStore = db.createObjectStore("habits", { keyPath: "id", autoIncrement: true });
      habitStore.createIndex("wakeTime", "wakeTime", { unique: false });
      habitStore.createIndex("breakfastTime", "breakfastTime", { unique: false });
      habitStore.createIndex("lunchTime", "lunchTime", { unique: false });
      habitStore.createIndex("dinnerTime", "dinnerTime", { unique: false });
      habitStore.createIndex("sleepTime", "sleepTime", { unique: false });
    }
    
    if (!db.objectStoreNames.contains("medicines")) {
      const medicineStore = db.createObjectStore("medicines", { keyPath: "id", autoIncrement: true });
      medicineStore.createIndex("medicineName", "medicineName", { unique: false });
      medicineStore.createIndex("dosage", "dosage", { unique: false });
      medicineStore.createIndex("period", "period", { unique: false });
    }
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    console.log("Baza terapija je otvorena.");
  };

  // Funkcija za unos navika
  document.getElementById("saveHabits").addEventListener("click", () => {
    const wakeTime = document.getElementById("wakeTime").value;
    const breakfastTime = document.getElementById("breakfastTime").value;
    const lunchTime = document.getElementById("lunchTime").value;
    const dinnerTime = document.getElementById("dinnerTime").value;
    const sleepTime = document.getElementById("sleepTime").value;

    if (!wakeTime || !breakfastTime || !lunchTime || !dinnerTime || !sleepTime) {
      alert("Molimo unesite sve navike.");
      return;
    }

    const transaction = db.transaction("habits", "readwrite");
    const objectStore = transaction.objectStore("habits");

    objectStore.add({
      wakeTime,
      breakfastTime,
      lunchTime,
      dinnerTime,
      sleepTime
    });

    transaction.oncomplete = () => {
      alert("Navike su sačuvane.");
      loadHabits();  // Ažuriraj tabelu sa navikama
    };
  });

  // Funkcija za učitavanje navika u tabelu
  function loadHabits() {
    const tbody = document.querySelector("#habitsTable tbody");
    tbody.innerHTML = "";  // Očisti postojeći sadržaj

    const transaction = db.transaction("habits", "readonly");
    const objectStore = transaction.objectStore("habits");
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
      const habits = event.target.result;
      habits.forEach((habit) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${habit.wakeTime ? "🌄" : ""} Buđenje</td>
          <td>${habit.wakeTime || "Nije uneseno"}</td>
          <td>${habit.breakfastTime ? "🍽️" : ""} Doručak</td>
          <td>${habit.breakfastTime || "Nije uneseno"}</td>
          <td>${habit.lunchTime ? "🍽️" : ""} Ručak</td>
          <td>${habit.lunchTime || "Nije uneseno"}</td>
          <td>${habit.dinnerTime ? "🍽️" : ""} Večera</td>
          <td>${habit.dinnerTime || "Nije uneseno"}</td>
          <td>${habit.sleepTime ? "🛏️" : ""} Spavanje</td>
          <td>${habit.sleepTime || "Nije uneseno"}</td>
        `;
        tbody.appendChild(tr);
      });

      // Prikazivanje tabele sa navikama
      document.getElementById("habitsTableContainer").style.display = 'block';
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

    // Čuvanje terapije u IndexedDB
    const transaction = db.transaction("medicines", "readwrite");
    const objectStore = transaction.objectStore("medicines");

    objectStore.add({
      medicineName,
      dosage,
      period
    });

    transaction.oncomplete = () => {
      alert("Terapija je sačuvana.");
      loadMedicines();  // Ažuriraj tabelu sa terapijama
    };
  });

  // Funkcija za učitavanje terapija u tabelu
  function loadMedicines() {
    const tbody = document.querySelector("#therapyTable tbody");
    tbody.innerHTML = "";  // Očisti postojeći sadržaj

    const transaction = db.transaction("medicines", "readonly");
    const objectStore = transaction.objectStore("medicines");
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
      const medicines = event.target.result;
      medicines.forEach((medicine) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${medicine.medicineName}</td>
          <td>${medicine.dosage}</td>
          <td>${medicine.period}</td>
          <td><button class="small" onclick="setMedicineReminder('${medicine.medicineName}', '${medicine.dosage}', '${medicine.period}')">Postavi podsetnik</button></td>
        `;
        tbody.appendChild(tr);
      });
    };
  }

  // Funkcija za postavljanje podsetnika
  function setMedicineReminder(name, dosage, period) {
    const now = new Date();
    const reminderTime = new Date(now);

    // Definišemo vreme za podsetnik na osnovu perioda
    if (period === "doručak") {
      reminderTime.setHours(8, 0, 0, 0); // Primer za doručak
    } else if (period === "ručak") {
      reminderTime.setHours(14, 0, 0, 0); // Primer za ručak
    } else if (period === "večera") {
      reminderTime.setHours(20, 0, 0, 0); // Primer za večeru
    } else if (period === "spavanje") {
      reminderTime.setHours(23, 0, 0, 0); // Primer za spavanje
    }

    const timeout = reminderTime.getTime() - new Date().getTime();

    // Postavljanje notifikacije
    setTimeout(() => {
      alert(`Podsetnik: Terapija "${name}" je sada na redu! Doza: ${dosage}`);
    }, timeout);
  }
});
