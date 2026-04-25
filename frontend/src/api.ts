export const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") || "";

export interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
}

export interface Room {
  id: number;
  name: string;
  location: string;
  capacity: number;
  description: string;
  amenities: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: number;
  room_id: number;
  user_id: number;
  title: string;
  notes: string;
  start_time: string;
  end_time: string;
  created_at: string;
  room: Room;
  user: User;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.json);
  }
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // ignore
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // auth
  login: (email: string, password: string) =>
    request<TokenResponse>("/api/auth/login", {
      method: "POST",
      json: { email, password },
    }),
  register: (email: string, name: string, password: string) =>
    request<TokenResponse>("/api/auth/register", {
      method: "POST",
      json: { email, name, password },
    }),
  me: () => request<User>("/api/auth/me"),

  // rooms
  listRooms: (opts: { include_inactive?: boolean; min_capacity?: number } = {}) => {
    const params = new URLSearchParams();
    if (opts.include_inactive) params.set("include_inactive", "true");
    if (opts.min_capacity != null) params.set("min_capacity", String(opts.min_capacity));
    const qs = params.toString();
    return request<Room[]>(`/api/rooms${qs ? `?${qs}` : ""}`);
  },
  getRoom: (id: number) => request<Room>(`/api/rooms/${id}`),
  createRoom: (data: Partial<Room>) =>
    request<Room>(`/api/rooms`, { method: "POST", json: data }),
  updateRoom: (id: number, data: Partial<Room>) =>
    request<Room>(`/api/rooms/${id}`, { method: "PATCH", json: data }),
  deleteRoom: (id: number) =>
    request<void>(`/api/rooms/${id}`, { method: "DELETE" }),

  // bookings
  listBookings: (opts: { mine?: boolean; room_id?: number; start?: string; end?: string } = {}) => {
    const params = new URLSearchParams();
    if (opts.mine) params.set("mine", "true");
    if (opts.room_id != null) params.set("room_id", String(opts.room_id));
    if (opts.start) params.set("start", opts.start);
    if (opts.end) params.set("end", opts.end);
    const qs = params.toString();
    return request<Booking[]>(`/api/bookings${qs ? `?${qs}` : ""}`);
  },
  createBooking: (data: {
    room_id: number;
    title: string;
    notes?: string;
    start_time: string;
    end_time: string;
  }) => request<Booking>(`/api/bookings`, { method: "POST", json: data }),
  cancelBooking: (id: number) =>
    request<void>(`/api/bookings/${id}`, { method: "DELETE" }),
};

export { ApiError };
