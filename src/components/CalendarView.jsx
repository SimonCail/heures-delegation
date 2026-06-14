import { formatHours } from '../utils/delegation';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/**
 * Month grid showing the hours logged on each day.
 * Tapping a day opens the add form pre-filled with that date.
 */
export default function CalendarView({ entries, year, month, onDayClick }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // JS: 0=Sunday..6=Saturday -> shift to Monday-first
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  // Aggregate hours per day for this month
  const byDay = {};
  for (const e of entries) {
    const d = new Date(e.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    const day = d.getDate();
    if (!byDay[day]) byDay[day] = { cse: 0, cseS: 0 };
    if (e.type === 'cse-s') byDay[day].cseS += e.hours;
    else byDay[day].cse += e.hours;
  }

  const today = new Date();
  const isToday = (day) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const pad = (n) => String(n).padStart(2, '0');
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  return (
    <div className="calendar">
      <div className="calendar-weekdays">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="calendar-weekday">{w}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} className="calendar-cell empty" />;
          const data = byDay[day];
          const total = data ? data.cse + data.cseS : 0;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          return (
            <button
              key={day}
              className={`calendar-cell ${total > 0 ? 'has-hours' : ''} ${isToday(day) ? 'today' : ''}`}
              onClick={() => onDayClick(dateStr)}
            >
              <span className="calendar-daynum">{day}</span>
              {total > 0 && (
                <>
                  <span className="calendar-hours">{formatHours(total)}h</span>
                  <span className="calendar-dots">
                    {data.cse > 0 && <span className="calendar-dot dot-cse" />}
                    {data.cseS > 0 && <span className="calendar-dot dot-cses" />}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <div className="calendar-legend">
        <span className="legend-item"><span className="legend-dot legend-cse" /> CSE</span>
        <span className="legend-item"><span className="legend-dot legend-cses" /> CSE-S</span>
      </div>
    </div>
  );
}
