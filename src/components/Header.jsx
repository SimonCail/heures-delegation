import { useState, useRef, useEffect } from 'react';
import { MONTH_NAMES } from '../utils/delegation';

const THEMES = [
  { id: 'light', label: 'Clair', bg: '#f5f7fa', fg: '#ffffff', accent: '#1e3a5f' },
  { id: 'dark', label: 'Sombre', bg: '#0f0f0f', fg: '#1a1a1a', accent: '#6c9fd8' },
  { id: 'dim', label: 'Bleu nuit', bg: '#15202b', fg: '#1e2d3d', accent: '#1d9bf0' },
];

export default function Header({ year, month, setYear, setMonth, view, setView, onLogout, userEmail }) {
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const panelRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!showSettings) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSettings]);

  const goToPrevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const goToNextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  return (
    <header className="header">
      <div className="header-top">
        <h1>Heures de Delegation</h1>
        <div className="header-right" ref={panelRef}>
          <button
            className={`settings-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Reglages"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>

          {showSettings && (
            <div className="settings-panel">
              <div className="settings-user">
                <span className="settings-email">{userEmail}</span>
              </div>

              <div className="settings-section">
                <span className="settings-label">Theme</span>
                <div className="theme-options">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      className={`theme-option ${theme === t.id ? 'active' : ''}`}
                      onClick={() => setTheme(t.id)}
                    >
                      <div className="theme-preview" style={{ background: t.bg }}>
                        <div className="theme-preview-card" style={{ background: t.fg }}>
                          <div className="theme-preview-line" style={{ background: t.accent }} />
                          <div className="theme-preview-line short" style={{ background: t.accent, opacity: 0.4 }} />
                        </div>
                      </div>
                      <span className="theme-label">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button className="settings-logout" onClick={onLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Deconnexion
              </button>
            </div>
          )}
        </div>
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
            Annee
          </button>
        </div>
      </div>
      {view === 'month' ? (
        <div className="month-selector">
          <button className="nav-btn" onClick={goToPrevMonth}>&#8249;</button>
          <span className="current-month">
            {MONTH_NAMES[month]} {year}
          </span>
          <button className="nav-btn" onClick={goToNextMonth}>&#8250;</button>
        </div>
      ) : (
        <div className="month-selector">
          <button className="nav-btn" onClick={() => setYear(year - 1)}>&#8249;</button>
          <span className="current-month">{year}</span>
          <button className="nav-btn" onClick={() => setYear(year + 1)}>&#8250;</button>
        </div>
      )}
    </header>
  );
}
