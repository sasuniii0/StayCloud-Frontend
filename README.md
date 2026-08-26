# Hotel Booking — Frontend

> **Student Name:** Sasuni Wijerathne

## Project Description

A minimal React single-page app for the ITS 2130 Enterprise Cloud
Architecture final project. It exists to **demonstrate that every backend
microservice is reachable and working** through the API Gateway — it is
deliberately unstyled beyond basic readability, since UI design is not part
of the grading criteria for this module.

It talks to the [API Gateway](https://github.com/sasuniii0/backend-platform)
only (never a service directly), which routes each request to the right
microservice via Eureka:

- **Rooms** tab → `room-service` (MongoDB) — list/create rooms, toggle
  availability, upload a room image straight to a Cloud Storage bucket
- **Reservations** tab → `reservation-service` (PostgreSQL) — book/cancel a
  stay for an available room (cross-service call to `room-service`)
- **Payments** tab → `payment-service` (PostgreSQL) — pay for a confirmed
  reservation (cross-service call to `reservation-service`)

## Technology Stack

- React 19 + Vite
- Plain `fetch` against the API Gateway (`src/api.js`) — no extra HTTP/state
  libraries
- Deployed as a static site (PaaS/serverless), per the module's required
  deployment model for the frontend

## Setup / Getting Started

```bash
npm install
cp .env.example .env      # set VITE_API_BASE_URL to your gateway's URL
npm run dev                # http://localhost:5173
```

### Production build

```bash
npm run build    # outputs static files to dist/
npm run preview  # serve the production build locally
```

### Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the deployed API Gateway | `http://localhost:8080` |

`VITE_API_BASE_URL` is baked in at **build time** — set it in your hosting
provider's build configuration (e.g. Firebase Hosting / Cloud Run build
step) before deploying, not just in a local `.env` file.
