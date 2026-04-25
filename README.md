# Meridian Rooms

Internal meeting room booking website with React + FastAPI + SQLite.

- **Backend**: FastAPI, SQLAlchemy, SQLite, JWT auth (admin / employee roles)
- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Features**:
  - Browse rooms (capacity, location, amenities, photos)
  - Day calendar per room with conflict-checked bookings
  - "My bookings" page with cancel
  - Admin panel to create / edit / deactivate / delete rooms
  - Self-service signup + email/password login

## Demo accounts (seeded)

| Role     | Email                | Password   |
| -------- | -------------------- | ---------- |
| Admin    | `admin@example.com`  | `admin123` |
| Employee | `user@example.com`   | `user123`  |

## Local development

### Backend

```bash
cd backend
uv sync
DATABASE_URL=sqlite:///./app.db uv run uvicorn app.main:app --reload --port 8000
```

API docs at <http://localhost:8000/docs>.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to `http://127.0.0.1:8000`.
Visit <http://localhost:5173>.

### Environment variables

Backend (`backend/.env` or shell):

- `DATABASE_URL` — defaults to `sqlite:////data/app.db` (used in production); set to `sqlite:///./app.db` locally
- `JWT_SECRET` — change in production
- `CORS_ORIGINS` — comma-separated list, defaults to `*`
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`

Frontend:

- `VITE_API_BASE` — base URL of the backend (e.g. `https://booking-room-api.fly.dev`). Empty string uses same origin / Vite proxy.

## Project structure

```
backend/
  app/
    main.py        # FastAPI app + CORS + lifespan (creates tables, seeds data)
    config.py      # pydantic-settings
    db.py          # SQLAlchemy engine + session
    models.py      # User, Room, Booking
    schemas.py     # Pydantic v2 schemas
    security.py    # JWT, password hashing, dependencies
    seed.py        # Initial admin + sample rooms
    routers/
      auth.py      # /api/auth/{register,login,me}
      rooms.py     # /api/rooms (admin CRUD)
      bookings.py  # /api/bookings (per-user, with conflict check)
frontend/
  src/
    api.ts                    # Typed REST client
    auth.tsx                  # Auth context + token storage
    components/{Layout,RequireAuth}.tsx
    pages/{Login,Register,Rooms,RoomDetail,MyBookings,Admin}Page.tsx
    utils/datetime.ts
```
