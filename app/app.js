/* Kalkulator poligraficzny — interfejs. Wymaga calc.js i data.js. */
(function () {
  'use strict';
  const S = Data.load();
  const app = document.getElementById('app');
  let sheetOverlay = null; // aktualnie otwarty arkusz dolny

  /* ---------- pomocnicze ---------- */
  const nf0 = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 });
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const persist = () => Data.save(S);
  const unit = () => S.settings.unit;
  /** mm → tekst w jednostce użytkownika (bez jednostki). */
  const dim = (mm) => unit() === 'cm' ? nf2.format(mm / 10) : nf2.format(mm);
  const dims = (w, h) => `${dim(w)} × ${dim(h)} ${unit()}`;
  /** wartość z pola (w jednostce użytkownika) → mm */
  const toMm = (v) => { const n = parseFloat(String(v).replace(',', '.').replace(/\s/g, '')); if (!isFinite(n) || n < 0) return 0; return unit() === 'cm' ? n * 10 : n; };
  const fromMm = (mm) => unit() === 'cm' ? nf2.format(mm / 10) : nf2.format(mm);
  const kg = (g) => g >= 1000 ? `${nf1.format(g / 1000)} kg` : `${nf0.format(g)} g`;
  const parseInt0 = (v) => { const n = parseInt(String(v).replace(/\s/g, ''), 10); return isFinite(n) && n > 0 ? n : 0; };

  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1800);
  }

  /* ---------- dane ---------- */
  const allFormats = () => S.customFormats.concat(Data.STANDARD_FORMATS);
  const allSheets = () => S.customSheets.concat(Data.STANDARD_SHEETS);
  const SHEET_GROUPS = [['offset', 'Offset · arkusze maszynowe'], ['digital', 'Cyfra · arkuszowe'], ['wide', 'Wielki format · plotery']];
  /** Grupy formatów standardowych w kolejności z danych. */
  const formatGroups = () => Data.STANDARD_FORMATS.reduce((a, f) => (a.includes(f.group) ? a : a.concat(f.group)), []);
  const formatById = (id) => allFormats().find((f) => f.id === id) || null;
  const sheetById = (id) => allSheets().find((s) => s.id === id) || null;
  function currentSheet() {
    return sheetById(S.current.sheetId) || sheetById(S.settings.defaultSheetId) || Data.STANDARD_SHEETS[0];
  }
  /** Arkusz z chwytem/marginesem zmienionym w kalkulatorze (c.gm), albo oryginalny. */
  function effectiveSheet() {
    const s = currentSheet();
    if (S.current.gm == null) return s;
    return Object.assign({}, s, s.group === 'offset' ? { gripper: S.current.gm, margin: 0 } : { margin: S.current.gm, gripper: 0 });
  }
  function currentInput() {
    const c = S.current;
    return {
      format: { w: c.w, h: c.h }, sheet: effectiveSheet(), bleed: c.bleed, quantity: c.quantity,
      grammage: c.grammage, orientation: c.orientation, rounding: S.settings.rounding,
    };
  }
  function currentResult() { return Calc.calculate(currentInput()); }
  function formatLabel() {
    const f = S.current.formatId ? formatById(S.current.formatId) : null;
    return f ? f.name : 'Własny';
  }
  function useFormat(f) {
    Object.assign(S.current, { formatId: f.id, w: f.w, h: f.h, bleed: f.bleed != null ? f.bleed : S.settings.bleed });
    S.recentFormats = [f.id].concat(S.recentFormats.filter((x) => x !== f.id)).slice(0, 4);
    persist();
  }
  function useSheet(s) {
    S.current.sheetId = s.id; S.current.gm = null;
    S.recentSheets = [s.id].concat(S.recentSheets.filter((x) => x !== s.id)).slice(0, 4);
    persist();
  }
  function detectFormat() {
    // Po ręcznej zmianie wymiaru: jeśli pasuje do znanego formatu, podświetl go; inaczej "Własny".
    const f = allFormats().find((x) => x.w === S.current.w && x.h === S.current.h);
    S.current.formatId = f ? f.id : null;
  }

  /** Zapis bieżącego obliczenia w historii (nowy wpis albo aktualizacja). */
  function saveToHistory(star) {
    const r = currentResult();
    const sh = effectiveSheet();
    const entry = {
      id: S.current.historyId || uid(), ts: Date.now(), name: S.current.name || '',
      starred: false,
      input: { formatId: S.current.formatId, formatName: formatLabel(), w: S.current.w, h: S.current.h, bleed: S.current.bleed, quantity: S.current.quantity, sheetId: sh.id, sheetName: sh.name, sheetW: sh.w, sheetH: sh.h, gripper: sh.gripper, margin: sh.margin, grammage: S.current.grammage, orientation: S.current.orientation, rounding: S.settings.rounding },
      result: { perSheet: r.perSheet, sheets: r.sheets, cols: r.layout.chosen.cols, rows: r.layout.chosen.rows, orientation: r.layout.chosen.orientation, utilization: r.utilization, lastSheet: r.lastSheet, weightSheets: r.weight.sheetsTotal, weightPiece: r.weight.piece, weightPieces: r.weight.piecesTotal, weightSheet: r.weight.sheet },
    };
    const i = S.history.findIndex((h) => h.id === entry.id);
    if (i >= 0) { entry.starred = S.history[i].starred; if (!star) entry.ts = S.history[i].ts; S.history[i] = entry; }
    else S.history.unshift(entry);
    if (star) entry.starred = !entry.starred;
    S.current.historyId = entry.id;
    if (S.history.length > 500) S.history.length = 500;
    persist();
    return entry;
  }
  function loadFromHistory(h) {
    const i = h.input;
    Object.assign(S.current, { formatId: i.formatId, w: i.w, h: i.h, bleed: i.bleed, quantity: i.quantity, sheetId: i.sheetId, grammage: i.grammage, orientation: i.orientation === 'landscape' || (i.orientation !== 'portrait' && h.result && h.result.orientation === 'landscape') ? 'landscape' : 'portrait', name: h.name, historyId: h.id });
    if (!sheetById(i.sheetId)) {
      // arkusz usunięty: odtwórz jako własny
      const s = { id: i.sheetId, name: i.sheetName, w: i.sheetW, h: i.sheetH, gripper: i.gripper, margin: i.margin, group: i.margin ? 'digital' : 'offset' };
      S.customSheets.push(s);
    }
    persist();
  }

  /* ---------- ikony ---------- */
  const I = {
    back: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 2 4 8l6 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    close: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2 2 12" stroke="currentColor" stroke-width="1.6"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.8"/></svg>',
    gear: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    save: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2h10v12l-5-3-5 3z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    saveOn: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2h10v12l-5-3-5 3z" fill="currentColor" stroke="currentColor" stroke-width="1.5"/></svg>',
    chev: '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    arrow: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5 2l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    search: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="#5c6670" stroke-width="1.5"/><path d="M11 11l3.5 3.5" stroke="#5c6670" stroke-width="1.5"/></svg>',
    pdf: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2h7l3 3v9H3z M10 2v3h3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    share: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 10V2M4.5 5.5 8 2l3.5 3.5M3 9v4h10V9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    calc: '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="3" y="2" width="12" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 6h6M6 9.5h2M10 9.5h2M6 13h2M10 13h2" stroke="currentColor" stroke-width="1.5"/></svg>',
    lib: '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="2.5" y="2.5" width="13" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 9h13M9 2.5v13" stroke="currentColor" stroke-width="1.5"/></svg>',
    hist: '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 5v4l3 2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    mail: '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="2" y="4" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 5l6.5 5 6.5-5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 3.5h10M5 3.5V2h4v1.5M3.5 3.5l.7 8.5h5.6l.7-8.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  };

  /** Podgląd arkusza z użytkami jako SVG (proporcjonalny). */
  function previewSVG(result, sheet, opts) {
    opts = opts || {};
    const W = sheet.w, H = sheet.h;
    const lay = result.layout.chosen;
    const u = result.layout.usable;
    const m = sheet.margin || 0, g = sheet.gripper || 0;
    const cells = [];
    const totalW = lay.cols * lay.w, totalH = lay.rows * lay.h;
    const ox = m + (u.w - totalW) / 2, oy = g + m + (u.h - totalH) / 2; // wyśrodkowane w polu użytecznym
    let n = 1;
    for (let r = 0; r < lay.rows; r++) for (let c = 0; c < lay.cols; c++) {
      const x = ox + c * lay.w, y = oy + r * lay.h;
      cells.push(`<rect x="${x + 1}" y="${y + 1}" width="${Math.max(0, lay.w - 2)}" height="${Math.max(0, lay.h - 2)}" fill="#fff" stroke="#dbe0e5" stroke-width="1"/>`);
      if (opts.numbers) cells.push(`<text x="${x + lay.w / 2}" y="${y + lay.h / 2}" font-size="${Math.min(lay.w, lay.h) * 0.3}" fill="#5c6670" text-anchor="middle" dominant-baseline="central" font-family="Inter,system-ui,sans-serif">${n++}</text>`);
    }
    const grip = g > 0 ? `<line x1="0" y1="${g}" x2="${W}" y2="${g}" stroke="#5c6670" stroke-width="1.5" stroke-dasharray="6 5"/>` : '';
    const marg = m > 0 ? `<rect x="${m}" y="${m}" width="${W - 2 * m}" height="${H - 2 * m}" fill="none" stroke="#5c6670" stroke-width="1" stroke-dasharray="4 4"/>` : '';
    return `<svg viewBox="-2 -2 ${W + 4} ${H + 4}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Rozkład ${lay.count} użytków na arkuszu"><rect x="0" y="0" width="${W}" height="${H}" rx="${W * 0.012}" fill="#eceff2" stroke="#c9d0d6" stroke-width="1.5"/>${grip}${marg}${cells.join('')}</svg>`;
  }

  /* ---------- nawigacja ---------- */
  const logoBtn = () => `<button type="button" class="icobtn logo no-print" id="menu" aria-label="Menu"><img src="icon.svg?v=2" alt="" width="44" height="44"></button>`;
  const backBtn = (href) => `<a href="${href || '#/'}" class="icobtn no-print" aria-label="Wstecz">${I.back}</a>`;
  function bindMenu() { const b = app.querySelector('#menu'); if (b) b.addEventListener('click', openMenu); }
  function openMenu() {
    const item = (href, icon, t, sub) => `<a href="${href}" class="opt" data-nav><span class="nm" style="display:flex;align-items:center;gap:10px">${icon}${t}</span><span class="dim">${sub}</span></a>`;
    const el = openSheet(`${sheetHead('Kalkulator Poligraficzny')}
      ${item('#/', I.calc, 'Kalkulator', 'Nowe obliczenie')}
      ${item('#/biblioteka/formaty', I.lib, 'Biblioteka', `${Data.STANDARD_FORMATS.length + S.customFormats.length} formatów · ${Data.STANDARD_SHEETS.length + S.customSheets.length} arkuszy`)}
      ${item('#/historia', I.hist, 'Historia', S.history.length ? `${S.history.length} ${S.history.length === 1 ? 'obliczenie' : S.history.length < 5 ? 'obliczenia' : 'obliczeń'}` : 'Pusta')}
      ${item('#/ustawienia', I.gear, 'Ustawienia', 'Spady, chwyt, jednostki, kopia zapasowa')}
      <button type="button" class="opt" id="contact"><span class="nm" style="display:flex;align-items:center;gap:10px">${I.mail}Kontakt</span><span class="dim">Pytania, błędy, pomysły</span></button>`);
    el.querySelector('[data-close]').addEventListener('click', closeSheet);
    el.querySelectorAll('[data-nav]').forEach((a) => a.addEventListener('click', () => { closeSheet(); if (a.getAttribute('href') === location.hash) route(); }));
    el.querySelector('#contact').addEventListener('click', openContact);
  }
  function openContact() {
    const mail = Data.CONTACT_EMAIL;
    const el = openSheet(`${sheetHead('Kontakt')}
      <div class="card stack8">
        <div class="lbl">E-mail</div>
        <div style="font-size:17px;font-weight:600;word-break:break-all" id="mailTxt">${esc(mail)}</div>
        <p class="hint">Napisz, jeśli brakuje formatu lub arkusza, coś się źle liczy albo masz pomysł na funkcję.</p>
      </div>
      <div class="actions" style="margin-top:4px"><a class="btn" href="mailto:${esc(mail)}?subject=${encodeURIComponent('Kalkulator Poligraficzny')}">Napisz e-mail</a><button type="button" class="btn light auto" id="copyMail">Kopiuj</button></div>
      <p class="hint" style="margin:8px 4px 0">Kalkulator Poligraficzny · wersja 1.2 · dane są przechowywane tylko w tej przeglądarce.</p>`);
    el.querySelector('[data-close]').addEventListener('click', closeSheet);
    el.querySelector('#copyMail').addEventListener('click', async () => { try { await navigator.clipboard.writeText(mail); toast('Adres skopiowany'); } catch (e) { toast(mail); } });
  }

  function route() {
    closeSheet();
    const h = location.hash.replace(/^#\/?/, '') || '';
    const [p, q] = h.split('?');
    const parts = p.split('/');
    window.scrollTo(0, 0);
    if (parts[0] === '') return renderCalc();
    if (parts[0] === 'karta') return renderCard(new URLSearchParams(q || '').get('id'));
    if (parts[0] === 'biblioteka') return parts[1] === 'arkusze' ? renderSheets() : renderFormats();
    if (parts[0] === 'nowy-format') return renderNewFormat(new URLSearchParams(q || '').get('id'));
    if (parts[0] === 'nowy-arkusz') return renderNewSheet(new URLSearchParams(q || '').get('id'));
    if (parts[0] === 'historia') return renderHistory();
    if (parts[0] === 'ustawienia') return renderSettings();
    if (parts[0] === 'pomoc') return renderHelp();
    location.hash = '#/';
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

  /* ---------- ekran: kalkulator ---------- */
  function renderCalc() {
    const c = S.current;
    const r = currentResult();
    const sh = effectiveSheet();
    // 4 szybkie formaty: ostatnio używane + standardowe
    const quickIds = []; S.recentFormats.forEach((id) => { if (formatById(id) && quickIds.length < 4) quickIds.push(id); });
    ['a5', 'a4', 'a6', 'dl'].forEach((id) => { if (quickIds.length < 4 && !quickIds.includes(id)) quickIds.push(id); });
    if (c.formatId && !quickIds.includes(c.formatId)) quickIds.unshift(c.formatId);
    const quickSheetIds = [sh.id]; S.recentSheets.concat([S.settings.defaultSheetId, 'b1']).forEach((id) => { if (sheetById(id) && !quickSheetIds.includes(id) && quickSheetIds.length < 2) quickSheetIds.push(id); });
    const grams = [80, 130, 170, 300];
    const gramCustom = !grams.includes(c.grammage);
    const step = S.settings.step || 100;
    const bleeds = [0, 2, 3, 5];
    const isOffset = sh.group === 'offset';
    const gms = isOffset ? [0, 8, 10, 12] : [0, 3, 5, 10];
    const gmCur = isOffset ? sh.gripper : sh.margin;
    const hint = (t) => S.settings.hints ? `<p class="hint">${t}</p>` : '';
    const noFit = r.perSheet === 0;
    const entry = c.historyId ? S.history.find((x) => x.id === c.historyId) : null;

    app.innerHTML = `
    <div class="screen">
      <header class="top"><span class="title" style="flex:1">Kalkulator Poligraficzny</span>${logoBtn()}</header>
      <form class="stack" id="f" autocomplete="off" onsubmit="return false">
        <div class="card stack">
          <div><span class="lbl">Format użytku</span>${hint('Użytek to jedna gotowa, przycięta praca, np. ulotka. Wybierz gotowy format albo wpisz wymiar netto, bez spadów.')}</div>
          <div class="chiprow">
            <div class="chips scroll">
              ${quickIds.map((id) => { const f = formatById(id); return `<button type="button" class="chip ${c.formatId === id ? 'on' : ''}" data-format="${id}" title="${dims(f.w, f.h)}">${esc(f.name)}</button>`; }).join('')}
              ${!c.formatId ? '<button type="button" class="chip on">Własny</button>' : ''}
            </div>
            <button type="button" class="chip more" data-open="format">Więcej ${I.chev}</button>
          </div>
          <div class="dims">
            <div><input class="num" id="w" inputmode="decimal" value="${fromMm(c.w)}" aria-label="Szerokość"><div class="lbl sub">szerokość ${unit()}</div></div>
            <span class="x">×</span>
            <div><input class="num" id="h" inputmode="decimal" value="${fromMm(c.h)}" aria-label="Wysokość"><div class="lbl sub">wysokość ${unit()}</div></div>
          </div>
        </div>
        <div class="row2">
          <div class="card stack8">
            <span class="lbl">Nakład (szt.)</span>
            <div class="qty">
              <button type="button" class="step" data-step="-${step}" aria-label="Mniej o ${step}">−</button>
              <button type="button" class="num sm qbtn" id="q" aria-label="Nakład ${nf0.format(c.quantity)} sztuk, dotknij aby zmienić">${nf0.format(c.quantity)}</button>
              <button type="button" class="step" data-step="${step}" aria-label="Więcej o ${step}">+</button>
            </div>
            ${hint('Ile sztuk ma być wydrukowanych. Dotknij liczby, aby ustawić suwakiem.')}
          </div>
          <div class="card stack8">
            <span class="lbl">Arkusz</span>
            <div class="chips">
              ${quickSheetIds.map((id) => { const s = sheetById(id); return `<button type="button" class="chip sm ${sh.id === id ? 'on' : ''}" data-sheet="${id}" title="${dims(s.w, s.h)}">${esc(s.name)}</button>`; }).join('')}
              <button type="button" class="chip sm more" data-open="sheet">Więcej ${I.chev}</button>
            </div>
            ${hint('Papier, który wchodzi do maszyny. Na nim układamy użytki.')}
          </div>
        </div>
        <div class="card stack8">
          <span class="lbl">Papier (g/m²)</span>
          <div class="chips nowrap">
            ${grams.map((g) => `<button type="button" class="chip sm ${c.grammage === g ? 'on' : ''}" data-gram="${g}">${g}</button>`).join('')}
            <input class="num pill ${gramCustom ? 'on' : ''}" id="g" inputmode="numeric" placeholder="inna" value="${gramCustom ? c.grammage : ''}" aria-label="Inna gramatura" style="width:64px;flex-shrink:0;margin-left:auto">
          </div>
          ${hint('Gramatura, czyli waga metra kwadratowego papieru. Służy tylko do policzenia wagi nakładu.')}
        </div>
        <div class="row2">
          <div class="card stack8">
            <span class="lbl">Spady (${unit()})</span>
            <div class="chips">
              ${bleeds.map((v) => `<button type="button" class="chip sm ${c.bleed === v ? 'on' : ''}" data-bleed="${v}">${dim(v)}</button>`).join('')}
              <input class="num pill ${bleeds.includes(c.bleed) ? '' : 'on'}" id="bl" inputmode="decimal" placeholder="inne" value="${bleeds.includes(c.bleed) ? '' : fromMm(c.bleed)}" aria-label="Inny spad" style="width:56px">
            </div>
            ${hint('Zapas obrazu poza formatem, z każdej strony. Zwykle 2–3 mm.')}
          </div>
          <div class="card stack8">
            <span class="lbl">${isOffset ? 'Chwyt' : 'Margines'} (${unit()})</span>
            <div class="chips">
              ${gms.map((v) => `<button type="button" class="chip sm ${gmCur === v ? 'on' : ''}" data-gm="${v}">${dim(v)}</button>`).join('')}
              <input class="num pill ${gms.includes(gmCur) ? '' : 'on'}" id="gmi" inputmode="decimal" placeholder="inne" value="${gms.includes(gmCur) ? '' : fromMm(gmCur)}" aria-label="Inny ${isOffset ? 'chwyt' : 'margines'}" style="width:56px">
            </div>
            ${hint(isOffset ? 'Pas u góry arkusza, którego łapy maszyny nie zadrukują.' : 'Pas niezadrukowany z każdej strony arkusza.')}
          </div>
        </div>
        <div class="card stack8">
          <span class="lbl">Orientacja użytku</span>
          <div class="seg" role="group" aria-label="Orientacja użytku">
            <button type="button" class="${c.orientation === 'portrait' ? 'on' : ''}" data-orient="portrait">Pion</button>
            <button type="button" class="${c.orientation === 'landscape' ? 'on' : ''}" data-orient="landscape">Poziom</button>
          </div>
          ${hint('Jak obrócić użytek na arkuszu: pion – jak format, poziom – obrócony o 90°.')}
        </div>
      </form>
      <div class="bottom">
        ${noFit ? `<div class="warn" style="margin:0 4px 10px">Użytek ${dims(r.layout.gross.w, r.layout.gross.h)} ze spadami nie mieści się na arkuszu ${esc(sh.name)}.</div>` : ''}
        <button type="button" class="btn big" id="calc" ${noFit ? 'disabled' : ''}>Oblicz ${I.arrow}</button>
        ${hint('Wynik otworzy się jako karta zlecenia: liczba arkuszy, rozkład na arkuszu, waga papieru. Tam ją zapiszesz lub udostępnisz.')}
      </div>
    </div>`;

    const $ = (sel) => app.querySelector(sel);
    const onDim = (e) => {
      const w = toMm($('#w').value), h = toMm($('#h').value);
      if (!(w > 0 && h > 0)) { toast('Podaj oba wymiary większe od zera'); renderCalc(); return; }
      if (w !== c.w || h !== c.h) { c.w = w; c.h = h; c.historyId = null; detectFormat(); persist(); renderCalc(); focusKeep(e && e.target ? e.target.id : 'w'); }
    };
    let focusId = null;
    function focusKeep(id) { const el = app.querySelector('#' + id); if (el) { el.focus(); } }
    ['#w', '#h'].forEach((s) => { $(s).addEventListener('change', onDim); $(s).addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.target.blur(); } }); });
    $('#q').addEventListener('click', openQtySheet);
    $('#g').addEventListener('change', (e) => { const v = parseInt0(e.target.value); if (v) { c.grammage = v; c.historyId = null; persist(); renderCalc(); } else renderCalc(); });
    $('#g').addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.blur(); });
    app.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => { c.quantity = Math.min(1000000, Math.max(1, c.quantity + Number(b.dataset.step))); c.historyId = null; persist(); renderCalc(); }));
    app.querySelectorAll('[data-format]').forEach((b) => b.addEventListener('click', () => { useFormat(formatById(b.dataset.format)); c.historyId = null; renderCalc(); }));
    app.querySelectorAll('[data-sheet]').forEach((b) => b.addEventListener('click', () => { useSheet(sheetById(b.dataset.sheet)); c.historyId = null; renderCalc(); }));
    app.querySelectorAll('[data-gram]').forEach((b) => b.addEventListener('click', () => { c.grammage = Number(b.dataset.gram); c.historyId = null; persist(); renderCalc(); }));
    const setGm = (v) => { c.gm = v; c.historyId = null; persist(); renderCalc(); };
    app.querySelectorAll('[data-bleed]').forEach((b) => b.addEventListener('click', () => { c.bleed = Number(b.dataset.bleed); c.historyId = null; persist(); renderCalc(); }));
    $('#bl').addEventListener('change', (e) => { if (e.target.value.trim() === '') return renderCalc(); c.bleed = toMm(e.target.value); c.historyId = null; persist(); renderCalc(); });
    app.querySelectorAll('[data-gm]').forEach((b) => b.addEventListener('click', () => setGm(Number(b.dataset.gm))));
    $('#gmi').addEventListener('change', (e) => { if (e.target.value.trim() === '') return renderCalc(); setGm(toMm(e.target.value)); });
    ['#bl', '#gmi'].forEach((sel) => $(sel).addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.blur(); }));
    $('#calc').addEventListener('click', () => { if (noFit) return toast('Użytek nie mieści się na arkuszu'); location.hash = '#/karta'; });
    app.querySelectorAll('[data-orient]').forEach((b) => b.addEventListener('click', () => { c.orientation = b.dataset.orient; c.historyId = null; persist(); renderCalc(); }));
    app.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => b.dataset.open === 'format' ? openFormatSheet() : openSheetSheet()));
    bindMenu();
  }

  /* ---------- arkusze dolne ---------- */
  function openSheet(html) {
    closeSheet();
    sheetOverlay = document.createElement('div');
    sheetOverlay.className = 'sheetbg no-print';
    sheetOverlay.innerHTML = `<section class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</section>`;
    sheetOverlay.addEventListener('click', (e) => { if (e.target === sheetOverlay) closeSheet(); });
    document.body.appendChild(sheetOverlay);
    document.body.style.overflow = 'hidden';
    return sheetOverlay;
  }
  function closeSheet() { if (sheetOverlay) { sheetOverlay.remove(); sheetOverlay = null; document.body.style.overflow = ''; } }
  const sheetHead = (title) => `<div class="hd"><h2>${title}</h2><button type="button" class="icobtn" data-close aria-label="Zamknij">${I.close}</button></div>`;
  /** Potwierdzenie w arkuszu dolnym: systemowe okienka nie działają w każdym środowisku. */
  function ask(msg, okLabel) {
    return new Promise((resolve) => {
      const el = openSheet(`${sheetHead('Na pewno?')}<p style="margin:4px 4px 12px;font-size:15px;line-height:22px">${esc(msg)}</p><div class="actions" style="margin:0"><button type="button" class="btn" id="askOk" style="background:#b42a18">${esc(okLabel || 'Usuń')}</button><button type="button" class="btn light auto" id="askNo">Anuluj</button></div>`);
      const done = (v) => { closeSheet(); resolve(v); };
      el.querySelector('[data-close]').addEventListener('click', () => done(false));
      el.querySelector('#askNo').addEventListener('click', () => done(false));
      el.querySelector('#askOk').addEventListener('click', () => done(true));
      el.addEventListener('click', (e) => { if (e.target === el) resolve(false); });
    });
  }

  /** Nakład: suwak logarytmiczny 1 – 1 000 000 z zaokrąglaniem do „okrągłych” wartości. */
  function openQtySheet() {
    const c = S.current;
    const MAX = 1000000;
    const nice = (v) => { v = Math.max(1, Math.min(MAX, Math.round(v))); if (v < 100) return v; const m = Math.pow(10, Math.floor(Math.log10(v)) - 1); return Math.max(1, Math.min(MAX, Math.round(v / m) * m)); };
    const toPos = (v) => Math.round(Math.log10(Math.max(1, Math.min(MAX, v))) / 6 * 1000);
    const fromPos = (p) => nice(Math.pow(10, p / 1000 * 6));
    const presets = [50, 100, 250, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 1000000];
    let v = c.quantity || 1;
    const el = openSheet(`${sheetHead('Nakład')}
      <div class="card stack8">
        <input class="num" id="qv" inputmode="numeric" value="${nf0.format(v)}" aria-label="Nakład w sztukach" style="font-size:32px;min-height:64px">
        <input type="range" class="range" id="qs" min="0" max="1000" step="1" value="${toPos(v)}" aria-label="Suwak nakładu od 1 do 1 000 000">
        <div class="lbl scale"><span style="left:0">1</span><span style="left:16.67%">10</span><span style="left:33.33%">100</span><span style="left:50%">1 000</span><span style="left:66.67%">10 000</span><span style="left:83.33%">100 000</span><span style="left:100%">1 mln</span></div>
      </div>
      <div class="chips" id="qp">${presets.map((p) => `<button type="button" class="chip sm ${p === v ? 'on' : ''}" data-q="${p}">${nf0.format(p)}</button>`).join('')}</div>
      <div class="actions" style="margin-top:8px"><button type="button" class="btn" id="qok">Ustaw <span id="qokv">${nf0.format(v)}</span> szt.</button></div>`);
    const $ = (sel) => el.querySelector(sel);
    const show = (fromSlider) => {
      $('#qv').value = nf0.format(v); $('#qokv').textContent = nf0.format(v);
      if (!fromSlider) $('#qs').value = toPos(v);
      el.querySelectorAll('[data-q]').forEach((b) => b.classList.toggle('on', Number(b.dataset.q) === v));
    };
    $('#qs').addEventListener('input', (e) => { v = fromPos(Number(e.target.value)); show(true); });
    $('#qv').addEventListener('change', (e) => { const n = parseInt0(e.target.value); v = n ? Math.min(MAX, n) : v; show(false); });
    $('#qv').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.target.blur(); apply(); } });
    $('#qv').addEventListener('focus', (e) => { e.target.select(); });
    el.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => { v = Number(b.dataset.q); show(false); }));
    const apply = () => { const n = parseInt0($('#qv').value); if (n) v = Math.min(MAX, n); c.quantity = v; c.historyId = null; persist(); closeSheet(); renderCalc(); };
    $('#qok').addEventListener('click', apply);
    $('[data-close]').addEventListener('click', closeSheet);
  }

  function openFormatSheet() {
    const render = (query) => {
      const q = (query || '').trim().toLowerCase();
      const match = (f) => !q || f.name.toLowerCase().includes(q) || (f.group || '').toLowerCase().includes(q) || String(f.w).includes(q) || String(f.h).includes(q) || `${f.w} × ${f.h}`.includes(q) || `${f.w}x${f.h}`.includes(q);
      const recent = S.recentFormats.map(formatById).filter(Boolean).filter(match);
      const mine = S.customFormats.filter(match);
      const groups = formatGroups().map((g) => ({ g, items: Data.STANDARD_FORMATS.filter((f) => f.group === g && match(f)) })).filter((x) => x.items.length);
      const opt = (f, sub) => `<button type="button" class="opt ${S.current.formatId === f.id ? 'on' : ''}" data-pick="${f.id}"><span class="nm">${esc(f.name)}</span><span class="dim">${dims(f.w, f.h)}</span><span class="cnt">${f.bleed != null ? `spad ${dim(f.bleed)}` : ''}</span>${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</button>`;
      let html = '';
      if (recent.length) html += `<div class="sec">Ostatnio używane</div>${recent.map((f) => opt(f)).join('')}`;
      if (mine.length) html += `<div class="sec">Moje</div>${mine.map((f) => opt(f)).join('')}`;
      groups.forEach((x) => { html += `<div class="sec">${x.g}</div>${x.items.map((f) => opt(f)).join('')}`; });
      if (!html) html = '<div class="empty">Brak formatu pasującego do wyszukiwania.</div>';
      return html;
    };
    const el = openSheet(`${sheetHead('Wybierz format')}
      <div class="search">${I.search}<label for="fq" style="position:absolute;left:-9999px">Szukaj formatu</label><input class="txt" id="fq" placeholder="Szukaj: nazwa lub wymiar, np. 148"></div>
      <div id="list" class="stack8">${render('')}</div>
      <a href="#/nowy-format" class="btn light" style="margin-top:8px">Własny wymiar</a>`);
    el.querySelector('[data-close]').addEventListener('click', closeSheet);
    const list = el.querySelector('#list');
    const bind = () => list.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => { useFormat(formatById(b.dataset.pick)); S.current.historyId = null; closeSheet(); renderCalc(); }));
    bind();
    el.querySelector('#fq').addEventListener('input', (e) => { list.innerHTML = render(e.target.value); bind(); });
  }

  function openSheetSheet() {
    const input = currentInput();
    const fmt = formatLabel();
    const cmp = (s) => Calc.calculate(Object.assign({}, input, { sheet: s }));
    const opt = (s) => { const r = cmp(s); return `<button type="button" class="opt ${S.current.sheetId === s.id ? 'on' : ''}" data-pick="${s.id}"><span class="nm">${esc(s.name)}</span><span class="dim">${dims(s.w, s.h)} · ${s.gripper ? `chwyt ${dim(s.gripper)}` : `margines ${dim(s.margin)}`}</span><span class="cnt">${r.perSheet ? `${r.perSheet} · ${nf0.format(r.sheets)} ark.` : 'nie mieści się'}</span>${S.current.sheetId === s.id ? '<span class="tag">Wybrany</span>' : ''}</button>`; };
    const groups = SHEET_GROUPS.map(([g, t]) => ({ t, items: allSheets().filter((s) => s.group === g) })).filter((x) => x.items.length);
    const el = openSheet(`${sheetHead('Wybierz arkusz')}
      <p class="lbl" style="margin:0 4px">Przy każdym arkuszu: ile użytków ${esc(fmt)} się zmieści i ile arkuszy potrzeba na ${nf0.format(input.quantity)} szt.</p>
      ${groups.map((x) => `<div class="sec">${x.t}</div><div class="stack8">${x.items.map(opt).join('')}</div>`).join('')}
      <div class="sec">Własny arkusz</div>
      <div class="own"><input class="num sm" id="ow" inputmode="decimal" placeholder="szer." aria-label="Szerokość arkusza"><span>×</span><input class="num sm" id="oh" inputmode="decimal" placeholder="wys." aria-label="Wysokość arkusza"><input class="num sm" id="og" inputmode="decimal" placeholder="chwyt" aria-label="Chwyt"></div>
      <button type="button" class="btn light" id="useOwn" style="margin-top:4px">Użyj własnego arkusza</button>`);
    el.querySelector('[data-close]').addEventListener('click', closeSheet);
    el.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => { useSheet(sheetById(b.dataset.pick)); S.current.historyId = null; closeSheet(); renderCalc(); }));
    el.querySelector('#useOwn').addEventListener('click', () => {
      const w = toMm(el.querySelector('#ow').value), h = toMm(el.querySelector('#oh').value), g = toMm(el.querySelector('#og').value || '0');
      if (!(w > 0 && h > 0)) return toast('Podaj szerokość i wysokość arkusza');
      const s = { id: uid(), name: `${dim(w)} × ${dim(h)}`, w, h, gripper: g, margin: 0, group: 'offset' };
      S.customSheets.push(s); useSheet(s); S.current.historyId = null; closeSheet(); renderCalc(); toast('Arkusz dodany do biblioteki');
    });
  }

  /* ---------- ekran: karta zlecenia ---------- */
  function renderCard(id) {
    if (id) { const h = S.history.find((x) => x.id === id); if (h) loadFromHistory(h); }
    const r = currentResult();
    const sh = effectiveSheet();
    const c = S.current;
    if (r.perSheet === 0) { location.hash = '#/'; return; }
    let entry = c.historyId ? S.history.find((x) => x.id === c.historyId) : null;
    if (!entry && S.settings.autoHistory) entry = saveToHistory(false);
    const d = new Date(entry ? entry.ts : Date.now());
    const dateStr = d.toLocaleString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const lay = r.layout.chosen;
    const orientPl = lay.orientation === 'portrait' ? 'pion' : 'poziom';
    const pw = 150, ph = Math.round(pw * sh.h / sh.w);
    app.innerHTML = `
    <div class="screen noTabs">
      <header class="top no-print"><a href="#/" class="icobtn" aria-label="Wstecz">${I.back}</a><span class="title sm">Karta zlecenia</span><button type="button" class="icobtn ${entry && entry.starred ? 'dark' : ''}" id="star" aria-label="Zapisz w historii">${entry && entry.starred ? I.saveOn : I.save}</button></header>
      <div class="card stack" style="gap:14px">
        <div><label for="n" class="lbl">Nazwa (opcjonalnie)</label><input class="underline" id="n" value="${esc(c.name)}" placeholder="np. Ulotka A5 — Targi"></div>
        <div style="display:flex;gap:16px;align-items:flex-start">
          <div class="preview" style="width:${pw}px;height:${ph}px;border-radius:6px">${previewSVG(r, sh, { numbers: true })}</div>
          <div class="stack" style="flex:1">
            <div><div class="lbl">Arkuszy ${esc(sh.name)}</div><div style="font-size:48px;line-height:1;font-weight:600;letter-spacing:-.04em;margin-top:2px">${nf0.format(r.sheets)}</div></div>
            <div><div class="lbl">Nakład · ilość szt.</div><div style="font-size:17px;font-weight:600">${nf0.format(r.quantity)} szt.</div></div>
            <div><div class="lbl">Na arkuszu · użytki</div><div style="font-size:17px;font-weight:600">${lay.cols} × ${lay.rows} · ${r.perSheet} szt. <span class="lbl" style="font-weight:500">${orientPl}</span></div></div>
            <div><div class="lbl">Papier · waga arkuszy</div><div style="font-size:17px;font-weight:600">${kg(r.weight.sheetsTotal)} <span class="lbl" style="font-weight:500">${r.grammage} g/m²</span></div></div>
          </div>
        </div>
      </div>
      <div class="card rows" style="margin-top:10px">
        <div class="rrow"><span class="lbl">Format netto</span><span class="v">${c.formatId ? `${esc(formatLabel())} (${dims(c.w, c.h)})` : dims(c.w, c.h)}</span></div>
        <div class="rrow"><span class="lbl">Ze spadami</span><span class="v">${dim(c.bleed)} ${unit()}</span></div>
        <div class="rrow"><span class="lbl">Arkusz netto</span><span class="v">${esc(sh.name)} (${dims(sh.w, sh.h)})</span></div>
        <div class="rrow"><span class="lbl">${sh.gripper ? 'Z chwytem' : 'Z marginesem'}</span><span class="v">${dim(sh.gripper || sh.margin)} ${unit()}</span></div>
        <div class="rrow"><span class="lbl">Wykorzystanie · ostatni arkusz</span><span class="v">${nf0.format(r.utilization * 100)} % · ${r.lastSheet} ${r.lastSheet === 1 ? 'użytek' : 'użytki'}</span></div>
        <div class="rrow"><span class="lbl">Waga arkuszy (${nf0.format(r.sheets)} × ${nf1.format(r.weight.sheet)} g)</span><span class="v">${kg(r.weight.sheetsTotal)}</span></div>
        <div class="rrow"><span class="lbl">Data</span><span class="v">${dateStr}</span></div>
      </div>
      <div class="row2 no-print" style="gap:8px;margin-top:10px">
        <button type="button" class="btn light" id="pdf">${I.pdf}Pobierz PDF</button>
        <button type="button" class="btn light" id="share">${I.share}Udostępnij</button>
      </div>
      <div class="bottom no-print actions"><a href="#/" class="btn light" id="new">Zmień dane</a><a href="#/" class="btn" id="fresh">Nowe obliczenie</a></div>
    </div>`;
    const $ = (s) => app.querySelector(s);
    $('#n').addEventListener('input', (e) => { c.name = e.target.value; if (c.historyId) { const h = S.history.find((x) => x.id === c.historyId); if (h) h.name = c.name; } persist(); });
    $('#star').addEventListener('click', () => { const e = saveToHistory(true); toast(e.starred ? 'Zapisano w historii ★' : 'Usunięto gwiazdkę'); renderCard(); });
    $('#pdf').addEventListener('click', () => { document.title = `Karta zlecenia — ${c.name || formatLabel()} ${nf0.format(r.sheets)} ark.`; window.print(); document.title = 'Kalkulator poligraficzny'; });
    $('#share').addEventListener('click', async () => {
      const text = cardText(r, sh, c);
      try {
        if (navigator.share) await navigator.share({ title: 'Karta zlecenia', text });
        else { await navigator.clipboard.writeText(text); toast('Skopiowano do schowka'); }
      } catch (e) { /* anulowano */ }
    });
    $('#fresh').addEventListener('click', () => { Object.assign(c, { name: '', historyId: null }); persist(); });
  }
  function cardText(r, sh, c) {
    return [
      c.name ? `${c.name}` : 'Karta zlecenia',
      `Format netto: ${c.formatId ? `${formatLabel()} (${dims(c.w, c.h)})` : dims(c.w, c.h)}, ze spadami ${dim(c.bleed)} ${unit()}`,
      `Nakład: ${nf0.format(r.quantity)} szt.`,
      `Arkusz netto: ${sh.name} (${dims(sh.w, sh.h)}), ${sh.gripper ? 'z chwytem' : 'z marginesem'} ${dim(sh.gripper || sh.margin)} ${unit()}`,
      `Na arkuszu: ${r.perSheet} (${r.layout.chosen.cols} × ${r.layout.chosen.rows}), wykorzystanie ${nf0.format(r.utilization * 100)} %`,
      `Arkuszy: ${nf0.format(r.sheets)} (ostatni: ${r.lastSheet})`,
      `Papier: ${r.grammage} g/m², waga arkuszy ${kg(r.weight.sheetsTotal)}`,
    ].join('\n');
  }

  /* ---------- ekran: biblioteka — formaty ---------- */
  function renderFormats() {
    const render = (query) => {
      const q = (query || '').trim().toLowerCase();
      const match = (f) => !q || f.name.toLowerCase().includes(q) || (f.group || '').toLowerCase().includes(q) || String(f.w).includes(q) || String(f.h).includes(q);
      const mine = S.customFormats.filter(match);
      const stdGroups = formatGroups().map((g) => [g, Data.STANDARD_FORMATS.filter((f) => f.group === g && match(f))]).filter((x) => x[1].length);
      const th = (f) => { const k = 40 / Math.max(f.w, f.h); return `<span class="thumb" style="width:${Math.max(8, Math.round(f.w * k))}px;height:${Math.max(8, Math.round(f.h * k))}px"></span>`; };
      let html = '';
      if (mine.length) html += `<div class="sec">Moje</div><div class="stack8">${mine.map((f) => `<div class="item">${th(f)}<a href="#/nowy-format?id=${f.id}" class="grow"><span class="nm">${esc(f.name)}</span><span class="lbl">${dims(f.w, f.h)} · spad ${dim(f.bleed)}</span></a><button type="button" class="use" data-use="${f.id}">Użyj</button><button type="button" class="del" data-del="${f.id}" aria-label="Usuń format ${esc(f.name)}">${I.trash}</button></div>`).join('')}</div>`;
      else if (!q) html += `<div class="sec">Moje</div><div class="empty">Nie masz jeszcze własnych formatów. Dodaj plusem u góry.</div>`;
      stdGroups.forEach(([g, items]) => { html += `<div class="sec">${esc(g)}</div><div class="stack8">${items.map((f) => `<div class="item" style="min-height:56px;padding:10px 16px"><span class="grow"><span class="nm">${esc(f.name)}</span><span class="lbl">${dims(f.w, f.h)}</span></span><button type="button" class="use" data-use="${f.id}">Użyj</button></div>`).join('')}</div>`; });
      if (!html) html = '<div class="empty">Brak formatu pasującego do wyszukiwania.</div>';
      return html;
    };
    app.innerHTML = `
    <div class="screen">
      <header class="top">${backBtn()}<span class="title" style="flex:1">Biblioteka</span><a href="#/nowy-format" class="icobtn dark" aria-label="Dodaj format">${I.plus}</a></header>
      <nav class="seg inv" aria-label="Rodzaj" style="grid-template-columns:repeat(2,minmax(0,1fr))"><a href="#/biblioteka/formaty" class="on" style="display:flex;align-items:center;justify-content:center;border-radius:999px;padding:10px;font-size:14px;font-weight:500;min-height:40px;background:#111;color:#fff">Formaty</a><a href="#/biblioteka/arkusze" style="display:flex;align-items:center;justify-content:center;border-radius:999px;padding:10px;font-size:14px;font-weight:500;min-height:40px;color:var(--muted)">Arkusze</a></nav>
      <div class="search">${I.search}<label for="q" style="position:absolute;left:-9999px">Szukaj</label><input class="txt" id="q" placeholder="Szukaj: A5, 148, wizytówka…"></div>
      <div id="list">${render('')}</div>
    </div>`;
    const list = app.querySelector('#list');
    const bind = () => {
      list.querySelectorAll('[data-use]').forEach((b) => b.addEventListener('click', () => { useFormat(formatById(b.dataset.use)); S.current.historyId = null; location.hash = '#/'; }));
      list.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => { const f = formatById(b.dataset.del); if (!await ask(`Usunąć format „${f.name}”?`)) return; S.customFormats = S.customFormats.filter((x) => x.id !== f.id); S.recentFormats = S.recentFormats.filter((x) => x !== f.id); if (S.current.formatId === f.id) S.current.formatId = null; persist(); renderFormats(); }));
    };
    bind();
    app.querySelector('#q').addEventListener('input', (e) => { list.innerHTML = render(e.target.value); bind(); });
  }

  /* ---------- ekran: biblioteka — arkusze ---------- */
  function renderSheets() {
    const groups = SHEET_GROUPS;
    const row = (s) => { const def = S.settings.defaultSheetId === s.id; const custom = S.customSheets.includes(s); return `<div class="item" style="min-height:68px"><span class="thumb" style="width:34px;height:${Math.round(34 * s.h / s.w)}px;border-radius:2px;position:relative;overflow:hidden">${s.gripper ? `<i style="position:absolute;left:0;right:0;top:0;height:${Math.max(2, Math.round(34 * s.gripper / s.w))}px;background:#c3cad1"></i>` : `<i style="position:absolute;inset:${Math.max(2, Math.round(34 * s.margin / s.w))}px;border:1px dashed #b7bfc7"></i>`}</span><${custom ? `a href="#/nowy-arkusz?id=${s.id}"` : 'span'} class="grow"><span class="nm lg">${esc(s.name)}</span><span class="lbl">${dims(s.w, s.h)} · ${s.gripper ? `chwyt ${dim(s.gripper)}` : `margines ${dim(s.margin)}`}</span></${custom ? 'a' : 'span'}><button type="button" class="use ${def ? 'on' : ''}" data-def="${s.id}" aria-pressed="${def}">${def ? 'Domyślny' : 'Użyj'}</button>${custom ? `<button type="button" class="del" data-del="${s.id}" aria-label="Usuń arkusz ${esc(s.name)}">${I.trash}</button>` : ''}</div>`; };
    app.innerHTML = `
    <div class="screen">
      <header class="top">${backBtn()}<span class="title" style="flex:1">Biblioteka</span><a href="#/nowy-arkusz" class="icobtn dark" aria-label="Dodaj arkusz">${I.plus}</a></header>
      <nav class="seg inv" aria-label="Rodzaj" style="grid-template-columns:repeat(2,minmax(0,1fr))"><a href="#/biblioteka/formaty" style="display:flex;align-items:center;justify-content:center;border-radius:999px;padding:10px;font-size:14px;font-weight:500;min-height:40px;color:var(--muted)">Formaty</a><a href="#/biblioteka/arkusze" style="display:flex;align-items:center;justify-content:center;border-radius:999px;padding:10px;font-size:14px;font-weight:500;min-height:40px;background:#111;color:#fff">Arkusze</a></nav>
      <p class="lbl" style="margin:12px 4px 0">Dotknij „Użyj”, aby arkusz był domyślny: wybierany automatycznie w kalkulatorze. Arkusz domyślny jest też używany w podglądzie nowego formatu.</p>
      ${groups.map(([g, t]) => { const items = allSheets().filter((s) => s.group === g); return items.length ? `<div class="sec">${t}</div><div class="stack8">${items.map(row).join('')}</div>` : ''; }).join('')}
    </div>`;
    app.querySelectorAll('[data-def]').forEach((b) => b.addEventListener('click', () => { S.settings.defaultSheetId = b.dataset.def; useSheet(sheetById(b.dataset.def)); S.current.historyId = null; persist(); renderSheets(); toast(`${sheetById(b.dataset.def).name} jest arkuszem domyślnym`); }));
    app.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => { const s = sheetById(b.dataset.del); if (!await ask(`Usunąć arkusz „${s.name}”?`)) return; S.customSheets = S.customSheets.filter((x) => x.id !== s.id); S.recentSheets = S.recentSheets.filter((x) => x !== s.id); if (S.settings.defaultSheetId === s.id) S.settings.defaultSheetId = 'b2'; if (S.current.sheetId === s.id) S.current.sheetId = S.settings.defaultSheetId; persist(); renderSheets(); }));
  }

  /* ---------- ekran: nowy / edycja formatu ---------- */
  function renderNewFormat(id) {
    const existing = id ? S.customFormats.find((f) => f.id === id) : null;
    const st = existing ? { w: existing.w, h: existing.h, name: existing.name, bleed: existing.bleed } : { w: 150, h: 150, name: '', bleed: S.settings.bleed };
    const presets = ['a4', 'a5', 'a6', 'dl'];
    const draw = () => {
      const sh = sheetById(S.settings.defaultSheetId) || Data.STANDARD_SHEETS[0];
      const r = Calc.calculate({ format: { w: st.w, h: st.h }, sheet: sh, bleed: st.bleed, quantity: 1, grammage: 0, orientation: S.settings.orientation, rounding: 'up' });
      const g = r.layout.gross;
      const isPreset = presets.find((p) => { const f = formatById(p); return f.w === st.w && f.h === st.h; });
      const bleeds = [0, 2, 3, 5];
      app.innerHTML = `
      <div class="screen noTabs">
        <header class="top"><a href="#/biblioteka/formaty" class="icobtn" aria-label="Anuluj">${I.close}</a><span class="title sm">${existing ? 'Edytuj format' : 'Nowy format'}</span>${existing ? `<button type="button" class="icobtn" id="del" aria-label="Usuń format">${I.trash}</button>` : '<span class="spacer"></span>'}</header>
        <form class="stack" autocomplete="off" onsubmit="return false">
          <div class="card stack">
            <div style="display:flex;justify-content:space-between;align-items:center"><label for="w" class="lbl" style="color:var(--ink);font-weight:600">Wymiar netto</label><span class="lbl">${unit()}</span></div>
            <div class="dims" style="grid-template-columns:minmax(0,1fr) 20px minmax(0,1fr)"><input class="num" id="w" inputmode="decimal" value="${fromMm(st.w)}" aria-label="Szerokość"><span class="x" style="margin:0">×</span><input class="num" id="h" inputmode="decimal" value="${fromMm(st.h)}" aria-label="Wysokość"></div>
            <div class="chips">${presets.map((p) => { const f = formatById(p); return `<button type="button" class="chip sm ${isPreset === p ? 'on' : ''}" data-preset="${p}">${f.name}</button>`; }).join('')}<button type="button" class="chip sm ${!isPreset ? 'on' : ''}">Własny</button></div>
          </div>
          <div class="card stack8"><label for="n" class="lbl">Nazwa <span style="font-weight:400">(opcjonalnie)</span></label><input class="txt plain" id="n" value="${esc(st.name)}" placeholder="np. Zaproszenie kwadrat"></div>
          <div class="card stack8"><label for="b" class="lbl">Spady <span style="font-weight:400">(domyślnie ${dim(S.settings.bleed)} ${unit()})</span></label>
            <div class="chips" style="flex-wrap:nowrap">${bleeds.map((b) => `<button type="button" class="chip sm ${st.bleed === b ? 'on' : ''}" data-bleed="${b}">${dim(b)}</button>`).join('')}<input class="num pill" id="b" inputmode="decimal" placeholder="inne" value="${bleeds.includes(st.bleed) ? '' : fromMm(st.bleed)}" style="width:90px;padding:6px 12px"></div></div>
        </form>
        <div class="card" style="margin-top:10px;display:flex;align-items:center;gap:16px">
          <div class="thumb" style="width:${Math.max(10, Math.round(52 * Math.min(1, st.w / st.h)))}px;height:${Math.max(10, Math.round(52 * Math.min(1, st.h / st.w)))}px" aria-hidden="true"></div>
          <div style="flex:1"><div class="lbl">Podgląd</div><div style="font-size:15px;font-weight:500">${dims(st.w, st.h)} · ze spadami ${dim(g.w)} × ${dim(g.h)}</div><div class="lbl" style="font-size:12px">${r.perSheet ? `Na ${esc(sh.name)} zmieści się ${r.perSheet} ${r.perSheet === 1 ? 'użytek' : r.perSheet < 5 ? 'użytki' : 'użytków'}` : `Nie mieści się na ${esc(sh.name)}`}</div></div>
        </div>
        <div class="bottom actions" style="margin-top:auto"><button type="button" class="btn" id="saveUse">Zapisz i użyj</button><button type="button" class="btn light auto" id="save">Zapisz</button></div>
      </div>`;
      const $ = (s) => app.querySelector(s);
      const readDims = () => { const w = toMm($('#w').value), h = toMm($('#h').value); if (w > 0) st.w = w; if (h > 0) st.h = h; };
      ['#w', '#h'].forEach((s) => $(s).addEventListener('change', () => { readDims(); draw(); }));
      $('#n').addEventListener('input', (e) => { st.name = e.target.value; });
      $('#b').addEventListener('change', (e) => { st.bleed = toMm(e.target.value); draw(); });
      app.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => { const f = formatById(b.dataset.preset); st.w = f.w; st.h = f.h; if (!st.name) st.name = ''; draw(); }));
      app.querySelectorAll('[data-bleed]').forEach((b) => b.addEventListener('click', () => { st.bleed = Number(b.dataset.bleed); draw(); }));
      const doSave = () => {
        readDims(); st.name = $('#n').value.trim();
        if (!(st.w > 0 && st.h > 0)) { toast('Podaj oba wymiary'); return null; }
        const f = existing || { id: uid() };
        Object.assign(f, { w: st.w, h: st.h, bleed: st.bleed, name: st.name || `${dim(st.w)} × ${dim(st.h)}` });
        if (!existing) S.customFormats.unshift(f);
        persist(); return f;
      };
      $('#save').addEventListener('click', () => { if (doSave()) { toast('Format zapisany'); location.hash = '#/biblioteka/formaty'; } });
      $('#saveUse').addEventListener('click', () => { const f = doSave(); if (f) { useFormat(f); S.current.historyId = null; location.hash = '#/'; } });
      if (existing) $('#del').addEventListener('click', async () => { if (!await ask(`Usunąć format „${existing.name}”?`)) return; S.customFormats = S.customFormats.filter((x) => x.id !== existing.id); persist(); location.hash = '#/biblioteka/formaty'; });
    };
    draw();
  }

  /* ---------- ekran: nowy / edycja arkusza ---------- */
  function renderNewSheet(id) {
    const existing = id ? S.customSheets.find((s) => s.id === id) : null;
    const st = existing ? Object.assign({}, existing) : { name: '', w: 640, h: 900, gripper: S.settings.gripper, margin: 0, group: 'offset' };
    const draw = () => {
      app.innerHTML = `
      <div class="screen noTabs">
        <header class="top"><a href="#/biblioteka/arkusze" class="icobtn" aria-label="Anuluj">${I.close}</a><span class="title sm">${existing ? 'Edytuj arkusz' : 'Nowy arkusz'}</span><span class="spacer"></span></header>
        <form class="stack" autocomplete="off" onsubmit="return false">
          <div class="card stack">
            <div style="display:flex;justify-content:space-between;align-items:center"><label for="w" class="lbl" style="color:var(--ink);font-weight:600">Wymiar arkusza</label><span class="lbl">${unit()}</span></div>
            <div class="dims" style="grid-template-columns:minmax(0,1fr) 20px minmax(0,1fr)"><input class="num" id="w" inputmode="decimal" value="${fromMm(st.w)}" aria-label="Szerokość"><span class="x" style="margin:0">×</span><input class="num" id="h" inputmode="decimal" value="${fromMm(st.h)}" aria-label="Wysokość"></div>
          </div>
          <div class="card stack8"><label for="n" class="lbl">Nazwa</label><input class="txt plain" id="n" value="${esc(st.name)}" placeholder="np. B2+ albo 640 × 900"></div>
          <div class="card stack8"><span class="lbl">Rodzaj maszyny</span>
            <div class="seg inv" style="grid-template-columns:repeat(2,minmax(0,1fr));background:var(--bg)"><button type="button" class="${st.group === 'offset' ? 'on' : ''}" data-group="offset" style="${st.group === 'offset' ? 'background:#fff;color:#111' : ''}">Offset · chwyt</button><button type="button" class="${st.group === 'digital' ? 'on' : ''}" data-group="digital" style="${st.group === 'digital' ? 'background:#fff;color:#111' : ''}">Cyfra · margines</button></div></div>
          <div class="card stack8">
            <label for="g" class="lbl">${st.group === 'offset' ? `Chwyt maszyny (${unit()}, pas u góry arkusza)` : `Margines niezadrukowany (${unit()}, z każdej strony)`}</label>
            <div class="chips" style="flex-wrap:nowrap">${(st.group === 'offset' ? [0, 8, 10, 12] : [0, 3, 5, 8]).map((v) => `<button type="button" class="chip sm ${(st.group === 'offset' ? st.gripper : st.margin) === v ? 'on' : ''}" data-gm="${v}">${dim(v)}</button>`).join('')}<input class="num pill" id="g" inputmode="decimal" placeholder="inne" value="${(st.group === 'offset' ? [0, 8, 10, 12] : [0, 3, 5, 8]).includes(st.group === 'offset' ? st.gripper : st.margin) ? '' : fromMm(st.group === 'offset' ? st.gripper : st.margin)}" style="width:90px;padding:6px 12px"></div>
          </div>
        </form>
        <div class="bottom actions" style="margin-top:auto"><button type="button" class="btn" id="saveUse">Zapisz i użyj</button><button type="button" class="btn light auto" id="save">Zapisz</button></div>
      </div>`;
      const $ = (s) => app.querySelector(s);
      const read = () => { const w = toMm($('#w').value), h = toMm($('#h').value); if (w > 0) st.w = w; if (h > 0) st.h = h; st.name = $('#n').value.trim(); };
      ['#w', '#h'].forEach((s) => $(s).addEventListener('change', () => { read(); draw(); }));
      $('#g').addEventListener('change', (e) => { read(); const v = toMm(e.target.value); if (st.group === 'offset') { st.gripper = v; st.margin = 0; } else { st.margin = v; st.gripper = 0; } draw(); });
      app.querySelectorAll('[data-group]').forEach((b) => b.addEventListener('click', () => { read(); st.group = b.dataset.group; if (st.group === 'offset') { st.gripper = st.gripper || S.settings.gripper; st.margin = 0; } else { st.margin = st.margin || 5; st.gripper = 0; } draw(); }));
      app.querySelectorAll('[data-gm]').forEach((b) => b.addEventListener('click', () => { read(); const v = Number(b.dataset.gm); if (st.group === 'offset') { st.gripper = v; st.margin = 0; } else { st.margin = v; st.gripper = 0; } draw(); }));
      const doSave = () => {
        read();
        if (!(st.w > 0 && st.h > 0)) { toast('Podaj oba wymiary'); return null; }
        const s = existing || { id: uid() };
        Object.assign(s, { w: st.w, h: st.h, gripper: st.gripper, margin: st.margin, group: st.group, name: st.name || `${dim(st.w)} × ${dim(st.h)}` });
        if (!existing) S.customSheets.push(s);
        persist(); return s;
      };
      $('#save').addEventListener('click', () => { if (doSave()) { toast('Arkusz zapisany'); location.hash = '#/biblioteka/arkusze'; } });
      $('#saveUse').addEventListener('click', () => { const s = doSave(); if (s) { useSheet(s); S.current.historyId = null; location.hash = '#/'; } });
    };
    draw();
  }

  /* ---------- ekran: historia ---------- */
  let histFilter = 'all';
  function renderHistory() {
    const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); const yesterday = today - 86400000;
    const items = S.history.filter((h) => histFilter === 'all' || h.starred);
    const groups = [['Dzisiaj', items.filter((h) => h.ts >= today)], ['Wczoraj', items.filter((h) => h.ts >= yesterday && h.ts < today)], ['Wcześniej', items.filter((h) => h.ts < yesterday)]].filter((g) => g[1].length);
    const when = (h) => { const d = new Date(h.ts); if (h.ts >= yesterday) return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }); return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }); };
    const row = (h) => `<div class="item" style="min-height:76px"><span class="big">${nf0.format(h.result.sheets)}</span><a href="#/karta?id=${h.id}" class="grow"><span class="nm">${esc(h.name || h.input.formatName || 'Obliczenie')}${h.starred ? ' ★' : ''}</span><span class="lbl">${dims(h.input.w, h.input.h)} · ${nf0.format(h.input.quantity)} szt. · ${esc(h.input.sheetName)} · ${h.input.grammage} g · ${when(h)}</span></a><button type="button" class="use" data-repeat="${h.id}">Powtórz</button><button type="button" class="del" data-del="${h.id}" aria-label="Usuń z historii">${I.trash}</button></div>`;
    app.innerHTML = `
    <div class="screen">
      <header class="top">${backBtn()}<span class="title" style="flex:1">Historia</span><span class="lbl">${S.history.length ? `${S.history.length} ${S.history.length === 1 ? 'obliczenie' : S.history.length < 5 ? 'obliczenia' : 'obliczeń'}` : ''}</span></header>
      <div class="seg inv" role="group" aria-label="Filtr" style="grid-template-columns:repeat(2,minmax(0,1fr))"><button type="button" class="${histFilter === 'all' ? 'on' : ''}" data-f="all">Wszystkie</button><button type="button" class="${histFilter === 'star' ? 'on' : ''}" data-f="star">Zapisane ★</button></div>
      ${groups.length ? groups.map(([t, list]) => `<div class="sec">${t}</div><div class="stack8">${list.map(row).join('')}</div>`).join('') : `<div class="empty">${histFilter === 'star' ? 'Brak zapisanych obliczeń. Dotknij zakładki przy wyniku, aby zapisać.' : 'Historia jest pusta. Obliczenia trafiają tu po otwarciu karty zlecenia.'}</div>`}
    </div>`;
    app.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { histFilter = b.dataset.f; renderHistory(); }));
    app.querySelectorAll('[data-repeat]').forEach((b) => b.addEventListener('click', () => { const h = S.history.find((x) => x.id === b.dataset.repeat); loadFromHistory(h); S.current.historyId = null; S.current.name = ''; persist(); location.hash = '#/'; }));
    app.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => { if (!await ask('Usunąć to obliczenie z historii?')) return; S.history = S.history.filter((x) => x.id !== b.dataset.del); if (S.current.historyId === b.dataset.del) S.current.historyId = null; persist(); renderHistory(); }));
  }

  /* ---------- ekran: ustawienia ---------- */
  function renderSettings() {
    const s = S.settings;
    const def = sheetById(s.defaultSheetId) || Data.STANDARD_SHEETS[0];
    const seg = (name, vals, cur, fmt) => `<div class="seg" role="group" aria-label="${name}" style="grid-template-columns:repeat(${vals.length},minmax(0,1fr))">${vals.map((v) => `<button type="button" class="${String(cur) === String(v) ? 'on' : ''}" data-set="${name}" data-v="${v}">${fmt ? fmt(v) : v}</button>`).join('')}</div>`;
    const sw = (id, on, label) => `<button type="button" class="sw ${on ? 'on' : ''}" role="switch" aria-checked="${on}" aria-label="${label}" id="${id}"><i></i></button>`;
    const set = (title, value, hint, control) => `<div class="set"><div class="set-h"><span class="set-t">${title}</span>${value != null ? `<span class="set-v">${value}</span>` : ''}</div>${hint ? `<p class="hint">${hint}</p>` : ''}${control || ''}</div>`;
    const ex = Calc.calculate({ format: { w: 148, h: 210 }, sheet: def, bleed: s.bleed, quantity: 1000, grammage: s.grammage, orientation: s.orientation, rounding: 'up' });
    const grams = [80, 130, 170, 300];
    const nCustom = S.customFormats.length + S.customSheets.length;
    app.innerHTML = `
    <div class="screen noTabs">
      <header class="top"><a href="#/" class="icobtn" aria-label="Wstecz">${I.back}</a><span class="title sm">Ustawienia</span><span class="spacer"></span></header>

      <div class="sec">Druk</div>
      <div class="card sets">
        ${set('Spady', `${dim(s.bleed)} ${unit()}`, 'Zapas obrazu poza formatem netto, dodawany z każdej strony użytku. Zwykle 2–3 mm; przy etykietach i opakowaniach więcej.', seg('bleed', [0, 2, 3, 5], s.bleed, dim))}
        ${set('Chwyt maszyny', `${dim(s.gripper)} ${unit()}`, 'Pas u góry arkusza, którego łapy maszyny offsetowej nie zadrukują. Używany przy dodawaniu własnych arkuszy offsetowych.', seg('gripper', [0, 8, 10, 12], s.gripper, dim))}
        ${set('Orientacja użytku', null, 'Domyślne ułożenie użytku na arkuszu w nowych obliczeniach. W kalkulatorze zmienisz je dla pojedynczego zlecenia.', seg('orientation', ['portrait', 'landscape'], s.orientation, (v) => ({ portrait: 'Pion', landscape: 'Poziom' }[v])))}
        <a href="#/biblioteka/arkusze" class="set link"><div class="set-h"><span class="set-t">Arkusz domyślny</span><span class="set-v">${esc(def.name)} ›</span></div><p class="hint">${dims(def.w, def.h)} · ${def.gripper ? `chwyt ${dim(def.gripper)}` : `margines ${dim(def.margin)}`} ${unit()}. Wybierany automatycznie w nowych obliczeniach. Zmienisz go w bibliotece arkuszy.</p></a>
      </div>

      <div class="sec">Nakład i wynik</div>
      <div class="card sets">
        ${set('Krok przycisków − / +', nf0.format(s.step), 'O ile sztuk zmienia się nakład po dotknięciu minusa lub plusa w kalkulatorze.', seg('step', [10, 50, 100, 500, 1000], s.step, nf0.format))}
        ${set('Zaokrąglanie arkuszy', s.rounding === 'up' ? 'w górę' : 'do 10', `Przykład A5 na ${esc(def.name)}, 1 000 szt.: ${nf0.format(ex.sheets)} arkuszy albo ${nf0.format(Calc.roundSheets(ex.exact, 'ten'))} do pełnych dziesiątek.`, seg('rounding', ['up', 'ten'], s.rounding, (v) => v === 'up' ? 'W górę' : 'Do pełnych 10'))}
        ${set('Gramatura domyślna', `${s.grammage} g/m²`, 'Papier podstawiany w nowych obliczeniach. Do policzenia wagi nakładu.', `<div class="chips nowrap">${grams.map((g) => `<button type="button" class="chip sm ${s.grammage === g ? 'on' : ''}" data-set="grammage" data-v="${g}">${g}</button>`).join('')}<input class="num pill ${grams.includes(s.grammage) ? '' : 'on'}" id="gram" inputmode="numeric" placeholder="inna" value="${grams.includes(s.grammage) ? '' : s.grammage}" aria-label="Inna gramatura" style="width:64px;flex-shrink:0;margin-left:auto"></div>`)}
      </div>

      <div class="sec">Aplikacja</div>
      <div class="card sets">
        ${set('Jednostka', s.unit, 'Wymiary we wszystkich polach i listach. Dane są zapisane w milimetrach, więc przełączenie nic nie psuje.', seg('unit', ['mm', 'cm'], s.unit))}
        <div class="set row"><div><div class="set-t">Podpowiedzi w kalkulatorze</div><p class="hint">Krótkie opisy pod każdym kafelkiem: co wpisać i co oznacza wynik.</p></div>${sw('hints', s.hints, 'Podpowiedzi w kalkulatorze')}</div>
        <div class="set row"><div><div class="set-t">Zapisuj w historii</div><p class="hint">Każda otwarta karta zlecenia trafia do historii automatycznie. Wyłącz, aby zapisywać tylko zakładką.</p></div>${sw('auto', s.autoHistory, 'Zapisuj w historii')}</div>
      </div>

      <div class="sec">Dane</div>
      <div class="card sets">
        <button type="button" class="set link" id="csv"><div class="set-h"><span class="set-t">Eksport historii (CSV)</span><span class="set-v">${S.history.length} ›</span></div><p class="hint">Plik do Excela lub arkusza Google: format, nakład, arkusz, liczba arkuszy, waga.</p></button>
        <button type="button" class="set link" id="backup"><div class="set-h"><span class="set-t">Kopia zapasowa</span><span class="set-v">›</span></div><p class="hint">Plik JSON z historią, własnymi formatami i arkuszami oraz ustawieniami. Przenieś go na inny telefon lub komputer.</p></button>
        <button type="button" class="set link" id="restore"><div class="set-h"><span class="set-t">Przywróć z kopii</span><span class="set-v">›</span></div><p class="hint">Wczytuje plik kopii zapasowej i zastępuje nim obecne dane.</p></button>
        <input type="file" id="restoreFile" accept="application/json,.json" style="display:none">
        <button type="button" class="set link danger" id="reset"><div class="set-h"><span class="set-t">Wyczyść dane</span><span class="set-v">›</span></div><p class="hint">Usuwa historię (${S.history.length}) oraz własne formaty i arkusze (${nCustom}). Ustawienia zostają.</p></button>
      </div>

      <div class="sec">Pomoc</div>
      <div class="card sets">
        <a href="#/pomoc" class="set link"><div class="set-h"><span class="set-t">Jak liczymy użytki</span><span class="set-v">›</span></div><p class="hint">Krok po kroku: spady, chwyt, użytki na arkuszu, liczba arkuszy, wykorzystanie i waga.</p></a>
        <div class="set"><div class="set-h"><span class="set-t">Kalkulator Poligraficzny</span><span class="set-v">wersja 1.1</span></div><p class="hint">${Data.STANDARD_FORMATS.length} formatów i ${Data.STANDARD_SHEETS.length} arkuszy w bibliotece. Działa offline po dodaniu do ekranu początkowego. Dane są przechowywane tylko w tej przeglądarce.</p></div>
      </div>
      <div class="bottom"><a href="#/" class="btn">Gotowe</a></div>
    </div>`;
    const applySetting = (k, v) => {
      s[k] = v;
      if (k === 'bleed') S.current.bleed = v;
      if (k === 'grammage') S.current.grammage = v;
      if (k === 'orientation') S.current.orientation = v;
      S.current.historyId = null; persist(); renderSettings();
    };
    app.querySelectorAll('[data-set]').forEach((b) => b.addEventListener('click', () => { const v = isNaN(Number(b.dataset.v)) ? b.dataset.v : Number(b.dataset.v); applySetting(b.dataset.set, v); }));
    app.querySelector('#gram').addEventListener('change', (e) => { const v = parseInt0(e.target.value); if (v) applySetting('grammage', v); else renderSettings(); });
    app.querySelector('#gram').addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.blur(); });
    app.querySelector('#auto').addEventListener('click', () => { s.autoHistory = !s.autoHistory; persist(); renderSettings(); });
    app.querySelector('#hints').addEventListener('click', () => { s.hints = !s.hints; persist(); renderSettings(); });
    app.querySelector('#csv').addEventListener('click', exportCSV);
    app.querySelector('#backup').addEventListener('click', () => { download(`kalkulator-kopia-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(S, null, 1), 'application/json'); toast('Kopia zapasowa pobrana'); });
    app.querySelector('#restore').addEventListener('click', () => app.querySelector('#restoreFile').click());
    app.querySelector('#restoreFile').addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0]; if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!data || typeof data !== 'object' || !Array.isArray(data.history) || !data.settings) throw new Error('format');
        if (!await ask(`Zastąpić obecne dane kopią z ${file.name}? Historia: ${data.history.length} obliczeń, własne formaty: ${(data.customFormats || []).length}, arkusze: ${(data.customSheets || []).length}.`, 'Przywróć')) return;
        localStorage.setItem(Data.KEY, JSON.stringify(data));
        location.reload();
      } catch (err) { toast('To nie jest plik kopii zapasowej kalkulatora'); }
    });
    app.querySelector('#reset').addEventListener('click', async () => { if (!await ask('Usunąć całą historię oraz własne formaty i arkusze? Tej operacji nie można cofnąć.', 'Wyczyść')) return; S.history = []; S.customFormats = []; S.customSheets = []; S.recentFormats = []; S.recentSheets = []; S.settings.defaultSheetId = 'b2'; S.current = Object.assign({}, Data.DEFAULT_CURRENT); persist(); toast('Wyczyszczono'); renderSettings(); });
  }
  function download(name, content, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function exportCSV() {
    if (!S.history.length) return toast('Historia jest pusta');
    const head = ['data', 'nazwa', 'zapisane', 'format', 'szer_mm', 'wys_mm', 'spad_mm', 'naklad', 'arkusz', 'arkusz_szer_mm', 'arkusz_wys_mm', 'chwyt_mm', 'margines_mm', 'gramatura', 'orientacja', 'uzytkow_na_arkuszu', 'kolumny', 'wiersze', 'arkuszy', 'wykorzystanie_proc', 'ostatni_arkusz', 'waga_arkuszy_kg', 'waga_szt_g', 'waga_nakladu_kg'];
    const q = (v) => { const s = String(v == null ? '' : v); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = [head.join(';')].concat(S.history.map((h) => [new Date(h.ts).toISOString(), h.name, h.starred ? 'tak' : 'nie', h.input.formatId ? h.input.formatName : 'własny', h.input.w, h.input.h, h.input.bleed, h.input.quantity, h.input.sheetName, h.input.sheetW, h.input.sheetH, h.input.gripper, h.input.margin, h.input.grammage, h.result.orientation, h.result.perSheet, h.result.cols, h.result.rows, h.result.sheets, (h.result.utilization * 100).toFixed(1).replace('.', ','), h.result.lastSheet, (h.result.weightSheets / 1000).toFixed(2).replace('.', ','), h.result.weightPiece.toFixed(2).replace('.', ','), (h.result.weightPieces / 1000).toFixed(2).replace('.', ',')].map(q).join(';')));
    download(`kalkulator-historia-${new Date().toISOString().slice(0, 10)}.csv`, '\ufeff' + lines.join('\r\n'), 'text/csv;charset=utf-8');
  }

  /* ---------- ekran: pomoc ---------- */
  function renderHelp() {
    app.innerHTML = `
    <div class="screen noTabs">
      <header class="top"><a href="#/ustawienia" class="icobtn" aria-label="Wstecz">${I.back}</a><span class="title sm">Jak liczymy</span><span class="spacer"></span></header>
      <div class="card help">
        <p><b>1. Użytek brutto.</b> Do formatu netto dodajemy spad z każdej strony: <code>148 × 210 + 2 × 3 = 154 × 216 mm</code>.</p>
        <p><b>2. Pole zadruku arkusza.</b> Od wysokości arkusza odejmujemy chwyt maszyny (pas u góry, którego łapy maszyny nie zadrukują). W druku cyfrowym zamiast chwytu odejmujemy margines z każdej strony. <code>B2: 500 × (700 − 10) = 500 × 690 mm</code>.</p>
        <p><b>3. Użytki na arkuszu.</b> Liczymy, ile użytków zmieści się w pionie i w poziomie (zaokrąglając w dół), dla wybranej orientacji użytku (pion lub poziom). <code>500 ÷ 154 = 3, 690 ÷ 216 = 3 → 9 użytków</code>. Układy mieszane (część użytków obrócona) nie są liczone.</p>
        <p><b>4. Liczba arkuszy.</b> Nakład dzielimy przez użytki na arkuszu i zaokrąglamy w górę (lub do pełnych 10). <code>1 000 ÷ 9 = 111,1 → 112 arkuszy</code>. Nie dodajemy naddatku technologicznego na przyrząd i makulaturę: dolicz go według praktyki drukarni.</p>
        <p><b>5. Wykorzystanie.</b> Pole użytków brutto podzielone przez pole całego arkusza. <code>9 × 154 × 216 ÷ (500 × 700) = 86 %</code>.</p>
        <p><b>6. Waga.</b> Gramatura × powierzchnia. Arkusz B2 przy 130 g/m²: <code>130 × 0,35 m² = 45,5 g</code>; 112 arkuszy ≈ 5,1 kg. Waga sztuki liczona jest z formatu netto (po obcięciu).</p>
      </div>
      <div class="bottom"><a href="#/ustawienia" class="btn">Gotowe</a></div>
    </div>`;
  }

  route();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* bez trybu offline */ });
  }
})();
