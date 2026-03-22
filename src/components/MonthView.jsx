import { useState } from 'react';
import { getMonthData, formatDate, formatHours, createEntry, MONTH_NAMES } from '../utils/delegation';
import EntryForm from './EntryForm';
import ExcelImport from './ExcelImport';

export default function MonthView({ entries, setEntries, year, month, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const data = getMonthData(entries, year, month);

  const filteredEntries = data.entries.filter((entry) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      formatDate(entry.date).toLowerCase().includes(q) ||
      (entry.note && entry.note.toLowerCase().includes(q)) ||
      `${entry.hours}h`.includes(q) ||
      (entry.type === 'cse-s' && 'cse-s'.includes(q)) ||
      (entry.type !== 'cse-s' && 'cse'.includes(q))
    );
  });

  const handleAdd = (date, hours, note, type) => {
    if (type === 'cse-s' && hours > data.cseRemaining) {
      toast.show(`CSE-S : il ne reste que ${formatHours(data.cseRemaining)}h ce mois-ci`, 'error');
      return;
    }
    if (type !== 'cse-s' && data.used + hours > data.available) {
      toast.show(`Disponible : ${formatHours(data.available)}h ce mois-ci, vous ne pouvez ajouter que ${formatHours(data.available - data.used)}h de plus`, 'error');
      return;
    }
    const entry = createEntry(date, hours, note, type);
    setEntries([...entries, entry]);
    setShowForm(false);
    const label = type === 'cse-s' ? ' (CSE-S)' : '';
    toast.show(`${formatHours(hours)}h${label} ajoutee${hours > 1 ? 's' : ''} le ${formatDate(date)}`, 'success');
  };

  const handleEdit = (date, hours, note, type) => {
    if (type === 'cse-s') {
      const currentHours = editingEntry.type === 'cse-s' ? editingEntry.hours : 0;
      const availableCse = data.cseRemaining + currentHours;
      if (hours > availableCse) {
        toast.show(`CSE-S : il ne reste que ${formatHours(availableCse)}h ce mois-ci`, 'error');
        return;
      }
    }
    if (type !== 'cse-s') {
      const currentHours = editingEntry.type !== 'cse-s' ? editingEntry.hours : 0;
      const usedWithout = data.used - currentHours;
      if (usedWithout + hours > data.available) {
        toast.show(`Disponible : ${formatHours(data.available)}h ce mois-ci, vous ne pouvez ajouter que ${formatHours(data.available - usedWithout)}h de plus`, 'error');
        return;
      }
    }
    setEntries(
      entries.map((e) =>
        e.id === editingEntry.id ? { ...e, date, hours: parseFloat(hours), note, type } : e
      )
    );
    setEditingEntry(null);
    toast.show('Saisie modifiee', 'info');
  };

  const handleDelete = (id) => {
    const entry = entries.find((e) => e.id === id);
    setEntries(entries.filter((e) => e.id !== id));
    setDeletingId(null);
    toast.show(`Saisie du ${formatDate(entry.date)} supprimee`, 'warn');
  };

  const handleImport = (imported) => {
    setEntries([...entries, ...imported]);
    toast.show(`${imported.length} saisie${imported.length > 1 ? 's' : ''} importee${imported.length > 1 ? 's' : ''}`, 'success');
  };

  const usedPercent = data.available > 0 ? Math.min((data.used / data.available) * 100, 100) : 0;
  const isOver = data.remaining < 0;
  const csePercent = Math.min((data.cseUsed / data.cseAllocation) * 100, 100);
  const isCseOver = data.cseRemaining < 0;

  return (
    <div className="month-view">
      <div className="stats-column">
        <div className="stats-card">
          <div className="stats-card-title">CSE</div>
          <div className="stats-header">
            <div className="stat">
              <span className="stat-label">Credit mensuel</span>
              <span className="stat-value">{formatHours(data.allocation)}h</span>
            </div>
            {data.carryOver !== 0 && (
              <div className="stat">
                <span className="stat-label">{data.carryOver > 0 ? 'Report' : 'Deficit'}</span>
                <span className={`stat-value ${data.carryOver > 0 ? 'report' : 'negative'}`}>
                  {data.carryOver > 0 ? '+' : ''}{formatHours(data.carryOver)}h
                </span>
              </div>
            )}
            <div className="stat">
              <span className="stat-label">Disponible</span>
              <span className="stat-value">{formatHours(data.available)}h</span>
            </div>
          </div>

          <div className="progress-bar">
            <div
              className={`progress-fill ${isOver ? 'over' : ''}`}
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>

          <div className="stats-footer">
            <div className="stat">
              <span className="stat-label">Utilisees</span>
              <span className="stat-value used">{formatHours(data.used)}h</span>
            </div>
            <div className="stat">
              <span className="stat-label">Restantes</span>
              <span className={`stat-value ${isOver ? 'negative' : 'remaining'}`}>
                {formatHours(data.remaining)}h
              </span>
            </div>
          </div>
        </div>

        <div className="stats-card stats-card-cse">
          <div className="stats-card-title">CSE-S <span className="cse-badge">Tresorier</span></div>
          <div className="progress-bar">
            <div
              className={`progress-fill progress-fill-cse ${isCseOver ? 'over' : ''}`}
              style={{ width: `${Math.min(csePercent, 100)}%` }}
            />
          </div>
          <div className="stats-footer">
            <div className="stat">
              <span className="stat-label">Utilisees</span>
              <span className="stat-value used">{formatHours(data.cseUsed)}h</span>
            </div>
            <div className="stat">
              <span className="stat-label">Restantes</span>
              <span className={`stat-value ${isCseOver ? 'negative' : 'remaining'}`}>
                {formatHours(data.cseRemaining)}h
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Credit</span>
              <span className="stat-value">{formatHours(data.cseAllocation)}h</span>
            </div>
          </div>
        </div>
      </div>

      <div className="entries-section">
        <div className="entries-header">
          <h2>Saisies</h2>
          <div className="entries-actions">
            <ExcelImport onImport={handleImport} />
            <button className="add-btn" onClick={() => { setShowForm(true); setEditingEntry(null); }}>
              + Ajouter
            </button>
          </div>
        </div>

        {data.entries.length > 2 && (
          <div className="search-bar">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une saisie..."
              className="search-input"
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>&times;</button>
            )}
          </div>
        )}

        {showForm && !editingEntry && (
          <EntryForm
            year={year}
            month={month}
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        )}

        {data.entries.length === 0 && !showForm ? (
          <p className="empty-state">Aucune saisie pour {MONTH_NAMES[month].toLowerCase()}</p>
        ) : (
          <>
            {search && filteredEntries.length === 0 && (
              <p className="empty-state">Aucun resultat pour "{search}"</p>
            )}
            <ul className="entries-list">
              {filteredEntries.map((entry) => (
                <li key={entry.id} className={`entry-item ${entry.type === 'cse-s' ? 'entry-item-cse' : ''}`}>
                  {editingEntry?.id === entry.id ? (
                    <EntryForm
                      year={year}
                      month={month}
                      initialDate={entry.date}
                      initialHours={entry.hours}
                      initialNote={entry.note}
                      initialType={entry.type}
                      onSubmit={handleEdit}
                      onCancel={() => setEditingEntry(null)}
                    />
                  ) : (
                    <div className="entry-content">
                      <div className="entry-info">
                        <span className="entry-date">
                          {formatDate(entry.date)}
                          {entry.type === 'cse-s' ? (
                            <span className="entry-type-badge">CSE-S</span>
                          ) : (
                            <span className="entry-type-badge entry-type-badge-cse">CSE</span>
                          )}
                        </span>
                        <span className="entry-hours">{formatHours(entry.hours)}h</span>
                      </div>
                      {entry.note && <p className="entry-note">{entry.note}</p>}
                      <div className="entry-actions">
                        <button className="edit-btn" onClick={() => { setEditingEntry(entry); setShowForm(false); }}>
                          <span className="btn-icon">&#9998;</span> Modifier
                        </button>
                        <button className="delete-btn" onClick={() => setDeletingId(entry.id)}>
                          <span className="btn-icon">&times;</span> Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {deletingId && (
        <div className="modal-overlay" onClick={() => setDeletingId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Supprimer cette saisie ?</p>
            <p className="modal-desc">
              {(() => {
                const entry = entries.find((e) => e.id === deletingId);
                if (!entry) return '';
                return `${formatDate(entry.date)} - ${formatHours(entry.hours)}h${entry.type === 'cse-s' ? ' (CSE-S)' : ''}`;
              })()}
            </p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setDeletingId(null)}>
                Annuler
              </button>
              <button className="modal-confirm" onClick={() => handleDelete(deletingId)}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
