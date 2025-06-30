function parsePESEL(pesel) {
    if (typeof pesel !== 'string' || pesel.length !== 11) {
        return null;
    }
    let year = parseInt(pesel.substring(0, 2), 10);
    let month = parseInt(pesel.substring(2, 4), 10);
    let day = parseInt(pesel.substring(4, 6), 10);

    if (month > 80) {
        year += 1800;
        month -= 80;
    } else if (month > 60) {
        year += 2200;
        month -= 60;
    } else if (month > 40) {
        year += 2100;
        month -= 40;
    } else if (month > 20) {
        year += 2000;
        month -= 20;
    } else {
        year += 1900;
    }
    // Formatowanie do YYYY-MM-DD
    const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // Prosta walidacja daty
    if (new Date(fullDate).getDate() !== day) return null;
    
    return fullDate;
}