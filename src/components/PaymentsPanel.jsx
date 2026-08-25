import { useEffect, useState } from 'react';
import { createPayment, getPayments, getReservations } from '../api';

function money(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n) || 0);
}

const METHOD_LABEL = {
  CARD: 'Card',
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank transfer',
};

export default function PaymentsPanel() {
  const [payments, setPayments] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reservationId, setReservationId] = useState('');
  const [method, setMethod] = useState('CARD');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const selected = reservations.find((r) => String(r.id) === String(reservationId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createPayment({
        reservationId: Number(reservationId),
        amount: Number(selected?.totalAmount || 0),
        method,
        status: 'PAID',
      });
      setReservationId('');
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Payments</h2>
          <p>Collect payment for a confirmed booking.</p>
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="form-shell">
        <h3>Collect payment</h3>
        <form onSubmit={handleSubmit} className="inline-form">
          <label className="field field-wide">
            <span>Booking</span>
            <select required value={reservationId} onChange={(e) => setReservationId(e.target.value)}>
              <option value="" disabled>
                Choose a confirmed booking
              </option>
              {reservations
                .filter((r) => r.status === 'CONFIRMED')
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.guestName} · {money(r.totalAmount)}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            <span>Payment method</span>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              {Object.entries(METHOD_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn-primary" disabled={saving || !selected}>
            {saving ? 'Processing…' : selected ? `Pay ${money(selected.totalAmount)}` : 'Collect payment'}
          </button>
        </form>
      </div>

      {loading ? (
        <p className="muted">Loading payments…</p>
      ) : payments.length === 0 ? (
        <div className="empty">
          <strong>No payments yet</strong>
          <p>Payments appear here after you collect them.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Booking</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const booking = reservations.find((r) => String(r.id) === String(p.reservationId));
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-stack">
                        <strong>{booking?.guestName || `Booking #${p.reservationId}`}</strong>
                        <span className="subtle">#{p.reservationId}</span>
                      </div>
                    </td>
                    <td className="money">{money(p.amount)}</td>
                    <td>{METHOD_LABEL[p.method] || p.method}</td>
                    <td>
                      <span className="badge badge-ok">Paid</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
