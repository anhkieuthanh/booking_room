# Hoàng Long Group · Đặt phòng họp

Website đặt phòng họp nội bộ cho Hoàng Long Group — React + FastAPI + SQLite.

- **Backend**: FastAPI, SQLAlchemy, SQLite, JWT auth (vai trò Quản trị / Nhân viên)
- **Frontend**: React + Vite + TypeScript + TailwindCSS, giao diện tiếng Việt, màu sắc theo logo công ty
- **Tính năng**:
  - Duyệt phòng (sức chứa, vị trí, tiện nghi, ảnh)
  - Lịch ngày từng phòng, kiểm tra trùng giờ tự động
  - Trang "Lịch của tôi" cho phép huỷ
  - Trang quản trị: thêm / sửa / ngừng hoạt động / xoá phòng
  - Tự đăng ký + đăng nhập email/mật khẩu

## Tài khoản demo (đã seed sẵn)

| Vai trò    | Email                | Mật khẩu   |
| ---------- | -------------------- | ---------- |
| Quản trị   | `admin@example.com`  | `admin123` |
| Nhân viên  | `user@example.com`   | `user123`  |

## Chạy bằng Docker (khuyến nghị)

Yêu cầu: Docker + Docker Compose (Docker Desktop hoặc `docker-ce` + `docker-compose-plugin`).

```bash
docker compose up -d --build
```

Mở <http://localhost:8000>. Toàn bộ frontend + backend + SQLite được phục vụ trên cùng một cổng.

- Dữ liệu lưu vào volume `booking-data` (`/data/app.db` trong container) — `docker compose down` không làm mất dữ liệu, chỉ `docker compose down -v` mới xoá.
- API docs: <http://localhost:8000/docs>
- Đổi cổng host: sửa `ports: - "8000:8000"` trong `docker-compose.yml`.
- **Lưu ý production**: đổi `JWT_SECRET` và `SEED_ADMIN_PASSWORD` trong `docker-compose.yml`.

Dừng / khởi động lại:

```bash
docker compose stop      # dừng
docker compose start     # khởi động lại
docker compose down      # xoá container (giữ dữ liệu)
docker compose down -v   # xoá tất cả, bao gồm DB
```

Build image thủ công (không dùng compose):

```bash
docker build -t hoanglong-booking-room .
docker run -d -p 8000:8000 -v hoanglong-data:/data hoanglong-booking-room
```

## Phát triển local (không dùng Docker)

### Backend

```bash
cd backend
uv sync
DATABASE_URL=sqlite:///./app.db uv run uvicorn app.main:app --reload --port 8000
```

API docs tại <http://localhost:8000/docs>.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite proxy `/api` sang `http://127.0.0.1:8000`. Mở <http://localhost:5173>.

### Biến môi trường

Backend (`backend/.env` hoặc shell):

- `DATABASE_URL` — mặc định `sqlite:////data/app.db` (production); local set `sqlite:///./app.db`
- `JWT_SECRET` — đổi trong production
- `CORS_ORIGINS` — danh sách phân tách dấu phẩy, mặc định `*`
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`
- `FRONTEND_DIST` — đường dẫn tới `frontend/dist` để FastAPI tự phục vụ SPA cùng origin (dùng trong Docker image, không cần khi chạy dev riêng)

Frontend:

- `VITE_API_BASE` — base URL backend (vd. `https://booking-room-api.fly.dev`). Để trống = cùng origin / Vite proxy.

## Cấu trúc dự án

```
Dockerfile                # multi-stage: build frontend + chạy backend kèm SPA
docker-compose.yml        # one-shot: docker compose up -d --build
backend/
  app/
    main.py        # FastAPI + CORS + lifespan (tạo bảng, seed) + serve SPA
    config.py      # pydantic-settings
    db.py          # SQLAlchemy engine + session
    models.py      # User, Room, Booking
    schemas.py     # Pydantic v2 schemas
    security.py    # JWT, hash mật khẩu, dependencies
    seed.py        # Admin + danh sách phòng mặc định (tự đồng bộ tiếng Việt)
    routers/
      auth.py      # /api/auth/{register,login,me}
      rooms.py     # /api/rooms (admin CRUD)
      bookings.py  # /api/bookings (theo người dùng, có check trùng giờ)
frontend/
  public/
    logo.png                  # Logo Hoàng Long Group
  src/
    api.ts                    # REST client typed
    auth.tsx                  # Auth context + lưu token
    components/{Layout,RequireAuth}.tsx
    pages/{Login,Register,Rooms,RoomDetail,MyBookings,Admin}Page.tsx
    utils/datetime.ts         # locale vi-VN
  tailwind.config.js          # palette brand (xanh) + sun (vàng) + flag (đỏ)
```
