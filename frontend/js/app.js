// Plik: frontend/js/app.js - Wersja Kompletna i Poprawiona

document.addEventListener('DOMContentLoaded', () => {
  // === DEKLARACJE STAŁYCH DLA ELEMENTÓW HTML ===
  const patientListEl = document.getElementById('patient-list');
  const patientDetailContainerEl = document.getElementById('patient-detail-container');
  const inventoryContainerEl = document.getElementById('inventory-container');
  const patientsViewContainer = document.getElementById('patients-view-container');
  const warehouseViewContainer = document.getElementById('warehouse-view-container');
  const navPatientsBtn = document.getElementById('nav-patients-btn');
  const navWarehouseBtn = document.getElementById('nav-warehouse-btn');
  const subnavAssignedBtn = document.getElementById('subnav-assigned-btn');
  const subnavOverallBtn = document.getElementById('subnav-overall-btn');
  const assignedEquipmentView = document.getElementById('assigned-equipment-view');
  const overallStockView = document.getElementById('overall-stock-view');
  const addStockForm = document.getElementById('add-stock-form');
  const showAddPatientFormBtn = document.getElementById('show-add-patient-form-btn');
  const addPatientFormContainer = document.getElementById('add-patient-form-container');
  const addPatientForm = document.getElementById('add-patient-form');
  const cancelAddPatientBtn = document.getElementById('cancel-add-patient-btn');
  const swapAparatModal = document.getElementById('swap-aparat-modal');
  const swapAparatForm = document.getElementById('swap-aparat-form');
  const cancelSwapBtn = document.getElementById('cancel-swap-btn');
  const sluchawkiSection = document.getElementById('sluchawki-section');
  const sluchawkaSelect = document.getElementById('sluchawka-select');
  const swapSluchawkaModal = document.getElementById('swap-sluchawka-modal');
  const swapSluchawkaForm = document.getElementById('swap-sluchawka-form');
  const cancelSwapSluchawkaBtn = document.getElementById('cancel-swap-sluchawka-btn');
  const deletePatientModal = document.getElementById('delete-patient-modal');
  const btnDeleteConfirmYes = document.getElementById('btn-delete-confirm-yes');
  const btnDeleteConfirmNo = document.getElementById('btn-delete-confirm-no');
  const btnDeleteCancel = document.getElementById('btn-delete-cancel');
  const viewAudiogramModal = document.getElementById('view-audiogram-modal');
  const modalImageContent = document.getElementById('modal-image-content');
  const closeImageModalBtn = document.getElementById('close-image-modal-btn');
  const warehouseSearchInput = document.getElementById('warehouse-search-input');
  const showDeliveryModalBtn = document.getElementById('show-delivery-modal-btn');
  const deliveryModal = document.getElementById('delivery-modal');
  const deliveryForm = document.getElementById('delivery-form');
  const deliveryFormRows = document.getElementById('delivery-form-rows');
  const addDeliveryItemBtn = document.getElementById('add-delivery-item-btn');
  const cancelDeliveryBtn = document.getElementById('cancel-delivery-btn');
  const adjustmentModeBtn = document.getElementById('adjustment-mode-btn');
  const adjustmentActions = document.getElementById('adjustment-actions');
  const saveAdjustmentsBtn = document.getElementById('save-adjustments-btn');
  const cancelAdjustmentsBtn = document.getElementById('cancel-adjustments-btn');
  const editPatientModal = document.getElementById('edit-patient-modal');
  const editPatientForm = document.getElementById('edit-patient-form');
  const cancelEditPatientBtn = document.getElementById('cancel-edit-patient-btn');
  const warehouseFilterButtons = document.getElementById('warehouse-filter-buttons');
  const addBatteriesModal = document.getElementById('add-batteries-modal');
const addBatteriesForm = document.getElementById('add-batteries-form');
const sellBatteryModal = document.getElementById('quick-sale-modal');
const sellBatteryForm = document.getElementById('quick-sale-form');
const cancelQuickSaleBtn = document.getElementById('cancel-quick-sale-btn');
const navFinanceBtn = document.getElementById('nav-finance-btn');
const financeViewContainer = document.getElementById('finance-view-container');
const financeMonthSelector = document.getElementById('finance-month-selector');
const financeSummaryEl = document.getElementById('finance-summary');
const financeHistoryViewContainer = document.getElementById('finance-history-view-container');
const navFinanceHistoryBtn = document.getElementById('nav-finance-history-btn');
const financeYearSelect = document.getElementById('finance-year-select');
const financeMonthSelect = document.getElementById('finance-month-select');
const showHistoryBtn = document.getElementById('show-history-btn');
const financeHistorySummary = document.getElementById('finance-history-summary');
const financeHistoryTable = document.getElementById('finance-history-table');
const financeTransactionsTable = document.getElementById('finance-transactions-table');
const saleItemSelect = document.getElementById('sale-item-select');
const batterySaleInputs = document.getElementById('battery-sale-inputs');
const genericSaleInputs = document.getElementById('generic-sale-inputs');
const showManualTransactionBtn = document.getElementById('show-manual-transaction-btn');
const manualTransactionModal = document.getElementById('manual-transaction-modal');
const manualTransactionForm = document.getElementById('manual-transaction-form');
const manualTransactionRows = document.getElementById('manual-transaction-rows');
const addManualTransactionItemBtn = document.getElementById('add-manual-transaction-item-btn');
const showAddComplaintFormBtn = document.getElementById('show-add-complaint-form-btn');
const addComplaintFormContainer = document.getElementById('add-complaint-form-container');
const addComplaintForm = document.getElementById('add-complaint-form');
const cancelAddComplaintBtn = document.getElementById('cancel-add-complaint-btn');
  // Ustawiamy zamykanie wszystkich modali przez przyciski "Anuluj"
  document.querySelectorAll('.btn-cancel-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const backdrop = btn.closest('.modal-backdrop');
      if (backdrop) backdrop.classList.add('hidden');
    });
  });


  // === ZMIENNE STANU APLIKACJI ===
  let activePatientId = null;
  let structuredProductsData = {};
  let currentItemIdToSwap = null;
  let allProducts = [];
  let isAdjustmentMode = false;
  let stockAdjustments = {};
  let lastWarehouseState = [];
  let currentPatientApparatBrand = null;

  // === FUNKCJE POMOCNICZE ===
  async function refreshPatientDetails() {
      if (!activePatientId) return;
      try {
          const patientData = await getPatientDetails(activePatientId);
          renderPatientDetails(patientData);
      } catch (error) {
          console.error('Błąd podczas odświeżania danych pacjenta:', error);
      }
  }

  async function ensureAllProductsLoaded() {
  // Jeśli lista produktów jest już załadowana, nic nie rób
  if (allProducts.length > 0) {
      return;
  }
  // Jeśli jest pusta, pobierz dane z serwera
  try {
      allProducts = await getInventory();
  } catch (error) {
      showToast('Nie udało się załadować listy produktów.', 'error');
      // Przekaż błąd dalej, aby zatrzymać operację, która wymagała tej listy
      throw error;
  }
}

  function populateBatterySelect(selectElement) {
      selectElement.innerHTML = '<option value="">-- Wybierz typ --</option>';
      const batteryProducts = allProducts.filter(p => p.nazwa === 'Bateria');
      batteryProducts.forEach(b => {
          selectElement.add(new Option(`Bateria typ ${b.model}`, b.produkt_id));
      });
  }

  function populateSaleableItemsSelect(selectElement) {
      selectElement.innerHTML = '<option value="">-- Wybierz produkt --</option>';
      const saleableItems = allProducts.filter(p => p.typ === 'Zużywalne' || p.nazwa.includes('Słuchawka'));
      saleableItems.forEach(item => {
          const displayName = item.nazwa.includes('Słuchawka') ? item.nazwa : `Bateria typ ${item.model}`;
          selectElement.add(new Option(displayName, item.produkt_id));
      });
  }

function hideAllMainViews() {
    [patientsViewContainer, warehouseViewContainer, financeViewContainer, financeHistoryViewContainer].forEach(v => v.classList.add('hidden'));
    [navPatientsBtn, navWarehouseBtn, navFinanceBtn, navFinanceHistoryBtn].forEach(btn => btn.classList.remove('active'));
}

function setActiveNav(button) {
    [navPatientsBtn, navWarehouseBtn, navFinanceBtn, navFinanceHistoryBtn]
        .forEach(btn => btn.classList.remove('active'));
    if (button) button.classList.add('active');
}

  // === FUNKCJE DO ZARZĄDZANIA WIDOKAMI ===
  function showPatientsView() {
      hideAllMainViews();
      patientsViewContainer.classList.remove('hidden');
      navPatientsBtn.classList.add('active');
      hideAddPatientView();
      inventoryContainerEl.classList.add('hidden');
      patientDetailContainerEl.classList.add('hidden');
  }
  async function showWarehouseView() {
      hideAllMainViews();
      warehouseViewContainer.classList.remove('hidden');
      navWarehouseBtn.classList.add('active');
      await showOverallStockView(); // Domyślnie pokazujemy stan ogólny
  }
  async function showAddPatientView() {
    hideAllSubViews(); // Używamy nowej funkcji do ukrycia innych paneli
    addPatientFormContainer.classList.remove('hidden');
    addPatientForm.reset();
    if (Object.keys(structuredProductsData).length === 0) {
        structuredProductsData = await getStructuredProducts();
    }
    populateFirmaSelect(document.getElementById('firma-select'));
    populatePodgrupaSelect(document.getElementById('podgrupa-select'), '');
    populateAparatSelect(document.getElementById('aparat-select'), '', '');
    sluchawkiSection.classList.add('hidden');
}
  function hideAddPatientView() {
      addPatientFormContainer.classList.add('hidden');
  }
  // W pliku app.js
  async function showAssignedEquipmentView() {
    // Najpierw ukrywamy widok stanu ogólnego
    overallStockView.classList.add('hidden');
    // A potem pokazujemy widok sprzętu przypisanego
    assignedEquipmentView.classList.remove('hidden');

    // Aktualizujemy podświetlenie przycisków
    document.querySelectorAll('.sub-nav-btn').forEach(btn => btn.classList.remove('active'));
    subnavAssignedBtn.classList.add('active');

    try {
        const assignedData = await getAssignedEquipment();
        renderAssignedEquipment(assignedData);
    } catch (error) {
        showToast('Błąd ładowania przypisanego sprzętu.', 'error');
    }
}

async function showOverallStockView() {
  // Najpierw ukrywamy widok sprzętu przypisanego
  assignedEquipmentView.classList.add('hidden');
  // A potem pokazujemy widok stanu ogólnego
  overallStockView.classList.remove('hidden');

  // Aktualizujemy podświetlenie przycisków
  document.querySelectorAll('.sub-nav-btn').forEach(btn => btn.classList.remove('active'));
  subnavOverallBtn.classList.add('active');

  try {
      const warehouseData = await getWarehouseState();
      lastWarehouseState = warehouseData;
      renderOverallStock(warehouseData, isAdjustmentMode, stockAdjustments);
  } catch (error) {
      showToast('Błąd ładowania stanu magazynu.', 'error');
      console.error('Błąd ładowania ogólnego stanu magazynu:', error); // Dodajemy log do konsoli
  }
}

async function showFinanceView() {
    hideAllMainViews();
    financeViewContainer.classList.remove('hidden');
    setActiveNav(navFinanceBtn);
    try {
        const now = new Date();
        const currentMonthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const data = await getTransactionsForMonth(currentMonthString);
        renderTransactionsTable(data.transactions, 'finance-transactions-table');
        financeSummaryEl.innerHTML = `<h4>Przychód w bieżącym miesiącu: <strong>${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(data.summary.total)}</strong></h4>`;
    } catch(error) {
        showToast('Nie udało się załadować danych finansowych.', 'error');
    }
}

async function showFinanceHistoryView() {
    hideAllMainViews();
    financeHistoryViewContainer.classList.remove('hidden');
    setActiveNav(navFinanceHistoryBtn);
    financeHistorySummary.innerHTML = '';
    financeHistoryTable.innerHTML = '<tr><td colspan="3" style="text-align:center;">Wybierz okres z historii i kliknij "Pokaż".</td></tr>';
    try {
        const availableMonths = await getAvailableMonths();
        if (availableMonths.length > 0) {
            const years = [...new Set(availableMonths.map(m => m.split('-')[0]))];
            financeYearSelect.innerHTML = '';
            years.forEach(y => financeYearSelect.add(new Option(y, y)));
            await handleYearChange();
        } else {
            financeYearSelect.innerHTML = '<option>Brak danych</option>';
            financeMonthSelect.innerHTML = '<option>Brak danych</option>';
        }
    } catch (error) {
        showToast('Nie udało się załadować dostępnych okresów.', 'error');
    }
}

async function handleYearChange() {
    const selectedYear = financeYearSelect.value;
    const availableMonths = await getAvailableMonths();
    const monthsForYear = availableMonths.filter(m => m.startsWith(selectedYear)).map(m => m.split('-')[1]);
    financeMonthSelect.innerHTML = '';
    const monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    monthsForYear.forEach(m => {
        financeMonthSelect.add(new Option(monthNames[parseInt(m, 10) - 1], m));
    });
}

function hideAllSubViews() {
// Ta funkcja ukrywa wszystkie panele w środkowej kolumnie
[patientDetailContainerEl, inventoryContainerEl, addPatientFormContainer, addComplaintFormContainer].forEach(panel => {
    if (panel) panel.classList.add('hidden');
});
}

async function showAddComplaintView() {
hideAllSubViews(); // Używamy nowej funkcji do ukrycia innych paneli
addComplaintFormContainer.classList.remove('hidden');
addComplaintForm.reset();
// Ukrywamy kontenery na opisy przy starcie
document.getElementById('opis-aparaty-container').classList.add('hidden');
document.getElementById('opis-wkladki-container').classList.add('hidden');
}

  // === FUNKCJE DO WYPEŁNIANIA FORMULARZY ===
  function populateFirmaSelect(selectElement) {
      selectElement.innerHTML = '<option value="">-- Wybierz firmę --</option>';
      Object.keys(structuredProductsData).forEach(firma => {
          if (firma !== 'Akcesoria') {
              selectElement.add(new Option(firma, firma));
          }
      });
  }
  function populatePodgrupaSelect(selectElement, firma) {
      selectElement.innerHTML = '<option value="">-- Wybierz podgrupę --</option>';
      if (firma && structuredProductsData[firma]) {
          Object.keys(structuredProductsData[firma]).forEach(podgrupa => {
              selectElement.add(new Option(podgrupa, podgrupa));
          });
      }
  }
  function populateAparatSelect(selectElement, firma, podgrupa) {
      selectElement.innerHTML = '<option value="">-- Wybierz model --</option>';
      if (firma && podgrupa && structuredProductsData[firma][podgrupa]) {
          structuredProductsData[firma][podgrupa].forEach(aparat => {
              selectElement.add(new Option(aparat.nazwa, aparat.produkt_id));
          });
      }
  }
  function createDeliveryRow() {
      const row = document.createElement('div');
      row.className = 'form-row delivery-item-row';

      const categorySelect = document.createElement('select');
      categorySelect.className = 'delivery-category-select';
      // Usunęliśmy kategorię "Aparaty Demo", bo teraz każdy aparat może nim być
      categorySelect.innerHTML = `
          <option value="">-- Wybierz kategorię --</option>
          <option value="aparat-bernafon">Aparaty Bernafon</option>
          <option value="aparat-audibel">Aparaty Audibel</option>
          <option value="sluchawka-bernafon">Słuchawki Bernafon</option>
          <option value="sluchawka-audibel">Słuchawki Audibel</option>
          <option value="ladowarki">Ładowarki</option>
          <option value="baterie">Baterie</option>
      `;

      const productSelect = document.createElement('select');
      productSelect.className = 'delivery-product-select';
      productSelect.innerHTML = '<option value="">-- Najpierw wybierz kategorię --</option>';

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'delivery-quantity-input';
      input.placeholder = 'Ilość';
      input.min = 1;

      // Nowy checkbox dla wersji DEMO
      const demoLabel = document.createElement('label');
      const demoCheckbox = document.createElement('input');
      demoCheckbox.type = 'checkbox';
      demoCheckbox.className = 'delivery-demo-checkbox';
      demoLabel.appendChild(demoCheckbox);
      demoLabel.appendChild(document.createTextNode(' Wersja DEMO'));

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = 'X';
      removeBtn.className = 'btn-danger';
      removeBtn.onclick = () => row.remove();

      // Logika filtrowania
      categorySelect.addEventListener('change', () => {
          const selectedCategory = categorySelect.value;
          productSelect.innerHTML = '<option value="">-- Wybierz produkt --</option>';

          // NAPRAWIONA LOGIKA FILTROWANIA
          const filteredProducts = allProducts.filter(p => {
              // Poprawiony warunek dla aparatów - nie sprawdzamy już typ_egzemplarza
              if (selectedCategory === 'aparat-bernafon') return p.typ === 'Aparat' && p.producent === 'Bernafon';
              if (selectedCategory === 'aparat-audibel') return p.typ === 'Aparat' && p.producent === 'Audibel';
              // Reszta warunków bez zmian
              if (selectedCategory === 'sluchawka-bernafon') return p.nazwa.includes('Słuchawka') && p.nazwa.includes('Bernafon');
              if (selectedCategory === 'sluchawka-audibel') return p.nazwa.includes('Słuchawka') && p.nazwa.includes('Audibel');
              if (selectedCategory === 'ladowarki') return p.nazwa.includes('Ładowarka');
              if (selectedCategory === 'baterie') return p.typ === 'Zużywalne';
              return false;
          });

          filteredProducts.forEach(p => {
              productSelect.add(new Option(`${p.producent} - ${p.nazwa} ${p.model || ''}`, p.produkt_id));
          });
      });

      row.appendChild(categorySelect);
      row.appendChild(productSelect);
      row.appendChild(input);
      row.appendChild(demoLabel); // Dodajemy checkbox do wiersza
      row.appendChild(removeBtn);
      deliveryFormRows.appendChild(row);
  }

  function createManualTransactionRow() {
    const row = document.createElement('div');
    row.className = 'form-row manual-transaction-item-row';
    row.innerHTML = `
        <input type="text" class="manual-item-name" placeholder="Opis (np. Usługa dopasowania)" required style="flex: 3;">
        <input type="number" step="0.01" class="manual-item-price" placeholder="Kwota (np. 150.00)" required style="flex: 1;">
        <input type="number" class="manual-item-quantity" value="1" min="1" required style="flex: 1;">
        <button type="button" class="btn-danger" onclick="this.parentElement.remove()">X</button>
    `;
    manualTransactionRows.appendChild(row);
}

  function showToast(message, type = 'success') {
      const backgroundColor = type === 'success' ? 'linear-gradient(to right, #00b09b, #96c93d)' : 'linear-gradient(to right, #ff5f6d, #ffc371)';
      Toastify({
          text: message,
          duration: 3000,
          close: true,
          gravity: "top", // `top` or `bottom`
          position: "right", // `left`, `center` or `right`
          stopOnFocus: true, // Prevents dismissing of toast on hover
          style: {
              background: backgroundColor,
          },
      }).showToast();
  }

  function createManualTransactionRow() {
    const row = document.createElement('div');
    row.className = 'form-row manual-transaction-item-row';

    // Zmieniamy listę <select> na pola <input type="text"> do ręcznego wpisywania
    row.innerHTML = `
        <input type="text" class="manual-item-name" placeholder="Opis (np. Usługa dopasowania)" required style="flex: 3;">
        <input type="number" step="0.01" class="manual-item-price" placeholder="Kwota (np. 150.00)" required style="flex: 1;">
        <input type="number" class="manual-item-quantity" value="1" min="1" required style="flex: 1;">
        <button type="button" class="btn-danger" onclick="this.parentElement.remove()">X</button>
    `;
    manualTransactionRows.appendChild(row);
}

showAddComplaintFormBtn.addEventListener('click', () => { hideAllSubViews(); addComplaintFormContainer.classList.remove('hidden'); addComplaintForm.reset(); });
cancelAddComplaintBtn.addEventListener('click', () => { addComplaintFormContainer.classList.add('hidden'); });
addComplaintForm.addEventListener('change', (e) => {
  if (e.target.name === 'reklamacja_aparaty') document.getElementById('opis-aparaty-container').classList.toggle('hidden', !e.target.checked);
  if (e.target.name === 'reklamacja_wkladki') document.getElementById('opis-wkladki-container').classList.toggle('hidden', !e.target.checked);
});
addComplaintForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(addComplaintForm);
  const data = {
      imie: formData.get('imie'), nazwisko: formData.get('nazwisko'), telefon: formData.get('telefon'),
      pesel: formData.get('pesel'), data_urodzenia: addComplaintForm.querySelector('input[name="data_urodzenia"]').value,
      reklamacja_aparaty: formData.get('reklamacja_aparaty') === 'on',
      opis_aparaty: formData.get('opis_aparaty'),
      reklamacja_wkladki: formData.get('reklamacja_wkladki') === 'on',
      opis_wkladki: formData.get('opis_wkladki'),
  };
  if (!data.reklamacja_aparaty && !data.reklamacja_wkladki) return showToast('Musisz wybrać przedmiot reklamacji.', 'error');
  try {
      const result = await createComplaint(data);
      showToast(result.message);
      addComplaintFormContainer.classList.add('hidden');
      await init();
  } catch (error) { showToast(error.message, 'error'); }
});

// Listener dla formularza reklamacji, który obsługuje pole PESEL
addComplaintForm.addEventListener('input', e => {
if (e.target.name === 'pesel' && e.target.value.length === 11) {
    const dob = parsePESEL(e.target.value);
    // Znajdź pole daty urodzenia Wewnątrz formularza reklamacji
    addComplaintForm.querySelector('input[name="data_urodzenia"]').value = dob || 'Nieprawidłowy PESEL';
}
});

  // === INICJALIZACJA APLIKACJI ===
  async function init() {
      showPatientsView();
      try {
          const patients = await getPatients();
          renderPatientList(patients);
      } catch (error) {
          console.error('Błąd podczas ładowania listy pacjentów:', error);
          alert('Nie udało się załadować listy pacjentów.');
      }
  }

  // === EVENT LISTENERS (NASŁUCHIWANIE NA ZDARZENIA) ===

  // --- Listenery dla statycznych elementów (przyciski, nawigacja) ---
  navPatientsBtn.addEventListener('click', init);
  navWarehouseBtn.addEventListener('click', showWarehouseView);
  subnavAssignedBtn.addEventListener('click', showAssignedEquipmentView);
  subnavOverallBtn.addEventListener('click', showOverallStockView);
  showAddPatientFormBtn.addEventListener('click', showAddPatientView);
  cancelAddPatientBtn.addEventListener('click', hideAddPatientView);
  cancelAddPatientBtn.addEventListener('click', hideAddPatientView);
  warehouseSearchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#warehouse-table-body tr');
      rows.forEach(row => {
          const rowText = row.textContent.toLowerCase();
          row.style.display = rowText.includes(searchTerm) ? '' : 'none';
      });
  });
  adjustmentModeBtn.addEventListener('click', () => {
      isAdjustmentMode = true;
      stockAdjustments = {};
      adjustmentActions.classList.remove('hidden');
      adjustmentModeBtn.classList.add('hidden');
      warehouseSearchInput.disabled = true;
      renderOverallStock(lastWarehouseState, isAdjustmentMode, stockAdjustments);
  });
  cancelAdjustmentsBtn.addEventListener('click', () => {
      isAdjustmentMode = false;
      stockAdjustments = {};
      adjustmentActions.classList.add('hidden');
      adjustmentModeBtn.classList.remove('hidden');
      warehouseSearchInput.disabled = false;
      renderOverallStock(lastWarehouseState, isAdjustmentMode, stockAdjustments);
  });
  saveAdjustmentsBtn.addEventListener('click', async () => {
      const adjustmentsArray = Object.entries(stockAdjustments).map(([produkt_id, change]) => ({
          produkt_id: parseInt(produkt_id, 10),
          change: change
      })).filter(adj => adj.change !== 0);
      if (adjustmentsArray.length === 0) return alert('Nie wprowadzono żadnych korekt.');
      try {
          const result = await adjustStock(adjustmentsArray);
          alert(result.message);
          isAdjustmentMode = false;
          stockAdjustments = {};
          adjustmentActions.classList.add('hidden');
          adjustmentModeBtn.classList.remove('hidden');
          warehouseSearchInput.disabled = false;
          await showOverallStockView();
      } catch (error) { alert(`Błąd: ${error.message}`); }
  });
  showDeliveryModalBtn.addEventListener('click', async () => {
      if (allProducts.length === 0) { allProducts = await getInventory(); }
      deliveryFormRows.innerHTML = '';
      createDeliveryRow();
      deliveryModal.classList.remove('hidden');
  });
  cancelDeliveryBtn.addEventListener('click', () => deliveryModal.classList.add('hidden'));
  cancelQuickSaleBtn.addEventListener('click', () => {
      sellBatteryModal.classList.add('hidden');
      batterySaleInputs.classList.add('hidden');
      genericSaleInputs.classList.add('hidden');
  });
  addDeliveryItemBtn.addEventListener('click', createDeliveryRow);

  navFinanceBtn.addEventListener('click', showFinanceView);

  showManualTransactionBtn.addEventListener('click', async () => {
    // Ten listener nie potrzebuje już ensureAllProductsLoaded, bo tworzymy pola ręcznie
    manualTransactionRows.innerHTML = ''; // Wyczyść stare wiersze
    createManualTransactionRow(); // Dodaj pierwszy, pusty wiersz
    manualTransactionModal.classList.remove('hidden');
});

// Listener dla przycisku "+ Dodaj kolejną pozycję" wewnątrz modala
addManualTransactionItemBtn.addEventListener('click', createManualTransactionRow);

// Listener dla wysłania formularza ręcznej transakcji
manualTransactionForm.addEventListener('submit', async (e) => {
e.preventDefault();
const rows = document.querySelectorAll('.manual-transaction-item-row');
const itemsToSubmit = [];

rows.forEach(row => {
    const name = row.querySelector('.manual-item-name').value;
    const price = parseFloat(row.querySelector('.manual-item-price').value);
    const quantity = parseInt(row.querySelector('.manual-item-quantity').value);

    if (name && !isNaN(price) && !isNaN(quantity) && quantity > 0) {
        itemsToSubmit.push({ name, price, quantity });
    }
});

if (itemsToSubmit.length === 0) {
    return showToast('Proszę dodać przynajmniej jedną poprawną pozycję.', 'error');
}

try {
    const result = await createManualTransaction(itemsToSubmit);
    showToast(result.message);
    manualTransactionModal.classList.add('hidden');
    await showFinanceView();
} catch (error) {
    showToast(error.message, 'error');
}
});

  financeMonthSelector.addEventListener('click', async (e) => {
      if (!e.target.classList.contains('filter-btn')) return;

      const month = e.target.dataset.month;
      const total = parseFloat(e.target.dataset.total);

      document.querySelectorAll('#finance-month-selector .filter-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');

      financeSummaryEl.innerHTML = `<h4>Podsumowanie dla ${month}: <strong>${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(total)}</strong></h4>`;

      try {
          const transactions = await getTransactionsForMonth(month);
          renderTransactionsTable(transactions);
      } catch(error) {
          showToast(`Błąd ładowania transakcji dla miesiąca ${month}`, 'error');
      }
  });

  // W pliku app.js

  financeTransactionsTable.addEventListener('click', async (e) => {
    // Logika rozwijania szczegółów (bez zmian)
    if (e.target.classList.contains('expand-details-btn')) {
        e.preventDefault();
        const row = e.target.closest('.transaction-row');
        if (!row) return;
        const nextRow = row.nextElementSibling;
        if (nextRow && nextRow.classList.contains('detail-row')) {
            nextRow.remove();
            return;
        }
        const transactionId = row.dataset.transactionId;
        try {
            const details = await getTransactionDetails(transactionId);
            let detailsHTML = '<ul class="editable-items-list">';
            details.forEach(item => {
                const isReadonly = item.produkt_id ? 'readonly' : '';
                detailsHTML += `<li><div class="form-row"><input type="text" class="item-name-input" value="${item.produkt_nazwa} ${item.produkt_model || ''}" ${isReadonly}><input type="number" step="0.01" class="item-price-input" value="${item.cena_za_sztuke.toFixed(2)}" ${isReadonly}><input type="number" class="item-quantity-input" value="${item.ilosc}" min="0"><button class="btn-save-item-change btn-success" data-item-id="${item.pozycja_id}">Zapisz</button></div></li>`;
            });
            detailsHTML += `</ul><button class="btn-add-manual-item" data-transaction-id="${transactionId}">+ Dodaj pozycję ręczną</button>`;
            const detailRow = document.createElement('tr');
            detailRow.className = 'detail-row';
            detailRow.innerHTML = `<td colspan="3" class="transaction-details-cell">${detailsHTML}</td>`;
            row.insertAdjacentElement('afterend', detailRow);
        } catch (error) { showToast('Nie udało się załadować szczegółów.', 'error'); }
    }

    // --- POPRAWIONA LOGIKA ZAPISU EDYTOWANEJ POZYCJI ---
    if (e.target.classList.contains('btn-save-item-change')) {
        const itemId = e.target.dataset.itemId;
        const itemRow = e.target.closest('li');
        const updatedData = {
            name: itemRow.querySelector('.item-name-input').value,
            price: parseFloat(itemRow.querySelector('.item-price-input').value),
            quantity: parseInt(itemRow.querySelector('.item-quantity-input').value)
        };

        if (isNaN(updatedData.price) || isNaN(updatedData.quantity) || updatedData.quantity < 0) {
            return showToast('Proszę podać prawidłowe wartości liczbowe.', 'error');
        }

        // Zamiast confirm(), od razu wysyłamy żądanie
        try {
            await updateTransactionItem(itemId, updatedData);
            showToast('Zapisano zmiany w transakcji.');
            await showFinanceView(); // Odświeżamy widok, aby pokazać przeliczone sumy
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    // Logika dodawania i zapisu nowych pozycji ręcznych (bez zmian)
    if (e.target.classList.contains('btn-add-manual-item')) {
        const list = e.target.previousElementSibling;
        const nItemLi = document.createElement('li');
        nItemLi.innerHTML = `<div class="form-row"><input type="text" class="item-name-input" placeholder="Nazwa"><input type="number" step="0.01" class="item-price-input" placeholder="Cena"><input type="number" class="item-quantity-input" value="1" min="1"><button class="btn-save-manual-item btn-success" data-transaction-id="${e.target.dataset.transactionId}">Zapisz</button></div>`;
        list.appendChild(nItemLi);
        e.target.style.display = 'none';
    }
    if (e.target.classList.contains('btn-save-manual-item')) {
        const tId = e.target.dataset.transactionId;
        const iRow = e.target.closest('li');
        const iData = { name: iRow.querySelector('.item-name-input').value, price: parseFloat(iRow.querySelector('.item-price-input').value), quantity: parseInt(iRow.querySelector('.item-quantity-input').value) };
        if (!iData.name || isNaN(iData.price) || isNaN(iData.quantity)) return showToast('Proszę wypełnić wszystkie pola.', 'error');
        try { await addManualItemToTransaction(tId, iData); showToast('Dodano nową pozycję.'); await showFinanceView(); }
        catch (err) { showToast(err.message, 'error'); }
    }
});

  // --- Listenery dla formularzy ---
  addStockForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const productId = document.getElementById('product-select').value;
      const quantity = e.target.elements.quantity.value;
      const isDemo = e.target.elements.is_demo_stock.checked;
      const typEgzemplarza = isDemo ? 'Demo' : 'Sprzedażowy';
      if (!productId || !quantity) return;
      try {
          const result = await addStock(productId, quantity, typEgzemplarza);
          alert(result.message);
          addStockForm.reset();
          await showOverallStockView();
      } catch (error) { alert(`Błąd: ${error.message}`); }
  });



  addPatientForm.addEventListener('change', async e => {
      const firma = document.getElementById('firma-select').value;
      const podgrupa = document.getElementById('podgrupa-select').value;
      if (e.target.id === 'firma-select') {
          populatePodgrupaSelect(document.getElementById('podgrupa-select'), firma);
          populateAparatSelect(document.getElementById('aparat-select'), firma, '');
          sluchawkiSection.classList.add('hidden');
      } else if (e.target.id === 'podgrupa-select') {
          populateAparatSelect(document.getElementById('aparat-select'), firma, podgrupa);
          sluchawkiSection.classList.add('hidden');
      } else if (e.target.id === 'aparat-select') {
          const selectedAparatId = e.target.value;
          if (!selectedAparatId) {
              sluchawkiSection.classList.add('hidden');
              return;
          }
          const sluchawkiOptions = await getSluchawkiOptions(firma);
          sluchawkaSelect.innerHTML = '<option value="">-- Wybierz słuchawkę --</option>';
          sluchawkiOptions.forEach(opt => {
              sluchawkaSelect.add(new Option(opt.nazwa, opt.produkt_id));
          });
          sluchawkiSection.classList.remove('hidden');
      }
  });

  addPatientForm.addEventListener('submit', async e => {
      e.preventDefault();
      const formData = new FormData(addPatientForm);
      const data = {
          imie: formData.get('imie'), nazwisko: formData.get('nazwisko'),
          telefon: formData.get('telefon'), pesel: formData.get('pesel'),
          data_urodzenia: formData.get('data_urodzenia'), aparat_id: formData.get('aparat'),
          ilosc_aparatow: formData.get('ilosc_aparatow'), status_wnioskow: formData.get('status_wnioskow'),
          sluchawka_id: formData.get('sluchawka'), is_demo: formData.get('is_demo') === 'on'
      };

      // Walidacja daty urodzenia przed wysłaniem
      if (data.data_urodzenia === 'Nieprawidłowy PESEL') {
          showToast('Proszę podać prawidłowy numer PESEL.', 'error');
          return;
      }

      try {
          const result = await createPatient(data);
          showToast(result.message); // <-- Używamy nowego powiadomienia
          hideAddPatientView();
          await init();
      } catch (error) {
          showToast(error.message, 'error'); // <-- Używamy nowego powiadomienia o błędzie
      }
  });

  addPatientForm.addEventListener('input', e => {
      if (e.target.name === 'pesel' && e.target.value.length === 11) {
          const dob = parsePESEL(e.target.value);
          document.querySelector('input[name="data_urodzenia"]').value = dob || 'Nieprawidłowy PESEL';
      }
  });
  editPatientForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const updatedData = {
          imie: e.target.elements.imie.value, nazwisko: e.target.elements.nazwisko.value,
          telefon: e.target.elements.telefon.value, pesel: e.target.elements.pesel.value
      };
      try {
          const result = await updatePatient(activePatientId, updatedData);
          alert(result.message);
          editPatientModal.classList.add('hidden');
          await init();
          await refreshPatientDetails();
      } catch (error) { alert(`Błąd: ${error.message}`); }
  });
  deliveryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rows = document.querySelectorAll('.delivery-item-row');
      const itemsToSubmit = [];

      rows.forEach(row => {
          const produkt_id = row.querySelector('.delivery-product-select').value;
          const quantity = row.querySelector('.delivery-quantity-input').value;
          const is_demo = row.querySelector('.delivery-demo-checkbox').checked; // Odczytujemy stan checkboxa

          if (produkt_id && quantity > 0) {
              itemsToSubmit.push({ produkt_id, quantity, is_demo }); // Dodajemy nową informację
          }
      });

      if (itemsToSubmit.length === 0) {
          return showToast('Proszę dodać przynajmniej jedną pozycję do dostawy.', 'error');
      }

      try {
          const result = await bulkAddStock(itemsToSubmit);
          showToast(result.message);
          deliveryModal.classList.add('hidden');
          await showOverallStockView();
      } catch (error) {
          showToast(error.message, 'error');
      }
  });

  warehouseFilterButtons.addEventListener('click', (e) => {
      // Sprawdź, czy kliknięto na przycisk z odpowiednią klasą
      if (!e.target.classList.contains('filter-btn')) return;

      // Pobierz wartość filtra z atrybutu data-filter
      const filter = e.target.dataset.filter;

      // Zaktualizuj, który przycisk jest aktywny (podświetlony)
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');

      // Przejdź przez wszystkie wiersze tabeli i pokaż/ukryj odpowiednie
      const rows = document.querySelectorAll('#warehouse-table-body tr');
      rows.forEach(row => {
          if (filter === 'all' || row.dataset.category === filter) {
              row.style.display = ''; // Pokaż wiersz
          } else {
              row.style.display = 'none'; // Ukryj wiersz
          }
      });
  });

  navFinanceHistoryBtn.addEventListener('click', showFinanceHistoryView);

showHistoryBtn.addEventListener('click', async () => {
    const year = financeYearSelect.value;
    const month = financeMonthSelect.value;
    if (!year || !month) return showToast('Proszę wybrać rok i miesiąc.', 'error');
    const monthString = `${year}-${String(month).padStart(2, '0')}`;
    try {
        const data = await getTransactionsForMonth(monthString);
        renderTransactionsTable(data.transactions, 'finance-history-table');
        financeHistorySummary.innerHTML = `<h4>Podsumowanie dla ${year}-${month}: <strong>${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(data.summary.total)}</strong></h4>`;
    } catch (error) { showToast(`Błąd ładowania transakcji.`, 'error'); }
});

financeYearSelect.addEventListener('change', handleYearChange);

  // --- Listenery dla Modali ---
  cancelSwapBtn.addEventListener('click', () => swapAparatModal.classList.add('hidden'));
  cancelSwapSluchawkaBtn.addEventListener('click', () => swapSluchawkaModal.classList.add('hidden'));
  btnDeleteCancel.addEventListener('click', () => deletePatientModal.classList.add('hidden'));
  closeImageModalBtn.addEventListener('click', () => viewAudiogramModal.classList.add('hidden'));
  cancelEditPatientBtn.addEventListener('click', () => editPatientModal.classList.add('hidden'));

swapAparatForm.addEventListener('change', async (e) => {
  const firmaSelect = document.getElementById('swap-firma-select');
  const podgrupaSelect = document.getElementById('swap-podgrupa-select');
  const aparatSelect = document.getElementById('swap-aparat-select');
  const sluchawkaSection = document.getElementById('swap-sluchawka-section');
  const sluchawkaSelect = document.getElementById('swap-sluchawka-select');

  const nowaFirma = firmaSelect.value;
  const nowaPodgrupa = podgrupaSelect.value;

  if (e.target.id === 'swap-firma-select') {
      populatePodgrupaSelect(podgrupaSelect, nowaFirma);
      populateAparatSelect(aparatSelect, nowaFirma, '');

      // Pokaż/ukryj wymianę słuchawek i DYNAMICZNIE zarządzaj atrybutem 'required'
      if (nowaFirma && nowaFirma !== currentPatientApparatBrand) {
          const sluchawkiOptions = await getSluchawkiOptions(nowaFirma);
          sluchawkaSelect.innerHTML = '<option value="">-- Wybierz nową słuchawkę --</option>';
          sluchawkiOptions.forEach(opt => sluchawkaSelect.add(new Option(opt.nazwa, opt.produkt_id)));
          sluchawkaSelect.required = true; // Włącz wymóg
          sluchawkaSection.classList.remove('hidden');
      } else {
          sluchawkaSelect.required = false; // Wyłącz wymóg
          sluchawkaSection.classList.add('hidden');
      }
  } else if (e.target.id === 'swap-podgrupa-select') {
      populateAparatSelect(aparatSelect, nowaFirma, nowaPodgrupa);
  }
});

swapAparatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const sluchawkaSelect = document.getElementById('swap-sluchawka-select');
  const swapData = {
      new_aparat_id: document.getElementById('swap-aparat-select').value,
      is_demo: e.target.elements.is_demo_swap.checked,
      // Przekaż ID słuchawki tylko jeśli pole jest wymagane i ma wartość
      new_sluchawka_id: sluchawkaSelect.required ? sluchawkaSelect.value : null
  };

  if (!swapData.new_aparat_id) {
      return showToast('Proszę wybrać nowy aparat.', 'error');
  }
  if (sluchawkaSelect.required && !swapData.new_sluchawka_id) {
      return showToast('Musisz wybrać nową słuchawkę przy zmianie producenta.', 'error');
  }

  try {
      const result = await swapAparat(activePatientId, swapData);
      showToast(result.message);
      swapAparatModal.classList.add('hidden');
      await refreshPatientDetails();
  } catch (err) {
      showToast(err.message, 'error');
  }
});

  // Listener dla formularza wymiany samych słuchawek
  swapSluchawkaForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Zapobiegaj domyślnemu przeładowaniu strony

  // Pobierz ID wybranej nowej słuchawki
  const newSluchawkaId = document.getElementById('swap-sluchawka-select-single').value;

  // Sprawdź, czy coś zostało wybrane
  if (!newSluchawkaId) {
      return showToast('Proszę wybrać nową słuchawkę.', 'error');
  }

  try {
      // Wywołaj funkcję API, aby dokonać wymiany na serwerze
      const result = await swapSluchawki(activePatientId, newSluchawkaId);
      showToast(result.message);

      // Ukryj modal i odśwież kartę pacjenta, aby pokazać zmiany
      swapSluchawkaModal.classList.add('hidden');
      await refreshPatientDetails();
  } catch(err) {
      showToast(err.message, 'error');
  }
});
  addBatteriesForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const produktId = document.getElementById('add-battery-type-select').value;
      if (!produktId) return showToast('Proszę wybrać typ baterii.', 'error');

      const boxes = parseInt(document.getElementById('battery-boxes').value, 10) || 0;
      const blisters = parseInt(document.getElementById('battery-blisters').value, 10) || 0;
      const totalBatteries = (boxes * 60) + (blisters * 6);

      if (totalBatteries <= 0) return showToast('Proszę podać dodatnią liczbę.', 'error');

      try {
          const result = await addStock(produktId, totalBatteries, 'Sprzedażowy');
          showToast(result.message);
          addBatteriesModal.classList.add('hidden');
          await showOverallStockView();
      } catch (error) { showToast(error.message, 'error'); }
  });

  sellBatteryForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const produktId = saleItemSelect.value;
      if (!produktId) return showToast('Proszę wybrać produkt.', 'error');

      const product = allProducts.find(p => p.produkt_id == produktId);
      let quantity = 0;

      // Przelicz ilość w zależności od typu produktu
      if (product.nazwa === 'Bateria') {
          const boxes = parseInt(document.getElementById('battery-boxes-sold').value, 10) || 0;
          const blisters = parseInt(document.getElementById('battery-blisters-sold').value, 10) || 0;
          quantity = (boxes * 60) + (blisters * 6);
      } else {
          quantity = parseInt(document.getElementById('sale-quantity').value, 10) || 0;
      }

      if (quantity <= 0) {
          return showToast('Proszę podać prawidłową, dodatnią ilość.', 'error');
      }

      try {
          const result = await sellConsumable(produktId, quantity);
          showToast(result.message);
          sellBatteryModal.classList.add('hidden');
          // Ukryj sekcje z polami input po zamknięciu modala
          batterySaleInputs.classList.add('hidden');
          genericSaleInputs.classList.add('hidden');
          await showOverallStockView();
          if (!financeViewContainer.classList.contains('hidden')) {
              await showFinanceView();
          }
      } catch (error) {
          showToast(error.message, 'error');
      }
  });

  btnDeleteConfirmYes.addEventListener('click', async () => {
    try {
        const result = await deletePatient(activePatientId, true); // true = pacjent zakupił
        showToast(result.message);
        deletePatientModal.classList.add('hidden');
        patientDetailContainerEl.classList.add('hidden');
        await init(); // Odśwież listę pacjentów
    } catch (error) {
        showToast(error.message, 'error');
    }
});

btnDeleteConfirmNo.addEventListener('click', async () => {
  try {
      const result = await deletePatient(activePatientId, false); // false = pacjent zwrócił sprzęt
      showToast(result.message);
      deletePatientModal.classList.add('hidden');
      patientDetailContainerEl.classList.add('hidden');
      await init();
  } catch (error) {
      showToast(error.message, 'error');
  }
});

  saleItemSelect.addEventListener('change', (e) => {
      const selectedProductId = e.target.value;
      if (!selectedProductId) {
          batterySaleInputs.classList.add('hidden');
          genericSaleInputs.classList.add('hidden');
          return;
      }

      const product = allProducts.find(p => p.produkt_id == selectedProductId);

      if (product && product.nazwa === 'Bateria') {
          // Jeśli wybrano baterie, pokaż pola dla baterii
          genericSaleInputs.classList.add('hidden');
          batterySaleInputs.classList.remove('hidden');
      } else {
          // Jeśli wybrano cokolwiek innego (np. słuchawkę), pokaż pole na sztuki
          batterySaleInputs.classList.add('hidden');
          genericSaleInputs.classList.remove('hidden');
      }
  });

  document.body.addEventListener('change', (e) => {
    if (e.target.classList.contains('promo-checkbox')) {
        const itemId = e.target.dataset.itemId;
        const inputContainer = document.getElementById(`promo-input-container-${itemId}`);
        if (e.target.checked) {
            inputContainer.classList.remove('hidden');
        } else {
            inputContainer.classList.add('hidden');
            // Opcjonalnie: wyczyść cenę promo po odznaczeniu
            setPromoPrice(itemId, null).then(refreshPatientDetails);
        }
    }
});

  // --- Główny, delegowany listener dla przycisków dynamicznych ---
  // W pliku app.js - wklej ten blok przed init();

  // --- Główny, delegowany listener dla wszystkich dynamicznych przycisków ---
  document.body.addEventListener('click', async (e) => {
      const target = e.target;
      try {
          // Logika dla przycisków +/- w trybie korekty
          if (target.classList.contains('btn-adjust')) {
              const productId = target.dataset.productId;
              const change = parseInt(target.dataset.change, 10);
              if (!stockAdjustments[productId]) { stockAdjustments[productId] = 0; }
              stockAdjustments[productId] += change;
              const valueSpan = target.parentElement.querySelector('.adjustment-value');
              const currentValue = stockAdjustments[productId];
              valueSpan.textContent = `${currentValue > 0 ? '+' : ''}${currentValue}`;
          }
          // Logika dla przycisków w karcie pacjenta
          else if (target.id === 'btn-delete-patient') {
              deletePatientModal.classList.remove('hidden');
          }
          else if (target.classList.contains('btn-update-wnioski')) {
              const result = await updateWnioskiStatus(target.dataset.patientId, 'Zrobione');
              showToast(result.message);
              await refreshPatientDetails();
          }
          else if (target.classList.contains('btn-mark-ordered')) {
              await updateItemStatus(target.dataset.itemId, 'Zamówiono');
              showToast('Oznaczono jako zamówione.');
              await refreshPatientDetails();
          }
          else if (target.classList.contains('btn-mark-delivered')) {
              await updateItemStatus(target.dataset.itemId, 'Zarezerwowany');
              showToast('Oznaczono jako dostarczone.');
              await refreshPatientDetails();
          }
          else if (target.id === 'btn-set-wypozyczono') {
              const result = await setWypozyczonoStatus(activePatientId);
              showToast(result.message);
              await init();
              await refreshPatientDetails();
          }
         else if (e.target.id === 'btn-show-swap-all-modal') {
          // Zapamiętaj obecną markę aparatu pacjenta
          const patientData = await getPatientDetails(activePatientId);
          const currentAparat = patientData.sprzet.find(s => s.typ === 'Aparat');
          currentPatientApparatBrand = currentAparat ? currentAparat.producent : null;

          // --- KLUCZOWA POPRAWKA JEST TUTAJ ---
          // Upewniamy się, że dane o strukturze produktów są załadowane, ZANIM otworzymy modal
          if (Object.keys(structuredProductsData).length === 0) {
              try {
                  structuredProductsData = await getStructuredProducts();
              } catch (error) {
                  showToast('Nie udało się załadować listy aparatów.', 'error');
                  return; // Przerwij operację, jeśli wystąpił błąd
              }
          }
              populateFirmaSelect(document.getElementById('swap-firma-select'));
              populatePodgrupaSelect(document.getElementById('swap-podgrupa-select'), '');
              populateAparatSelect(document.getElementById('swap-aparat-select'), '', '');

              // Upewniamy się, że sekcja słuchawek jest ukryta przy starcie
              const sluchawkaSection = document.getElementById('swap-sluchawka-section');
              sluchawkaSection.classList.add('hidden');
              document.getElementById('swap-sluchawka-select').required = false;

              swapAparatModal.classList.remove('hidden');
          }
          else if (e.target.id === 'btn-show-swap-sluchawki-modal') {
              try {
                  // Krok 1: Pobierz aktualne dane pacjenta, aby znaleźć producenta jego aparatu
                  const patientData = await getPatientDetails(activePatientId);
                  const aparat = patientData.sprzet.find(s => s.typ === 'Aparat');

                  if (aparat) {
                      // Krok 2: Pobierz z API listę słuchawek pasujących do tego producenta
                      const sluchawkiOptions = await getSluchawkiOptions(aparat.producent);

                      // Krok 3: Znajdź listę <select> w modalu i wyczyść ją
                      const select = document.getElementById('swap-sluchawka-select-single');
                      select.innerHTML = '<option value="">-- Wybierz nową słuchawkę --</option>';

                      // Krok 4: Wypełnij listę pobranymi opcjami
                      sluchawkiOptions.forEach(opt => {
                          select.add(new Option(opt.nazwa, opt.produkt_id));
                      });

                      // Krok 5: Dopiero teraz pokaż modal
                      swapSluchawkaModal.classList.remove('hidden');
                  } else {
                      showToast('Nie można ustalić producenta aparatu pacjenta.', 'error');
                  }
              } catch (error) {
                  showToast('Wystąpił błąd przy ładowaniu opcji słuchawek.', 'error');
              }
          }
          else if (target.classList.contains('btn-save-notes')) {
              const patientId = target.dataset.patientId;
              const textarea = document.getElementById(`notes-textarea-${patientId}`);
              const result = await saveNotes(patientId, textarea.value);
              showToast(result.message);
          }
          else if (target.classList.contains('audiogram-thumb-img')) {
              modalImageContent.src = target.src;
              viewAudiogramModal.classList.remove('hidden');
          }
          else if (target.classList.contains('btn-upgrade-to-sales')) {
              const patientId = target.dataset.patientId;
              if (confirm('Czy na pewno chcesz zamienić aparaty DEMO na wersje sprzedażowe?')) {
                  const result = await upgradeToSales(patientId);
                  showToast(result.message);
                  await refreshPatientDetails();
              }
          }
          else if (target.id === 'btn-show-edit-patient') {
              const patientData = await getPatientDetails(activePatientId);
              editPatientForm.elements.imie.value = patientData.imie;
              editPatientForm.elements.nazwisko.value = patientData.nazwisko;
              editPatientForm.elements.telefon.value = patientData.telefon;
              editPatientForm.elements.pesel.value = patientData.pesel;
              editPatientModal.classList.remove('hidden');
          }
          else if (target.classList.contains('btn-edit-serial')) {
              const itemId = target.dataset.itemId;
              const displaySpan = document.getElementById(`serial-display-${itemId}`);
              const currentSerial = displaySpan.textContent.replace('Nr seryjny: ', '').replace('Brak', '');
              displaySpan.innerHTML = `<input type="text" class="serial-input" value="${currentSerial}" placeholder="Wpisz nr seryjny..."><button class="btn-save-serial btn-success" data-item-id="${itemId}">Zapisz</button>`;
              target.style.display = 'none';
          }
          else if (target.classList.contains('btn-save-serial')) {
              const itemId = target.dataset.itemId;
              const input = target.parentElement.querySelector('.serial-input');
              const result = await updateSerialNumber(itemId, input.value);
              showToast(result.message);
              await refreshPatientDetails();
          }
          else if (target.id === 'show-add-batteries-modal-btn') {
              addBatteriesForm.reset();
              await ensureAllProductsLoaded();
              populateBatterySelect(document.getElementById('add-battery-type-select'));
              addBatteriesModal.classList.remove('hidden');
          }
          else if (target.id === 'show-quick-sale-modal-btn') {
              sellBatteryForm.reset();
              await ensureAllProductsLoaded();
              populateSaleableItemsSelect(saleItemSelect);
              batterySaleInputs.classList.add('hidden');
              genericSaleInputs.classList.add('hidden');
              sellBatteryModal.classList.remove('hidden');
          }
          else if (target.classList.contains('btn-save-promo')) {
              const itemId = target.dataset.itemId;
              const priceInput = document.getElementById(`promo-input-container-${itemId}`).querySelector('.promo-price-input');
              const newPrice = priceInput.value;
              if (newPrice === '' || isNaN(parseFloat(newPrice)) || parseFloat(newPrice) < 0) {
                  return showToast('Proszę podać prawidłową cenę.', 'error');
              }
              const result = await setPromoPrice(itemId, newPrice);
              showToast(result.message);
              await refreshPatientDetails();
          }
          else if (target.classList.contains('btn-update-complaint-status')) {
              const complaintId = target.dataset.complaintId;
              let newStatus = target.dataset.newStatus;
              if (newStatus === 'Powiadom pacjenta') { newStatus = 'Powiadomiono'; }
              await updateComplaintStatus(complaintId, newStatus);
              showToast(`Status reklamacji zaktualizowany.`);
              await refreshPatientDetails();
          }
          else if (target.classList.contains('btn-save-complaint-description')) {
              const complaintId = target.dataset.complaintId;
              const description = document.querySelector(`.complaint-description[data-complaint-id="${complaintId}"]`).value;
              await updateComplaintDescription(complaintId, description);
              showToast('Opis reklamacji został zapisany.');
          }
      } catch (error) {
          console.error("Błąd w głównym listenerze body:", error);
          showToast(error.message, 'error');
      }
  });

  // --- Listener dla listy pacjentów (musi być osobno) ---
  patientListEl.addEventListener('click', async (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      document.querySelectorAll('#patient-list li').forEach(el => el.classList.remove('active'));
      li.classList.add('active');
      activePatientId = li.dataset.patientId;
      await refreshPatientDetails();
  });


  // Start aplikacji
  init();
});