import { useState } from 'react';
import { getMonthData, formatDate, formatHours, createEntry, MONTH_NAMES } from '../utils/delegation';
import EntryForm from './EntryForm';
import ExcelImport from './ExcelImport';

export default function MonthView({ entries, setEntries, year, month, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const data = getMonthData(entries, year, month);

  const handleAdd = (date, hours, note) => {
    const entry = createEntry(date, hours, note);
    setEntries([...entries, entry]);
    setShowForm(false);
    toast.show(`${formatHours(hours)}h ajoutée${hours > 1 ? 's' : ''} le ${formatDate(date)}`, 'success');
  };

  const handleEdit = (date, hours, note) => {
    setEntries(
      entries.map((e) =>
        e.id === editingEntry.id ? { ...e, date, hours: parseFloat(hours), note } : e
      )
    );
    setEditingEntry(null);
    toast.show('Saisie modifiée', 'info');
  };

  const handleDelete = (id) => {
    const entry = entries.find((e) => e.id === id);
    setEntries(entries.filter((e) => e.id !== id));
    toast.show(`Saisie du ${formatDate(entry.date)} supprimée`, 'warn');
  };

  const handleImport = (imported) => {
    setEntries([...entries, ...imported]);
    toast.show(`${imported.length} saisie${imported.length > 1 ? 's' : ''} importée${imported.length > 1 ? 's' : ''}`, 'success');
  };

  const usedPercent = data.available > 0 ? Math.min((data.used / data.available) * 100, 100) : 0;
  const isOver = data.remaining < 0;

  return (
    <div className="month-view">
      <div className="stats-card">
        <div className="stats-header">
          <div className="stat">
            <span className="stat-label">Crédit mensuel</span>
            <span className="stat-value">{formatHours(data.allocation)}h</span>
          </div>
          {data.carryOver > 0 && (
            <div className="stat">
              <span className="stat-label">Report</span>
              <span className="stat-value report">+{formatHours(data.carryOver)}h</span>
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
            <span className="stat-label">Utilisées</span>
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
          <ul className="entries-list">
            {data.entries.map((entry) => (
              <li key={entry.id} className="entry-item">
                {editingEntry?.id === entry.id ? (
                  <EntryForm
                    year={year}
                    month={month}
                    initialDate={entry.date}
                    initialHours={entry.hours}
                    initialNote={entry.note}
                    onSubmit={handleEdit}
                    onCancel={() => setEditingEntry(null)}
                  />
                ) : (
                  <div className="entry-content">
                    <div className="entry-info">
                      <span className="entry-date">{formatDate(entry.date)}</span>
                      <span className="entry-hours">{formatHours(entry.hours)}h</span>
                    </div>
                    {entry.note && <p className="entry-note">{entry.note}</p>}
                    <div className="entry-actions">
                      <button className="edit-btn" onClick={() => { setEditingEntry(entry); setShowForm(false); }}>
                        <span className="btn-icon">&#9998;</span> Modifier
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(entry.id)}>
                        <span className="btn-icon">&times;</span> Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
