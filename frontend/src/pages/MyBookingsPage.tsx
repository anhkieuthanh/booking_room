import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Booking, api } from "../api";
import { fmtDate, fmtTime, parseNaiveIso } from "../utils/datetime";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    api
      .listBookings({ mine: true })
      .then(setBookings)
      .catch((e) => setError(e instanceof Error ? e.message : "Không tải được dữ liệu"));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function cancel(b: Booking) {
    if (!confirm(`Huỷ đặt phòng "${b.title}"?`)) return;
    try {
      await api.cancelBooking(b.id);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Huỷ thất bại");
    }
  }

  const now = Date.now();
  const upcoming = (bookings ?? []).filter((b) => parseNaiveIso(b.end_time).getTime() >= now);
  const past = (bookings ?? []).filter((b) => parseNaiveIso(b.end_time).getTime() < now);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Lịch của tôi</h1>
      <p className="text-sm text-slate-500 mb-6">Tất cả các cuộc họp bạn đã đặt.</p>

      {error && <div className="text-sm text-flag-600 mb-4">{error}</div>}
      {bookings === null && !error && <div className="text-sm text-slate-500">Đang tải…</div>}

      {bookings !== null && bookings.length === 0 && (
        <div className="card p-8 text-center text-slate-500">
          Bạn chưa có lịch đặt phòng nào.{" "}
          <Link to="/" className="text-brand-700 hover:underline">
            Đặt phòng ngay
          </Link>
          .
        </div>
      )}

      {upcoming.length > 0 && (
        <Section title="Sắp diễn ra" bookings={upcoming} onCancel={cancel} canCancel />
      )}
      {past.length > 0 && <Section title="Đã kết thúc" bookings={past} muted />}
    </div>
  );
}

function Section({
  title,
  bookings,
  onCancel,
  canCancel = false,
  muted = false,
}: {
  title: string;
  bookings: Booking[];
  onCancel?: (b: Booking) => void;
  canCancel?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">
        {title}
      </h2>
      <div className="card divide-y divide-slate-200">
        {bookings.map((b) => {
          const s = parseNaiveIso(b.start_time);
          const e = parseNaiveIso(b.end_time);
          return (
            <div
              key={b.id}
              className={`p-4 flex flex-wrap items-center justify-between gap-3 ${
                muted ? "opacity-70" : ""
              }`}
            >
              <div>
                <div className="font-medium text-slate-900">{b.title}</div>
                <div className="text-sm text-slate-500">
                  {b.room.name} · {b.room.location}
                </div>
              </div>
              <div className="text-sm text-slate-700 text-right">
                <div>{fmtDate(s)}</div>
                <div className="text-slate-500">
                  {fmtTime(s)} – {fmtTime(e)}
                </div>
              </div>
              {canCancel && onCancel && (
                <button className="btn-danger" onClick={() => onCancel(b)}>
                  Huỷ
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
