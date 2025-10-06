let db;

// Kada je stranica učitana, inicijalizuje se baza i postavljaju event listener-i
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

  // Event listener za dodavanje nove terapije
  document.getElementById("btnAddTherapy").addEventListener("click", () => {
    const drugName = document.getElementById("drugName").value.trim();
    const dosage = document.getElementById("dosage").value.trim();
    const occasion = document.getElementById("occasion").value;
    const timeMeal = document.getElementById("timeMeal").value;
    const timePostMeal = document.getElementById("timePostMeal").value;
    const timeBeforeSleep = document.getElementById("timeBeforeSleep").value;

    if (!drugName || !dosage || !occasion) {
      alert("Sva polja su obavezna!");
      return;
    }

    // Validacija da satnica bude postavljena ako je obrok označen
    if ((document.getElementById("meal").checked && !timeMeal) || 
        (document.getElementById("postMeal").checked && !timePostMeal) || 
        (document.getElementById("beforeSleep").checked && !timeBeforeSleep)) {
      alert("Morate uneti satnicu za označene obroke!");
      return;
    }

    const therapy = { drugName, dosage, occasion, timeMeal, timePostMeal, timeBeforeSleep };
    
    const transaction = db.transaction("therapies", "readwrite");
    const objectStore = transaction.objectStore("therapies");
    objectStore.add(therapy);

    transaction.oncomplete = () => {
      console.log("Terapija dodata");
      loadTherapies();  // Ažuriranje tabele sa novim unosom
      resetForm();  // Resetovanje forme

      // Postavljanje alarma na osnovu unesenog vremena
      setReminder(timeMeal, "Uz obrok");
      setReminder(timePostMeal, "Posle obroka");
      setReminder(timeBeforeSleep, "Pred spavanje");
    };
  });

  // Funkcija za postavljanje podsetnika (notifikacije)
  function setReminder(time, occasion) {
    if (!time) return;

    const now = new Date();
    const reminderTime = new Date(now.toDateString() + " " + time); // Spajanje dana i vremena
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1); // Ako je vreme prošlo, postavi za sledeći dan
    }

    const timeout = reminderTime.getTime() - now.getTime(); // Razlika u milisekundama

    setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification(`Podsetnik: ${occasion}`, {
          body: `Vreme je za uzimanje leka: ${occasion}`,
          icon: '/images/notification-icon.png',  // Zameni ikonu po želji
        });
      }
    }, timeout);  // Notifikacija će biti poslata u tačno to vreme
  }

  // Funkcija za postavljanje podsetnika za pregled/laboratoriju
  document.getElementById("btnSetReviewReminder").addEventListener("click", () => {
    const reviewDate = document.getElementById("reviewDate").value;
    const reviewTime = document.getElementById("reviewTime").value;
    const reviewComment = document.getElementById("reviewComment").value.trim();

    if (!reviewDate || !reviewTime) {
      alert("Morate uneti datum i vreme pregleda!");
      return;
    }

    // Kombinovanje datuma i vremena u jedan objekat
    const reviewDateTime = new Date(`${reviewDate}T${reviewTime}:00`);

    const now = new Date();
    if (reviewDateTime <= now) {
      alert("Datum i vreme pregleda moraju biti u budućnosti!");
      return;
    }

    // Postavljanje podsetnika za pregled
    const timeout = reviewDateTime.getTime() - now.getTime(); // Razlika u milisekundama

    setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification("Podsetnik za pregled", {
          body: reviewComment ? `Podsećamo vas na pregled: ${reviewComment}` : "Podsećamo vas na predstojeći pregled.",
          icon: '/images/notification-icon.png',  // Zameni ikonu po želji
        });
      }
    }, timeout);  // Notifikacija će biti poslata u tačno to vreme
  });

  // Funkcija za resetovanje forme
  function resetForm() {
    document.getElementById("drugName").value = "";
    document.getElementById("dosage").value = "";
    document.getElementById("occasion").value = "jutro";
    document.getElementById("timeMeal").value = "";
    document.getElementById("timePostMeal").value = "";
    document.getElementById("timeBeforeSleep").value = "";
  }

  // Učitavanje svih terapija iz IndexedDB baze
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
          <td>${therapy.timeMeal || therapy.timePostMeal || therapy.timeBeforeSleep}</td>
        `;
        tbody.appendChild(tr);
      });
    };
  }
});


