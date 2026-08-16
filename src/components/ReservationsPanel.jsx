import { useEffect, useState } from 'react';
import { cancelReservation, createReservation, getReservations, getRooms } from '../api';

const emptyForm = {
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    roomId: '',
    checkInDate: '',
    checkOutDate: '',
    numberOfGuests: 1,
};

export default function ReservationsPanel() {
    const [reservations, setReservations] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const load = () => {
        setLoading(true);
        Promise.all([getReservations(), getRooms()])
            .then(([res, rms]) => {
                setReservations(res);
                setRooms(rms);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await createReservation({
                ...form,
                numberOfGuests: Number(form.numberOfGuests),
            });
            setForm(emptyForm);
            load();
        } catch (e) {
            setError(e.message);
        }
    };

    const handleCancel = async (id) => {
        try {
            await cancelReservation(id);
            load();
        } catch (e) {
            setError(e.message);
        }
    };

    return (
        <section>
            <h2>Reservations (reservation-service &middot; PostgreSQL &middot; calls room-service)</h2>
            {error && <p className="error">{error}</p>}

            <form onSubmit={handleSubmit} className="inline-form">
                <input required placeholder="Guest name" value={form.guestName}
                       onChange={(e) => setForm({ ...form, guestName: e.target.value })} />
                <input required type="email" placeholder="Guest email" value={form.guestEmail}
                       onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} />
                <input placeholder="Guest phone" value={form.guestPhone}
                       onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} />
                <select required value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>
                    <option value="" disabled>Select room</option>
                    {rooms.filter((r) => r.available).map((r) => (
                        <option key={r.id} value={r.id}>{r.roomNumber} ({r.type})</option>
                    ))}
                </select>
                <input required type="date" value={form.checkInDate}
                       onChange={(e) => setForm({ ...form, checkInDate: e.target.value })} />
                <input required type="date" value={form.checkOutDate}
                       onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })} />
                <input required type="number" min="1" placeholder="Guests" value={form.numberOfGuests}
                       onChange={(e) => setForm({ ...form, numberOfGuests: e.target.value })} />
                <button type="submit">Book</button>
            </form>

            {loading ? <p>Loading...</p> : (
                <table>
                    <thead>
                    <tr>
                        <th>ID</th><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th>
                        <th>Total</th><th>Status</th><th></th>
                    </tr>
                    </thead>
                    <tbody>
                    {reservations.map((r) => (
                        <tr key={r.id}>
                            <td>{r.id}</td>
                            <td>{r.guestName}</td>
                            <td>{r.roomId}</td>
                            <td>{r.checkInDate}</td>
                            <td>{r.checkOutDate}</td>
                            <td>{r.totalAmount}</td>
                            <td>{r.status}</td>
                            <td>
                                {r.status === 'CONFIRMED' && (
                                    <button onClick={() => handleCancel(r.id)}>Cancel</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}
