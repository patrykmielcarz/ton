# plik: backend/restore_db.py

import os
import shutil

DB_FILE = 'database.db'
BACKUP_FILE = 'database_backup.db'

# DB_FILE = '/home/tonmedica/folder bez nazwy 2/backend/database.db'
# BACKUP_FILE = '/home/tonmedica/folder bez nazwy 2/backend/database_backup.db'

def restore_from_backup():
    """Odtwarza bazę danych z pliku kopii zapasowej."""
    
    print("--- Rozpoczynanie procedury odtwarzania bazy danych ---")
    
    # Sprawdź, czy plik kopii zapasowej istnieje
    if not os.path.exists(BACKUP_FILE):
        print(f"BŁĄD: Plik kopii zapasowej '{BACKUP_FILE}' nie został znaleziony!")
        print("Odtwarzanie przerwane.")
        return

    try:
        # Kopiujemy plik backupu i nadpisujemy nim główny plik bazy danych
        shutil.copy2(BACKUP_FILE, DB_FILE)
        print(f"Pomyślnie odtworzono bazę danych z pliku '{BACKUP_FILE}'.")
        print("Możesz teraz bezpiecznie uruchomić główną aplikację.")
    except Exception as e:
        print(f"Wystąpił błąd podczas odtwarzania: {e}")

if __name__ == '__main__':
    # Dodatkowe potwierdzenie od użytkownika dla bezpieczeństwa
    confirm = input(f"Czy na pewno chcesz nadpisać plik '{DB_FILE}' zawartością pliku '{BACKUP_FILE}'? (tak/nie): ")
    if confirm.lower() == 'tak':
        restore_from_backup()
    else:
        print("Procedura odtwarzania anulowana.")