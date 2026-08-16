import { useState } from 'react';
import RoomsPanel from './components/RoomsPanel';
import ReservationsPanel from './components/ReservationsPanel';
import PaymentsPanel from './components/PaymentsPanel';
import { API_BASE_URL } from './api';
import './App.css';

const TABS = {
    rooms: RoomsPanel,
    reservations: ReservationsPanel,
    payments: PaymentsPanel,
};

export default function App() {
    const [tab, setTab] = useState('rooms');
    const ActivePanel = TABS[tab];

    return (
        <div className="app">
            <header>
                <h1>Hotel Booking — Microservices Demo</h1>
                <p className="api-base">API Gateway: <code>{API_BASE_URL}</code></p>
            </header>

            <nav>
                {Object.keys(TABS).map((key) => (
                    <button key={key} className={key === tab ? 'active' : ''} onClick={() => setTab(key)}>
                        {key}
                    </button>
                ))}
            </nav>

            <main>
                <ActivePanel />
            </main>
        </div>
    );
}
