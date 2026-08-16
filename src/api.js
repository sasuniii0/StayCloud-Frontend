// Base URL of the API Gateway (the single entry point for all backend
// microservices). Configure via a .env file — see .env.example.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function request(path, options = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: options.body instanceof FormData
            ? undefined
            : { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${options.method || 'GET'} ${path} failed: ${res.status} ${text}`);
    }

    if (res.status === 204) return null;
    return res.json();
}

// --- room-service (via gateway) ---
export const getRooms = () => request('/api/rooms');
export const getRoom = (id) => request(`/api/rooms/${id}`);
export const createRoom = (room) => request('/api/rooms', { method: 'POST', body: JSON.stringify(room) });
export const setRoomAvailability = (id, available) =>
    request(`/api/rooms/${id}/availability`, { method: 'PATCH', body: JSON.stringify({ available }) });
export const uploadRoomImage = (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return request(`/api/rooms/${id}/images`, { method: 'POST', body: form });
};

// --- reservation-service (via gateway) ---
export const getReservations = () => request('/api/reservations');
export const createReservation = (payload) =>
    request('/api/reservations', { method: 'POST', body: JSON.stringify(payload) });
export const cancelReservation = (id) => request(`/api/reservations/${id}/cancel`, { method: 'POST' });

// --- payment-service (via gateway) ---
export const getPayments = () => request('/api/payments');
export const createPayment = (payload) =>
    request('/api/payments', { method: 'POST', body: JSON.stringify(payload) });

export { API_BASE_URL };
