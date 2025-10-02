<?php
$page = isset($_GET['page']) ? $_GET['page'] : 'trends';  // Podrazumevano otvara 'trends' ako nije postavljen parametar
?>

<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/style.css">
    <title>Gliko</title>
</head>
<body>

    <!-- Navbar -->
    <div id="navbar">
        <ul class="tabs">
            <li><a href="?page=trends" class="tab-btn <?php echo ($page == 'trends') ? 'active' : ''; ?>" data-tab="trends">Trendovi</a></li>
            <li><a href="?page=food" class="tab-btn <?php echo ($page == 'food') ? 'active' : ''; ?>" data-tab="food">Ishrana</a></li>
            <li><a href="?page=therapy" class="tab-btn <?php echo ($page == 'therapy') ? 'active' : ''; ?>" data-tab="therapy">Terapija</a></li>
        </ul>
    </div>

    <!-- Uputstvo modal koji se otvara automatski pri učitavanju -->
    <div id="instructionModal" class="modal" hidden>
        <div class="modal-content">
            <div class="modal-head">
                <h3>Dobrodošli u Gliko aplikaciju</h3>
                <button class="close" id="instructionClose">zatvori</button>
            </div>
            <div class="modal-body">
                <p>Ovde možete pratiti trendove vaših merenja nivoa šećera, dobiti savete za ishranu i kontrolisati terapiju.</p>
                <ul>
                    <li><strong>U odgovarajuća polja unestite:</strong></li>
                    <li>Vrednost šećera</li>
                    <li>Datum i vreme merenja</li>
                    <li>Izaberite komentar o aktivnosti koja je prethodila merenju</li>
                    <li>Možete uneti i vrstu hrane koju ste konzumirali da biste pratili uticaj toga šta jedete na vrednost šećera</li>
                    <li><strong>AI "asistent" će uporediti vaše trenutno merenje sa referentnim vrednostima.</strong></li>
                    <li><strong>Ako imate više merenja, odmah ćete videti njihov prosek vrednosti.</strong></li>
                    <li><strong>Pritiskom na taster "ANALIZA TRENDOVA" AI "asistent" će uporediti sva vaša merenja sa referentnim vrednostima i na njih dati komentar (uzmite u obzir da ovo nije medicinski savet).</strong></li>
                    <li><strong>U grafikonu i tabeli ispod možete videti sve vaše merene vrednosti koje možete filtrirati po dobu dana. (i grafikon i tabela se ažuriraju na osnovu filtera)</strong></li>
                </ul>
            </div>
        </div>
    </div>

    <div id="content">
        <?php
        // Dinamičko učitavanje sadržaja na osnovu parametra 'page'
        if ($page == 'trends') {
            include('trends/trends.html');  // Učitaj trends.html
        } elseif ($page == 'food') {
            include('food/food.html');  // Učitaj food.html
        } elseif ($page == 'therapy') {
            include('therapy/therapy.html');  // Učitaj therapy.html
        } else {
            echo "<p>Stranica nije pronađena.</p>";
        }
        ?>
    </div>

    <script src="app.js"></script>

    <script>
        // Otvori modal prilikom učitavanja stranice
        document.addEventListener('DOMContentLoaded', function() {
            // Proveri da li je modal već prikazan u ovoj sesiji
            if (!sessionStorage.getItem('modalShown')) {
                const instructionModal = document.getElementById('instructionModal');
                instructionModal.hidden = false;

                // Zatvori modal kada korisnik klikne na dugme za zatvaranje
                document.getElementById('instructionClose').addEventListener('click', function() {
                    instructionModal.hidden = true;
                    // Obeležavamo da je modal prikazan u ovoj sesiji
                    sessionStorage.setItem('modalShown', 'true');
                });
            }
        });
    </script>

    <!-- Putanje do skripti iz trends.html sa apsolutnim putanjama -->
    <script src="/gliko-test/trends/trends.js"></script>
    <script src="/gliko-test/trends/ai_current.js"></script>
    <script src="/gliko-test/trends/ai_analysis.js"></script>

</body>
</html>
