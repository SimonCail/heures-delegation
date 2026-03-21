import { useRef, useState } from 'react';
import { read, utils } from 'xlsx';
import { createEntry } from '../utils/delegation';

export default function ExcelImport({ onImport }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const parseFile = (file) => {
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = read(e.target.result, { type: 'array', cellDates: false });
        const allEntries = [];

        for (const name of wb.SheetNames) {
          const sheet = wb.Sheets[name];
          const grid = utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
          const entries = parseGrid(grid);
          allEntries.push(...entries);
        }

        if (allEntries.length === 0) {
          setError('Aucune saisie trouvée. Vérifiez que le fichier contient des dates (ex: 12/1/2020) et des heures.');
          return;
        }

        // Sort by date
        allEntries.sort((a, b) => a.date.localeCompare(b.date));
        setPreview(allEntries);
      } catch {
        setError('Impossible de lire ce fichier. Vérifiez le format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirm = () => {
    onImport(preview);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleCancel = () => {
    setPreview(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="excel-import">
      {!preview ? (
        <>
          <label className="import-btn">
            Importer Excel
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files[0] && parseFile(e.target.files[0])}
            />
          </label>
          {error && <p className="import-error">{error}</p>}
        </>
      ) : (
        <div className="import-preview">
          <p className="import-count">{preview.length} saisie{preview.length > 1 ? 's' : ''} trouvée{preview.length > 1 ? 's' : ''}</p>
          <ul className="import-list">
            {preview.map((e) => (
              <li key={e.id}>
                {new Date(e.date).toLocaleDateString('fr-FR')} — {e.hours}h
              </li>
            ))}
          </ul>
          <div className="form-actions">
            <button className="submit-btn" onClick={handleConfirm}>Confirmer l'import</button>
            <button className="cancel-btn" onClick={handleCancel}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Parse a 2D grid (array of arrays) to find all date+hours entries.
 * Handles the multi-table layout: multiple small tables per sheet,
 * side by side, each with columns: Date | nbre d'heure | total
 *
 * Strategy: scan every cell for a date value. If found, the cell
 * immediately to its right should contain the hours.
 */
function parseGrid(grid) {
  const entries = [];

  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      const date = parseDate(cell);
      if (!date) continue;

      // The hours should be in the next column
      const hoursCell = row[c + 1];
      if (hoursCell === undefined || hoursCell === '') continue;
      const hours = parseHours(hoursCell);
      if (!hours) continue;

      entries.push(createEntry(date, hours));
    }
  }

  return entries;
}

/**
 * Try to parse a cell value as a date.
 * Returns ISO string (yyyy-mm-dd) or null.
 */
function parseDate(val) {
  if (val === null || val === undefined || val === '') return null;

  // Excel serial number (days since 1900-01-01, with the 1900 leap year bug)
  if (typeof val === 'number' && val > 1 && val < 200000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(epoch.getTime() + val * 86400000);
    const y = date.getUTCFullYear();
    if (y < 1990 || y > 2100) return null;
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();

  // dd/mm/yyyy or d/m/yyyy (with / - or . separator)
  const parts = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (parts) {
    const day = parts[1].padStart(2, '0');
    const month = parts[2].padStart(2, '0');
    const year = parts[3];
    if (+month >= 1 && +month <= 12 && +day >= 1 && +day <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // yyyy-mm-dd
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  return null;
}

/**
 * Parse a cell value as hours (positive number).
 */
function parseHours(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val > 0 ? val : null;
  const num = parseFloat(String(val).replace(',', '.'));
  return isNaN(num) || num <= 0 ? null : num;
}
