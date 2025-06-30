/* Plik: backend/schema.sql - Wersja Ostateczna */

DROP TABLE IF EXISTS Historia_Reklamacji;
DROP TABLE IF EXISTS Reklamacje;
DROP TABLE IF EXISTS Pozycje_Transakcji;
DROP TABLE IF EXISTS Transakcje;
DROP TABLE IF EXISTS Historia_Sprzedazy;
DROP TABLE IF EXISTS Audiogramy;
DROP TABLE IF EXISTS Historia_Wypozyczen;
DROP TABLE IF EXISTS Magazyn;
DROP TABLE IF EXISTS Produkty;
DROP TABLE IF EXISTS Pacjenci;

CREATE TABLE Pacjenci (
    pacjent_id INTEGER PRIMARY KEY AUTOINCREMENT,
    imie TEXT NOT NULL,
    nazwisko TEXT NOT NULL,
    telefon TEXT,
    pesel TEXT UNIQUE,
    data_urodzenia TEXT,
    status_wnioskow TEXT,
    status_ogolny TEXT,
    data_wypozyczenia TEXT,
    notatki TEXT
);

CREATE TABLE Produkty (
    produkt_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nazwa TEXT NOT NULL,
    model TEXT,
    producent TEXT,
    typ TEXT NOT NULL,
    cena REAL DEFAULT 0
);

CREATE TABLE Magazyn (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    produkt_id INTEGER NOT NULL REFERENCES Produkty(produkt_id),
    numer_seryjny TEXT UNIQUE,
    status TEXT NOT NULL,
    pacjent_id INTEGER NULL REFERENCES Pacjenci(pacjent_id),
    typ_egzemplarza TEXT NOT NULL DEFAULT 'Sprzedażowy',
    cena_niestandardowa REAL NULL
);

CREATE TABLE Historia_Wypozyczen (
    historia_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pacjent_id INTEGER NOT NULL REFERENCES Pacjenci(pacjent_id),
    produkt_id INTEGER NOT NULL REFERENCES Produkty(produkt_id),
    data_rozpoczecia TEXT NOT NULL,
    data_zakonczenia TEXT NOT NULL
);

CREATE TABLE Audiogramy (
    audiogram_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pacjent_id INTEGER NOT NULL REFERENCES Pacjenci(pacjent_id),
    data_utworzenia TEXT NOT NULL,
    dane_obrazu TEXT NOT NULL
);

CREATE TABLE Transakcje (
    transakcja_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pacjent_imie TEXT,
    pacjent_nazwisko TEXT,
    pacjent_pesel TEXT,
    kwota_laczna REAL NOT NULL,
    data_transakcji DATE NOT NULL
);

CREATE TABLE Pozycje_Transakcji (
    pozycja_id INTEGER PRIMARY KEY AUTOINCREMENT,
    transakcja_id INTEGER NOT NULL REFERENCES Transakcje(transakcja_id),
    produkt_id INTEGER NULL REFERENCES Produkty(produkt_id),
    produkt_nazwa TEXT NOT NULL,
    produkt_model TEXT,
    cena_za_sztuke REAL NOT NULL,
    ilosc INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE Reklamacje (
    reklamacja_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pacjent_id INTEGER NOT NULL REFERENCES Pacjenci(pacjent_id),
    typ_reklamacji TEXT NOT NULL, -- 'Aparaty' lub 'Wkładki'
    opis TEXT,
    status TEXT NOT NULL, -- 'Przyjęto', 'Wysłane', 'Odebrane', 'Powiadomiono'
    data_utworzenia DATE NOT NULL
);

CREATE TABLE Historia_Reklamacji (
    historia_id INTEGER PRIMARY KEY AUTOINCREMENT,
    reklamacja_id INTEGER NOT NULL REFERENCES Reklamacje(reklamacja_id),
    status_zmieniony_na TEXT NOT NULL,
    data_zmiany TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);