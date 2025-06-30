import sqlite3
DATABASE = 'database.db'

def check_database_state():
    print("\n--- Sprawdzanie zawartości tabeli Pacjenci ---")
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute("SELECT pacjent_id, imie, nazwisko, pesel FROM Pacjenci;")
        all_patients = cursor.fetchall()
        if not all_patients:
            print("Tabela Pacjenci jest pusta.")
        else:
            print(f"Znaleziono {len(all_patients)} pacjentów:")
            for p in all_patients: print(f"  ID: {p[0]}, Imię: {p[1]}, Nazwisko: {p[2]}, PESEL: {p[3]}")
        
        print("\n--- Sprawdzanie zawartości tabeli Magazyn ---")
        cursor.execute("SELECT item_id, produkt_id, status, pacjent_id FROM Magazyn;")
        all_items = cursor.fetchall()
        if not all_items:
            print("Tabela Magazyn jest pusta.")
        else:
            print(f"Znaleziono {len(all_items)} pozycji w magazynie:")
            for i in all_items: print(f"  Item ID: {i[0]}, Produkt ID: {i[1]}, Status: {i[2]}, Pacjent ID: {i[3]}")
        
    except Exception as e:
        print(f"Wystąpił błąd: {e}")
    finally:
        if 'conn' in locals() and conn: conn.close()

if __name__ == '__main__':
    check_database_state()