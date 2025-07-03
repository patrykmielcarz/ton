// Plik do komunikacji z API (backendem)

const API_BASE_URL = 'http://127.0.0.1:5000/api';

// const API_BASE_URL = 'https://tonmedica.pythonanywhere.com/api';

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Wystąpił błąd serwera');
  }
  // Jeśli metoda to nie GET i odpowiedź nie zawiera treści, zwracamy sukces
  if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true };
  }
  return response.json();
}

// Pobiera listę wszystkich pacjentów
function getPatients() {
  return fetchAPI('/patients');
}

// Pobiera szczegóły jednego pacjenta
function getPatientDetails(patientId) {
  return fetchAPI(`/patients/${patientId}`);
}

// Pobiera aktualny stan magazynowy
function getInventory() {
  return fetchAPI('/inventory');
}

// Pobiera szczegółowy stan magazynu
function getWarehouseState() {
  return fetchAPI('/warehouse');
}

function getAssignedEquipment() {
  return fetchAPI('/warehouse/assigned');
}

// NOWA: Inteligentnie przypisuje produkt do pacjenta
function assignProduct(patientId, productId) {
  return fetchAPI('/assign-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pacjent_id: patientId, produkt_id: productId }),
  });
}

// Dodaje nowe sztuki produktu do magazynu
// W pliku api.js
function addStock(productId, quantity, typEgzemplarza = 'Sprzedażowy') {
  return fetchAPI('/warehouse/add-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          produkt_id: productId,
          quantity: quantity,
          typ_egzemplarza: typEgzemplarza // Wysyłamy typ
      }),
  });
}

function getStructuredProducts() { return fetchAPI('/products-structured'); }
function createPatient(formData) {
  return fetchAPI('/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
  });
}
function updateWnioskiStatus(patientId, status) {
  return fetchAPI(`/patients/${patientId}/update-wnioski`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status })
  });
}

function updateItemStatus(itemId, newStatus) {
  return fetchAPI(`/warehouse/item/${itemId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_status: newStatus })
  });
}

function setWypozyczonoStatus(patientId) {
  return fetchAPI(`/patients/${patientId}/set-wypozyczono`, { method: 'PUT' });
}
// W pliku api.js - zastąp tę funkcję
function swapAparat(patientId, swapData) { // Przyjmuje teraz jeden obiekt z danymi
  return fetchAPI(`/patients/${patientId}/swap-aparat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapData)
  });
}

async function getSluchawkiOptions(producent) {
  return await fetchAPI(`/sluchawki-options/${encodeURIComponent(producent)}`);
}
function swapSluchawki(patientId, newSluchawkaId) {
  return fetchAPI(`/patients/${patientId}/swap-sluchawki`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_sluchawka_id: newSluchawkaId })
  });
}

// W pliku api.js
function saveNotes(patientId, notesText) {
  return fetchAPI(`/patients/${patientId}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notatki: notesText })
  });
}

// W pliku api.js
function deletePatient(patientId, zakupił) {
  return fetchAPI(`/patients/${patientId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zakupiono: zakupił })
  });
}

function bulkAddStock(itemsArray) {
  return fetchAPI('/warehouse/bulk-add-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemsArray)
  });
}

function adjustStock(adjustmentsArray) {
  return fetchAPI('/warehouse/adjust-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adjustmentsArray)
  });
}

function upgradeToSales(patientId) {
  return fetchAPI(`/patients/${patientId}/upgrade-to-sales`, { method: 'POST' });
}

function updatePatient(patientId, patientData) {
  return fetchAPI(`/patients/${patientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
  });
}

function updateSerialNumber(itemId, serialNumber) {
  return fetchAPI(`/warehouse/item/${itemId}/serial`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serial_number: serialNumber })
  });
}

function sellConsumable(productId, quantity) {
  return fetchAPI('/warehouse/sell-consumable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produkt_id: productId, quantity })
  });
}

function getMonthlySummaries() {
  return fetchAPI('/finances/monthly-summaries');
}

function getAvailableMonths() {
  return fetchAPI('/finances/available-months');
}

function getTransactionsForMonth(month) { // format RRRR-MM
  return fetchAPI(`/finances/transactions?month=${month}`);
}

function getTransactionDetails(transactionId) {
  return fetchAPI(`/finances/transactions/${transactionId}`);
}

function setPromoPrice(itemId, price) {
  return fetchAPI(`/warehouse/item/${itemId}/promo-price`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: price })
  });
}

function updateTransactionItem(itemId, itemData) {
return fetchAPI(`/finances/transaction-item/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData) // Poprawnie przekazujemy cały obiekt z danymi
});
}

function createManualTransaction(itemsArray) {
// Upewniamy się, że wołamy endpoint, który potrafi obsłużyć ręczne dane
return fetchAPI('/finances/manual-transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemsArray)
});
}

function addManualItemToTransaction(transactionId, itemData) {
return fetchAPI(`/finances/transactions/${transactionId}/manual-item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData)
});
}

function swapCharger(itemId) {
return fetchAPI(`/warehouse/item/${itemId}/swap-charger`, { method: 'PUT' });
}

function upgradeToSales(patientId) {
  return fetchAPI(`/patients/${patientId}/upgrade-to-sales`, { method: 'POST' });
}

function createComplaint(complaintData) { return fetchAPI('/complaints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(complaintData) }); }
function updateComplaintStatus(complaintId, newStatus) { return fetchAPI(`/complaints/${complaintId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_status: newStatus }) }); }
function updateComplaintDescription(complaintId, description) { return fetchAPI(`/complaints/${complaintId}/description`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opis: description }) }); }