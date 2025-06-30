#!/bin/bash

# Pobierz ścieżkę do folderu, w którym znajduje się ten skrypt
BASE_DIR=$(cd "$(dirname "$0")"; pwd)

echo "Uruchamianie serwera Backend..."
# Uruchom serwer backendu w nowym oknie Terminala
osascript <<EOF
tell application "Terminal"
    do script "cd '$BASE_DIR/backend' && source '$BASE_DIR/.venv/bin/activate' && python app.py"
end tell
EOF

echo "Uruchamianie serwera Frontend..."
# Uruchom serwer frontendu w nowym oknie Terminala
osascript <<EOF
tell application "Terminal"
    do script "cd '$BASE_DIR/frontend' && python -m http.server"
end tell
EOF

echo "Oczekiwanie na start serwerów..."
# Daj serwerom 3 sekundy na uruchomienie się
sleep 3

echo "Otwieranie aplikacji w przeglądarce..."
open http://localhost:8000

echo "Gotowe!"