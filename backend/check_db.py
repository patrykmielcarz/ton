# plik: backend/check_db.py

import sqlite3

DATABASE = 'database.db'

def check_all_patients():
    print("--- Sprawdzanie zawartości tabeli Pacjenci ---")
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Wybieramy wszystkie kluczowe dane z tabeli
        cursor.execute("SELECT pacjent_id, imie, nazwisko, pesel FROM Pacjenci;")
        
        all_patients = cursor.fetchall()
        
        if not all_patients:
            print("Tabela Pacjenci jest pusta.")
            return

        print(f"Znaleziono {len(all_patients)} pacjentów w bazie danych:")
        print("ID | Imię      | Nazwisko    | PESEL")
        print("-------------------------------------------------")
        
        # Drukujemy każdego pacjenta w czytelny sposób
        for patient in all_patients:
            # Wartości None zamieniamy na czytelny tekst 'PUSTE'
            pacjent_id, imie, nazwisko, pesel = (val if val is not None else 'PUSTE' for val in patient)
            print(f"{pacjent_id:<2} | {imie:<10} | {nazwisko:<12} | {pesel}")

    except Exception as e:
        print(f"Wystąpił błąd: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == '__main__':
    check_all_patients()