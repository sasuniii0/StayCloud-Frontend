import { useEffect, useState } from 'react';
import { createRoom, deleteRoom, getRooms, setRoomAvailability, uploadRoomImage } from '../api';

const emptyForm = {
  roomNumber: '',
  type: 'DOUBLE',
  description: '',
  pricePerNight: '',
};

const TYPE_LABEL = {
  SINGLE: 'Single',
  DOUBLE: 'Double',
  DELUXE: 'Deluxe',
  SUITE: 'Suite',
  FAMILY: 'Family',
};

function money(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(n) || 0);
}

export default function RoomsPanel() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getRooms()
      .then(setRooms)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const clearImage = () => {
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setFileInputKey((k) => k + 1);
  };

  const onPickImage = (file) => {
    if (!file) {
      clearImage();
      return;
    }
    setImageFile(file);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!imageFile) {
      setError('Please choose a room picture before saving.');
      return;
    }
    setSaving(true);
    try {
      const created = await createRoom({
        roomNumber: form.roomNumber,
        type: form.type,
        description: form.description,
        pricePerNight: Number(form.pricePerNight),
      });
      if (!created?.id) {
        throw new Error('Room was created but no id was returned for image upload.');
      }
      await uploadRoomImage(created.id, imageFile);
      setForm(emptyForm);
      clearImage();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (room) => {
    try {
      await setRoomAvailability(room.id, !room.available);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await deleteRoom(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const onChangePhoto = async (room, file) => {
    if (!file) return;
    try {
      await uploadRoomImage(room.id, file);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Rooms</h2>
          <p>Add a room with its picture in one step. Photos are stored in cloud storage.</p>
        </div>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="form-shell">
        <h3>Add room</h3>
        <form onSubmit={handleSubmit} className="inline-form">
          <label className="field">
            <span>Room number</span>
            <input
              required
              placeholder="101"
              value={form.roomNumber}
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Category</span>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field field-wide">
            <span>Description</span>
            <input
              required
              placeholder="Quiet garden view"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Nightly rate</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="120"
              value={form.pricePerNight}
              onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })}
            />
          </label>
          <label className="field field-wide">
            <span>Room picture</span>
            <input
              key={fileInputKey}
              required
              type="file"
              accept="image/*"
              onChange={(e) => onPickImage(e.target.files?.[0])}
            />
            {imagePreview ? (
              <img className="thumb form-thumb" src={imagePreview} alt="Selected room" />
            ) : (
              <span className="subtle">Choose an image — it uploads when you save</span>
            )}
          </label>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Add room'}
          </button>
        </form>
      </div>

      {loading ? (
        <p className="muted">Loading rooms…</p>
      ) : rooms.length === 0 ? (
        <div className="empty">
          <strong>No rooms yet</strong>
          <p>Add your first room (with a picture) to start taking bookings.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Room</th>
                <th>Category</th>
                <th>Rate</th>
                <th>Availability</th>
                <th>Photo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>
                    <div className="cell-stack">
                      <strong>#{room.roomNumber}</strong>
                      <span className="subtle">{room.description}</span>
                    </div>
                  </td>
                  <td>{TYPE_LABEL[room.type] || room.type}</td>
                  <td className="money">{money(room.pricePerNight)}</td>
                  <td>
                    <button
                      type="button"
                      className={`btn btn-sm ${room.available ? 'btn-ghost' : 'btn-danger'}`}
                      onClick={() => toggleAvailability(room)}
                    >
                      {room.available ? 'Available' : 'Unavailable'}
                    </button>
                  </td>
                  <td>
                    {room.imageUrls?.[0] ? (
                      <img className="thumb" src={room.imageUrls[0]} alt={`Room ${room.roomNumber}`} />
                    ) : (
                      <span className="subtle">No photo</span>
                    )}
                    <label className="file-btn" style={{ display: 'block', marginTop: '0.35rem' }}>
                      Change
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onChangePhoto(room, e.target.files?.[0])}
                      />
                    </label>
                  </td>
                  <td>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(room.id)}>
                      Delete
                    </button>
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
