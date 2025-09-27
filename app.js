let filteredPeriod = "morning";  // Default filter: Jutro
let glucoseData = [5.6, 6.1, 5.8, 7.0, 6.3];  // Sample data

// Funckija za promenu perioda
function filterByPeriod() {
  filteredPeriod = document.getElementById('timePeriod').value;
  updateChart(glucoseData);
}

// Funkcija za AI analizu
function analyzeTrends() {
  const avg = calculateAverage(glucoseData);
  const min = Math.min(...glucoseData);
  const max = Math.max(...glucoseData);
  const trend = `Prosečna glukoza: ${avg} mmol/L, Min: ${min} mmol/L, Max: ${max} mmol/L`;

  let recommendation = "";
  if (avg > 10) {
    recommendation = "Preporučujemo da se posavetujete sa lekarom zbog visokih vrednosti glukoze.";
  } else if (avg < 4) {
    recommendation = "Vrednosti glukoze su preniske. Razmislite o konsultaciji sa lekarom.";
  } else {
    recommendation = "Vaši nivoi glukoze su u normalnom opsegu.";
  }

  displayAIChat(trend + "\n" + recommendation);
}

// Prikazivanje AI chatbox-a
function displayAIChat(message) {
  const aiChatContent = document.getElementById('aiChatContent');
  aiChatContent.textContent = message;
  document.getElementById('aiChatBox').style.display = 'block';
}

// Zatvaranje AI chatbox-a
function closeAIChatBox() {
  document.getElementById('aiChatBox').style.display = 'none';
}

// Izračunavanje proseka
function calculateAverage(values) {
  const sum = values.reduce((a, b) => a + b, 0);
  return (sum / values.length).toFixed(1);
}

// Funkcija za renderovanje grafikona
function updateChart(data) {
  const chartData = data;  // U stvarnom životu poveži sa Chart.js
  console.log(`Prikazujem grafik za period: ${filteredPeriod}`);
}
