import sqlite3

DATABASE = 'database.db'

# DATABASE = '/home/tonmedica/folder bez nazwy 2/backend/database.db'

# Zweryfikowana i kompletna struktura danych
dane_kompletne = {
    "firmy": {
      "Bernafon": {
        "ENCANTA": [
          { "nazwa": "Bernafon ENCANTA 400 MNR", "cena": 10400 },
          { "nazwa": "Bernafon ENCANTA 300 MNR", "cena": 8500 },
          { "nazwa": "Bernafon ENCANTA 200 MNR", "cena": 6900 },
          { "nazwa": "Bernafon ENCANTA 100 MNR", "cena": 4990 },
        ],
        "ALPHA XT 5": [
          { "nazwa": "Bernafon ALPHA XT 5 MNR T R", "cena": 7271 },
          { "nazwa": "Bernafon ALPHA XT 5 MNR T", "cena": 6757 },
          { "nazwa": "Bernafon ALPHA XT 5 MNB T R", "cena": 7271 },
          { "nazwa": "Bernafon ALPHA XT 5 MNB T", "cena": 6757 },
        ],
        "ALPHA 3": [
          { "nazwa": "Bernafon ALPHA 3 MNR T R", "cena": 5355 },
          { "nazwa": "Bernafon ALPHA 3 MNR T", "cena": 4925 },
          { "nazwa": "Bernafon ALPHA 3 MNB T R", "cena": 5355 },
          { "nazwa": "Bernafon ALPHA 3 MNB T", "cena": 4925 },
          { "nazwa": "Bernafon ALPHA 3 ITE HS", "cena": 5525 },
          { "nazwa": "Bernafon ALPHA 3 ITE FS", "cena": 5525 },
          { "nazwa": "Bernafon ALPHA 3 ITC", "cena": 5525 },
          { "nazwa": "Bernafon ALPHA 3 CIC", "cena": 5525 },
          { "nazwa": "Bernafon ALPHA 3 IIC", "cena": 5525 },
        ],
        "ALPHA 1": [
          { "nazwa": "Bernafon ALPHA 1 MNR T R", "cena": 2800 },
          { "nazwa": "Bernafon ALPHA 1 MNR T", "cena": 3700 },
          { "nazwa": "Bernafon ALPHA 1 MNB T R", "cena": 2800 },
          { "nazwa": "Bernafon ALPHA 1 MNB T", "cena": 3700 },
          { "nazwa": "Bernafon ALPHA 1 ITE HS", "cena": 4200 },
          { "nazwa": "Bernafon ALPHA 1 ITE FS", "cena": 4200 },
          { "nazwa": "Bernafon ALPHA 1 ITC", "cena": 4295 },
          { "nazwa": "Bernafon ALPHA 1 CIC", "cena": 4200 },
          { "nazwa": "Bernafon ALPHA 1 IIC", "cena": 4200 },
        ],
        "LEOX": [
          { "nazwa": "Bernafon LEOX 7 SP", "cena": 6800 },
          { "nazwa": "Bernafon LEOX 7 UP", "cena": 6800 },
          { "nazwa": "Bernafon LEOX 3 SP", "cena": 4600 },
          { "nazwa": "Bernafon LEOX 3 UP", "cena": 4600 },
        ],
        "VIRON 3": [
          { "nazwa": "Bernafon VIRON 3 B105", "cena": 4260 },
          { "nazwa": "Bernafon VIRON 3 MNR T R", "cena": 5010 },
          { "nazwa": "Bernafon VIRON 3 MNR T", "cena": 4450 },
          { "nazwa": "Bernafon VIRON 3 MNR", "cena": 4450 },
        ],
        "VIRON 1": [
          { "nazwa": "Bernafon VIRON 1 B105", "cena": 3300 },
          { "nazwa": "Bernafon VIRON 1 MNR T R", "cena": 2700 },
          { "nazwa": "Bernafon VIRON 1 MNR T", "cena": 3500 },
          { "nazwa": "Bernafon VIRON 1 MNR", "cena": 3500 },
        ],
        "ENTRA A2": [
          { "nazwa": "Bernafon ENTRA A2 B105", "cena": 2650 },
          { "nazwa": "Bernafon ENTRA A2 MNR T", "cena": 2950 },
          { "nazwa": "Bernafon ENTRA A2 MNR", "cena": 2950 },
          { "nazwa": "Bernafon ENTRA A2 ITE HS", "cena": 3650 },
          { "nazwa": "Bernafon ENTRA A2 ITE FS", "cena": 3550 },
          { "nazwa": "Bernafon ENTRA A2 ITC", "cena": 3500 },
          { "nazwa": "Bernafon ENTRA A2 CIC", "cena": 3550 },
          { "nazwa": "Bernafon ENTRA A2 IIC", "cena": 3750 },
        ],
        "ENTRA A1": [
          { "nazwa": "Bernafon ENTRA A1 B105", "cena": 1500 },
          { "nazwa": "Bernafon ENTRA A1 MNR T", "cena": 2450 },
          { "nazwa": "Bernafon ENTRA A1 MNR", "cena": 2450 },
          { "nazwa": "Bernafon ENTRA A1 ITE HS", "cena": 2950 },
          { "nazwa": "Bernafon ENTRA A1 ITE FS", "cena": 2950 },
          { "nazwa": "Bernafon ENTRA A1 ITC", "cena": 2950 },
          { "nazwa": "Bernafon ENTRA A1 CIC", "cena": 2950 },
          { "nazwa": "Bernafon ENTRA A1 IIC", "cena": 3100 },
        ],
      },
      "Audibel": {
        "INTRIGUE AL 20": [
          { "nazwa": "Audibel INTRIGUE AL 20 RIC RT", "cena": 6500 },
          { "nazwa": "Audibel INTRIGUE AL 20 RIC 312", "cena": 6000 },
          { "nazwa": "Audibel INTRIGUE AL 20 MRIC R", "cena": 6500 },
          { "nazwa": "Audibel INTRIGUE AL 20 ITE R", "cena": 6500 },
          { "nazwa": "Audibel INTRIGUE AL 20 ITC R", "cena": 6500 },
          { "nazwa": "Audibel INTRIGUE AL 20 IIC NW", "cena": 6500 },
          { "nazwa": "Audibel INTRIGUE AL 20 CIC NW", "cena": 6500 },
          { "nazwa": "Audibel INTRIGUE AL 20 CIC", "cena": 6000 },
        ],
        "INTRIGUE AL 16": [
          { "nazwa": "Audibel INTRIGUE AL 16 RIC RT", "cena": 5500 },
          { "nazwa": "Audibel INTRIGUE AL 16 RIC 312", "cena": 5000 },
          { "nazwa": "Audibel INTRIGUE AL 16 MRIC R", "cena": 5500 },
          { "nazwa": "Audibel INTRIGUE AL 16 ITE R", "cena": 5500 },
          { "nazwa": "Audibel INTRIGUE AL 16 ITC R", "cena": 5500 },
          { "nazwa": "Audibel INTRIGUE AL 16 IIC NW", "cena": 5500 },
          { "nazwa": "Audibel INTRIGUE AL 16 CIC NW", "cena": 5500 },
          { "nazwa": "Audibel INTRIGUE AL 16 CIC", "cena": 5000 },
        ],
        "ARC AL 2400": [
          { "nazwa": "Audibel ARC AL 2400 RIC R", "cena": 6500 },
          { "nazwa": "Audibel ARC AL 2400 RIC 312", "cena": 6000 },
          { "nazwa": "Audibel ARC AL 2400 MRIC 312", "cena": 6000 },
          { "nazwa": "Audibel ARC AL 2400 ITE R", "cena": 6000 },
          { "nazwa": "Audibel ARC AL 2400 IIC NW", "cena": 6000 },
          { "nazwa": "Audibel ARC AL 2400 CIC NW", "cena": 6000 },
          { "nazwa": "Audibel ARC AL 2400 BTE R", "cena": 6000 },
          { "nazwa": "Audibel ARC AL 2400 BTE 13", "cena": 6000 },
        ],
        "ARC AL 2000": [
          { "nazwa": "Audibel ARC AL 2000 RIC R", "cena": 5500 },
          { "nazwa": "Audibel ARC AL 2000 RIC 312", "cena": 5000 },
          { "nazwa": "Audibel ARC AL 2000 MRIC 312", "cena": 5000 },
          { "nazwa": "Audibel ARC AL 2000 ITE R", "cena": 5000 },
          { "nazwa": "Audibel ARC AL 2000 IIC NW", "cena": 5000 },
          { "nazwa": "Audibel ARC AL 2000 CIC NW", "cena": 5000 },
          { "nazwa": "Audibel ARC AL 2000 BTE R", "cena": 5000 },
          { "nazwa": "Audibel ARC AL 2000 BTE 13", "cena": 5000 },
        ],
        "ARC AL 1600": [
          { "nazwa": "Audibel ARC AL 1600 RIC R", "cena": 4500 },
          { "nazwa": "Audibel ARC AL 1600 RIC 312", "cena": 4000 },
          { "nazwa": "Audibel ARC AL 1600 MRIC 312", "cena": 4000 },
          { "nazwa": "Audibel ARC AL 1600 ITE R", "cena": 4000 },
          { "nazwa": "Audibel ARC AL 1600 IIC NW", "cena": 4000 },
          { "nazwa": "Audibel ARC AL 1600 CIC NW", "cena": 4000 },
          { "nazwa": "Audibel ARC AL 1600 BTE R", "cena": 4000 },
          { "nazwa": "Audibel ARC AL 1600 BTE 13", "cena": 4000 },
        ],
        "ARC AL 1200": [
          { "nazwa": "Audibel ARC AL 1200 RIC R", "cena": 3500 },
          { "nazwa": "Audibel ARC AL 1200 RIC 312", "cena": 3000 },
          { "nazwa": "Audibel ARC AL 1200 MRIC 312", "cena": 3000 },
          { "nazwa": "Audibel ARC AL 1200 ITE R", "cena": 3000 },
          { "nazwa": "Audibel ARC AL 1200 CIC NW", "cena": 3000 },
          { "nazwa": "Audibel ARC AL 1200 BTE R", "cena": 3000 },
          { "nazwa": "Audibel ARC AL 1200 BTE 13", "cena": 3000 },
        ],
        "ARC AL 1000": [
          { "nazwa": "Audibel ARC AL 1000 RIC R", "cena": 2500 },
          { "nazwa": "Audibel ARC AL 1000 RIC 312", "cena": 2000 },
          { "nazwa": "Audibel ARC AL 1000 MRIC 312", "cena": 2000 },
          { "nazwa": "Audibel ARC AL 1000 ITE R", "cena": 2000 },
          { "nazwa": "Audibel ARC AL 1000 CIC NW", "cena": 2000 },
          { "nazwa": "Audibel ARC AL 1000 BTE R", "cena": 2500 },
        ],
        "MODEL A3": [
          { "nazwa": "Audibel MODEL A3 RIC 312", "cena": 2500 },
          { "nazwa": "Audibel MODEL A3 BTE 13", "cena": 2500 },
        ],
        "MODEL A2": [
          { "nazwa": "Audibel MODEL A2 RIC 312", "cena": 2000 },
          { "nazwa": "Audibel MODEL A2 BTE 13", "cena": 2000 },
        ],
      },
      "Akcesoria": {
        "Ładowarki": [
            {"nazwa": "Ładowarka Bernafon (Bez powerbanku)", "cena": 500},
            {"nazwa": "Ładowarka Bernafon (Z powerbankiem)", "cena": 750},
            {"nazwa": "Ładowarka Audibel (Bez powerbanku)", "cena": 500},
            {"nazwa": "Ładowarka Audibel (Z powerbankiem)", "cena": 750},
        ],
       "Słuchawki Bernafon": [
    {"nazwa": "Słuchawka Bernafon 60 dł. 2", "cena": 250},
    {"nazwa": "Słuchawka Bernafon 60 dł. 3", "cena": 250},
    {"nazwa": "Słuchawka Bernafon 60 dł. 4", "cena": 250},
    {"nazwa": "Słuchawka Bernafon 85 dł. 2", "cena": 250},
    {"nazwa": "Słuchawka Bernafon 85 dł. 3", "cena": 250},
    {"nazwa": "Słuchawka Bernafon 85 dł. 4", "cena": 250},
    {"nazwa": "Słuchawka Bernafon 100 dł. 2", "cena": 250},
    {"nazwa": "Słuchawka Bernafon 100 dł. 3", "cena": 250},
    {"nazwa": "Słuchawka Bernafon 100 dł. 4", "cena": 250}
],
"Słuchawki Audibel": [
    {"nazwa": "Słuchawka Audibel 40 dł. 2", "cena": 250},
    {"nazwa": "Słuchawka Audibel 40 dł. 3", "cena": 250},
    {"nazwa": "Słuchawka Audibel 40 dł. 4", "cena": 250},
    {"nazwa": "Słuchawka Audibel 50 dł. 2", "cena": 250},
    {"nazwa": "Słuchawka Audibel 50 dł. 3", "cena": 250},
    {"nazwa": "Słuchawka Audibel 50 dł. 4", "cena": 250},
    {"nazwa": "Słuchawka Audibel 60 dł. 2", "cena": 250},
    {"nazwa": "Słuchawka Audibel 60 dł. 3", "cena": 250},
    {"nazwa": "Słuchawka Audibel 60 dł. 4", "cena": 250}
]
      }
    }
}


def create_and_import_data():
    conn = None
    try:
        print("Tworzenie nowej bazy danych i tabel...")
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        with open('schema.sql', 'r') as f:
            cursor.executescript(f.read())
        print("Baza danych i tabele zostały utworzone.")

        print("Przetwarzanie danych o produktach...")
        produkty_do_importu = []
        for producent, modele in dane_kompletne['firmy'].items():
            for model, aparaty in modele.items():
                for aparat in aparaty:
                    typ_produktu = "Aparat"
                    if producent == "Akcesoria":
                        typ_produktu = "Akcesorium"
                    
                    nowy_produkt = {
                        "producent": producent,
                        "model": model,
                        "nazwa": aparat['nazwa'],
                        "cena": aparat['cena'],
                        "typ": typ_produktu
                    }
                    produkty_do_importu.append(nowy_produkt)

        print(f"Znaleziono {len(produkty_do_importu)} unikalnych produktów do zaimportowania.")

        for produkt in produkty_do_importu:
            cursor.execute("""
                INSERT INTO Produkty (nazwa, model, producent, typ, cena) 
                VALUES (?, ?, ?, ?, ?)
            """, (
                produkt.get("nazwa"), 
                produkt.get("model"), 
                produkt.get("producent"), 
                produkt.get("typ"),
                produkt.get("cena")
            ))

        print("Dodawanie przykładowych pacjentów...")
        cursor.execute("INSERT INTO Pacjenci (imie, nazwisko, telefon) VALUES (?, ?, ?)",
                   ('Jan', 'Kowalski', '123-456-789'))
        cursor.execute("INSERT INTO Pacjenci (imie, nazwisko, telefon) VALUES (?, ?, ?)",
                   ('Anna', 'Nowak', '987-654-321'))
        
        cursor.execute("INSERT INTO Produkty (nazwa, model, producent, cena, typ) VALUES (?, ?, ?, ?, ?)", ('Bateria', '10', 'Akcesoria', 2.50, 'Zużywalne'))
        cursor.execute("INSERT INTO Produkty (nazwa, model, producent, cena, typ) VALUES (?, ?, ?, ?, ?)", ('Bateria', '13', 'Akcesoria', 2.50, 'Zużywalne'))
        cursor.execute("INSERT INTO Produkty (nazwa, model, producent, cena, typ) VALUES (?, ?, ?, ?, ?)", ('Bateria', '312', 'Akcesoria', 2.50, 'Zużywalne'))
        cursor.execute("INSERT INTO Produkty (nazwa, model, producent, cena, typ) VALUES (?, ?, ?, ?, ?)", ('Bateria', '675', 'Akcesoria', 2.50, 'Zużywalne'))

        conn.commit()
        print(f"\nImport zakończony sukcesem! Dodano {len(produkty_do_importu) + 1} produktów.")

    except sqlite3.Error as e:
        print(f"Wystąpił błąd bazy danych: {e}")
    finally:
        if conn:
            conn.close()
            print("Połączenie z bazą danych zostało zamknięte.")


if __name__ == '__main__':
    create_and_import_data()