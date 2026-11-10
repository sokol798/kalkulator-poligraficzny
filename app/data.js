/* Dane domyślne i pamięć (localStorage). */
(function (root) {
  'use strict';
  const KEY = 'kalkulator-poligraficzny-v1';

  // Formaty netto produktu (mm). Pogrupowane jak w cennikach drukarń.
  const STANDARD_FORMATS = [
    // Seria A (ISO 216)
    { id: 'a0', name: 'A0', w: 841, h: 1189, group: 'Seria A' },
    { id: 'a1', name: 'A1', w: 594, h: 841, group: 'Seria A' },
    { id: 'a2', name: 'A2', w: 420, h: 594, group: 'Seria A' },
    { id: 'a3', name: 'A3', w: 297, h: 420, group: 'Seria A' },
    { id: 'a4', name: 'A4', w: 210, h: 297, group: 'Seria A' },
    { id: 'a5', name: 'A5', w: 148, h: 210, group: 'Seria A' },
    { id: 'a6', name: 'A6', w: 105, h: 148, group: 'Seria A' },
    { id: 'a7', name: 'A7', w: 74, h: 105, group: 'Seria A' },
    { id: 'a8', name: 'A8', w: 52, h: 74, group: 'Seria A' },
    // Seria B (ISO 216)
    { id: 'b0', name: 'B0', w: 1000, h: 1414, group: 'Seria B' },
    { id: 'b1', name: 'B1', w: 707, h: 1000, group: 'Seria B' },
    { id: 'b2', name: 'B2', w: 500, h: 707, group: 'Seria B' },
    { id: 'b3', name: 'B3', w: 353, h: 500, group: 'Seria B' },
    { id: 'b4', name: 'B4', w: 250, h: 353, group: 'Seria B' },
    { id: 'b5', name: 'B5', w: 176, h: 250, group: 'Seria B' },
    { id: 'b6', name: 'B6', w: 125, h: 176, group: 'Seria B' },
    { id: 'b7', name: 'B7', w: 88, h: 125, group: 'Seria B' },
    // Ulotki i druki reklamowe
    { id: 'dl', name: 'DL', w: 99, h: 210, group: 'Ulotki' },
    { id: 'dl100', name: 'DL 100 × 210', w: 100, h: 210, group: 'Ulotki' },
    { id: 'a65', name: 'A65 (⅓ A4 wys.)', w: 105, h: 210, group: 'Ulotki' },
    { id: 'u2a4', name: '⅔ A4', w: 198, h: 210, group: 'Ulotki' },
    { id: 'u2a5', name: '½ DL', w: 99, h: 105, group: 'Ulotki' },
    { id: 'kw100', name: 'Kwadrat 100', w: 100, h: 100, group: 'Ulotki' },
    { id: 'kw120', name: 'Kwadrat 120', w: 120, h: 120, group: 'Ulotki' },
    { id: 'kw148', name: 'Kwadrat 148', w: 148, h: 148, group: 'Ulotki' },
    { id: 'kw150', name: 'Kwadrat 150', w: 150, h: 150, group: 'Ulotki' },
    { id: 'kw200', name: 'Kwadrat 200', w: 200, h: 200, group: 'Ulotki' },
    { id: 'kw210', name: 'Kwadrat 210', w: 210, h: 210, group: 'Ulotki' },
    // Wizytówki, karty, zakładki
    { id: 'wiz', name: 'Wizytówka', w: 90, h: 50, group: 'Wizytówki i karty' },
    { id: 'wiz8555', name: 'Wizytówka 85 × 55', w: 85, h: 55, group: 'Wizytówki i karty' },
    { id: 'wiz9055', name: 'Wizytówka 90 × 55', w: 90, h: 55, group: 'Wizytówki i karty' },
    { id: 'wizkw', name: 'Wizytówka kwadrat', w: 55, h: 55, group: 'Wizytówki i karty' },
    { id: 'id1', name: 'Karta ID-1 (kredytowa)', w: 85.6, h: 54, group: 'Wizytówki i karty' },
    { id: 'zak50', name: 'Zakładka 50 × 150', w: 50, h: 150, group: 'Wizytówki i karty' },
    { id: 'zak50b', name: 'Zakładka 50 × 200', w: 50, h: 200, group: 'Wizytówki i karty' },
    { id: 'zak60', name: 'Zakładka 60 × 200', w: 60, h: 200, group: 'Wizytówki i karty' },
    { id: 'bilet', name: 'Bilet / voucher 70 × 200', w: 70, h: 200, group: 'Wizytówki i karty' },
    { id: 'poczt', name: 'Pocztówka 100 × 150', w: 100, h: 150, group: 'Wizytówki i karty' },
    { id: 'poczt2', name: 'Pocztówka 105 × 150', w: 105, h: 150, group: 'Wizytówki i karty' },
    { id: 'zapr', name: 'Zaproszenie 100 × 210', w: 100, h: 210, group: 'Wizytówki i karty' },
    // Koperty (ISO 269)
    { id: 'c4', name: 'Koperta C4', w: 229, h: 324, group: 'Koperty' },
    { id: 'c5', name: 'Koperta C5', w: 162, h: 229, group: 'Koperty' },
    { id: 'c6', name: 'Koperta C6', w: 114, h: 162, group: 'Koperty' },
    { id: 'c65', name: 'Koperta C6/5', w: 114, h: 229, group: 'Koperty' },
    { id: 'dlk', name: 'Koperta DL', w: 110, h: 220, group: 'Koperty' },
    { id: 'b4k', name: 'Koperta B4', w: 250, h: 353, group: 'Koperty' },
    { id: 'e4k', name: 'Koperta E4', w: 280, h: 400, group: 'Koperty' },
    // Plakaty w formatach drukarskich (obcięte z arkusza)
    { id: 'b2p', name: 'Plakat B2 (500 × 700)', w: 500, h: 700, group: 'Plakaty' },
    { id: 'b1p', name: 'Plakat B1 (700 × 1000)', w: 700, h: 1000, group: 'Plakaty' },
    { id: 'b3p', name: 'Plakat B3 (350 × 500)', w: 350, h: 500, group: 'Plakaty' },
    { id: 'b4p', name: 'Plakat B4 (250 × 350)', w: 250, h: 350, group: 'Plakaty' },
    { id: 'b2o', name: 'Plakat B2 obcięty (480 × 680)', w: 480, h: 680, group: 'Plakaty' },
    { id: 'b1o', name: 'Plakat B1 obcięty (680 × 980)', w: 680, h: 980, group: 'Plakaty' },
    { id: 'b3o', name: 'Plakat B3 obcięty (340 × 480)', w: 340, h: 480, group: 'Plakaty' },
    { id: 'a3plus', name: 'A3+ (329 × 483)', w: 329, h: 483, group: 'Plakaty' },
    { id: 'p6186', name: 'Plakat 61 × 86', w: 610, h: 860, group: 'Plakaty' },
    { id: 'p4361', name: 'Plakat 43 × 61', w: 430, h: 610, group: 'Plakaty' },
    // Książki, broszury, katalogi (format strony po obcięciu)
    { id: 'ks120', name: 'Książka 120 × 190', w: 120, h: 190, group: 'Książki i broszury' },
    { id: 'ks125', name: 'Książka 125 × 195', w: 125, h: 195, group: 'Książki i broszury' },
    { id: 'ks135', name: 'Książka 135 × 205', w: 135, h: 205, group: 'Książki i broszury' },
    { id: 'ks145', name: 'Książka 145 × 205', w: 145, h: 205, group: 'Książki i broszury' },
    { id: 'ks160', name: 'Książka 160 × 230', w: 160, h: 230, group: 'Książki i broszury' },
    { id: 'ks165', name: 'Książka 165 × 235', w: 165, h: 235, group: 'Książki i broszury' },
    { id: 'ks170', name: 'Album 170 × 240', w: 170, h: 240, group: 'Książki i broszury' },
    { id: 'ks205', name: 'Katalog 205 × 205', w: 205, h: 205, group: 'Książki i broszury' },
    { id: 'ks210', name: 'Katalog 210 × 280', w: 210, h: 280, group: 'Książki i broszury' },
    { id: 'ks230', name: 'Album 230 × 230', w: 230, h: 230, group: 'Książki i broszury' },
    // Kalendarze i teczki (wymiar po rozłożeniu, bez skrzydełek)
    { id: 'kal3', name: 'Kalendarz trójdzielny główka 315 × 210', w: 315, h: 210, group: 'Kalendarze i teczki' },
    { id: 'kal3k', name: 'Kalendarium trójdzielne 315 × 140', w: 315, h: 140, group: 'Kalendarze i teczki' },
    { id: 'kalb', name: 'Kalendarz biurkowy 210 × 100', w: 210, h: 100, group: 'Kalendarze i teczki' },
    { id: 'kala3', name: 'Kalendarz ścienny A3 (297 × 420)', w: 297, h: 420, group: 'Kalendarze i teczki' },
    { id: 'kalpl', name: 'Planer A2 (420 × 594)', w: 420, h: 594, group: 'Kalendarze i teczki' },
    { id: 'tecz', name: 'Teczka A4 rozłożona 440 × 310', w: 440, h: 310, group: 'Kalendarze i teczki' },
    { id: 'teczg', name: 'Teczka A4 z grzbietem 460 × 320', w: 460, h: 320, group: 'Kalendarze i teczki' },
    { id: 'podk', name: 'Podkładka A3 (297 × 420)', w: 297, h: 420, group: 'Kalendarze i teczki' },
    // Fotografia
    { id: 'f913', name: 'Foto 9 × 13', w: 89, h: 127, group: 'Fotografia' },
    { id: 'f1015', name: 'Foto 10 × 15', w: 102, h: 152, group: 'Fotografia' },
    { id: 'f1318', name: 'Foto 13 × 18', w: 127, h: 178, group: 'Fotografia' },
    { id: 'f1521', name: 'Foto 15 × 21', w: 152, h: 216, group: 'Fotografia' },
    { id: 'f2030', name: 'Foto 20 × 30', w: 203, h: 305, group: 'Fotografia' },
    { id: 'f3040', name: 'Foto 30 × 40', w: 305, h: 406, group: 'Fotografia' },
    // Formaty amerykańskie
    { id: 'letter', name: 'Letter', w: 216, h: 279, group: 'Amerykańskie' },
    { id: 'legal', name: 'Legal', w: 216, h: 356, group: 'Amerykańskie' },
    { id: 'tabloid', name: 'Tabloid', w: 279, h: 432, group: 'Amerykańskie' },
    { id: 'hletter', name: 'Half Letter', w: 140, h: 216, group: 'Amerykańskie' },
    { id: 'uswiz', name: 'Wizytówka US 89 × 51', w: 89, h: 51, group: 'Amerykańskie' },
  ];

  // Arkusze drukarskie (mm). Offset: chwyt maszyny u góry. Cyfra: margines z każdej strony.
  const STANDARD_SHEETS = [
    // Offset: formaty B (poligraficzne 700 × 1000, nie ISO)
    { id: 'b1', name: 'B1', w: 700, h: 1000, gripper: 12, margin: 0, group: 'offset' },
    { id: 'b1plus', name: 'B1+', w: 720, h: 1020, gripper: 12, margin: 0, group: 'offset' },
    { id: 'b2', name: 'B2', w: 500, h: 700, gripper: 10, margin: 0, group: 'offset' },
    { id: 'b2plus', name: 'B2+', w: 520, h: 720, gripper: 10, margin: 0, group: 'offset' },
    { id: 'b3', name: 'B3', w: 350, h: 500, gripper: 8, margin: 0, group: 'offset' },
    { id: 'b3plus', name: 'B3+', w: 365, h: 520, gripper: 8, margin: 0, group: 'offset' },
    { id: 'b4', name: 'B4', w: 250, h: 350, gripper: 8, margin: 0, group: 'offset' },
    // Offset: formaty A drukarskie, RA i SRA (ISO 217)
    { id: 'a0d', name: 'A0 drukarski', w: 860, h: 1220, gripper: 12, margin: 0, group: 'offset' },
    { id: 'a1d', name: 'A1 drukarski', w: 610, h: 860, gripper: 12, margin: 0, group: 'offset' },
    { id: 'sra1', name: 'SRA1', w: 640, h: 900, gripper: 12, margin: 0, group: 'offset' },
    { id: 'a2d', name: 'A2 drukarski', w: 430, h: 610, gripper: 10, margin: 0, group: 'offset' },
    { id: 'a2plus', name: 'A2+', w: 450, h: 640, gripper: 10, margin: 0, group: 'offset' },
    { id: 'a3d2', name: 'A3 drukarski', w: 305, h: 430, gripper: 8, margin: 0, group: 'offset' },
    { id: 'sra3o', name: 'SRA3 offset', w: 320, h: 450, gripper: 8, margin: 0, group: 'offset' },
    { id: 'sra4o', name: 'SRA4 offset', w: 225, h: 320, gripper: 8, margin: 0, group: 'offset' },
    { id: 'f6490', name: '64 × 90', w: 640, h: 900, gripper: 12, margin: 0, group: 'offset' },
    { id: 'f5375', name: '53 × 75', w: 530, h: 750, gripper: 10, margin: 0, group: 'offset' },
    // Cyfra (margines niezadrukowany z każdej strony)
    { id: 'sra3', name: 'SRA3', w: 320, h: 450, gripper: 0, margin: 5, group: 'digital' },
    { id: 'sra3plus', name: 'SRA3+', w: 330, h: 488, gripper: 0, margin: 5, group: 'digital' },
    { id: 'a3plusd', name: 'A3+', w: 329, h: 483, gripper: 0, margin: 5, group: 'digital' },
    { id: 'f320464', name: '320 × 464', w: 320, h: 464, gripper: 0, margin: 5, group: 'digital' },
    { id: 'f330700', name: 'Baner 330 × 700', w: 330, h: 700, gripper: 0, margin: 5, group: 'digital' },
    { id: 'a3d', name: 'A3', w: 297, h: 420, gripper: 0, margin: 5, group: 'digital' },
    { id: 'sra4', name: 'SRA4', w: 225, h: 320, gripper: 0, margin: 5, group: 'digital' },
    { id: 'a4d', name: 'A4', w: 210, h: 297, gripper: 0, margin: 5, group: 'digital' },
    { id: 'indigo', name: 'B2 Indigo', w: 530, h: 750, gripper: 0, margin: 10, group: 'digital' },
  ];

  const DEFAULT_SETTINGS = {
    bleed: 3, gripper: 10, grammage: 130, defaultSheetId: 'b2',
    orientation: 'auto', rounding: 'up', autoHistory: true, unit: 'mm',
  };

  const DEFAULT_CURRENT = {
    formatId: 'a5', w: 148, h: 210, bleed: 3, quantity: 1000,
    sheetId: 'b2', grammage: 130, orientation: 'auto', name: '', historyId: null,
  };

  function load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { saved = null; }
    const s = saved || {};
    return {
      settings: Object.assign({}, DEFAULT_SETTINGS, s.settings || {}),
      current: Object.assign({}, DEFAULT_CURRENT, s.current || {}),
      customFormats: Array.isArray(s.customFormats) ? s.customFormats : [],
      customSheets: Array.isArray(s.customSheets) ? s.customSheets : [],
      history: Array.isArray(s.history) ? s.history : [],
      recentFormats: Array.isArray(s.recentFormats) ? s.recentFormats : [],
      recentSheets: Array.isArray(s.recentSheets) ? s.recentSheets : [],
    };
  }

  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* tryb prywatny: bez zapisu */ }
  }

  root.Data = { KEY, STANDARD_FORMATS, STANDARD_SHEETS, DEFAULT_SETTINGS, DEFAULT_CURRENT, load, save };
})(window);
