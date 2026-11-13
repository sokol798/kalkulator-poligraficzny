/** Eksport: PDF karty zlecenia (expo-print), udostępnianie, CSV historii. */
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

import type { Calculation } from '@/hooks/use-calculation';
import { fmtDate, fmtDec, fmtInt } from '@/lib/format';
import type { CalcInputs, HistoryEntry } from '@/store/app-store';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function cardText(name: string, inputs: CalcInputs, c: Calculation, when = Date.now()): string {
  return [
    name || `Obliczenie ${c.formatName}`,
    `Arkuszy ${c.sheet.name}: ${fmtInt(c.grossSheets)}${c.wasteSheets ? ` (${fmtInt(c.sheets)} + naddatek ${fmtInt(c.wasteSheets)})` : ''}`,
    `Nakład: ${fmtInt(inputs.quantity)} szt.`,
    `Układ: ${c.ups} na arkuszu (${c.imposition.best ? `${c.imposition.best.columns} × ${c.imposition.best.rows}` : '—'}), ostatni arkusz ${c.lastSheetPercent} %`,
    `Format netto: ${inputs.width} × ${inputs.height} mm, spady ${inputs.bleed} mm (${c.itemWithBleed.width} × ${c.itemWithBleed.height} mm)`,
    `Arkusz: ${c.sheet.name} ${c.sheet.size.width} × ${c.sheet.size.height} mm, marginesy ${c.sheet.marginTop} / ${c.sheet.marginSides} mm`,
    `Wykorzystanie arkusza: ${c.utilization} %`,
    `Papier: ${inputs.grammage} g/m², ${fmtDec(c.totalWeightKg, 1)} kg (${fmtInt(c.grossSheets)} × ${fmtDec(c.sheetWeightG, 1)} g)`,
    ...(c.cost != null ? [`Koszt papieru: ${fmtDec(c.cost, 2)} zł (${fmtInt(c.grossSheets)} × ${fmtDec(inputs.pricePerSheet, 2)} zł)`] : []),
    `Waga 1 szt. / nakładu: ${fmtDec(c.pieceWeightG, 1)} g / ${fmtDec(c.runWeightKg, 1)} kg`,
    `Data: ${fmtDate(when)}`,
  ].join('\n');
}

function previewSvg(c: Calculation): string {
  const { sheet, margins } = c.imposition.input;
  const scale = 220 / Math.max(sheet.width, sheet.height);
  const w = sheet.width * scale;
  const h = sheet.height * scale;
  const items = (c.imposition.best?.items ?? [])
    .map((it, i) => {
      const x = it.x * scale;
      const y = it.y * scale;
      const iw = it.width * scale - 1;
      const ih = it.height * scale - 1;
      return `<rect x="${x}" y="${y}" width="${iw}" height="${ih}" fill="#fff" stroke="#dbe0e5"/><text x="${x + iw / 2}" y="${y + ih / 2 + 4}" font-size="10" text-anchor="middle" fill="#5c6670">${i + 1}</text>`;
    })
    .join('');
  const grip = margins.top ? `<line x1="0" y1="${margins.top * scale}" x2="${w}" y2="${margins.top * scale}" stroke="#5c6670" stroke-dasharray="3 2"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#eceff2" rx="4"/>${grip}${items}</svg>`;
}

export function cardHtml(name: string, inputs: CalcInputs, c: Calculation, when = Date.now()): string {
  const rows: [string, string][] = [
    ['Format netto', `${inputs.width} × ${inputs.height} mm (${c.formatName})`],
    [`Ze spadami ${inputs.bleed} mm`, `${c.itemWithBleed.width} × ${c.itemWithBleed.height} mm`],
    ['Arkusz · marginesy', `${c.sheet.name} ${c.sheet.size.width} × ${c.sheet.size.height} · ${c.sheet.marginTop} / ${c.sheet.marginSides} mm`],
    ['Układ na arkuszu', `${c.ups}${c.imposition.best ? ` · ${c.imposition.best.columns} × ${c.imposition.best.rows}` : ''}`],
    ['Wykorzystanie arkusza · ostatni arkusz', `${c.utilization} % · ${c.lastSheetPercent} %`],
    ...(c.wasteSheets ? ([[`Naddatek (${inputs.wastePercent} %)`, `${fmtInt(c.sheets)} + ${fmtInt(c.wasteSheets)} = ${fmtInt(c.grossSheets)} ark.`]] as [string, string][]) : []),
    [`Waga arkuszy (${fmtInt(c.grossSheets)} × ${fmtDec(c.sheetWeightG, 1)} g)`, `${fmtDec(c.totalWeightKg, 1)} kg`],
    ...(c.cost != null ? ([['Koszt papieru', `${fmtDec(c.cost, 2)} zł`]] as [string, string][]) : []),
    ['Waga 1 szt. / nakładu', `${fmtDec(c.pieceWeightG, 1)} g / ${fmtDec(c.runWeightKg, 1)} kg`],
    ['Data', fmtDate(when)],
  ];
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${esc(name || 'Karta zlecenia')}</title>
<style>body{font-family:Inter,-apple-system,Helvetica,Arial,sans-serif;color:#111;margin:32px;font-size:14px}h1{font-size:22px;margin:0 0 4px}.sub{color:#5c6670;margin-bottom:24px}.top{display:flex;gap:28px;align-items:flex-start}.big{font-size:56px;font-weight:600;letter-spacing:-2px;line-height:1}.lbl{color:#5c6670;font-size:12px}.kv{display:grid;grid-template-columns:1fr auto;gap:8px 24px;margin-top:24px;border-top:1px solid #dbe0e5}.kv div{padding:8px 0;border-bottom:1px solid #dbe0e5}.stat{margin-top:10px}.stat b{font-size:16px}</style></head><body>
<h1>${esc(name || `Obliczenie ${c.formatName}`)}</h1><div class="sub">Karta zlecenia · kalkulator poligraficzny</div>
<div class="top">${previewSvg(c)}<div><div class="lbl">Arkuszy ${esc(c.sheet.name)}</div><div class="big">${fmtInt(c.grossSheets)}</div>
<div class="stat"><div class="lbl">Nakład</div><b>${fmtInt(inputs.quantity)} szt.</b></div>
<div class="stat"><div class="lbl">Ostatni arkusz</div><b>${c.lastSheetPercent} %</b></div>
<div class="stat"><div class="lbl">Papier</div><b>${inputs.grammage} g/m² · ${fmtDec(c.totalWeightKg, 1)} kg</b></div></div></div>
<div class="kv">${rows.map(([k, v]) => `<div class="lbl">${esc(k)}</div><div>${esc(v)}</div>`).join('')}</div>
</body></html>`;
}

export async function exportCardPdf(name: string, inputs: CalcInputs, c: Calculation): Promise<void> {
  const html = cardHtml(name, inputs, c);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: name || 'Karta zlecenia' });
  }
}

export async function shareCard(name: string, inputs: CalcInputs, c: Calculation): Promise<void> {
  const text = cardText(name, inputs, c);
  if (Platform.OS === 'web') {
    const nav = globalThis.navigator as Navigator & { share?: (d: { text: string; title?: string }) => Promise<void>; clipboard?: { writeText(s: string): Promise<void> } };
    if (nav.share) await nav.share({ title: name || 'Karta zlecenia', text });
    else await nav.clipboard?.writeText(text);
    return;
  }
  await Share.share({ message: text, title: name || 'Karta zlecenia' });
}

export function historyCsv(entries: HistoryEntry[]): string {
  const head = ['data', 'nazwa', 'format', 'szerokosc_mm', 'wysokosc_mm', 'spad_mm', 'naklad', 'arkusz', 'uzytkow_na_arkuszu', 'arkuszy', 'gramatura', 'waga_kg', 'koszt_pln', 'zapisane'];
  const cell = (v: string | number | boolean) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = entries.map((e) =>
    [
      new Date(e.createdAt).toISOString(),
      e.name,
      e.summary.formatName,
      e.inputs.width,
      e.inputs.height,
      e.inputs.bleed,
      e.inputs.quantity,
      e.summary.sheetName,
      e.summary.ups,
      e.summary.sheets,
      e.inputs.grammage,
      e.summary.weightKg,
      e.summary.cost ?? '',
      e.starred ? 1 : 0,
    ]
      .map(cell)
      .join(';'),
  );
  return '﻿' + [head.join(';'), ...lines].join('\n');
}

export async function exportHistoryCsv(entries: HistoryEntry[]): Promise<void> {
  const csv = historyCsv(entries);
  const filename = `historia-${new Date().toISOString().slice(0, 10)}.csv`;
  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: filename });
}
