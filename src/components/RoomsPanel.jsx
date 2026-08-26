import { useEffect, useRef, useState } from 'react';
import {
  API_BASE_URL,
  createRoom,
  deleteRoom,
  getRooms,
  setRoomAvailability,
  uploadRoomImage,
} from '../api';

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
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(Number(n) || 0);
}

/** Photos are private in GCS — load them through the API gateway. */
function photoUrl(room) {
  if (!room?.id || !room.imageUrls?.length) return '';
  const stamp = encodeURIComponent(String(room.imageUrls[0]));
  return `${API_BASE_URL}/api/rooms/${room.id}/photo?v=${stamp}`;
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
  const fileRef = useRef(null);

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
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    setError('');
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
      setError('Choose a room photo before saving.');
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
        throw new Error('Room saved but no id returned for photo upload.');
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

  const changePhoto = async (room, file) => {
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
        <h2>Rooms</h2>
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

          <div className="field field-wide">
            <span>Photo</span>
            <div
              className={`photo-drop${imagePreview ? ' has-image' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onPickImage(e.dataTransfer.files?.[0]);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileRef.current?.click();
                }
              }}
            >
              <input
                key={fileInputKey}
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onPickImage(e.target.files?.[0])}
              />
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Selected room" />
                  <div className="photo-drop-meta">
                    <strong>{imageFile?.name}</strong>
                    <span>Click or drop to replace</span>
                  </div>
                </>
              ) : (
                <div className="photo-drop-meta">
                  <strong>Add room photo</strong>
                  <span>Click or drag an image here</span>
                </div>
              )}
            </div>
            {imagePreview && (
              <button
                type="button"
                className="btn btn-sm btn-ghost photo-clear"
                onClick={(e) => {
                  e.stopPropagation();
                  clearImage();
                }}
              >
                Remove photo
              </button>
            )}
          </div>

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
          <p>Add a room to start taking bookings.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Room</th>
                <th>Category</th>
                <th>Rate</th>
                <th>Availability</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => {
                const photo = photoUrl(room);
                return (
                  <tr key={room.id}>
                    <td>
                      <div className="photo-cell">
                        {photo ? (
                          <img className="thumb-lg" src={photo} alt={`Room ${room.roomNumber}`} />
                        ) : (
                          <div className="thumb-lg thumb-empty">No photo</div>
                        )}
                        <label className="file-btn">
                          {photo ? 'Change' : 'Add'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => changePhoto(room, e.target.files?.[0])}
                          />
                        </label>
                      </div>
                    </td>
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
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => remove(room.id)}
                      >
                        Delete
                      </button>
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
