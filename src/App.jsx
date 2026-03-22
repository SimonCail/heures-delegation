import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useFirestoreEntries } from './hooks/useFirestoreEntries';
import Header from './components/Header';
import MonthView from './components/MonthView';
import YearView from './components/YearView';
import LoginPage from './components/LoginPage';
import Toast, { useToast } from './components/Toast';

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState('month');
  const toast = useToast();

  if (authLoading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AuthenticatedApp
    user={user}
    logout={logout}
    year={year}
    setYear={setYear}
    month={month}
    setMonth={setMonth}
    view={view}
    setView={setView}
    toast={toast}
  />;
}

function AuthenticatedApp({ user, logout, year, setYear, month, setMonth, view, setView, toast }) {
  const [entries, setEntries, dataLoading] = useFirestoreEntries(user.uid);

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
        onLogout={logout}
        userEmail={user.email || user.displayName}
      />
      <main className="main">
        {dataLoading ? (
          <div className="loading-data"><div className="spinner" /></div>
        ) : view === 'month' ? (
          <MonthView entries={entries} setEntries={setEntries} year={year} month={month} toast={toast} />
        ) : (
          <YearView entries={entries} setEntries={setEntries} year={year} onMonthClick={handleMonthClick} toast={toast} />
        )}
      </main>
    </div>
  );
}
