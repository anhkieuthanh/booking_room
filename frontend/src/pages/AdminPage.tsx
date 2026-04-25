import { FormEvent, useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Room, api } from "../api";
import { useAuth } from "../auth";

interface FormState {
  name: string;
  location: string;
  capacity: string;
  description: string;
  amenities: string;
  image_url: string;
  is_active: boolean;
}

const EMPTY: FormState = {
  name: "",
  location: "",
  capacity: "4",
  description: "",
  amenities: "",
  image_url: "",
  is_active: true,
};

export default function AdminPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(() => {
    api
      .listRooms({ include_inactive: true })
      .then(setRooms)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (user && !user.is_admin) {
    return <Navigate to="/" replace />;
  }

  function startCreate() {
    setEditing(null);
    setForm(EMPTY);
  }

  function startEdit(r: Room) {
    setEditing(r);
    setForm({
      name: r.name,
      location: r.location,
      capacity: String(r.capacity),
      description: r.description,
      amenities: r.amenities,
      image_url: r.image_url,
      is_active: r.is_active,
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {
      name: form.name,
      location: form.location,
      capacity: parseInt(form.capacity, 10) || 1,
      description: form.description,
      amenities: form.amenities,
      image_url: form.image_url,
      is_active: form.is_active,
    };
    try {
      if (editing) {
        await api.updateRoom(editing.id, payload);
      } else {
        await api.createRoom(payload);
      }
      setEditing(null);
      setForm(EMPTY);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(r: Room) {
    if (!confirm(`Delete room "${r.name}"? This cancels all its bookings.`)) return;
    try {
      await api.deleteRoom(r.id);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Admin · Rooms</h1>
      <p className="text-sm text-slate-500 mb-6">Add, edit or remove meeting rooms.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {error && <div className="text-sm text-rose-600 mb-3">{error}</div>}
          <div className="card divide-y divide-slate-200">
            {rooms === null ? (
              <div className="p-4 text-sm text-slate-500">Loading…</div>
            ) : rooms.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No rooms yet.</div>
            ) : (
              rooms.map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 truncate">
                      {r.name}{" "}
                      {!r.is_active && (
                        <span className="ml-1 text-xs rounded bg-slate-200 text-slate-700 px-1.5 py-0.5">
                          inactive
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      {r.location} · seats {r.capacity}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary" onClick={() => startEdit(r)}>
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => onDelete(r)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <aside>
          <form onSubmit={onSubmit} className="card p-5 space-y-4 sticky top-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">
                {editing ? `Edit "${editing.name}"` : "New room"}
              </h2>
              {editing && (
                <button type="button" className="text-sm text-slate-500" onClick={startCreate}>
                  + new
                </button>
              )}
            </div>
            <div>
              <label className="label">Name</label>
              <input
                className="input mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                className="input mt-1"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Capacity</label>
              <input
                className="input mt-1"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input mt-1"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Amenities (comma separated)</label>
              <input
                className="input mt-1"
                value={form.amenities}
                onChange={(e) => setForm({ ...form, amenities: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Image URL</label>
              <input
                className="input mt-1"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active (bookable)
            </label>
            <button className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Create room"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
