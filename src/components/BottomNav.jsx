const TABS = [
  {
    id: 'month',
    label: 'Mois',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'year',
    label: 'Année',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="20" x2="6" y2="13" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="18" y1="20" x2="18" y2="9" />
      </svg>
    ),
  },
];

export default function BottomNav({ view, setView }) {
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === view));
  return (
    <nav className="bottom-nav" style={{ '--tabs': TABS.length }}>
      <div className="bottom-nav-indicator" style={{ transform: `translateX(${activeIndex * 100}%)` }} />
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`bottom-nav-btn ${view === t.id ? 'active' : ''}`}
          onClick={() => setView(t.id)}
          aria-label={t.label}
          aria-current={view === t.id ? 'page' : undefined}
        >
          <span className="bottom-nav-icon">{t.icon}</span>
          <span className="bottom-nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
