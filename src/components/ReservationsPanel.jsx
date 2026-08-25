import { useEffect, useState } from 'react';
import {
  cancelReservation,
  createReservation,
  getReservations,
  getRooms,
  setRoomAvailability,
} from '../api';

const emptyForm = {
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  roomId: '',
  checkInDate: '',
  checkOutDate: '',
  numberOfGuests: 1,
};

function money(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n) || 0);
}

function nightsBetween(checkIn, checkOut) {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const ms = b - a;
  if (Number.isNaN(ms) || ms <= 0) return 1;
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function prettyDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ReservationsPanel() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const roomLabel = (roomId) => {
    const room = rooms.find((r) => String(r.id) === String(roomId));
    return room ? `#${room.roomNumber}` : roomId;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const room = rooms.find((r) => String(r.id) === String(form.roomId));
      const nights = nightsBetween(form.checkInDate, form.checkOutDate);
      const totalAmount = (room?.pricePerNight || 0) * nights;

      await createReservation({
        ...form,
        numberOfGuests: Number(form.numberOfGuests),
        totalAmount,
        status: 'CONFIRMED',
      });

      if (room?.id) {
        await setRoomAvailability(room.id, false);
      }

      setForm(emptyForm);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (reservation) => {
    try {
      await cancelReservation(reservation.id);
      if (reservation.roomId) {
        await setRoomAvailability(reservation.roomId, true);
      }
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Bookings</h2>
          <p>Reserve an available room for your guest.</p>
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="form-shell">
        <h3>New booking</h3>
        <form onSubmit={handleSubmit} className="inline-form">
          <label className="field">
            <span>Guest name</span>
            <input
              required
              placeholder="Alex Rivera"
              value={form.guestName}
              onChange={(e) => setForm({ ...form, guestName: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              required
              type="email"
              placeholder="alex@email.com"
              value={form.guestEmail}
              onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Phone</span>
            <input
              placeholder="Optional"
              value={form.guestPhone}
              onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Room</span>
            <select
              required
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
            >
              <option value="" disabled>
                Choose an available room
              </option>
              {rooms
                .filter((r) => r.available)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    #{r.roomNumber} · {money(r.pricePerNight)}/night
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            <span>Check-in</span>
            <input
              required
              type="date"
              value={form.checkInDate}
              onChange={(e) => setForm({ ...form, checkInDate: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Check-out</span>
            <input
              required
              type="date"
              value={form.checkOutDate}
              onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Guests</span>
            <input
              required
              type="number"
              min="1"
              value={form.numberOfGuests}
              onChange={(e) => setForm({ ...form, numberOfGuests: e.target.value })}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Booking…' : 'Confirm booking'}
          </button>
        </form>
      </div>

      {loading ? (
        <p className="muted">Loading bookings…</p>
      ) : reservations.length === 0 ? (
        <div className="empty">
          <strong>No bookings yet</strong>
          <p>Confirm a stay when a guest is ready.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Room</th>
                <th>Stay</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="cell-stack">
                      <strong>{r.guestName}</strong>
                      <span className="subtle">{r.guestEmail}</span>
                    </div>
                  </td>
                  <td>{roomLabel(r.roomId)}</td>
                  <td>
                    <div className="cell-stack">
                      <span>{prettyDate(r.checkInDate)}</span>
                      <span className="subtle">to {prettyDate(r.checkOutDate)}</span>
                    </div>
                  </td>
                  <td className="money">{money(r.totalAmount)}</td>
                  <td>
                    <span className={`badge ${r.status === 'CONFIRMED' ? 'badge-ok' : 'badge-off'}`}>
                      {r.status === 'CONFIRMED' ? 'Confirmed' : 'Cancelled'}
                    </span>
                  </td>
                  <td>
                    {r.status === 'CONFIRMED' && (
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => handleCancel(r)}>
                        Cancel stay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
