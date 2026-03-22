import { useState } from 'react';

export default function EntryForm({
  year,
  month,
  initialDate,
  initialHours,
  initialNote,
  initialType,
  onSubmit,
  onCancel,
}) {
  const defaultDate = initialDate || `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const [date, setDate] = useState(defaultDate);
  const [hours, setHours] = useState(initialHours?.toString() || '');
  const [note, setNote] = useState(initialNote || '');
  const [type, setType] = useState(initialType || 'delegation');

  const handleSubmit = (e) => {
    e.preventDefault();
    const h = parseFloat(hours);
    if (!date || isNaN(h) || h <= 0) return;
    onSubmit(date, h, note.trim(), type);
  };

  const isEditing = !!initialDate;
  const hasChanged = isEditing && (
    date !== initialDate ||
    hours !== initialHours?.toString() ||
    note !== (initialNote || '') ||
    type !== (initialType || 'delegation')
  );

  const minDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const maxDay = new Date(year, month + 1, 0).getDate();
  const maxDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(maxDay).padStart(2, '0')}`;

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-field">
          <label>Date</label>
          <input
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label>Heures</label>
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            min="0.25"
            max="24"
            step="0.25"
            placeholder="0"
            required
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label>Type</label>
          <div className="type-toggle">
            <button
              type="button"
              className={`type-btn ${type === 'delegation' ? 'active' : ''}`}
              onClick={() => setType('delegation')}
            >
              Délégation
            </button>
            <button
              type="button"
              className={`type-btn type-btn-cse ${type === 'cse-s' ? 'active' : ''}`}
              onClick={() => setType('cse-s')}
            >
              CSE-S
            </button>
          </div>
        </div>
      </div>
      <div className="form-field">
        <label>Note (optionnel)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex: Réunion CE, négociations..."
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="submit-btn" disabled={isEditing && !hasChanged}>
          {isEditing ? '✓ Modifier' : '+ Ajouter'}
        </button>
        <button type="button" className="cancel-btn" onClick={onCancel}>
          ✕ Annuler
        </button>
      </div>
    </form>
  );
}
