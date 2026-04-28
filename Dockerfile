# syntax=docker/dockerfile:1.7

# ---------- Stage 1: build the React frontend ----------
FROM node:20-alpine AS frontend
WORKDIR /frontend

# Install deps first for layer caching.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
# Same-origin: empty VITE_API_BASE so the SPA hits "/api/*" on the same host.
ENV VITE_API_BASE=""
RUN npm run build


# ---------- Stage 2: Python backend serving the SPA ----------
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System deps required by bcrypt / cryptography wheels (fallback if no manylinux wheel).
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Python deps — install from pyproject for reproducibility.
COPY backend/pyproject.toml backend/uv.lock* ./
RUN pip install \
        "fastapi>=0.115.0" \
        "uvicorn[standard]>=0.32.0" \
        "sqlalchemy>=2.0.36" \
        "pydantic>=2.9.0" \
        "pydantic-settings>=2.6.0" \
        "python-jose[cryptography]>=3.3.0" \
        "passlib[bcrypt]>=1.7.4" \
        "bcrypt==4.0.1" \
        "python-multipart>=0.0.12" \
        "email-validator>=2.2.0"

# Backend source.
COPY backend/app ./app

# Built frontend → /app/frontend_dist (served by FastAPI as same-origin SPA).
COPY --from=frontend /frontend/dist ./frontend_dist

# Persistent SQLite location (mount a volume here in compose / `docker run -v`).
RUN mkdir -p /data
VOLUME ["/data"]

ENV DATABASE_URL=sqlite:////data/app.db \
    FRONTEND_DIST=/app/frontend_dist \
    PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:8000/api/healthz || exit 1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
