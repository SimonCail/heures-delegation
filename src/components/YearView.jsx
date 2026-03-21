import { getYearSummary, MONTH_SHORT, formatHours } from '../utils/delegation';

export default function YearView({ entries, year, onMonthClick }) {
  const months = getYearSummary(entries, year);

  const totalAllocated = months.reduce((s, m) => s + m.allocation, 0);
  const totalUsed = months.reduce((s, m) => s + m.used, 0);
  const lastMonth = months.findLast((m) => m.used > 0) || months[0];

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

      <div className="months-grid">
        {months.map((m) => {
          const usedPercent = m.available > 0 ? Math.min((m.used / m.available) * 100, 100) : 0;
          const isOver = m.remaining < 0;
          const isFuture = m.used === 0 && (m.month > new Date().getMonth() || m.year > new Date().getFullYear());

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
              {m.carryOver > 0 && (
                <span className="month-card-carry">+{formatHours(m.carryOver)}h report</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
