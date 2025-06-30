window.onload = function() {
    const canvas = document.getElementById('audiogramCanvas');
    const ctx = canvas.getContext('2d');
    
    // Elementy sterujące
    const clearBtn = document.getElementById('clearBtn');
    const generateBtn = document.getElementById('generateBtn');
    const patientNameInput = document.getElementById('patientName');
    const patientPeselInput = document.getElementById('patientPesel');
    const performedByInput = document.getElementById('performedBy');

    // Przycisk zapisu do karty - tworzony dynamicznie
    const saveBtn = document.createElement('button');
    saveBtn.id = 'saveBtn';
    saveBtn.textContent = 'Generuj i zapisz w karcie';
    saveBtn.className = 'btn-success';

    // Tablice na dane audiogramu
    const rightEarAir = [], rightEarBone = [], leftEarAir = [], leftEarBone = [];
    
    // Wczytywanie tła
    const backgroundImage = new Image();
    backgroundImage.crossOrigin = "Anonymous"; // Ważne dla uniknięcia błędu 'Tainted Canvas'
    backgroundImage.src = 'audiogram.jpg';
    backgroundImage.onload = function() {
        canvas.width = this.width;
        canvas.height = this.height;
        redraw();
    };

    // Odczytanie parametrów z URL i wypełnienie pól
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get('id');
    if (patientNameInput) patientNameInput.value = params.get('name') || '';
    if (patientPeselInput) patientPeselInput.value = params.get('pesel') || '';

    // Pokaż przycisk zapisu tylko jeśli jesteśmy w kontekście pacjenta
    if (patientId) {
        document.querySelector('.controls').appendChild(saveBtn);
    }
    
    // --- GŁÓWNA FUNKCJA RYSUJĄCA ---
    function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImage, 0, 0);
        drawPath(rightEarAir, 'red', 'circle', 'solid');
        drawPath(rightEarBone, 'red', 'greater_than', 'dashed');
        drawPath(leftEarAir, 'blue', 'cross', 'solid');
        drawPath(leftEarBone, 'blue', 'less_than', 'dashed');
    }

    // --- FUNKCJA POMOCNICZA DO RYSOWANIA ŚCIEŻKI I SYMBOLI ---
    function drawPath(points, color, symbol, lineStyle) {
        points.sort((a, b) => a.x - b.x);
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        if (lineStyle === 'dashed') { ctx.setLineDash([5, 5]); } else { ctx.setLineDash([]); }
        points.forEach((point, index) => { (index === 0) ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y); });
        ctx.stroke();
        ctx.fillStyle = color; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        points.forEach(point => {
            if (symbol === 'circle') { ctx.beginPath(); ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI); ctx.fill(); } 
            else if (symbol === 'cross') { ctx.beginPath(); ctx.moveTo(point.x - 5, point.y - 5); ctx.lineTo(point.x + 5, point.y + 5); ctx.moveTo(point.x + 5, point.y - 5); ctx.lineTo(point.x - 5, point.y + 5); ctx.stroke(); } 
            else if (symbol === 'greater_than') { ctx.fillText('>', point.x, point.y + 1); } 
            else if (symbol === 'less_than') { ctx.fillText('<', point.x, point.y + 1); }
        });
    }

    // --- FUNKCJA DO GENEROWANIA OBRAZU Z DANYMI ---
    function generateFinalImage() {
        redraw();
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left'; // Resetujemy wyrównanie tekstu
    
        // Używamy bezpiecznych, większych wartości dla marginesu
        const leftMargin = 95;
        const rightMargin = 310;
        const topMargin1 = 25;
        const topMargin2 = 45;

        ctx.fillText('Nazwisko i imię: ' + patientNameInput.value, leftMargin, topMargin1);
        ctx.fillText('PESEL: ' + patientPeselInput.value, rightMargin, topMargin1);
        ctx.fillText('Rozpoznanie: ', leftMargin, topMargin2);
        ctx.fillText('Data: ' + new Date().toLocaleDateString('pl-PL'), rightMargin, topMargin2);
        ctx.fillText('Wykonał: ' + performedByInput.value, 420, topMargin2);
        
        return canvas.toDataURL('image/png');
    }

    // --- EVENT LISTENERS ---
    canvas.addEventListener('click', function(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (x < canvas.width / 2) { (rightEarAir.length < 6) ? rightEarAir.push({ x, y }) : rightEarBone.push({ x, y }); } 
        else { (leftEarAir.length < 6) ? leftEarAir.push({ x, y }) : leftEarBone.push({ x, y }); }
        redraw();
    });

    clearBtn.addEventListener('click', function() {
        rightEarAir.length = 0; rightEarBone.length = 0; leftEarAir.length = 0; leftEarBone.length = 0;
        redraw();
    });

    generateBtn.addEventListener('click', function() {
        const imageURL = generateFinalImage();
        const link = document.createElement('a');
        link.download = `audiogram-${patientNameInput.value || 'pacjent'}.png`;
        link.href = imageURL;
        link.click();
        setTimeout(redraw, 100); // Czyścimy tekst z płótna po chwili
    });

    saveBtn.addEventListener('click', async function() {
        const imageData = generateFinalImage();
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/patients/${patientId}/audiograms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_data: imageData })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert('Audiogram został pomyślnie zapisany w karcie pacjenta!');
            window.close();
        } catch (error) {
            console.error('Szczegółowy błąd zapisu:', error);
            alert(`Nie udało się zapisać audiogramu: ${error.message}`);
        }
    });
};