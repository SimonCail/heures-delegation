import { useState } from 'react';
import { getYearSummary, MONTH_SHORT, formatHours } from '../utils/delegation';

export default function YearView({ entries, setEntries, year, onMonthClick, toast }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const months = getYearSummary(entries, year);

  const totalAllocated = months.reduce((s, m) => s + m.allocation, 0);
  const totalUsed = months.reduce((s, m) => s + m.used, 0);
  const lastMonth = months.findLast((m) => m.used > 0) || months[0];

  const totalCseUsed = months.reduce((s, m) => s + m.cseUsed, 0);
  const totalCseAlloc = months.reduce((s, m) => s + m.cseAllocation, 0);

  const yearEntryCount = entries.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year;
  }).length;

  const handleReset = () => {
    setEntries(entries.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() !== year;
    }));
    setConfirmReset(false);
    toast.show(`Toutes les saisies de ${year} ont été supprimées`, 'warn');
  };

  return (
    <div className="year-view">
      <div className="year-stats">
        <div className="stat">
          <span className="stat-label">Total annuel</span>
          <span className="stat-value">{formatHours(totalAllocated)}h</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total utilisé</span>
          <span className="stat-value used">{formatHours(totalUsed)}h</span>
        </div>
        <div className="stat">
          <span className="stat-label">Report actuel</span>
          <span className="stat-value remaining">
            {formatHours(Math.max(0, lastMonth.remaining))}h
          </span>
        </div>
      </div>

      <div className="year-stats year-stats-cse">
        <div className="stat">
          <span className="stat-label">CSE-S annuel</span>
          <span className="stat-value">{formatHours(totalCseAlloc)}h</span>
        </div>
        <div className="stat">
          <span className="stat-label">CSE-S utilisé</span>
          <span className="stat-value used">{formatHours(totalCseUsed)}h</span>
        </div>
        <div className="stat">
          <span className="stat-label">CSE-S restant</span>
          <span className="stat-value remaining">
            {formatHours(totalCseAlloc - totalCseUsed)}h
          </span>
        </div>
      </div>

      <div className="months-grid">
        {months.map((m) => {
          const usedPercent = m.available > 0 ? Math.min((m.used / m.available) * 100, 100) : 0;
          const isOver = m.remaining < 0;
          const isFuture = m.used === 0 && m.cseUsed === 0 && (m.month > new Date().getMonth() || m.year > new Date().getFullYear());

          return (
            <button
              key={m.month}
              className={`month-card ${isOver ? 'over' : ''} ${isFuture ? 'future' : ''}`}
              onClick={() => onMonthClick(m.month)}
            >
              <span className="month-card-name">{MONTH_SHORT[m.month]}</span>
              <div className="month-card-bar">
                <div
                  className={`month-card-fill ${isOver ? 'over' : ''}`}
                  style={{ width: `${usedPercent}%` }}
                />
              </div>
              <div className="month-card-stats">
                <span>{formatHours(m.used)}h</span>
                <span className="month-card-avail">/ {formatHours(m.available)}h</span>
              </div>
              {m.carryOver !== 0 && (
                <span className={`month-card-carry ${m.carryOver < 0 ? 'month-card-deficit' : ''}`}>
                  {m.carryOver > 0 ? '+' : ''}{formatHours(m.carryOver)}h {m.carryOver > 0 ? 'report' : 'déficit'}
                </span>
              )}
              {m.cseUsed > 0 && (
                <span className="month-card-cse">{formatHours(m.cseUsed)}h CSE-S</span>
              )}
            </button>
          );
        })}
      </div>

      {yearEntryCount > 0 && (
        <div className="reset-section">
          {!confirmReset ? (
            <button className="reset-btn" onClick={() => setConfirmReset(true)}>
              Réinitialiser {year}
            </button>
          ) : (
            <div className="reset-confirm">
              <p className="reset-warn">Supprimer les {yearEntryCount} saisie{yearEntryCount > 1 ? 's' : ''} de {year} ?</p>
              <div className="form-actions">
                <button className="delete-btn-full" onClick={handleReset}>
                  Confirmer la suppression
                </button>
                <button className="cancel-btn" onClick={() => setConfirmReset(false)}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
