// Plik: frontend/js/ui.js - Wersja Kompletna i Poprawiona

// Deklaracje stałych dla elementów DOM
const patientListEl = document.getElementById('patient-list');
const patientDetailContainerEl = document.getElementById('patient-detail-container');
const inventoryContainerEl = document.getElementById('inventory-container');
const addPatientFormContainer = document.getElementById('add-patient-form-container');
const warehouseTableBodyEl = document.getElementById('warehouse-table-body');
const productSelectEl = document.getElementById('product-select');
const assignedEquipmentBodyEl = document.getElementById('assigned-equipment-body');

// Renderuje listę pacjentów
// W pliku ui.js - zastąp tę funkcję

function renderPatientList(patients) {
  patientListEl.innerHTML = '';
  if (!patients || patients.length === 0) {
      patientListEl.innerHTML = '<li>Brak pacjentów w bazie.</li>';
      return;
  }
  patients.forEach(patient => {
      const li = document.createElement('li');
      let statusHTML = '';
      if (patient.status_ogolny === 'Wypożyczono') {
          statusHTML += ' <span class="status status-wydany">Wypożyczono</span>';
      }
      if (patient.demo_count > 0) {
          statusHTML += ' <span class="status status-demo">DEMO</span>';
      }
      // POPRAWKA TUTAJ: Dodajemy sprawdzanie i wyświetlanie etykiety REKLAMACJA
      if (patient.complaint_count > 0) {
          statusHTML += ' <span class="status status-danger">REKLAMACJA</span>';
      }
      
      li.innerHTML = `${patient.imie} ${patient.nazwisko} ${statusHTML}`;
      li.dataset.patientId = patient.pacjent_id;
      patientListEl.appendChild(li);
  });
}

// Renderuje szczegółową kartę pacjenta
function renderPatientDetails(patientData) {
  // === POPRAWKA TUTAJ: Dodajemy 'reklamacje' do listy zmiennych ===
  const { 
      pacjent_id, imie, nazwisko, telefon, pesel, data_urodzenia, 
      status_wnioskow, status_ogolny, data_wypozyczenia, 
      sprzet, historia, notatki, audiogramy, reklamacje 
  } = patientData;

  let finalHTML = '';

  // Sprawdź, czy pacjent ma aktywne reklamacje. Jeśli tak, pokaż specjalny widok.
  if (reklamacje && reklamacje.length > 0) {
      let complaintDetailsHTML = '';
      reklamacje.forEach(comp => {
          const status_map = { 'Przyjęto': 'Wysłane', 'Wysłane': 'Odebrane', 'Odebrane': 'Powiadom pacjenta' };
          const next_status_text = status_map[comp.status];
          let actionButton = '';

          if (comp.status === 'Powiadomiono') {
              actionButton = `<p><strong>Proces reklamacyjny zakończony.</strong></p>`;
          } else if (next_status_text) {
              actionButton = `<button class="btn-update-complaint-status btn-warning" data-complaint-id="${comp.reklamacja_id}" data-new-status="${next_status_text}">${next_status_text}</button>`;
          }
          
          let historyHTML = '<ul>';
          comp.historia_reklamacji.forEach(h => {
              historyHTML += `<li>${new Date(h.data_zmiany).toLocaleString('pl-PL')}: ${h.status_zmieniony_na}</li>`;
          });
          historyHTML += '</ul>';

          complaintDetailsHTML += `
              <div class="complaint-card"><hr>
                  <h3>Reklamacja: ${comp.typ_reklamacji} (Status: ${comp.status})</h3>
                  <textarea class="complaint-description" data-complaint-id="${comp.reklamacja_id}" rows="4" placeholder="Wpisz szczegóły...">${comp.opis || ''}</textarea>
                  <button class="btn-save-complaint-description btn-info" data-complaint-id="${comp.reklamacja_id}">Zapisz opis</button>
                  <div class="complaint-actions">${actionButton}</div>
                  <h4>Historia statusów:</h4>
                  ${historyHTML}
              </div>
          `;
      });
      finalHTML = `<div class="patient-card"><h2>Reklamacje dla: ${imie} ${nazwisko}</h2><p><strong>Telefon:</strong> ${telefon || 'Brak'} | <strong>PESEL:</strong> ${pesel || 'Brak'}</p>${complaintDetailsHTML}</div>`;
  
  } else {
      // Jeśli to standardowy pacjent, renderuj widok sprzedaży
      let maPrzypisanyAparat = false;
      const maSluchawki = sprzet && sprzet.some(item => item.nazwa.includes('Słuchawka'));
      const audiogramURL = `audiogram.html?id=${pacjent_id}&name=${encodeURIComponent(imie + ' ' + nazwisko)}&pesel=${pesel}`;
      const createAudiogramBtn = `<button onclick="window.open('${audiogramURL}', '_blank')" class="btn-info">Stwórz Audiogram</button>`;
      
      let audiogramyHTML = '<h3>Zapisane audiogramy</h3>';
      if (audiogramy && audiogramy.length > 0) {
          audiogramyHTML += '<div class="audiogram-gallery">';
          audiogramy.forEach(ag => { const fileName = `audiogram_${nazwisko}_${ag.data_utworzenia}.png`; audiogramyHTML += `<div class="audiogram-thumbnail"><a href="${ag.dane_obrazu}" target="_blank"><img src="${ag.dane_obrazu}" alt="Audiogram z dnia ${ag.data_utworzenia}"></a><div class="thumbnail-actions"><span>${ag.data_utworzenia}</span><a href="${ag.dane_obrazu}" download="${fileName}" class="download-link">Pobierz</a></div></div>`; });
          audiogramyHTML += '</div>';
      } else { audiogramyHTML += '<p>Brak zapisanych audiogramów.</p>'; }

      let equipmentHTML = '<h3>Posiadany Sprzęt</h3>';
      if (sprzet && sprzet.length > 0) {
          equipmentHTML += '<ul class="equipment-list">';
          sprzet.forEach(item => {
              if (item.typ === 'Aparat') { maPrzypisanyAparat = true; }
              let actionButton = '', promoHTML = '', chargerSwapHTML = '';
              let statusClass = `status-${item.status.toLowerCase().replace(/ /g, '-').replace(/[()]/g, '')}`;
              
              if (item.status === 'Oczekuje na zamówienie') { actionButton = `<button class="btn-warning btn-mark-ordered" data-item-id="${item.item_id}">Zamówiono</button>`; } 
              else if (item.status === 'Zamówiono') { actionButton = `<button class="btn-success btn-mark-delivered" data-item-id="${item.item_id}">Dostarczono</button>`; }
              
              if (item.nazwa.includes('Ładowarka')) {
                  const isPromo = item.cena_niestandardowa !== null;
                  promoHTML = `<div class="promo-section"><label><input type="checkbox" class="promo-checkbox" data-item-id="${item.item_id}" ${isPromo ? 'checked' : ''}> PROMO</label><div id="promo-input-container-${item.item_id}" class="${isPromo ? '' : 'hidden'}"><input type="number" class="promo-price-input" value="${isPromo ? item.cena_niestandardowa : ''}" placeholder="Cena PROMO"><button class="btn-save-promo btn-success" data-item-id="${item.item_id}">Zapisz</button></div></div>`;
                  if (item.nazwa.includes('(Bez powerbanku)')) {
                      chargerSwapHTML = `<button class="btn-swap-charger btn-info" data-item-id="${item.item_id}">Wymień na wersję z powerbankiem</button>`;
                  } else if (item.nazwa.includes('(Z powerbankiem)')) {
                      chargerSwapHTML = `<button class="btn-swap-charger btn-info" data-item-id="${item.item_id}">Wymień na wersję bez powerbanku</button>`;
                  }
              }
              equipmentHTML += `<li><div><span><strong class="item-type">[${item.typ}]</strong> ${item.nazwa} ${item.model || ''} <strong>(${item.typ_egzemplarza})</strong><br><small class="serial-number-display" id="serial-display-${item.item_id}">Nr seryjny: ${item.numer_seryjny || 'Brak'}</small><button class="btn-edit-serial" data-item-id="${item.item_id}">Edytuj nr</button></span>${promoHTML}</div><div class="status-actions">${chargerSwapHTML}<span class="status ${statusClass}">${item.status}</span>${actionButton}</div></li>`;
          });
          equipmentHTML += '</ul>';
      } else { equipmentHTML += '<p>Brak przypisanego sprzętu.</p>'; }

      let wnioskiHTML = `<p><strong>Wnioski:</strong> ${status_wnioskow || 'Brak'}</p>`;
      if (status_wnioskow === 'Do zrobienia') { wnioskiHTML += `<button class="btn-success btn-update-wnioski" data-patient-id="${pacjent_id}">Oznacz jako zrobione</button>`;}
      let historiaHTML = '<h3>Historia wypożyczeń</h3>';
      if (historia && historia.length > 0) { historiaHTML += '<ul>'; historia.forEach(h => { historiaHTML += `<li>${h.nazwa} ${h.model} (zwrócono: ${h.data_zakonczenia})</li>`; }); historiaHTML += '</ul>';}
      else { historiaHTML += '<p>Brak historii.</p>'; }
      let mainActionButtons = '';
      if (status_ogolny === 'Wypożyczono') {
          mainActionButtons = `<p class="status-info">Sprzęt wypożyczono dnia: ${data_wypozyczenia}</p>`;
          if (maPrzypisanyAparat) { mainActionButtons += `<button id="btn-show-swap-all-modal" class="btn-info">Wymień aparaty</button>`; }
          if (maSluchawki) { mainActionButtons += `<button id="btn-show-swap-sluchawki-modal" class="btn-info">Zmień słuchawki</button>`;}
      } else { mainActionButtons = `<button id="btn-set-wypozyczono" class="btn-success" data-patient-id="${pacjent_id}">Oznacz jako "Wypożyczono"</button>`; }
      const notatkiHTML = `<div class="notes-section"><h3>Notatki:</h3><textarea id="notes-textarea-${pacjent_id}" rows="4">${notatki || ''}</textarea><button class="btn-save-notes" data-patient-id="${pacjent_id}">Zapisz notatki</button></div>`;
      finalHTML = `<div class="patient-card"><h2>Karta pacjenta: ${imie} ${nazwisko}</h2><div class="main-actions">${mainActionButtons} ${createAudiogramBtn}</div><p><strong>Telefon:</strong> ${telefon || 'Brak'} | <strong>PESEL:</strong> ${pesel || 'Brak'} | <strong>Data urodzenia:</strong> ${data_urodzenia || 'Brak'} <button id="btn-show-edit-patient" class="btn-info" style="margin-left: 15px; padding: 0.2rem 0.5rem;">Edytuj dane</button></p><div class="wnioski-section">${wnioskiHTML}</div>${equipmentHTML}${historiaHTML}<hr>${audiogramyHTML}<hr>${notatkiHTML}<hr><div class="danger-zone"><button id="btn-delete-patient" class="btn-danger" data-patient-id="${pacjent_id}">Usuń pacjenta</button></div></div>`;
  }
  
  const addComplaintFormContainer = document.getElementById('add-complaint-form-container');
  patientDetailContainerEl.innerHTML = finalHTML;
  addPatientFormContainer.classList.add('hidden');
  addComplaintFormContainer.classList.add('hidden');
  inventoryContainerEl.classList.add('hidden');
  patientDetailContainerEl.classList.remove('hidden');
}

// Renderuje popup do przypisywania sprzętu
function renderInventory(inventory, patientId) {
    const inventoryListEl = document.getElementById('inventory-list');
    inventoryListEl.innerHTML = '<h3>Wybierz produkt do przypisania</h3><ul class="inventory-item-list">';
    let inventoryHTML = '';
    inventory.forEach(item => {
        const formattedPrice = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(item.cena || 0);
        inventoryHTML += `<li><span>${item.nazwa}<br><small>Cena: ${formattedPrice}</small></span><button class="btn-success btn-assign" data-product-id="${item.produkt_id}">Przypisz</button></li>`;
    });
    inventoryListEl.querySelector('ul').innerHTML = inventoryHTML;
    inventoryListEl.querySelectorAll('button').forEach(btn => btn.dataset.patientId = patientId);
    inventoryContainerEl.classList.remove('hidden');
    patientDetailContainerEl.classList.add('hidden');
}

// Renderuje tabelę z ogólnym stanem magazynu
function renderOverallStock(warehouseData, isAdjustmentMode = false, adjustments = {}) {
    warehouseTableBodyEl.innerHTML = '';
    productSelectEl.innerHTML = '<option value="" disabled selected>-- Wybierz produkt --</option>';

    warehouseData.forEach(item => {
        const row = document.createElement('tr');
        
        // --- NOWA LOGIKA: Ustalanie kategorii dla każdego wiersza ---
        let category = '';
        if (item.typ === 'Aparat') {
            if (item.typ_egzemplarza === 'Demo') {
                category = 'aparat-demo';
            } else if (item.producent === 'Bernafon') {
                category = 'aparat-bernafon';
            } else if (item.producent === 'Audibel') {
                category = 'aparat-audibel';
            }
        } else if (item.typ === 'Akcesorium') {
            if (item.nazwa.includes('Słuchawka') && item.nazwa.includes('Bernafon')) {
                category = 'sluchawka-bernafon';
            } else if (item.nazwa.includes('Słuchawka') && item.nazwa.includes('Audibel')) {
                category = 'sluchawka-audibel';
            } else if (item.nazwa.includes('Ładowarka')) {
                category = 'ladowarki';
            }
        } else if (item.typ === 'Zużywalne') { // <-- NOWY WARUNEK
            if (item.nazwa === ('Bateria')) {
                category = 'baterie';
            }
        }
        row.dataset.category = category;
        // --- KONIEC NOWEJ LOGIKI ---

        console.log(`Produkt: "${item.nazwa}", Typ: "${item.typ}", Producent: "${item.producent}", Egzemplarz: "${item.typ_egzemplarza}"  =>  Przypisana kategoria: "${category}"`);

        const displayName = `${item.producent} - ${item.nazwa} ${item.model || ''} <strong>(${item.typ_egzemplarza})</strong>`;
        
        let adjustmentControls = '';
        if (isAdjustmentMode) {
            const currentAdjustment = adjustments[item.produkt_id] || 0;
            adjustmentControls = `<div class="adjustment-controls"><button class="btn-adjust" data-product-id="${item.produkt_id}" data-change="-1">-</button><span class="adjustment-value">${currentAdjustment > 0 ? '+' : ''}${currentAdjustment}</span><button class="btn-adjust" data-product-id="${item.produkt_id}" data-change="1">+</button></div>`;
        }
        
        row.innerHTML = `
            <td>${displayName}</td>
            <td class="text-center">${item.ilosc_dostepna} ${adjustmentControls}</td>
            <td class="text-center">${item.ilosc_zarezerwowana}</td>
            <td class="text-center">${item.ilosc_oczekujaca}</td>
            <td class="text-center">${item.ilosc_lacznie}</td>
        `;
        warehouseTableBodyEl.appendChild(row);

        if (item.typ_egzemplarza === 'Sprzedażowy') {
            const option = document.createElement('option');
            option.value = item.produkt_id;
            option.textContent = `${item.producent} - ${item.nazwa}`;
            productSelectEl.appendChild(option);
        }
    });
}

// Renderuje tabelę ze sprzętem przypisanym do pacjentów
function renderAssignedEquipment(assignedData) {
    assignedEquipmentBodyEl.innerHTML = '';
    assignedData.forEach(item => {
        const row = document.createElement('tr');
        const statusClass = item.status.toLowerCase().replace(/ /g, '-').replace('(', '').replace(')', '');
        row.innerHTML = `
            <td>${item.producent} - ${item.nazwa}</td>
            <td>${item.imie} ${item.nazwisko}</td>
            <td><span class="status status-${statusClass}">${item.status}</span></td>
        `;
        assignedEquipmentBodyEl.appendChild(row);
    });
}

function renderFinanceView(summaries) {
    const monthSelector = document.getElementById('finance-month-selector');
    monthSelector.innerHTML = ''; // Wyczyść
    summaries.forEach(summary => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = `${summary.miesiac} (${summary.liczba_transakcji} transakcji)`;
        btn.dataset.month = summary.miesiac;
        btn.dataset.total = summary.suma_miesieczna;
        monthSelector.appendChild(btn);
    });
}

/**
 * Renderuje tabelę z listą transakcji w widoku finansowym.
 * @param {Array} transactions - Lista obiektów transakcji z API.
 */
function renderTransactionsTable(transactions) {
    // 1. Znajdź element tbody tabeli w dokumencie HTML.
    const tableBody = document.getElementById('finance-transactions-table');
    
    // 2. Wyczyść całą istniejącą zawartość tabeli.
    tableBody.innerHTML = '';

    // 3. Sprawdź, czy są jakiekolwiek transakcje do wyświetlenia.
    if (!transactions || transactions.length === 0) {
        // Jeśli nie ma, wstaw wiersz z informacją.
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 3; // Scal komórki na całą szerokość tabeli.
        cell.textContent = 'Brak transakcji w wybranym okresie.';
        cell.style.textAlign = 'center';
        return; // Zakończ działanie funkcji.
    }

    // 4. Przejdź przez każdą transakcję z listy.
    transactions.forEach(trx => {
        // 5. Stwórz nowy element wiersza (<tr>).
        const row = document.createElement('tr');
        row.className = 'transaction-row'; // Klasa do stylowania i identyfikacji.
        row.dataset.transactionId = trx.transakcja_id; // Zapisz ID transakcji w atrybucie data-.

        // 6. Wypełnij wiersz danymi, używając template literal.
        //    Nazwisko pacjenta jest linkiem <a> z klasą "expand-details-btn", aby było klikalne.
        row.innerHTML = `
            <td>${trx.data_transakcji}</td>
            <td><a href="#" class="expand-details-btn">${trx.pacjent_imie} ${trx.pacjent_nazwisko}</a></td>
            <td>${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(trx.kwota_laczna)}</td>
        `;

        // 7. Dodaj gotowy wiersz do tabeli.
        tableBody.appendChild(row);
    });
}