import { useEffect, useState } from 'react';
import { createRoom, getRooms, setRoomAvailability, uploadRoomImage } from '../api';

const emptyForm = {
    roomNumber: '',
    type: 'DOUBLE',
    description: '',
    pricePerNight: '',
    amenities: '',
};

export default function RoomsPanel() {
    const [rooms, setRooms] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const load = () => {
        setLoading(true);
        getRooms()
            .then(setRooms)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await createRoom({
                roomNumber: form.roomNumber,
                type: form.type,
                description: form.description,
                pricePerNight: Number(form.pricePerNight),
                amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
            });
            setForm(emptyForm);
            load();
        } catch (e) {
            setError(e.message);
        }
    };

    const toggleAvailability = async (room) => {
        try {
            await setRoomAvailability(room.id, !room.available);
            load();
        } catch (e) {
            setError(e.message);
        }
    };

    const handleImageUpload = async (room, file) => {
        if (!file) return;
        try {
            await uploadRoomImage(room.id, file);
            load();
        } catch (e) {
            setError(e.message);
        }
    };

    return (
        <section>
            <h2>Rooms (room-service &middot; MongoDB &middot; Cloud Storage)</h2>
            {error && <p className="error">{error}</p>}

            <form onSubmit={handleSubmit} className="inline-form">
                <input required placeholder="Room number" value={form.roomNumber}
                       onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} />
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {['SINGLE', 'DOUBLE', 'DELUXE', 'SUITE', 'FAMILY'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input required placeholder="Description" value={form.description}
                       onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <input required type="number" min="0" step="0.01" placeholder="Price / night" value={form.pricePerNight}
                       onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })} />
                <input placeholder="Amenities (comma separated)" value={form.amenities}
                       onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
                <button type="submit">Add room</button>
            </form>

            {loading ? <p>Loading...</p> : (
                <table>
                    <thead>
                    <tr>
                        <th>Room #</th><th>Type</th><th>Price/night</th><th>Available</th><th>Images</th><th>Upload</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rooms.map((room) => (
                        <tr key={room.id}>
                            <td>{room.roomNumber}</td>
                            <td>{room.type}</td>
                            <td>{room.pricePerNight}</td>
                            <td>
                                <button onClick={() => toggleAvailability(room)}>
                                    {room.available ? 'Available' : 'Unavailable'}
                                </button>
                            </td>
                            <td>{room.imageUrls?.length || 0}</td>
                            <td>
                                <input type="file" accept="image/*"
                                       onChange={(e) => handleImageUpload(room, e.target.files[0])} />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}
