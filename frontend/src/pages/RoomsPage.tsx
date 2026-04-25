import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Room, api } from "../api";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [minCap, setMinCap] = useState("");

  useEffect(() => {
    api
      .listRooms()
      .then(setRooms)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load rooms"));
  }, []);

  const filtered = useMemo(() => {
    if (!rooms) return [];
    const q = query.trim().toLowerCase();
    const min = parseInt(minCap, 10);
    return rooms.filter((r) => {
      if (!isNaN(min) && r.capacity < min) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.amenities.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    });
  }, [rooms, query, minCap]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Meeting rooms</h1>
          <p className="text-sm text-slate-500">Pick a room and reserve a time slot.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            className="input md:w-64"
            placeholder="Search rooms, amenities…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            className="input w-32"
            placeholder="Min capacity"
            type="number"
            min={1}
            value={minCap}
            onChange={(e) => setMinCap(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="text-sm text-rose-600 mb-4">{error}</div>}
      {rooms === null && !error && <div className="text-sm text-slate-500">Loading rooms…</div>}

      {rooms !== null && filtered.length === 0 && (
        <div className="card p-8 text-center text-slate-500">No rooms match your filters.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((r) => (
          <Link
            to={`/rooms/${r.id}`}
            key={r.id}
            className="card overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="aspect-[16/10] bg-slate-100">
              {r.image_url ? (
                <img
                  src={r.image_url}
                  alt={r.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-slate-400 text-sm">
                  No image
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{r.name}</h3>
                <span className="text-xs rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">
                  Seats {r.capacity}
                </span>
              </div>
              <div className="text-sm text-slate-500 mt-1">{r.location || "—"}</div>
              {r.amenities && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.amenities
                    .split(",")
                    .map((a) => a.trim())
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((a) => (
                      <span
                        key={a}
                        className="text-xs rounded bg-brand-50 text-brand-700 px-2 py-0.5"
                      >
                        {a}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
