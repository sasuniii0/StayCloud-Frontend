import { useEffect, useState } from 'react';
import { createPayment, getPayments, getReservations } from '../api';

export default function PaymentsPanel() {
    const [payments, setPayments] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [reservationId, setReservationId] = useState('');
    const [method, setMethod] = useState('CARD');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const load = () => {
        setLoading(true);
        Promise.all([getPayments(), getReservations()])
            .then(([pays, res]) => {
                setPayments(pays);
                setReservations(res);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await createPayment({ reservationId: Number(reservationId), method });
            setReservationId('');
            load();
        } catch (e) {
            setError(e.message);
        }
    };

    return (
        <section>
            <h2>Payments (payment-service &middot; PostgreSQL &middot; calls reservation-service)</h2>
            {error && <p className="error">{error}</p>}

            <form onSubmit={handleSubmit} className="inline-form">
                <select required value={reservationId} onChange={(e) => setReservationId(e.target.value)}>
                    <option value="" disabled>Select reservation</option>
                    {reservations.filter((r) => r.status === 'CONFIRMED').map((r) => (
                        <option key={r.id} value={r.id}>#{r.id} — {r.guestName} — {r.totalAmount}</option>
                    ))}
                </select>
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                    {['CARD', 'CASH', 'BANK_TRANSFER'].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <button type="submit">Pay</button>
            </form>

            {loading ? <p>Loading...</p> : (
                <table>
                    <thead>
                    <tr><th>ID</th><th>Reservation</th><th>Amount</th><th>Method</th><th>Status</th><th>Ref</th></tr>
                    </thead>
                    <tbody>
                    {payments.map((p) => (
                        <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{p.reservationId}</td>
                            <td>{p.amount}</td>
                            <td>{p.method}</td>
                            <td>{p.status}</td>
                            <td>{p.transactionRef}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}
