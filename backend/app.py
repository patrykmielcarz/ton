# Plik: backend/app.py - Wersja Kompletna, Czysta i Ostateczna

import sqlite3
import os
import shutil
from flask import Flask, jsonify, request, g,redirect
from flask_cors import CORS

DATABASE = 'database.db'

# DATABASE = '/home/tonmedica/folder bez nazwy 2/backend/database.db'

app = Flask(__name__)
CORS(app)

# --- Połączenie z Bazą Danych ---
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# --- Funkcje Pomocnicze ---

# @app.route("/", defaults={"path": ""})
# @app.route("/<path:path>")
# def serve_frontend(path):
#     root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
#     file_path = os.path.join(root_dir, path)

#     if path != "" and os.path.exists(file_path):
#         return send_from_directory(root_dir, path)
#     else:
#         return send_from_directory(root_dir, "index.html")

def _perform_backup():
    """Tworzy kopię zapasową pliku bazy danych, nadpisując poprzednią."""
    if not os.path.exists(DATABASE):
        print("Plik bazy danych nie istnieje, pomijam tworzenie kopii zapasowej.")
        return
    try:
        shutil.copy2(DATABASE, 'database_backup.db')
        print(f"Pomyślnie utworzono kopię zapasową bazy danych w pliku: database_backup.db")
    except Exception as e:
        print(f"Błąd podczas tworzenia kopii zapasowej: {e}")

def _try_fulfill_waiting_orders(db, produkt_id, typ_egzemplarza='Sprzedażowy'):
    """
    Ulepszona, uniwersalna funkcja, która rezerwuje dostępne sztuki dla oczekujących pacjentów.
    """
    # 1. Znajdź dostępne sztuki danego typu
    available_items_cursor = db.execute(
        "SELECT item_id FROM Magazyn WHERE produkt_id = ? AND status = 'Dostępny' AND typ_egzemplarza = ?",
        (produkt_id, typ_egzemplarza)
    )
    available_ids = [row['item_id'] for row in available_items_cursor.fetchall()]

    if not available_ids:
        return # Brak dostępnych sztuk, nic nie robimy

    # 2. Znajdź "rezerwacje-duchy" (placeholdery) dla tego samego typu produktu
    waiting_status = 'Oczekuje na zwrot (Demo)' if typ_egzemplarza == 'Demo' else 'Oczekuje na zamówienie'

    waiting_placeholders_cursor = db.execute(
        "SELECT item_id, pacjent_id FROM Magazyn WHERE produkt_id = ? AND status = ? AND typ_egzemplarza = ? ORDER BY item_id",
        (produkt_id, waiting_status, typ_egzemplarza)
    )
    waiting_placeholders = [dict(row) for row in waiting_placeholders_cursor.fetchall()]

    if not waiting_placeholders:
        return # Nikt nie czeka, nic nie robimy

    # 3. Przypisz dostępne sztuki do oczekujących, aktualizując istniejące wpisy i usuwając placeholdery
    num_to_assign = min(len(available_ids), len(waiting_placeholders))

    fulfilled_placeholders_ids = []
    for i in range(num_to_assign):
        item_id_to_assign = available_ids[i]
        placeholder_to_fulfill = waiting_placeholders[i]

        # Zaktualizuj FIZYCZNIE DOSTĘPNĄ sztukę, przypisując ją do pacjenta
        db.execute(
            "UPDATE Magazyn SET status = 'Zarezerwowany', pacjent_id = ? WHERE item_id = ?",
            (placeholder_to_fulfill['pacjent_id'], item_id_to_assign)
        )

        # Zaznacz "rezerwację-ducha" do usunięcia
        fulfilled_placeholders_ids.append(placeholder_to_fulfill['item_id'])

    # 4. Usuń "rezerwacje-duchy", które zostały już zrealizowane
    if fulfilled_placeholders_ids:
        # Tworzymy string z znakami zapytania, np. (?, ?, ?) dla bezpiecznego zapytania
        placeholders_str = ','.join('?' for _ in fulfilled_placeholders_ids)
        db.execute(
            f"DELETE FROM Magazyn WHERE item_id IN ({placeholders_str})",
            fulfilled_placeholders_ids
        )

    print(f"Automatycznie zrealizowano {num_to_assign} oczekujących rezerwacji dla produktu ID: {produkt_id}")


def _assign_product_to_patient(db, pacjent_id, produkt_id, ilosc=1, typ_egzemplarza='Sprzedażowy'):
    """Uniwersalna funkcja do przypisywania sprzętu pacjentowi."""
    for _ in range(ilosc):
        if typ_egzemplarza == 'Demo':
            cursor = db.execute("SELECT item_id FROM Magazyn WHERE produkt_id = ? AND status = 'Dostępny' AND typ_egzemplarza = 'Demo' LIMIT 1", (produkt_id,))
            available_item = cursor.fetchone()
            if available_item:
                db.execute("UPDATE Magazyn SET status = 'Zarezerwowany', pacjent_id = ? WHERE item_id = ?", (pacjent_id, available_item['item_id']))
            else:
                db.execute("INSERT INTO Magazyn (produkt_id, status, pacjent_id, typ_egzemplarza) VALUES (?, 'Oczekuje na zwrot (Demo)', ?, 'Demo')", (produkt_id, pacjent_id))
        else: # Sprzedażowy
            cursor = db.execute("SELECT item_id FROM Magazyn WHERE produkt_id = ? AND status = 'Dostępny' AND typ_egzemplarza = 'Sprzedażowy' LIMIT 1", (produkt_id,))
            available_item = cursor.fetchone()
            if available_item:
                db.execute("UPDATE Magazyn SET status = 'Zarezerwowany', pacjent_id = ? WHERE item_id = ?", (pacjent_id, available_item['item_id']))
            else:
                db.execute("INSERT INTO Magazyn (produkt_id, status, pacjent_id, typ_egzemplarza) VALUES (?, 'Oczekuje na zamówienie', ?, 'Sprzedażowy')", (produkt_id, pacjent_id))

# --- API ENDPOINTS ---

# === SEKCJA PACJENTÓW ===

@app.route('/api/patients', methods=['GET'])
def get_patients():
    db = get_db()
    cursor = db.execute("""
        SELECT
            p.pacjent_id, p.imie, p.nazwisko, p.status_ogolny,
            (SELECT COUNT(*) FROM Magazyn m WHERE m.pacjent_id = p.pacjent_id AND m.typ_egzemplarza = 'Demo') as demo_count,
            (SELECT COUNT(*) FROM Reklamacje r WHERE r.pacjent_id = p.pacjent_id AND r.status != 'Powiadomiono') as complaint_count
        FROM Pacjenci p ORDER BY p.nazwisko, p.imie
    """)
    return jsonify([dict(row) for row in cursor.fetchall()])

@app.route('/api/patients/<int:patient_id>', methods=['GET', 'PUT', 'DELETE'])
def patient_by_id(patient_id):
    db = get_db()

    # --- Obsługa metody GET (pobieranie szczegółów) ---
    if request.method == 'GET':
        cursor = db.execute("SELECT * FROM Pacjenci WHERE pacjent_id = ?", (patient_id,))
        patient_row = cursor.fetchone()
        if not patient_row:
            return jsonify({'message': 'Nie znaleziono pacjenta'}), 404

        patient = dict(patient_row)

        # Pobierz sprzęt
        cursor = db.execute("""
            SELECT m.item_id, m.status, m.produkt_id, m.typ_egzemplarza, m.numer_seryjny, m.cena_niestandardowa,
                   p.nazwa, p.model, p.producent, p.typ
            FROM Magazyn m JOIN Produkty p ON m.produkt_id = p.produkt_id
            WHERE m.pacjent_id = ?
        """, (patient_id,))

        sprzet_pacjenta = []
        for item_row in cursor.fetchall():
            item = dict(item_row)
            if item['typ_egzemplarza'] == 'Demo' and item['typ'] == 'Aparat':
                sales_version_cursor = db.execute(
                    "SELECT COUNT(*) as count FROM Magazyn WHERE produkt_id = ? AND status = 'Dostępny' AND typ_egzemplarza = 'Sprzedażowy'",
                    (item['produkt_id'],)
                )
                item['dostepnosc_sprzedazowa'] = sales_version_cursor.fetchone()['count']
            sprzet_pacjenta.append(item)
        patient['sprzet'] = sprzet_pacjenta

        # Pobierz historię
        cursor = db.execute("SELECT h.data_zakonczenia, p.nazwa, p.model FROM Historia_Wypozyczen h JOIN Produkty p ON h.produkt_id = p.produkt_id WHERE h.pacjent_id = ? ORDER BY h.data_zakonczenia DESC", (patient_id,))
        patient['historia'] = [dict(row) for row in cursor.fetchall()]

        # Pobierz audiogramy
        cursor = db.execute("SELECT audiogram_id, dane_obrazu, data_utworzenia FROM Audiogramy WHERE pacjent_id = ? ORDER BY data_utworzenia DESC", (patient_id,))
        patient['audiogramy'] = [dict(row) for row in cursor.fetchall()]

        # Pobierz reklamacje
        cursor = db.execute("SELECT * FROM Reklamacje WHERE pacjent_id = ? ORDER BY data_utworzenia DESC", (patient_id,))
        reklamacje = []
        for row in cursor.fetchall():
            reklamacja = dict(row)
            history_cursor = db.execute("SELECT * FROM Historia_Reklamacji WHERE reklamacja_id = ? ORDER BY data_zmiany", (reklamacja['reklamacja_id'],))
            reklamacja['historia_reklamacji'] = [dict(h_row) for h_row in history_cursor.fetchall()]
            reklamacje.append(reklamacja)
        patient['reklamacje'] = reklamacje

        return jsonify(patient)

    # --- Obsługa metody PUT (edycja danych) ---
    if request.method == 'PUT':
        data = request.json
        if not all(k in data for k in ['imie', 'nazwisko', 'pesel']):
            return jsonify({'message': 'Imię, nazwisko i PESEL są wymagane.'}), 400
        try:
            db.execute("UPDATE Pacjenci SET imie = ?, nazwisko = ?, telefon = ?, pesel = ? WHERE pacjent_id = ?",
                       (data['imie'], data['nazwisko'], data['telefon'], data['pesel'], patient_id))
            db.commit()
            return jsonify({'message': 'Dane pacjenta zaktualizowane.'})
        except sqlite3.IntegrityError:
            return jsonify({'message': 'Pacjent z tym numerem PESEL już istnieje.'}), 409
        except Exception as e:
            db.rollback()
            return jsonify({'message': f'Wystąpił błąd serwera: {e}'}), 500

    # --- Obsługa metody DELETE (usuwanie) ---
    if request.method == 'DELETE':
        data = request.json
        zakupiono = data.get('zakupiono', False)
        try:
            if zakupiono:
                pacjent_info = db.execute("SELECT * FROM Pacjenci WHERE pacjent_id = ?", (patient_id,)).fetchone()
                sprzet_cursor = db.execute("SELECT p.produkt_id, p.nazwa, p.model, p.typ, COALESCE(m.cena_niestandardowa, p.cena) as finalna_cena, COUNT(m.item_id) as ilosc FROM Magazyn m JOIN Produkty p ON m.produkt_id = p.produkt_id WHERE m.pacjent_id = ? GROUP BY p.produkt_id, finalna_cena", (patient_id,))
                sprzet_do_rachunku = [dict(row) for row in sprzet_cursor.fetchall()]
                items_to_bill = [item for item in sprzet_do_rachunku if item['typ'] == 'Aparat' or item['nazwa'].startswith('Ładowarka')]
                kwota_laczna = sum(item['finalna_cena'] * item['ilosc'] for item in items_to_bill)
                if items_to_bill:
                    trans_cursor = db.execute("INSERT INTO Transakcje (pacjent_imie, pacjent_nazwisko, pacjent_pesel, kwota_laczna, data_transakcji) VALUES (?, ?, ?, ?, date('now'))", (pacjent_info['imie'], pacjent_info['nazwisko'], pacjent_info['pesel'], kwota_laczna))
                    new_trans_id = trans_cursor.lastrowid
                    for item in items_to_bill:
                        db.execute("INSERT INTO Pozycje_Transakcji (transakcja_id, produkt_id, produkt_nazwa, produkt_model, cena_za_sztuke, ilosc) VALUES (?, ?, ?, ?, ?, ?)", (new_trans_id, item['produkt_id'], item['nazwa'], item['model'], item['finalna_cena'], item['ilosc']))
                db.execute("DELETE FROM Magazyn WHERE pacjent_id = ?", (patient_id,))

            else: # Jeśli pacjent zwrócił sprzęt
                # === NOWA, POPRAWNA LOGIKA ZWRACANIA SPRZĘTU ===
                # 1. Znajdź FIZYCZNE sztuki, które pacjent miał (i które wracają na stan)
                physical_items_returned_cursor = db.execute("""
                    SELECT DISTINCT produkt_id, typ_egzemplarza
                    FROM Magazyn WHERE pacjent_id = ? AND status NOT IN ('Oczekuje na zamówienie', 'Oczekuje na zwrot (Demo)', 'Zamówiono')
                """, (patient_id,))
                physical_items_returned = [dict(row) for row in physical_items_returned_cursor.fetchall()]

                # 2. Usuń z bazy "wirtualne" rezerwacje i zamówienia dla tego pacjenta
                db.execute("DELETE FROM Magazyn WHERE pacjent_id = ? AND status IN ('Oczekuje na zamówienie', 'Oczekuje na zwrot (Demo)', 'Zamówiono')", (patient_id,))

                # 3. Fizyczne sztuki (jeśli były) zwróć do magazynu jako "Dostępne"
                db.execute("UPDATE Magazyn SET pacjent_id = NULL, status = 'Dostępny' WHERE pacjent_id = ?", (patient_id,))

                # 4. Spróbuj przypisać zwrócone FIZYCZNE sztuki innym oczekującym
                for item in physical_items_returned:
                    _try_fulfill_waiting_orders(db, item['produkt_id'], item['typ_egzemplarza'])
                # --- KONIEC NOWEJ LOGIKI ---

            # Na koniec, usuń pacjenta i jego historię (bez zmian)
            db.execute("DELETE FROM Historia_Wypozyczen WHERE pacjent_id = ?", (patient_id,))
            db.execute("DELETE FROM Audiogramy WHERE pacjent_id = ?", (patient_id,))
            db.execute("DELETE FROM Reklamacje WHERE pacjent_id = ?", (patient_id,))
            db.execute("DELETE FROM Pacjenci WHERE pacjent_id = ?", (patient_id,))

            db.commit()
            return jsonify({'message': 'Pacjent został pomyślnie usunięty.'})

        except Exception as e:
            db.rollback()
            print(f"BŁĄD KRYTYCZNY PODCZAS USUWANIA PACJENTA: {e}")
            return jsonify({'message': f'Wystąpił błąd serwera: {e}'}), 500

@app.route('/api/patients', methods=['POST'])
def create_patient():
    data = request.json
    db = get_db()
    if not all(k in data for k in ['imie', 'nazwisko', 'pesel']):
        return jsonify({'message': 'Imię, nazwisko i PESEL są wymagane.'}), 400
    try:
        cursor = db.execute("INSERT INTO Pacjenci (imie, nazwisko, telefon, pesel, data_urodzenia, status_wnioskow) VALUES (?, ?, ?, ?, ?, ?)", (data['imie'], data['nazwisko'], data['telefon'], data['pesel'], data['data_urodzenia'], data['status_wnioskow']))
        new_patient_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Pacjent z tym numerem PESEL już istnieje.'}), 409
    try:
        ilosc = int(data.get('ilosc_aparatow', 1))
        is_demo = data.get('is_demo', False)
        typ = 'Demo' if is_demo else 'Sprzedażowy'

        if data.get('aparat_id'):
            _assign_product_to_patient(db, new_patient_id, data['aparat_id'], ilosc, typ)

        aparat_info = db.execute("SELECT nazwa, producent FROM Produkty WHERE produkt_id = ?", (data.get('aparat_id'),)).fetchone()

        # --- ZAKTUALIZOWANA LOGIKA SPRAWDZANIA ŁADOWARKI ---
        if aparat_info:
            nazwa_upper = aparat_info['nazwa'].strip().upper()
            # Sprawdzamy, czy nazwa kończy się na " R", " RT" LUB zawiera "ENCANTA"
            last_part = nazwa_upper.split()[-1]
            if last_part == 'R' or last_part == 'RT' or 'ENCANTA' in nazwa_upper:
                ladowarka_nazwa = f"Ładowarka {aparat_info['producent']} (Bez powerbanku)"
                ladowarka_info = db.execute("SELECT produkt_id FROM Produkty WHERE nazwa = ?", (ladowarka_nazwa,)).fetchone()
                if ladowarka_info:
                    _assign_product_to_patient(db, new_patient_id, ladowarka_info['produkt_id'])
        # --- KONIEC POPRAWKI ---

        if data.get('sluchawka_prawa_id'):
            _assign_product_to_patient(db, new_patient_id, data['sluchawka_prawa_id'], 1)

        if data.get('sluchawka_lewa_id'):
            _assign_product_to_patient(db, new_patient_id, data['sluchawka_lewa_id'], 1)

        db.commit()
        return jsonify({'message': 'Pacjent został pomyślnie dodany.', 'pacjent_id': new_patient_id}), 201
    except Exception as e:
        db.rollback()
        print(f"BŁĄD KRYTYCZNY: {e}")
        return jsonify({'message': f'Błąd serwera: {e}.'}), 500

# W pliku app.py - ZASTĄP TĘ FUNKCJĘ

@app.route('/api/patients/<int:patient_id>/upgrade-to-sales', methods=['POST'])
def upgrade_to_sales(patient_id):
    """Zamienia aparaty DEMO pacjenta na wersje sprzedażowe, poprawnie obsługując stany magazynowe."""
    db = get_db()
    try:
        # Krok 1: Znajdź wszystkie aparaty DEMO pacjenta, włączając ich status
        demo_aparaty = db.execute("""
            SELECT m.item_id, m.produkt_id, m.status
            FROM Magazyn m JOIN Produkty p ON m.produkt_id = p.produkt_id
            WHERE m.pacjent_id = ? AND p.typ = 'Aparat' AND m.typ_egzemplarza = 'Demo'
        """, (patient_id,)).fetchall()

        if not demo_aparaty:
            return jsonify({'message': 'Pacjent nie posiada aparatów DEMO do wymiany.'}), 404

        # Krok 2: Przetwórz każdy aparat DEMO osobno
        for item in demo_aparaty:
            old_status = item['status']

            if old_status in ['Oczekuje na zwrot (Demo)']:
                # Jeśli to był tylko placeholder, bezwzględnie go usuwamy
                db.execute("DELETE FROM Magazyn WHERE item_id = ?", (item['item_id'],))
            else:
                # Jeśli to był fizyczny egzemplarz, zwracamy go do magazynu jako dostępny
                db.execute("UPDATE Magazyn SET status = 'Dostępny', pacjent_id = NULL WHERE item_id = ?", (item['item_id'],))
                # I od razu próbujemy go przypisać komuś innemu z kolejki
                _try_fulfill_waiting_orders(db, item['produkt_id'], 'Demo')

        # Krok 3: Przypisz pacjentowi nowe wersje sprzedażowe tych samych modeli
        for item in demo_aparaty:
            _assign_product_to_patient(db, patient_id, item['produkt_id'], 1, 'Sprzedażowy')

        db.commit()
        return jsonify({'message': 'Pomyślnie przypisano wersje sprzedażowe aparatów.'})
    except Exception as e:
        db.rollback()
        print(f"BŁĄD KRYTYCZNY PODCZAS UPGRADE'U DO WERSJI SPRZEDAŻOWEJ: {e}")
        return jsonify({'message': f'Wystąpił błąd serwera: {e}'}), 500

@app.route('/api/patients/<int:patient_id>/update-wnioski', methods=['PUT'])
def update_wnioski(patient_id):
    data = request.json
    db = get_db()
    db.execute("UPDATE Pacjenci SET status_wnioskow = ? WHERE pacjent_id = ?", (data.get('status'), patient_id))
    db.commit()
    return jsonify({'message': 'Status wniosków zaktualizowany.'})

@app.route('/api/patients/<int:patient_id>/set-wypozyczono', methods=['PUT'])
def set_wypozyczono_status(patient_id):
    db = get_db()
    db.execute("UPDATE Pacjenci SET status_ogolny = 'Wypożyczono', data_wypozyczenia = date('now') WHERE pacjent_id = ?", (patient_id,))
    db.commit()
    return jsonify({'message': 'Status pacjenta został zaktualizowany.'})

@app.route('/api/patients/<int:patient_id>/notes', methods=['PUT'])
def save_patient_notes(patient_id):
    data = request.json
    db = get_db()
    db.execute("UPDATE Pacjenci SET notatki = ? WHERE pacjent_id = ?", (data.get('notatki', ''), patient_id))
    db.commit()
    return jsonify({'message': 'Notatki zostały pomyślnie zapisane.'})

@app.route('/api/patients/<int:patient_id>/audiograms', methods=['POST'])
def save_audiogram(patient_id):
    data = request.json
    if not data.get('image_data'): return jsonify({'message': 'Brak danych obrazu.'}), 400
    db = get_db()
    db.execute("INSERT INTO Audiogramy (pacjent_id, data_utworzenia, dane_obrazu) VALUES (?, date('now'), ?)", (patient_id, data['image_data']))
    db.commit()
    return jsonify({'message': 'Audiogram został pomyślnie zapisany.'}), 201

@app.route('/api/patients/<int:patient_id>', methods=['PUT'])
def update_patient(patient_id):
    """Aktualizuje dane istniejącego pacjenta."""
    data = request.json
    db = get_db()

    # Sprawdzamy, czy wymagane pola nie są puste
    if not data.get('imie') or not data.get('nazwisko') or not data.get('pesel'):
        return jsonify({'message': 'Imię, nazwisko i PESEL są wymagane.'}), 400

    try:
        db.execute("""
            UPDATE Pacjenci
            SET imie = ?, nazwisko = ?, telefon = ?, pesel = ?
            WHERE pacjent_id = ?
        """, (
            data['imie'], data['nazwisko'], data['telefon'],
            data['pesel'], patient_id
        ))
        db.commit()
        return jsonify({'message': 'Dane pacjenta zostały zaktualizowane.'})
    except sqlite3.IntegrityError:
        # Ten błąd wystąpi, jeśli spróbujemy zmienić PESEL na taki, który już istnieje
        return jsonify({'message': 'Pacjent z tym numerem PESEL już istnieje w bazie danych.'}), 409
    except Exception as e:
        db.rollback()
        print(f"BŁĄD KRYTYCZNY PODCZAS EDYCJI PACJENTA: {e}")
        return jsonify({'message': f'Wystąpił błąd serwera: {e}'}), 500

# === SEKCJA PRODUKTÓW I SPRZĘTU ===

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    db = get_db()
    cursor = db.execute("SELECT produkt_id, nazwa, model, producent, cena, typ FROM Produkty ORDER BY producent, nazwa")
    return jsonify([dict(row) for row in cursor.fetchall()])

@app.route('/api/products-structured', methods=['GET'])
def get_structured_products():
    db = get_db()
    cursor = db.execute("SELECT producent, model, nazwa, produkt_id FROM Produkty WHERE typ = 'Aparat' ORDER BY producent, model, nazwa")
    structured_data = {}
    for row in cursor.fetchall():
        row_dict = dict(row)
        producent, model = row_dict['producent'], row_dict['model']
        if producent not in structured_data: structured_data[producent] = {}
        if model not in structured_data[producent]: structured_data[producent][model] = []
        structured_data[producent][model].append({'nazwa': row_dict['nazwa'], 'produkt_id': row_dict['produkt_id']})
    return jsonify(structured_data)

@app.route('/api/sluchawki-options/<producent>', methods=['GET'])
def get_sluchawki_options(producent):
    db = get_db()
    like_query = f"%Słuchawka {producent}%"
    cursor = db.execute("SELECT produkt_id, nazwa FROM Produkty WHERE typ = 'Akcesorium' AND nazwa LIKE ?", (like_query,))
    return jsonify([dict(row) for row in cursor.fetchall()])

# W pliku app.py - ZASTĄP TĘ FUNKCJĘ

@app.route('/api/patients/<int:patient_id>/swap-aparat', methods=['POST'])
def swap_aparat(patient_id):
    """Obsługuje kompleksową logikę wymiany aparatów, warunkowo wymieniając słuchawki."""
    data = request.json
    new_aparat_id = data.get('new_aparat_id')
    new_sluchawka_id = data.get('new_sluchawka_id') # Może być None
    is_demo = data.get('is_demo', False)

    if not new_aparat_id:
        return jsonify({'message': 'Nie wybrano nowego aparatu.'}), 400

    db = get_db()
    try:
        # Znajdź stare aparaty do wymiany
        stare_aparaty = db.execute("SELECT m.item_id, m.produkt_id FROM Magazyn m JOIN Produkty p ON m.produkt_id = p.produkt_id WHERE m.pacjent_id = ? AND p.typ = 'Aparat'", (patient_id,)).fetchall()
        if not stare_aparaty:
            return jsonify({'message': 'Nie znaleziono aparatów do wymiany.'}), 404
        ilosc_do_wymiany = len(stare_aparaty)

        # Zawsze zwracaj starą ładowarkę (jeśli istniała)
        stara_ladowarka = db.execute("SELECT m.item_id FROM Magazyn m JOIN Produkty p ON m.produkt_id = p.produkt_id WHERE m.pacjent_id = ? AND p.nazwa LIKE 'Ładowarka%'", (patient_id,)).fetchone()
        if stara_ladowarka:
            db.execute("UPDATE Magazyn SET status = 'Dostępny', pacjent_id = NULL WHERE item_id = ?", (stara_ladowarka['item_id'],))

        # Jeśli podano nową słuchawkę (zmiana producenta), zwróć stare słuchawki
        if new_sluchawka_id:
            stare_sluchawki = db.execute("SELECT m.item_id FROM Magazyn m JOIN Produkty p ON m.produkt_id = p.produkt_id WHERE m.pacjent_id = ? AND p.nazwa LIKE 'Słuchawka%'", (patient_id,)).fetchall()
            for sluchawka in stare_sluchawki:
                db.execute("UPDATE Magazyn SET status = 'Dostępny', pacjent_id = NULL WHERE item_id = ?", (sluchawka['item_id'],))

        # Zawsze zwracaj stare aparaty i zapisuj w historii
        for stary_aparat in stare_aparaty:
            db.execute("INSERT INTO Historia_Wypozyczen (pacjent_id, produkt_id, data_rozpoczecia, data_zakonczenia) VALUES (?, ?, (SELECT data_wypozyczenia FROM Pacjenci WHERE pacjent_id = ?), date('now'))", (patient_id, stary_aparat['produkt_id'], patient_id))
            db.execute("UPDATE Magazyn SET status = 'Dostępny', pacjent_id = NULL WHERE item_id = ?", (stary_aparat['item_id'],))

        # Przypisz nowy sprzęt
        typ_egzemplarza = 'Demo' if is_demo else 'Sprzedażowy'
        _assign_product_to_patient(db, patient_id, new_aparat_id, ilosc_do_wymiany, typ_egzemplarza)

        if new_sluchawka_id: # Przypisz nowe słuchawki tylko jeśli zostały wybrane
            _assign_product_to_patient(db, patient_id, new_sluchawka_id, ilosc_do_wymiany, 'Sprzedażowy')

        # Przypisz nową ładowarkę, jeśli jest potrzebna
        nowy_aparat_produkt = db.execute("SELECT nazwa, producent FROM Produkty WHERE produkt_id = ?", (new_aparat_id,)).fetchone()
        if nowy_aparat_produkt:
            nazwa_upper = nowy_aparat_produkt['nazwa'].strip().upper()
            last_part = nazwa_upper.split()[-1]
            if last_part == 'R' or last_part == 'RT' or 'ENCANTA' in nazwa_upper:
                ladowarka_nazwa = f"Ładowarka {nowy_aparat_produkt['producent']} (Bez powerbanku)"
                ladowarka_info = db.execute("SELECT produkt_id FROM Produkty WHERE nazwa = ?", (ladowarka_nazwa,)).fetchone()
                if ladowarka_info:
                    _assign_product_to_patient(db, patient_id, ladowarka_info['produkt_id'])

        db.commit()
        return jsonify({'message': 'Aparaty zostały pomyślnie wymienione.'})
    except Exception as e:
        db.rollback()
        return jsonify({'message': f'Wystąpił błąd serwera: {e}'}), 500

# W pliku app.py - ZASTĄP TĘ FUNKCJĘ

@app.route('/api/patients/<int:patient_id>/swap-sluchawki', methods=['POST'])
def swap_sluchawki(patient_id):
    """
    Wymienia wszystkie słuchawki pacjenta na nowy model,
    poprawnie obsługując fizyczne zwroty i wirtualne zamówienia.
    """
    data = request.json
    new_sluchawka_id = data.get('new_sluchawka_id')
    if not new_sluchawka_id:
        return jsonify({'message': 'Nie wybrano nowej słuchawki.'}), 400

    db = get_db()
    try:
        # Krok 1: Znajdź wszystkie stare słuchawki, które pacjent posiada, WRAZ Z ICH STATUSEM
        stare_sluchawki = db.execute("""
            SELECT m.item_id, m.produkt_id, m.status
            FROM Magazyn m JOIN Produkty p ON m.produkt_id = p.produkt_id
            WHERE m.pacjent_id = ? AND p.nazwa LIKE 'Słuchawka%'
        """, (patient_id,)).fetchall()

        ilosc_do_wymiany = len(stare_sluchawki)

        if ilosc_do_wymiany == 0:
            return jsonify({'message': 'Pacjent nie posiada słuchawek do wymiany.'}), 404

        # Krok 2: Przetwórz każdą starą słuchawkę osobno
        for item in stare_sluchawki:
            # === KLUCZOWA ZMIANA LOGICZNA ===
            if item['status'] in ['Oczekuje na zamówienie', 'Oczekuje na zwrot (Demo)', 'Zamówiono']:
                # Jeśli to był tylko placeholder, bezwzględnie go usuwamy
                db.execute("DELETE FROM Magazyn WHERE item_id = ?", (item['item_id'],))
            else:
                # Jeśli to był fizyczny egzemplarz, zwracamy go do magazynu jako dostępny
                db.execute("UPDATE Magazyn SET status = 'Dostępny', pacjent_id = NULL WHERE item_id = ?", (item['item_id'],))

        # Krok 3: Użyj naszej uniwersalnej funkcji do przypisania nowych słuchawek.
        # Ta funkcja sama sprawdzi dostępność i ustawi poprawny status.
        _assign_product_to_patient(db, patient_id, new_sluchawka_id, ilosc_do_wymiany, 'Sprzedażowy')

        db.commit()
        return jsonify({'message': 'Słuchawki zostały pomyślnie wymienione.'})
    except Exception as e:
        db.rollback()
        print(f"BŁĄD KRYTYCZNY PODCZAS WYMIANY SŁUCHAWEK: {e}")
        return jsonify({'message': f'Wystąpił błąd serwera: {e}'}), 500

@app.route('/api/warehouse/item/<int:item_id>/promo-price', methods=['PUT'])
def set_promo_price(item_id):
    """Ustawia niestandardową cenę dla konkretnej pozycji w magazynie."""
    data = request.json
    # Używamy get('price', None) aby móc ustawić cenę 0.0
    price = data.get('price')
    if price is None:
        return jsonify({'message': 'Brak podanej ceny.'}), 400

    db = get_db()
    db.execute("UPDATE Magazyn SET cena_niestandardowa = ? WHERE item_id = ?", (float(price), item_id))
    db.commit()
    return jsonify({'message': 'Cena promocyjna została zapisana.'})

# === SEKCJA MAGAZYNU ===

# W pliku backend/app.py

# W pliku backend/app.py - ZASTĄP TĘ FUNKCJĘ

@app.route('/api/warehouse', methods=['GET'])
def get_warehouse_state():
    """Pobiera zagregowany, ogólny stan magazynu - Wersja Ostateczna i Poprawna."""
    db = get_db()
    try:
        # Nowe, bardziej stabilne zapytanie. Najpierw agreguje dane z magazynu,
        # a dopiero potem łączy je z pełną listą produktów.
        query = """
            WITH AggregatedStock AS (
                SELECT
                    produkt_id,
                    typ_egzemplarza,
                    COUNT(CASE WHEN status = 'Dostępny' THEN 1 END) as ilosc_dostepna,
                    COUNT(CASE WHEN status = 'Zarezerwowany' THEN 1 END) as ilosc_zarezerwowana,
                    COUNT(CASE WHEN status IN ('Oczekuje na zamówienie', 'Oczekuje na zwrot (Demo)', 'Zamówiono') THEN 1 END) as ilosc_oczekujaca,
                    COUNT(item_id) as ilosc_lacznie
                FROM Magazyn
                GROUP BY produkt_id, typ_egzemplarza
            )
            SELECT
                p.produkt_id, p.nazwa, p.model, p.producent, p.cena, p.typ,
                'Sprzedażowy' as typ_egzemplarza,
                COALESCE(ags_s.ilosc_dostepna, 0) as ilosc_dostepna,
                COALESCE(ags_s.ilosc_zarezerwowana, 0) as ilosc_zarezerwowana,
                COALESCE(ags_s.ilosc_oczekujaca, 0) as ilosc_oczekujaca,
                COALESCE(ags_s.ilosc_lacznie, 0) as ilosc_lacznie
            FROM Produkty p
            LEFT JOIN AggregatedStock ags_s ON p.produkt_id = ags_s.produkt_id AND ags_s.typ_egzemplarza = 'Sprzedażowy'

            UNION ALL

            SELECT
                p.produkt_id, p.nazwa, p.model, p.producent, p.cena, p.typ,
                'Demo' as typ_egzemplarza,
                COALESCE(ags_d.ilosc_dostepna, 0) as ilosc_dostepna,
                COALESCE(ags_d.ilosc_zarezerwowana, 0) as ilosc_zarezerwowana,
                COALESCE(ags_d.ilosc_oczekujaca, 0) as ilosc_oczekujaca,
                COALESCE(ags_d.ilosc_lacznie, 0) as ilosc_lacznie
            FROM Produkty p
            JOIN AggregatedStock ags_d ON p.produkt_id = ags_d.produkt_id AND ags_d.typ_egzemplarza = 'Demo'

            ORDER BY producent, nazwa, model, typ_egzemplarza;
        """
        cursor = db.execute(query)
        # Filtrujemy wyniki, aby usunąć puste wiersze, które nie mają żadnego stanu
        all_rows = [dict(row) for row in cursor.fetchall()]
        final_results = [row for row in all_rows if row['ilosc_lacznie'] > 0 or row['typ_egzemplarza'] == 'Sprzedażowy']

        return jsonify(final_results)

    except Exception as e:
        print(f"BŁĄD KRYTYCZNY W GET_WAREHOUSE_STATE: {e}")
        return jsonify({'message': f'Wystąpił błąd serwera: {e}'}), 500

@app.route('/api/warehouse/assigned', methods=['GET'])
def get_assigned_equipment():
    db = get_db()
    cursor = db.execute("""
        SELECT
            m.item_id, m.status, m.typ_egzemplarza, p.nazwa, p.model, p.producent, pac.imie, pac.nazwisko
        FROM Magazyn m
        JOIN Produkty p ON m.produkt_id = p.produkt_id
        LEFT JOIN Pacjenci pac ON m.pacjent_id = pac.pacjent_id
        WHERE m.pacjent_id IS NOT NULL
        ORDER BY pac.nazwisko, pac.imie
    """)
    return jsonify([dict(row) for row in cursor.fetchall()])

@app.route('/api/warehouse/add-stock', methods=['POST'])
def add_stock():
    data = request.json
    produkt_id, quantity_to_add, typ_egzemplarza = data.get('produkt_id'), data.get('quantity'), data.get('typ_egzemplarza', 'Sprzedażowy')
    if not produkt_id or not quantity_to_add or int(quantity_to_add) <= 0: return jsonify({'message': 'Nieprawidłowe dane.'}), 400

    db = get_db()
    try:
        for _ in range(int(quantity_to_add)):
            db.execute("INSERT INTO Magazyn (produkt_id, status, typ_egzemplarza, pacjent_id) VALUES (?, 'Dostępny', ?, NULL)", (produkt_id, typ_egzemplarza))

        # --- POPRAWKA TUTAJ ---
        # Wywołujemy funkcję pomocniczą z odpowiednim typem egzemplarza
        _try_fulfill_waiting_orders(db, produkt_id, typ_egzemplarza)

        db.commit()
        return jsonify({'message': f"Dodano {quantity_to_add} sztuk do magazynu."}), 201
    except Exception as e:
        db.rollback()
        print(f"BŁĄD KRYTYCZNY PODCZAS DODAWANIA DO MAGAZYNU: {e}")
        return jsonify({'message': f"Wystąpił błąd serwera: {e}"}), 500

@app.route('/api/warehouse/bulk-add-stock', methods=['POST'])
def bulk_add_stock():
    """Dodaje wiele różnych produktów do magazynu, uwzględniając wersje DEMO."""
    items_to_add = request.json
    if not isinstance(items_to_add, list): return jsonify({'message': 'Nieprawidłowy format danych.'}), 400

    db = get_db()
    try:
        for item in items_to_add:
            produkt_id = item.get('produkt_id')
            quantity = item.get('quantity')
            is_demo = item.get('is_demo', False) # Odbieramy nową informację

            if not produkt_id or not quantity or int(quantity) <= 0: continue

            typ_egzemplarza = 'Demo' if is_demo else 'Sprzedażowy'

            for _ in range(int(quantity)):
                db.execute("INSERT INTO Magazyn (produkt_id, status, typ_egzemplarza, pacjent_id) VALUES (?, 'Dostępny', ?, NULL)", (produkt_id, typ_egzemplarza))

            # Po dodaniu, spróbuj przypisać towar do oczekujących pacjentów
            _try_fulfill_waiting_orders(db, produkt_id, typ_egzemplarza)

        db.commit()
        return jsonify({'message': 'Dostawa została pomyślnie przetworzona.'})
    except Exception as e:
        db.rollback()
        print(f"BŁĄD KRYTYCZNY PODCZAS DODAWANIA DOSTAWY: {e}")
        return jsonify({'message': f"Wystąpił błąd serwera: {e}"}), 500

@app.route('/api/warehouse/adjust-stock', methods=['POST'])
def adjust_stock():
    adjustments = request.json
    if not isinstance(adjustments, list): return jsonify({'message': 'Nieprawidłowy format.'}), 400
    db = get_db()
    try:
        for adj in adjustments:
            produkt_id, change = adj.get('produkt_id'), int(adj.get('change', 0))
            # Zakładamy, że ręczna korekta dotyczy tylko wersji sprzedażowych
            typ_egzemplarza = 'Sprzedażowy'
            if change > 0:
                for _ in range(change):
                    db.execute("INSERT INTO Magazyn (produkt_id, status, pacjent_id, typ_egzemplarza) VALUES (?, 'Dostępny', NULL, ?)", (produkt_id, typ_egzemplarza))
                _try_fulfill_waiting_orders(db, produkt_id, typ_egzemplarza)
            elif change < 0:
                num_to_delete = abs(change)
                items_to_delete_cursor = db.execute("SELECT item_id FROM Magazyn WHERE produkt_id = ? AND status = 'Dostępny' AND typ_egzemplarza = ? LIMIT ?", (produkt_id, typ_egzemplarza, num_to_delete))
                items_to_delete = [row['item_id'] for row in items_to_delete_cursor.fetchall()]
                if items_to_delete:
                    db.execute("DELETE FROM Magazyn WHERE item_id IN ({})".format(','.join('?' for _ in items_to_delete)), items_to_delete)
        db.commit()
        return jsonify({'message': 'Korekta magazynu została zapisana.'})
    except Exception as e:
        db.rollback()
        print(f"BŁĄD KRYTYCZNY PODCZAS KOREKTY MAGAZYNU: {e}")
        return jsonify({'message': f'Wystąpił błąd serwera: {e}'}), 500

@app.route('/api/warehouse/item/<int:item_id>/status', methods=['PUT'])
def update_item_status(item_id):
    data = request.json
    new_status = data.get('new_status')
    if not new_status: return jsonify({'message': 'Brak nowego statusu'}), 400
    db = get_db()
    db.execute("UPDATE Magazyn SET status = ? WHERE item_id = ?", (new_status, item_id))
    db.commit()
    return jsonify({'message': f'Status przedmiotu {item_id} zaktualizowany na {new_status}.'})

@app.route('/api/warehouse/item/<int:item_id>/serial', methods=['PUT'])
def update_serial_number(item_id):
    """Aktualizuje numer seryjny dla konkretnej pozycji w magazynie."""
    data = request.json
    serial_number = data.get('serial_number', '')
    db = get_db()
    try:
        db.execute("UPDATE Magazyn SET numer_seryjny = ? WHERE item_id = ?", (serial_number, item_id))
        db.commit()
        return jsonify({'message': 'Numer seryjny zaktualizowany.'})
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Ten numer seryjny jest już przypisany do innego produktu.'}), 409
    except Exception as e:
        db.rollback()
        return jsonify({'message': f'Błąd serwera: {e}'}), 500

@app.route('/api/warehouse/sell-consumable', methods=['POST'])
def sell_consumable():
    """Obsługuje szybką sprzedaż i tworzy czytelny wpis w module finansowym."""
    data = request.json
    produkt_id, quantity_sold = data.get('produkt_id'), int(data.get('quantity'))
    if not produkt_id or not quantity_sold or quantity_sold <= 0:
        return jsonify({'message': 'Nieprawidłowe dane.'}), 400

    db = get_db()
    try:
        product_info = db.execute("SELECT nazwa, model, cena FROM Produkty WHERE produkt_id = ?", (produkt_id,)).fetchone()
        if not product_info: return jsonify({'message': 'Nie znaleziono produktu.'}), 404

        price_per_unit = product_info['cena']

        available_items_cursor = db.execute("SELECT item_id FROM Magazyn WHERE produkt_id = ? AND status = 'Dostępny'", (produkt_id,))
        available_ids = [row['item_id'] for row in available_items_cursor.fetchall()]

        if len(available_ids) < quantity_sold:
            return jsonify({'message': f'Niewystarczająca ilość na stanie. Dostępne: {len(available_ids)} szt.'}), 400

        kwota_laczna = price_per_unit * quantity_sold

        # --- ZMIANA TUTAJ: Tworzymy bardziej opisowy wpis do transakcji ---
        pacjent_imie_placeholder = "Sprzedaż Bezpośrednia"
        # W polu nazwiska umieszczamy nazwę produktu
        pacjent_nazwisko_placeholder = f"({product_info['nazwa']} typ {product_info['model']})"

        transakcja_cursor = db.execute(
            "INSERT INTO Transakcje (pacjent_imie, pacjent_nazwisko, kwota_laczna, data_transakcji) VALUES (?, ?, ?, date('now'))",
            (pacjent_imie_placeholder, pacjent_nazwisko_placeholder, kwota_laczna)
        )
        new_transakcja_id = transakcja_cursor.lastrowid

        db.execute(
            "INSERT INTO Pozycje_Transakcji (transakcja_id, produkt_nazwa, produkt_model, cena_za_sztuke, ilosc) VALUES (?, ?, ?, ?, ?)",
            (new_transakcja_id, product_info['nazwa'], product_info['model'], price_per_unit, quantity_sold)
        )

        ids_to_delete = available_ids[:quantity_sold]
        placeholders = ','.join('?' for _ in ids_to_delete)
        db.execute(f"DELETE FROM Magazyn WHERE item_id IN ({placeholders})", ids_to_delete)

        db.commit()
        return jsonify({'message': f'Zarejestrowano sprzedaż {quantity_sold} szt.'}), 200
    except Exception as e:
        db.rollback()
        print(f"BŁĄD KRYTYCZNY PODCZAS SPRZEDAŻY: {e}")
        return jsonify({'message': f'Wystąpił błąd serwera: {e}'}), 500

@app.route('/api/warehouse/item/<int:item_id>/swap-charger', methods=['PUT'])
def swap_charger(item_id):
    """
    Wymienia ładowarkę (z/bez powerbanku) na jej przeciwieństwo.
    Poprawnie obsługuje egzemplarze fizyczne i wirtualne (oczekujące).
    """
    db = get_db()
    try:
        # Krok 1: Znajdź kluczowe informacje o starej ładowarce: jej status, nazwę, pacjenta
        old_charger_info = db.execute("""
            SELECT m.produkt_id, m.pacjent_id, m.status, p.nazwa
            FROM Magazyn m JOIN Produkty p ON m.produkt_id = p.produkt_id
            WHERE m.item_id = ?
        """, (item_id,)).fetchone()

        if not old_charger_info:
            return jsonify({'message': 'Nie znaleziono ładowarki do wymiany.'}), 404

        old_charger_name = old_charger_info['nazwa']
        pacjent_id = old_charger_info['pacjent_id']
        old_status = old_charger_info['status']

        # Krok 2: Ustal producenta i typ docelowej ładowarki
        producent = 'Bernafon' if 'Bernafon' in old_charger_name else 'Audibel'

        # Logika dwukierunkowej wymiany
        if '(Z powerbankiem)' in old_charger_name:
            new_charger_name = f"Ładowarka {producent} (Bez powerbanku)"
        else:
            new_charger_name = f"Ładowarka {producent} (Z powerbankiem)"

        # Krok 3: Znajdź ID nowej ładowarki
        new_charger_produkt = db.execute("SELECT produkt_id FROM Produkty WHERE nazwa = ?", (new_charger_name,)).fetchone()
        if not new_charger_produkt:
            return jsonify({'message': f'Błąd krytyczny: Nie znaleziono w katalogu produktu: "{new_charger_name}".'}), 500
        new_charger_produkt_id = new_charger_produkt['produkt_id']

        # Krok 4: Poprawnie obsłuż starą ładowarkę (NAJWAŻNIEJSZA ZMIANA)
        if old_status in ['Oczekuje na zamówienie', 'Oczekuje na zwrot (Demo)']:
            # Jeśli to był tylko placeholder, bezwzględnie go usuń
            db.execute("DELETE FROM Magazyn WHERE item_id = ?", (item_id,))
        else:
            # Jeśli to był fizyczny egzemplarz, zwróć go do magazynu
            db.execute("UPDATE Magazyn SET status = 'Dostępny', pacjent_id = NULL WHERE item_id = ?", (item_id,))

        # Krok 5: Przypisz nową ładowarkę pacjentowi (ta funkcja sama obsłuży dostępność)
        _assign_product_to_patient(db, pacjent_id, new_charger_produkt_id, 1, 'Sprzedażowy')

        db.commit()
        return jsonify({'message': 'Pomyślnie wymieniono ładowarkę.'})

    except Exception as e:
        db.rollback()
        print(f"BŁĄD KRYTYCZNY PODCZAS WYMIANY ŁADOWARKI: {e}")
        return jsonify({'message': f'Wystąpił błąd serwera: {e}'}), 500

# === SEKCJA FINANSÓW ===

@app.route('/api/finances/monthly-summaries', methods=['GET'])
def get_monthly_summaries():
    """Zwraca podsumowanie sprzedaży dla każdego miesiąca."""
    db = get_db()
    # Używamy strftime do grupowania transakcji po roku i miesiącu
    cursor = db.execute("""
        SELECT
            strftime('%Y-%m', data_transakcji) as miesiac,
            SUM(kwota_laczna) as suma_miesieczna,
            COUNT(transakcja_id) as liczba_transakcji
        FROM Transakcje
        GROUP BY miesiac
        ORDER BY miesiac DESC
    """)
    return jsonify([dict(row) for row in cursor.fetchall()])

@app.route('/api/finances/available-months', methods=['GET'])
def get_available_months():
    """Zwraca listę miesięcy, dla których istnieją transakcje."""
    db = get_db()
    cursor = db.execute(
        "SELECT DISTINCT strftime('%Y-%m', data_transakcji) as miesiac FROM Transakcje ORDER BY miesiac DESC"
    )
    return jsonify([row['miesiac'] for row in cursor.fetchall()])

@app.route('/api/finances/transactions', methods=['GET'])
def get_transactions_for_month():
    """Zwraca listę transakcji dla danego miesiąca (w formacie RRRR-MM)."""
    month = request.args.get('month')
    if not month:
        return jsonify({'message': 'Brak parametru miesiąca.'}), 400

    db = get_db()
    cursor = db.execute(
        """
        SELECT transakcja_id, data_transakcji, pacjent_imie, pacjent_nazwisko, kwota_laczna
        FROM Transakcje
        WHERE strftime('%Y-%m', data_transakcji) = ?
        ORDER BY data_transakcji DESC
        """,
        (month,)
    )

    summary_cursor = db.execute(
        "SELECT SUM(kwota_laczna) as total FROM Transakcje WHERE strftime('%Y-%m', data_transakcji) = ?",
        (month,)
    )
    total = summary_cursor.fetchone()["total"] or 0.0

    return jsonify({"transactions": [dict(row) for row in cursor.fetchall()], "summary": {"total": total}})

@app.route('/api/finances/transactions/<int:transaction_id>', methods=['GET'])
def get_transaction_details(transaction_id):
    """Zwraca szczegóły (pozycje) dla pojedynczej transakcji, w tym produkt_id."""
    db = get_db()
    # Poprawione zapytanie, które jest teraz zgodne ze schematem
    cursor = db.execute("SELECT * FROM Pozycje_Transakcji WHERE transakcja_id = ?", (transaction_id,))
    return jsonify([dict(row) for row in cursor.fetchall()])

# W pliku app.py - zastąp starą funkcję
# W pliku app.py - ZASTĄP TĘ FUNKCJĘ

@app.route('/api/finances/transaction-item/<int:item_id>', methods=['PUT'])
def update_transaction_item(item_id):
    """Aktualizuje lub usuwa pozycję w transakcji, a także całą transakcję, jeśli jest pusta."""
    data = request.json
    new_quantity = int(data.get('quantity', 0))

    db = get_db()
    try:
        item_info = db.execute("SELECT transakcja_id, produkt_id FROM Pozycje_Transakcji WHERE pozycja_id = ?", (item_id,)).fetchone()
        if not item_info:
            return jsonify({'message': 'Nie znaleziono pozycji transakcji.'}), 404
        transakcja_id = item_info['transakcja_id']

        if new_quantity > 0:
            # Dla pozycji ręcznych (bez ID produktu) pozwalamy na pełną edycję
            if item_info['produkt_id'] is None:
                new_name = data.get('name')
                new_price = float(data.get('price'))
                db.execute("UPDATE Pozycje_Transakcji SET ilosc = ?, produkt_nazwa = ?, cena_za_sztuke = ? WHERE pozycja_id = ?",
                           (new_quantity, new_name, new_price, item_id))
            else: # Dla pozycji z magazynu edytujemy tylko ilość
                db.execute("UPDATE Pozycje_Transakcji SET ilosc = ? WHERE pozycja_id = ?", (new_quantity, item_id))
        else:
            # Jeśli nowa ilość to 0, bezwzględnie usuwamy pozycję
            db.execute("DELETE FROM Pozycje_Transakcji WHERE pozycja_id = ?", (item_id,))

        # Po każdej zmianie, przelicz na nowo sumę całej transakcji
        items_left_cursor = db.execute("SELECT COUNT(*) as count, SUM(cena_za_sztuke * ilosc) as new_total FROM Pozycje_Transakcji WHERE transakcja_id = ?", (transakcja_id,))
        summary = items_left_cursor.fetchone()

        if summary['count'] == 0:
            db.execute("DELETE FROM Transakcje WHERE transakcja_id = ?", (transakcja_id,))
        else:
            new_total = summary['new_total'] or 0.0
            db.execute("UPDATE Transakcje SET kwota_laczna = ? WHERE transakcja_id = ?", (new_total, transakcja_id))

        db.commit()
        return jsonify({'message': 'Zmiany w transakcji zostały zapisane.'})
    except Exception as e:
        db.rollback()
        return jsonify({'message': f'Wystąpił błąd serwera: {e}'}), 500

@app.route('/api/finances/manual-transaction', methods=['POST'])
def create_full_manual_transaction():
    """Tworzy nową transakcję na podstawie w pełni ręcznie wpisanych pozycji."""
    items_to_add = request.json
    if not isinstance(items_to_add, list) or not items_to_add:
        return jsonify({'message': 'Brak pozycji do dodania.'}), 400

    db = get_db()
    try:
        # Oblicz sumę całej transakcji
        kwota_laczna = sum(float(item.get('price', 0)) * int(item.get('quantity', 0)) for item in items_to_add)

        # Użyj nazwy pierwszej pozycji jako nazwy transakcji
        pacjent_imie_placeholder = items_to_add[0].get('name', 'Transakcja Ręczna')
        pacjent_nazwisko_placeholder = f"(+ {len(items_to_add) - 1} poz.)" if len(items_to_add) > 1 else "(Ręczna)"

        # Stwórz nową, główną transakcję
        trans_cursor = db.execute(
            "INSERT INTO Transakcje (pacjent_imie, pacjent_nazwisko, kwota_laczna, data_transakcji) VALUES (?, ?, ?, date('now'))",
            (pacjent_imie_placeholder, pacjent_nazwisko_placeholder, kwota_laczna)
        )
        new_transakcja_id = trans_cursor.lastrowid

        # Dodaj każdą ręcznie wpisaną pozycję do tej transakcji
        for item in items_to_add:
            db.execute(
                "INSERT INTO Pozycje_Transakcji (transakcja_id, produkt_nazwa, cena_za_sztuke, ilosc) VALUES (?, ?, ?, ?)",
                (new_transakcja_id, item.get('name'), float(item.get('price')), int(item.get('quantity')))
            )

        db.commit()
        return jsonify({'message': 'Nowa transakcja ręczna została pomyślnie zapisana.'}), 201
    except Exception as e:
        db.rollback()
        print(f"BŁĄD KRYTYCZNY PRZY TWORZENIU TRANSAKCJI RĘCZNEJ: {e}")
        return jsonify({'message': f'Wystąpił błąd serwera: {e}'}), 500

# Wklej tę funkcję w app.py, w sekcji finansów

@app.route('/api/finances/transactions/<int:transaction_id>/manual-item', methods=['POST'])
def add_manual_item_to_transaction(transaction_id):
    """Dodaje nową, ręcznie wpisaną pozycję do istniejącej transakcji."""
    data = request.json
    name = data.get('name')
    price = float(data.get('price', 0))
    quantity = int(data.get('quantity', 1))

    if not name or price < 0 or quantity <= 0:
        return jsonify({'message': 'Nieprawidłowe dane: nazwa i cena są wymagane.'}), 400

    db = get_db()
    try:
        # Dodaj nową pozycję, produkt_id jest celowo pusty (NULL)
        db.execute(
            "INSERT INTO Pozycje_Transakcji (transakcja_id, produkt_nazwa, cena_za_sztuke, ilosc) VALUES (?, ?, ?, ?)",
            (transaction_id, name, price, quantity)
        )

        # Przelicz sumę całej transakcji
        total_cursor = db.execute("SELECT SUM(cena_za_sztuke * ilosc) as new_total FROM Pozycje_Transakcji WHERE transakcja_id = ?", (transaction_id,))
        new_total = total_cursor.fetchone()['new_total'] or 0.0
        db.execute("UPDATE Transakcje SET kwota_laczna = ? WHERE transakcja_id = ?", (new_total, transaction_id))

        db.commit()
        return jsonify({'message': 'Dodano nową pozycję do transakcji.'}), 201
    except Exception as e:
        db.rollback()
        print(f"BŁĄD KRYTYCZNY PRZY DODAWANIU POZYCJI RĘCZNEJ: {e}")
        return jsonify({'message': f'Wystąpił błąd serwera: {e}'}), 500

# === SEKCJA REKLAMACJI ===

@app.route('/api/complaints', methods=['POST'])
def create_complaint_patient():
    """Tworzy nowego pacjenta i przypisaną do niego reklamację."""
    data = request.json
    db = get_db()

    try:
        cursor = db.execute("INSERT INTO Pacjenci (imie, nazwisko, telefon, pesel, data_urodzenia) VALUES (?, ?, ?, ?, ?)",
            (data['imie'], data['nazwisko'], data['telefon'], data['pesel'], data['data_urodzenia']))
        new_patient_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Pacjent z tym numerem PESEL już istnieje.'}), 409

    try:
        if data.get('reklamacja_aparaty'):
            db.execute("INSERT INTO Reklamacje (pacjent_id, typ_reklamacji, opis, status, data_utworzenia) VALUES (?, 'Aparaty', ?, 'Przyjęto', date('now'))",
                (new_patient_id, data.get('opis_aparaty', '')))

        if data.get('reklamacja_wkladki'):
            db.execute("INSERT INTO Reklamacje (pacjent_id, typ_reklamacji, opis, status, data_utworzenia) VALUES (?, 'Wkładki', ?, 'Przyjęto', date('now'))",
                (new_patient_id, data.get('opis_wkladki', '')))

        db.commit()
        return jsonify({'message': 'Nowa reklamacja została pomyślnie utworzona.', 'pacjent_id': new_patient_id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'message': f'Wystąpił błąd serwera: {e}'}), 500

@app.route('/api/complaints/<int:reklamacja_id>/status', methods=['PUT'])
def update_complaint_status(reklamacja_id):
    """Aktualizuje status reklamacji i dodaje wpis do historii."""
    data = request.json
    new_status = data.get('new_status')
    db = get_db()
    try:
        db.execute("UPDATE Reklamacje SET status = ? WHERE reklamacja_id = ?", (new_status, reklamacja_id))
        db.execute("INSERT INTO Historia_Reklamacji (reklamacja_id, status_zmieniony_na) VALUES (?, ?)", (reklamacja_id, new_status))
        db.commit()
        return jsonify({'message': f'Status reklamacji zaktualizowany na {new_status}.'})
    except Exception as e:
        db.rollback()
        return jsonify({'message': f'Błąd serwera: {e}'}), 500

@app.route('/api/complaints/<int:reklamacja_id>/description', methods=['PUT'])
def update_complaint_description(reklamacja_id):
    """Aktualizuje opis/notatki dla reklamacji."""
    data = request.json
    db = get_db()
    db.execute("UPDATE Reklamacje SET opis = ? WHERE reklamacja_id = ?", (data.get('opis', ''), reklamacja_id))
    db.commit()
    return jsonify({'message': 'Opis reklamacji został zaktualizowany.'})

@app.route("/")
def redirect_to_ui():
    return redirect("/frontend/index.html")  # Jeśli wrzuciłeś frontend jako statyczne pliki

# --- URUCHOMIENIE APLIKACJI ---
if __name__ == '__main__':
    _perform_backup()
    app.run(debug=True)