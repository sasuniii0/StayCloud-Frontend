import { useState } from 'react';
import RoomsPanel from './components/RoomsPanel';
import ReservationsPanel from './components/ReservationsPanel';
import PaymentsPanel from './components/PaymentsPanel';
import './App.css';

const TABS = [
  { key: 'rooms', label: 'Rooms', Panel: RoomsPanel },
  { key: 'reservations', label: 'Bookings', Panel: ReservationsPanel },
  { key: 'payments', label: 'Payments', Panel: PaymentsPanel },
];

export default function App() {
  const [tab, setTab] = useState('rooms');
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const ActivePanel = active.Panel;

  return (
    <div className="app">
      <header className="hero">
        <h1 className="brand">StayCloud</h1>
      </header>

      <nav className="tabs" aria-label="Main">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={key === tab ? 'active' : ''}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main>
        <ActivePanel />
      </main>
    </div>
  );
}
