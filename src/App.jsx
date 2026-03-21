import { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import MonthView from './components/MonthView';
import YearView from './components/YearView';
import Toast, { useToast } from './components/Toast';

export default function App() {
  const now = new Date();
  const [entries, setEntries] = useLocalStorage('delegation-entries', []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState('month');
  const toast = useToast();

  const handleMonthClick = (m) => {
    setMonth(m);
    setView('month');
  };

  return (
    <div className="app">
      <Toast toasts={toast.toasts} onDismiss={toast.dismiss} />
      <Header
        year={year}
        month={month}
        setYear={setYear}
        setMonth={setMonth}
        view={view}
        setView={setView}
      />
      <main className="main">
        {view === 'month' ? (
          <MonthView entries={entries} setEntries={setEntries} year={year} month={month} toast={toast} />
        ) : (
          <YearView entries={entries} year={year} onMonthClick={handleMonthClick} />
        )}
      </main>
    </div>
  );
}
