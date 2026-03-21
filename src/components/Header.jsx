import { MONTH_NAMES } from '../utils/delegation';

export default function Header({ year, month, setYear, setMonth, view, setView }) {
  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <header className="header">
      <div className="header-top">
        <h1>Heures de Délégation</h1>
      </div>
      <div className="header-nav">
        <div className="view-toggle">
          <button
            className={view === 'month' ? 'active' : ''}
            onClick={() => setView('month')}
          >
            Mois
          </button>
          <button
            className={view === 'year' ? 'active' : ''}
            onClick={() => setView('year')}
          >
            Année
          </button>
        </div>
      </div>
      {view === 'month' ? (
        <div className="month-selector">
          <button className="nav-btn" onClick={goToPrevMonth}>‹</button>
          <span className="current-month">
            {MONTH_NAMES[month]} {year}
          </span>
          <button className="nav-btn" onClick={goToNextMonth}>›</button>
        </div>
      ) : (
        <div className="month-selector">
          <button className="nav-btn" onClick={() => setYear(year - 1)}>‹</button>
          <span className="current-month">{year}</span>
          <button className="nav-btn" onClick={() => setYear(year + 1)}>›</button>
        </div>
      )}
    </header>
  );
}
