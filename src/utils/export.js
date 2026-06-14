import { utils, writeFile } from 'xlsx';
import { getYearSummary, MONTH_NAMES, formatHours } from './delegation';

/**
 * Build the per-month summary rows for a given year.
 * Returns an array of { month, cseUsed, cseSUsed, total, carryOver }.
 */
function buildMonthlyRows(entries, year) {
  const months = getYearSummary(entries, year);
  return months.map((m) => ({
    month: MONTH_NAMES[m.month],
    cseUsed: m.used,
    cseSUsed: m.cseUsed,
    total: m.used + m.cseUsed,
    carryOver: m.carryOver,
  }));
}

/** Flat list of all entries for the year, sorted by date. */
function buildEntryRows(entries, year) {
  return entries
    .filter((e) => new Date(e.date).getFullYear() === year)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString('fr-FR'),
      type: e.type === 'cse-s' ? 'CSE-S' : 'CSE',
      hours: e.hours,
      note: e.note || '',
    }));
}

/**
 * Export the year's data as an Excel workbook (.xlsx) with two sheets:
 * a monthly summary and the full list of entries.
 */
export function exportExcel(entries, year) {
  const monthlyRows = buildMonthlyRows(entries, year);
  const entryRows = buildEntryRows(entries, year);

  const totalCse = monthlyRows.reduce((s, r) => s + r.cseUsed, 0);
  const totalCseS = monthlyRows.reduce((s, r) => s + r.cseSUsed, 0);

  const summary = utils.json_to_sheet(
    monthlyRows.map((r) => ({
      Mois: r.month,
      'CSE (h)': r.cseUsed,
      'CSE-S (h)': r.cseSUsed,
      'Total (h)': r.total,
      'Report (h)': r.carryOver,
    }))
  );
  utils.sheet_add_json(
    summary,
    [{ Mois: 'TOTAL', 'CSE (h)': totalCse, 'CSE-S (h)': totalCseS, 'Total (h)': totalCse + totalCseS, 'Report (h)': '' }],
    { skipHeader: true, origin: -1 }
  );

  const details = utils.json_to_sheet(
    entryRows.map((r) => ({ Date: r.date, Type: r.type, 'Heures': r.hours, Note: r.note }))
  );

  const wb = utils.book_new();
  utils.book_append_sheet(wb, summary, 'Résumé');
  utils.book_append_sheet(wb, details, 'Saisies');
  writeFile(wb, `heures-delegation-${year}.xlsx`);
}

/**
 * Export the year's entries as a CSV file (semicolon-separated for Excel FR).
 */
export function exportCSV(entries, year) {
  const rows = buildEntryRows(entries, year);
  const header = ['Date', 'Type', 'Heures', 'Note'];
  const escape = (v) => {
    const s = String(v).replace(/"/g, '""');
    return /[";\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [
    header.join(';'),
    ...rows.map((r) => [r.date, r.type, formatHours(r.hours), r.note].map(escape).join(';')),
  ];
  // BOM so accents render correctly in Excel
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `heures-delegation-${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export a clean annual recap as a PDF document.
 */
export async function exportPDF(entries, year, userLabel = '') {
  // Lazy-load jsPDF so it stays out of the initial bundle
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const monthlyRows = buildMonthlyRows(entries, year);
  const entryRows = buildEntryRows(entries, year);

  const totalCse = monthlyRows.reduce((s, r) => s + r.cseUsed, 0);
  const totalCseS = monthlyRows.reduce((s, r) => s + r.cseSUsed, 0);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, pageWidth, 90, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Heures de Délégation', 40, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text(`Récapitulatif annuel ${year}`, 40, 68);

  if (userLabel) {
    doc.setFontSize(10);
    doc.text(userLabel, pageWidth - 40, 45, { align: 'right' });
  }
  doc.setFontSize(9);
  doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 40, 68, { align: 'right' });

  // Monthly summary table
  autoTable(doc, {
    startY: 120,
    head: [['Mois', 'CSE (h)', 'CSE-S (h)', 'Total (h)', 'Report (h)']],
    body: monthlyRows.map((r) => [
      r.month,
      formatHours(r.cseUsed),
      formatHours(r.cseSUsed),
      formatHours(r.total),
      (r.carryOver > 0 ? '+' : '') + formatHours(r.carryOver),
    ]),
    foot: [['TOTAL', formatHours(totalCse), formatHours(totalCseS), formatHours(totalCse + totalCseS), '']],
    theme: 'striped',
    headStyles: { fillColor: [47, 111, 237], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [233, 238, 246], textColor: [30, 58, 95], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: { 0: { fontStyle: 'bold' } },
  });

  // Detail table (only if there are entries)
  if (entryRows.length > 0) {
    const afterSummary = doc.lastAutoTable.finalY + 28;
    doc.setTextColor(30, 58, 95);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Détail des saisies', 40, afterSummary);

    autoTable(doc, {
      startY: afterSummary + 10,
      head: [['Date', 'Type', 'Heures', 'Note']],
      body: entryRows.map((r) => [r.date, r.type, formatHours(r.hours), r.note]),
      theme: 'grid',
      headStyles: { fillColor: [47, 111, 237], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: { 3: { cellWidth: 220 } },
    });
  }

  doc.save(`heures-delegation-${year}.pdf`);
}
