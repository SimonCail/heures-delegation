const MONTHLY_ALLOCATION = 22;
const MAX_MONTHLY = 33;
const CSE_S_MONTHLY = 4;

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const MONTH_SHORT = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

export { MONTHLY_ALLOCATION, MAX_MONTHLY, CSE_S_MONTHLY, MONTH_NAMES, MONTH_SHORT };

/**
 * Calculate the available hours for a given month,
 * including carry-over from previous months in the same year.
 */
export function getMonthData(entries, year, month) {
  let carryOver = 0;

  for (let m = 0; m < month; m++) {
    const monthEntries = getEntriesForMonth(entries, year, m).filter((e) => e.type !== 'cse-s');
    const used = monthEntries.reduce((sum, e) => sum + e.hours, 0);
    const totalAvailable = MONTHLY_ALLOCATION + carryOver;
    // The person can only use up to MAX_MONTHLY, the rest carries over
    carryOver = totalAvailable - used;
  }

  const allMonthEntries = getEntriesForMonth(entries, year, month);
  const delegEntries = allMonthEntries.filter((e) => e.type !== 'cse-s');
  const cseEntries = allMonthEntries.filter((e) => e.type === 'cse-s');

  const used = delegEntries.reduce((sum, e) => sum + e.hours, 0);
  const totalWithCarry = MONTHLY_ALLOCATION + carryOver;

  const cseUsed = cseEntries.reduce((sum, e) => sum + e.hours, 0);

  return {
    month,
    year,
    entries: allMonthEntries.sort((a, b) => new Date(a.date) - new Date(b.date)),
    carryOver,
    allocation: MONTHLY_ALLOCATION,
    available: Math.min(totalWithCarry, MAX_MONTHLY),
    used,
    remaining: totalWithCarry - used,
    maxMonthly: MAX_MONTHLY,
    cseAllocation: CSE_S_MONTHLY,
    cseUsed,
    cseRemaining: CSE_S_MONTHLY - cseUsed,
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

export function createEntry(date, hours, note = '', type = 'delegation') {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    date,
    hours: parseFloat(hours),
    note,
    type,
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
