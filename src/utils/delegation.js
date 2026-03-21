const MONTHLY_ALLOCATION = 22;
const MAX_MONTHLY = 33;

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const MONTH_SHORT = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

export { MONTHLY_ALLOCATION, MAX_MONTHLY, MONTH_NAMES, MONTH_SHORT };

/**
 * Calculate the available hours for a given month,
 * including carry-over from previous months in the same year.
 */
export function getMonthData(entries, year, month) {
  let carryOver = 0;

  for (let m = 0; m < month; m++) {
    const monthEntries = getEntriesForMonth(entries, year, m);
    const used = monthEntries.reduce((sum, e) => sum + e.hours, 0);
    const available = MONTHLY_ALLOCATION + carryOver;
    const remaining = available - used;
    // Carry-over is the unused hours (can be negative if over-used)
    carryOver = remaining;
  }

  const monthEntries = getEntriesForMonth(entries, year, month);
  const used = monthEntries.reduce((sum, e) => sum + e.hours, 0);
  const available = Math.min(MONTHLY_ALLOCATION + Math.max(0, carryOver), MAX_MONTHLY);
  const totalWithCarry = MONTHLY_ALLOCATION + carryOver;
  const remaining = totalWithCarry - used;

  return {
    month,
    year,
    entries: monthEntries.sort((a, b) => new Date(a.date) - new Date(b.date)),
    carryOver: Math.max(0, carryOver),
    allocation: MONTHLY_ALLOCATION,
    available: Math.min(totalWithCarry, MAX_MONTHLY),
    used,
    remaining: totalWithCarry - used,
    maxMonthly: MAX_MONTHLY,
  };
}

export function getEntriesForMonth(entries, year, month) {
  return entries.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function getYearSummary(entries, year) {
  const months = [];
  for (let m = 0; m < 12; m++) {
    months.push(getMonthData(entries, year, m));
  }
  return months;
}

export function createEntry(date, hours, note = '') {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    date,
    hours: parseFloat(hours),
    note,
  };
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatHours(h) {
  if (h === Math.floor(h)) return h.toString();
  return h.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
