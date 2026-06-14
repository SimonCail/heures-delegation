const TABS = [
  {
    id: 'month',
    label: 'CSE',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 2a1 1 0 0 0-2 0v1.1A4 4 0 0 0 2.1 7H21.9A4 4 0 0 0 18 3.1V2a1 1 0 1 0-2 0v1H8V2z" />
        <path d="M2 9.5a1.5 1.5 0 0 1 1.5-1.5h17A1.5 1.5 0 0 1 22 9.5V19a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9.5z" />
      </svg>
    ),
  },
  {
    id: 'year',
    label: 'Récap',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <rect x="2.5" y="2.5" width="8.5" height="8.5" rx="2.4" /><rect x="13" y="2.5" width="8.5" height="8.5" rx="2.4" />
        <rect x="2.5" y="13" width="8.5" height="8.5" rx="2.4" /><rect x="13" y="13" width="8.5" height="8.5" rx="2.4" />
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
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3.5" y="12" width="4.5" height="9" rx="2" />
        <rect x="9.75" y="3" width="4.5" height="18" rx="2" />
        <rect x="16" y="8" width="4.5" height="13" rx="2" />
      </svg>
    ),
  },
];

export default function BottomNav({ view, setView }) {
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === view));
  return (
    <nav className="bottom-nav" style={{ '--tabs': TABS.length }}>
      <div className="bottom-nav-indicator" style={{ transform: `translateX(${activeIndex * 100}%)` }} />
      {TABS.map((t) => {
        const active = view === t.id;
        return (
          <button
            key={t.id}
            className={`bottom-nav-btn ${active ? 'active' : ''}`}
            onClick={() => setView(t.id)}
            aria-label={t.label}
            aria-current={active ? 'page' : undefined}
          >
            <span className="bottom-nav-icon">{active ? t.iconActive : t.icon}</span>
            <span className="bottom-nav-label">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
