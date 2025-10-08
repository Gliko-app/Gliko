document.addEventListener("DOMContentLoaded", () => {
  let dbHabits, dbTherapy;

  // Otvori bazu za navike i terapiju
  const requestHabits = indexedDB.open("habitsDB", 2);  // Baza za navike
  const requestTherapy = indexedDB.open("therapyDB", 2);  // Baza za terapije

  // Kreiranje baza (ako ne postoje)
  requestHabits.onupgradeneeded = (event) => {
    dbHabits = event.target.result;

    // Kreiraj store za navike
    if (!dbHabits.objectStoreNames.contains("habits")) {
      const store = dbHabits.createObjectStore("habits", { keyPath: "id", autoIncrement: true });
      store.createIndex("name", "name", { unique: false });
      store.createIndex("time", "time", { unique: false });
    }
  };

  requestHabits.onsuccess = (event) => {
    dbHabits = event.target.result;
    console.log("Baza za navike je otvorena!");
    loadHabits();  // Učitaj navike čim se baza otvori
  };

  requestHabits.onerror = (event) => {
    console.error("Greška pri otvaranju baze za navike:", event.target.error);
  };

  requestTherapy.onupgradeneeded = (event) => {
    dbTherapy = event.target.result;

    // Kreiraj store za terapije
    if (!dbTherapy.objectStoreNames.contains("medicines")) {
      const store = dbTherapy.createObjectStore("medicines", { keyPath: "id", autoIncrement: true });
      store.createIndex("medicineName", "medicineName", { unique: false });
      store.createIndex("dosage", "dosage", { unique: false });
      store.createIndex("period", "period", { unique: false });
    }
  };

  requestTherapy.onsuccess = (event) => {
    dbTherapy = event.target.result;
    console.log("Baza za terapije je otvorena!");
    loadTherapies();  // Učitaj terapije čim se baza otvori
  };

  requestTherapy.onerror = (event) => {
    console.error("Greška pri otvaranju baze za terapije:", event.target.error);
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

    // Kreiranje transakcije za IndexedDB (navike)
    const transaction = dbHabits.transaction("habits", "readwrite");
    const objectStore = transaction.objectStore("habits");
    objectStore.clear();  // Očisti prethodne podatke
    const request = objectStore.add(habits);

    request.onsuccess = () => {
      console.log("Navike su uspešno sačuvane!");
      loadHabits();  // Ažuriraj tabelu sa novim podacima
    };

    request.onerror = (error) => {
      console.error("Greška pri unosu navika:", error);
    };
  });

  // Funkcija za učitavanje navika u tabelu
  function loadHabits() {
    const tbody = document.querySelector("#habitsTable tbody");
    tbody.innerHTML = "";  // Očistiti prethodni sadržaj

    const transaction = dbHabits.transaction("habits", "readonly");
    const objectStore = transaction.objectStore("habits");
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
      const habits = event.target.result;
      console.log("Učitane navike:", habits);  // Dodajemo log za učitane navike

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

    request.onerror = (error) => {
      console.error("Greška pri učitavanju navika:", error);
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

    const therapy = {
      medicineName,
      dosage,
      period
    };

    // Kreiranje transakcije za terapije
    const transaction = dbTherapy.transaction("medicines", "readwrite");
    const objectStore = transaction.objectStore("medicines");
    const request = objectStore.add(therapy);

    request.onsuccess = () => {
      console.log("Terapija je uspešno sačuvana!");
      loadTherapies();  // Ažuriraj tabelu sa terapijama
    };

    request.onerror = (error) => {
      console.error("Greška pri unosu terapije:", error);
    };
  });

  // Funkcija za učitavanje terapija u tabelu
  function loadTherapies() {
    const tbody = document.querySelector("#therapyTable tbody");
    tbody.innerHTML = "";  // Očistiti prethodni sadržaj

    const transaction = dbTherapy.transaction("medicines", "readonly");
    const objectStore = transaction.objectStore("medicines");
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
      const therapies = event.target.result;
      console.log("Učitane terapije:", therapies);  // Dodajemo log za učitane terapije

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

    request.onerror = (error) => {
      console.error("Greška pri učitavanju terapija:", error);
    };
  }

  // Funkcija za kreiranje podsetnika
  function createReminder(id) {
    const tx = dbTherapy.transaction("medicines", "readonly");
    const store = tx.objectStore("medicines");
    const request = store.get(id);

    request.onsuccess = (event) => {
      const item = event.target.result;
      setMedicineReminder(item.medicineName, item.dosage, item.period);
    };
  }

  // Funkcija za postavljanje podsetnika
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

    console.log(`Podsetnik za "${name}" zakazan za ${reminderTime.toLocaleTimeString()}`);

    // Ako su push notifikacije dozvoljene, zakazujemo notifikaciju
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(function(registration) {
          registration.showNotification(`Terapija "${name}" - doza: ${dosage}`, {
            body: `Vreme je za uzimanje leka "${name}"!`,
            icon: '/Gliko/images/notification-icon.png',
            badge: '/Gliko/images/badge.png'
          });
        });
      }
    }, timeout);
  }
});
