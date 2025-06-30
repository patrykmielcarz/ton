@echo off
REM --- Inteligentny Skrypt Startowy dla Aplikacji ---
ECHO.
ECHO ******************************************************
ECHO * URUCHAMIANIE SERWEROW APLIKACJI...          *
ECHO ******************************************************
ECHO.

REM Przejdz do folderu, w ktorym znajduje sie ten plik .bat
REM To jest kluczowy krok, ktory rozwiazuje problem z baza danych!
cd /d "%~dp0"

ECHO Uruchamianie srodowiska wirtualnego...
call .venv\Scripts\activate.bat

ECHO.
ECHO Uruchamianie serwera Backend (Flask)...
REM Uruchom serwer backendu w nowym, nazwanym oknie terminala
REM Komenda /k sprawia, ze okno pozostanie otwarte, wiec zobaczysz logi serwera
start "Backend Server" cmd /k "python backend/app.py"

ECHO.
ECHO Uruchamianie serwera Frontend (HTTP)...
REM Poczekaj chwile, aby backend sie uruchomil
timeout /t 2 /nobreak >nul

REM Uruchom serwer frontendu w nowym oknie, wskazujac folder i port
start "Frontend Server" cmd /k "python -m http.server 8000 --directory frontend"

ECHO.
ECHO Gotowe!
ECHO Aplikacja powinna byc dostepna pod adresem: http://localhost:8000
ECHO.
ECHO Mozesz zamknac to okno.