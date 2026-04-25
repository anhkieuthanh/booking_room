import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Booking, Room, api } from "../api";
import {
  addDays,
  fmtDate,
  fmtDateLong,
  fmtTime,
  parseNaiveIso,
  startOfDay,
  toNaiveIso,
  ymd,
} from "../utils/datetime";
import { useAuth } from "../auth";

const HOUR_START = 7;
const HOUR_END = 21;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const roomId = Number(id);

  const [room, setRoom] = useState<Room | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [date, setDate] = useState<Date>(() => startOfDay(new Date()));
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [startStr, setStartStr] = useState("");
  const [endStr, setEndStr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const dayStart = useMemo(() => startOfDay(date), [date]);
  const dayEnd = useMemo(() => addDays(dayStart, 1), [dayStart]);

  const reload = useCallback(async () => {
    if (!roomId) return;
    try {
      const [r, b] = await Promise.all([
        api.getRoom(roomId),
        api.listBookings({
          room_id: roomId,
          start: toNaiveIso(dayStart),
          end: toNaiveIso(dayEnd),
        }),
      ]);
      setRoom(r);
      setBookings(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load room");
    }
  }, [roomId, dayStart, dayEnd]);

  useEffect(() => {
    reload();
  }, [reload]);

  const segments = useMemo(() => {
    if (!bookings) return [];
    return bookings.map((b) => {
      const s = parseNaiveIso(b.start_time);
      const e = parseNaiveIso(b.end_time);
      const startMin = Math.max(0, (s.getTime() - dayStart.getTime()) / 60000);
      const endMin = Math.min(24 * 60, (e.getTime() - dayStart.getTime()) / 60000);
      const top = ((startMin - HOUR_START * 60) / ((HOUR_END - HOUR_START) * 60)) * 100;
      const height = ((endMin - startMin) / ((HOUR_END - HOUR_START) * 60)) * 100;
      return { booking: b, top, height, isMine: user?.id === b.user_id };
    });
  }, [bookings, dayStart, user]);

  function pickSlot(hour: number) {
    const s = new Date(dayStart);
    s.setHours(hour, 0, 0, 0);
    const e = new Date(s);
    e.setHours(hour + 1);
    setStartStr(toLocalInput(s));
    setEndStr(toLocalInput(e));
    setSuccess(null);
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!room) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Please choose a start and end time");
      }
      await api.createBooking({
        room_id: room.id,
        title: title.trim() || "Meeting",
        notes,
        start_time: toNaiveIso(start),
        end_time: toNaiveIso(end),
      });
      setTitle("");
      setNotes("");
      setSuccess("Booking confirmed.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onCancel(b: Booking) {
    if (!confirm(`Cancel booking "${b.title}"?`)) return;
    try {
      await api.cancelBooking(b.id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    }
  }

  if (!room && !error) return <div className="text-sm text-slate-500">Loading room…</div>;
  if (error && !room) return <div className="text-sm text-rose-600">{error}</div>;
  if (!room) return null;

  return (
    <div>
      <div className="mb-4">
        <Link to="/" className="text-sm text-brand-700 hover:underline">
          ← All rooms
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="aspect-[16/7] bg-slate-100">
              {room.image_url && (
                <img src={room.image_url} alt={room.name} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">{room.name}</h1>
                <span className="text-sm rounded-full bg-slate-100 text-slate-700 px-3 py-1">
                  Seats {room.capacity}
                </span>
              </div>
              <div className="text-slate-500 mt-1">{room.location}</div>
              {room.description && <p className="mt-3 text-slate-700">{room.description}</p>}
              {room.amenities && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {room.amenities
                    .split(",")
                    .map((a) => a.trim())
                    .filter(Boolean)
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
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">{fmtDateLong(dayStart)}</h2>
              <div className="flex items-center gap-2">
                <button className="btn-secondary" onClick={() => setDate(addDays(date, -1))}>
                  ←
                </button>
                <input
                  className="input w-44"
                  type="date"
                  value={ymd(dayStart)}
                  onChange={(e) => {
                    if (e.target.value) setDate(new Date(e.target.value + "T00:00:00"));
                  }}
                />
                <button className="btn-secondary" onClick={() => setDate(addDays(date, 1))}>
                  →
                </button>
              </div>
            </div>

            <div className="relative grid grid-cols-[60px_1fr] border-t border-slate-200">
              <div>
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="h-12 text-xs text-slate-500 pr-2 text-right border-b border-slate-100"
                  >
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>
              <div className="relative border-l border-slate-200">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className="block w-full h-12 border-b border-slate-100 hover:bg-brand-50/50 text-left"
                    onClick={() => pickSlot(h)}
                    aria-label={`Book at ${h}:00`}
                  />
                ))}
                {segments.map(({ booking, top, height, isMine }) => (
                  <div
                    key={booking.id}
                    className={`absolute left-1 right-1 rounded-md px-2 py-1 text-xs shadow-sm ${
                      isMine
                        ? "bg-brand-600 text-white"
                        : "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
                    }`}
                    style={{ top: `${top}%`, height: `${Math.max(height, 4)}%` }}
                    title={`${booking.title} · ${booking.user.name}`}
                  >
                    <div className="font-medium truncate">{booking.title}</div>
                    <div className="opacity-90 truncate">
                      {fmtTime(parseNaiveIso(booking.start_time))} –{" "}
                      {fmtTime(parseNaiveIso(booking.end_time))} · {booking.user.name}
                    </div>
                    {isMine && (
                      <button
                        type="button"
                        onClick={() => onCancel(booking)}
                        className="absolute top-1 right-1 text-[10px] underline"
                      >
                        cancel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-brand-600" /> Your booking
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-rose-100 ring-1 ring-rose-200" />{" "}
                Booked
              </span>
              <span>Click a free slot to pre-fill the booking form.</span>
            </div>
          </div>
        </div>

        <aside>
          <form onSubmit={onSubmit} className="card p-5 space-y-4 sticky top-4">
            <h2 className="font-semibold text-slate-900">Reserve {room.name}</h2>
            <div>
              <label className="label">Title</label>
              <input
                className="input mt-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sprint planning"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start</label>
                <input
                  className="input mt-1"
                  type="datetime-local"
                  value={startStr}
                  onChange={(e) => setStartStr(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">End</label>
                <input
                  className="input mt-1"
                  type="datetime-local"
                  value={endStr}
                  onChange={(e) => setEndStr(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea
                className="input mt-1"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            {error && <div className="text-sm text-rose-600">{error}</div>}
            {success && <div className="text-sm text-emerald-700">{success}</div>}
            <button className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Booking…" : "Confirm booking"}
            </button>
            <p className="text-xs text-slate-500">
              Showing availability for {fmtDate(dayStart)}.
            </p>
          </form>
        </aside>
      </div>
    </div>
  );
}

function toLocalInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
}
