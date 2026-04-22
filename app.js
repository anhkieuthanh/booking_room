const SLOT_MINUTES = 30;
const START_HOUR = 8;
const END_HOUR = 17;
const today = new Date();
const currentWeekStart = startOfWeek(today);
const nextWeekStart = addDays(currentWeekStart, 7);
const todayKey = toDateKey(today);

const roomConfigs = [
  {
    id: "dashboard-1",
    dashboardTitle: "Dashboard phòng 1",
    roomName: "Phòng họp 1",
    location: "Tầng 12",
  },
  {
    id: "dashboard-2",
    dashboardTitle: "Dashboard phòng 2",
    roomName: "Phòng họp 2",
    location: "Tầng 8",
  },
];

const rooms = roomConfigs.map((config, index) => {
  const schedule = {};
  const weekDates = [...weekDatesFor(currentWeekStart), ...weekDatesFor(nextWeekStart)];

  weekDates.forEach((dateKey) => {
    schedule[dateKey] = generateInitialBookings(config.id, dateKey, index);
  });

  return {
    ...config,
    capacity: index === 0 ? 12 : 8,
    schedule,
    selectedDate: null,
    expanded: index === 0,
    formStartTime: "",
    formEndTime: "",
  };
});

const root = document.getElementById("dashboard-root");

document.addEventListener("DOMContentLoaded", () => {
  render();
});

function render() {
  root.innerHTML = rooms.map((room) => renderDashboard(room)).join("");
  bindDashboardEvents();
}

function renderDashboard(room) {
  const currentWeek = weekDatesFor(currentWeekStart);
  const nextWeek = weekDatesFor(nextWeekStart);
  const selectedDate = room.selectedDate;
  const selectedBookings = selectedDate ? room.schedule[selectedDate] || [] : [];
  const selectedAvailability = selectedDate ? getDayAvailability(room, selectedDate) : [];
  const selectedStatus = selectedDate ? getDayStatus(room, selectedDate) : "idle";
  const availableStarts = selectedDate ? getAvailableStartTimes(room, selectedDate) : [];
  const selectedStartTime = room.formStartTime || "";
  const availableEnds = selectedDate && selectedStartTime ? getAvailableEndTimes(room, selectedDate, selectedStartTime) : [];
  const selectedEndTime = availableEnds.includes(room.formEndTime) ? room.formEndTime : "";
  const hasBookableWindow = selectedDate && selectedStatus !== "full" && availableStarts.length > 0;
  const computedDuration = selectedStartTime && selectedEndTime ? toMinutes(selectedEndTime) - toMinutes(selectedStartTime) : null;

  return `
    <article class="dashboard panel ${room.expanded ? "is-open" : ""}" data-room-id="${room.id}">
      <button class="dashboard-header" type="button" data-action="toggle-dashboard" aria-expanded="${room.expanded}">
        <div class="dashboard-title">
          <p class="eyebrow">${room.dashboardTitle}</p>
          <h2>${room.roomName}</h2>
          <p class="dashboard-subtitle">${room.location} · ${room.capacity} chỗ ngồi</p>
        </div>
        <div class="dashboard-head-meta">
          <span class="pill pill-blue">${countTotalBookings(room)} lịch</span>
          <span class="pill pill-neutral">${room.expanded ? "Đang mở" : "Bấm để xem"}</span>
        </div>
      </button>

      ${
        room.expanded
          ? `
            <div class="dashboard-body">
              <div class="weeks-grid">
                <section class="week-panel">
                  <div class="section-heading">
                    <div>
                      <p class="eyebrow">Tuần hiện tại</p>
                      <h3>${formatWeekRange(currentWeek)}</h3>
                    </div>
                  </div>
                  <div class="day-grid">
                    ${renderWeekDays(room, currentWeek)}
                  </div>
                </section>

                <section class="week-panel">
                  <div class="section-heading">
                    <div>
                      <p class="eyebrow">Tuần tới</p>
                      <h3>${formatWeekRange(nextWeek)}</h3>
                    </div>
                  </div>
                  <div class="day-grid">
                    ${renderWeekDays(room, nextWeek)}
                  </div>
                </section>
              </div>

              ${
                selectedDate
                  ? `
                    <div class="detail-grid">
                      <section class="detail-panel">
                        <div class="section-heading">
                          <div>
                            <p class="eyebrow">Ngày đã chọn</p>
                            <h3>${formatLongDate(selectedDate)}</h3>
                          </div>
                          <span class="pill ${statusPillClass(selectedStatus)}">${statusLabel(selectedStatus)}</span>
                        </div>

                        <div class="day-summary">
                          <div class="summary-item">
                            <span>Trạng thái</span>
                            <strong>${dayStatusText(selectedStatus, selectedAvailability)}</strong>
                          </div>
                          <div class="summary-item">
                            <span>Khung giờ trống</span>
                            <strong>${availableStarts.length}</strong>
                          </div>
                        </div>

                        <div class="agenda-list">
                          ${
                            selectedBookings.length
                              ? selectedBookings
                                  .map(
                                    (booking) => `
                                      <div class="agenda-item">
                                        <strong>${booking.start} - ${booking.end}</strong>
                                        <span>${escapeHtml(booking.person)}</span>
                                        <p>${escapeHtml(booking.purpose)}</p>
                                      </div>
                                    `
                                  )
                                  .join("")
                              : `<p class="empty-note">Ngày này chưa có buổi họp nào.</p>`
                          }
                        </div>
                      </section>

                      <section class="detail-panel">
                        <div class="section-heading">
                          <div>
                            <p class="eyebrow">Đặt lịch</p>
                            <h3>Thông tin buổi họp</h3>
                          </div>
                        </div>

                        ${
                          hasBookableWindow
                            ? `
                              <form class="booking-form" data-action="book" data-room-id="${room.id}">
                                <input type="hidden" name="date" value="${selectedDate}" />

                                <label class="field">
                                  <span>Thời gian dùng phòng</span>
                                  <div class="inline-grid time-grid">
                                    <select name="startTime">
                                      ${renderStartTimeOptions(availableStarts, selectedStartTime)}
                                    </select>
                                    <select name="endTime" ${selectedStartTime ? "" : "disabled"}>
                                      ${renderEndTimeOptions(availableEnds, selectedEndTime)}
                                    </select>
                                  </div>
                                </label>

                                <div class="time-summary">
                                  <span>Thời lượng tự tính</span>
                                  <strong>${computedDuration ? `${computedDuration} phút` : "--"}</strong>
                                </div>

                                <label class="field">
                                  <span>Người đặt</span>
                                  <input name="person" type="text" placeholder="VD: Nguyễn Văn A" />
                                </label>

                                <label class="field">
                                  <span>Mục đích sử dụng</span>
                                  <textarea
                                    name="purpose"
                                    rows="4"
                                    placeholder="VD: Họp kế hoạch tuần"
                                  ></textarea>
                                </label>

                                <div class="form-hint">
                                  Chọn giờ bắt đầu và giờ kết thúc để hệ thống tự tính thời lượng.
                                </div>

                                <button class="button button-primary" type="submit">
                                  Đặt lịch
                                </button>

                                <p class="form-error" data-error></p>
                              </form>
                            `
                            : `<p class="empty-note">Ngày này đã full chỗ hoặc không còn khung giờ trống.</p>`
                        }
                      </section>
                    </div>
                  `
                  : ""
              }
            </div>
          `
          : ""
      }
    </article>
  `;
}

function bindDashboardEvents() {
  root.querySelectorAll('[data-action="toggle-dashboard"]').forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-room-id]");
      const roomId = card.dataset.roomId;
      const room = rooms.find((item) => item.id === roomId);
      room.expanded = !room.expanded;
      render();
    });
  });

  root.querySelectorAll('[data-action="select-day"]').forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-room-id]");
      const room = rooms.find((item) => item.id === card.dataset.roomId);
      room.selectedDate = button.dataset.date;
      room.formStartTime = "";
      room.formEndTime = "";
      room.expanded = true;
      render();
    });
  });

  root.querySelectorAll('[data-action="book"]').forEach((form) => {
    form.addEventListener("submit", handleBookingSubmit);
    form.addEventListener("change", (event) => {
      const room = rooms.find((item) => item.id === form.dataset.roomId);
      if (event.target.name === "startTime") {
        room.formStartTime = event.target.value;
        room.formEndTime = "";
        render();
      }
      if (event.target.name === "endTime") {
        room.formEndTime = event.target.value;
        render();
      }
    });
  });
}

function handleBookingSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const roomId = form.dataset.roomId;
  const room = rooms.find((item) => item.id === roomId);
  const errorEl = form.querySelector("[data-error]");
  const date = form.elements.date.value;
  const startTime = form.elements.startTime.value;
  const endTime = form.elements.endTime.value;
  const person = form.elements.person.value.trim();
  const purpose = form.elements.purpose.value.trim();

  const validationError = validateBooking(room, date, startTime, endTime, person, purpose);
  if (validationError) {
    errorEl.textContent = validationError;
    return;
  }

  const duration = toMinutes(endTime) - toMinutes(startTime);

  const booking = {
    start: startTime,
    end: endTime,
    duration,
    person,
    purpose,
  };

  room.schedule[date] = [...(room.schedule[date] || []), booking].sort((a, b) => a.start.localeCompare(b.start));
  room.selectedDate = date;
  room.formStartTime = "";
  room.formEndTime = "";

  errorEl.textContent = "";
  form.reset();
  render();
}

function validateBooking(room, date, startTime, endTime, person, purpose) {
  if (!date || !startTime || !endTime) {
    return "Vui lòng chọn giờ bắt đầu và giờ kết thúc.";
  }
  if (!person) {
    return "Vui lòng nhập người đặt.";
  }
  if (!purpose) {
    return "Vui lòng nhập mục đích sử dụng.";
  }

  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return "Giờ phải nhập theo định dạng HH:MM.";
  }
  if (!isSlotAligned(startTime) || !isSlotAligned(endTime)) {
    return "Giờ phải theo mốc 30 phút.";
  }
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return "Giờ kết thúc phải lớn hơn giờ bắt đầu.";
  }

  const availability = getDayAvailability(room, date);
  const slotIndex = availability.findIndex((slot) => slot.time === startTime);
  if (slotIndex < 0) {
    return "Khung giờ này không còn trống.";
  }

  const neededSlots = Math.ceil((toMinutes(endTime) - toMinutes(startTime)) / SLOT_MINUTES);
  const selectedSlots = availability.slice(slotIndex, slotIndex + neededSlots);
  if (selectedSlots.length < neededSlots || selectedSlots.some((slot) => !slot.available)) {
    return "Thời gian đã chọn bị trùng hoặc không đủ trống.";
  }

  return "";
}

function renderWeekDays(room, weekDates) {
  return weekDates
    .map((dateKey) => {
      const status = getDayStatus(room, dateKey);
      const selected = room.selectedDate === dateKey;

      return `
        <button
          type="button"
          class="day-tile ${dayTileClass(status)} ${selected ? "is-selected" : ""}"
          data-action="select-day"
          data-date="${dateKey}"
        >
          <strong>${shortDayLabel(dateKey)}</strong>
        </button>
      `;
    })
    .join("");
}

function dayTileClass(status) {
  if (status === "full") return "tile-full";
  if (status === "busy") return "tile-busy";
  return "tile-free";
}

function statusPillClass(status) {
  if (status === "full") return "pill-danger";
  if (status === "busy") return "pill-blue";
  return "pill-neutral";
}

function statusLabel(status) {
  if (status === "full") return "Full chỗ";
  if (status === "busy") return "Có buổi họp";
  return "Còn trống";
}

function dayStatusText(status, availability) {
  if (status === "full") return "Không còn khung giờ trống";
  if (status === "busy") return `${availability.filter((slot) => slot.available).length} khung giờ trống`;
  return "Có thể đặt lịch";
}

function renderStartTimeOptions(availableStarts, selectedStartTime) {
  if (!availableStarts.length) {
    return `<option value="">Không còn khung giờ trống</option>`;
  }

  return [`<option value="">Chọn giờ bắt đầu</option>`, ...availableStarts.map((time) => `<option value="${time}" ${time === selectedStartTime ? "selected" : ""}>${time}</option>`)].join("");
}

function renderEndTimeOptions(availableEnds, selectedEndTime) {
  if (!availableEnds.length) {
    return `<option value="">Chọn giờ bắt đầu trước</option>`;
  }

  return [`<option value="">Chọn giờ kết thúc</option>`, ...availableEnds.map((time) => `<option value="${time}" ${time === selectedEndTime ? "selected" : ""}>${time}</option>`)].join("");
}

function getDayStatus(room, dateKey) {
  const availability = getDayAvailability(room, dateKey);
  const bookings = room.schedule[dateKey] || [];
  const hasBooking = bookings.length > 0;
  const isFull = availability.every((slot) => !slot.available);

  if (isFull) return "full";
  if (hasBooking) return "busy";
  return "free";
}

function getDayAvailability(room, dateKey) {
  const bookings = room.schedule[dateKey] || [];
  const slots = [];

  for (let minutes = START_HOUR * 60; minutes < END_HOUR * 60; minutes += SLOT_MINUTES) {
    const start = minutesToTime(minutes);
    const end = addMinutes(start, SLOT_MINUTES);
    const available = !bookings.some((booking) => overlaps(start, end, booking.start, booking.end));
    slots.push({ time: start, available });
  }

  return slots;
}

function getAvailableStartTimes(room, dateKey) {
  const availability = getDayAvailability(room, dateKey);
  return availability.filter((slot) => slot.available).map((slot) => slot.time);
}

function getAvailableEndTimes(room, dateKey, startTime) {
  const availability = getDayAvailability(room, dateKey);
  const startIndex = availability.findIndex((slot) => slot.time === startTime);
  if (startIndex < 0) return [];

  const ends = [];
  for (let endIndex = startIndex + 1; endIndex <= availability.length; endIndex += 1) {
    const slice = availability.slice(startIndex, endIndex);
    if (slice.length && slice.every((slot) => slot.available)) {
      ends.push(availability[endIndex - 1].time ? addMinutes(availability[endIndex - 1].time, SLOT_MINUTES) : "");
    } else {
      break;
    }
  }

  return ends.filter(Boolean);
}

function overlaps(startA, endA, startB, endB) {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(endA) > toMinutes(startB);
}

function generateInitialBookings(roomId, dateKey, roomIndex) {
  const seed = seededNumber(`${roomId}-${dateKey}`);
  const bookings = [];

  if (seed % 11 === 0) {
    bookings.push({
      start: "08:00",
      end: "18:00",
      duration: 600,
      person: roomIndex === 0 ? "Nguyễn Minh Anh" : "Trần Quốc Huy",
      purpose: "Workshop nội bộ",
    });
    return bookings;
  }

  const patterns = [
    { start: "08:30", duration: 60, person: "Lê Hoàng", purpose: "Họp tiến độ" },
    { start: "10:00", duration: 90, person: "Phạm Ngọc", purpose: "Rà soát kế hoạch" },
    { start: "13:00", duration: 60, person: "Đỗ Thảo", purpose: "Trao đổi dự án" },
    { start: "15:30", duration: 60, person: "Vũ Đức", purpose: "Phỏng vấn ứng viên" },
  ];

  const count = seed % 3;
  for (let index = 0; index < count; index += 1) {
    const pattern = patterns[(seed + index * 2) % patterns.length];
    const end = addMinutes(pattern.start, pattern.duration);
    if (
      !bookings.some((booking) => overlaps(pattern.start, end, booking.start, booking.end)) &&
      toMinutes(end) <= toMinutes("18:00")
    ) {
      bookings.push({
        ...pattern,
        end,
      });
    }
  }

  return bookings.sort((a, b) => a.start.localeCompare(b.start));
}

function countTotalBookings(room) {
  return Object.values(room.schedule).reduce((sum, bookings) => sum + bookings.length, 0);
}

function weekDatesFor(startDate) {
  return Array.from({ length: 7 }, (_, index) => toDateKey(addDays(startDate, index)));
}

function formatWeekRange(weekDates) {
  const first = formatShortDate(weekDates[0]);
  const last = formatShortDate(weekDates[weekDates.length - 1]);
  return `${first} - ${last}`;
}

function formatShortDate(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatLongDate(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function shortDayLabel(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
  }).format(date);
}

function startOfWeek(date) {
  const day = date.getDay() === 0 ? 7 : date.getDay();
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  copy.setDate(copy.getDate() - (day - 1));
  return copy;
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function addMinutes(time, amount) {
  const total = toMinutes(time) + amount;
  return minutesToTime(total);
}

function toMinutes(time) {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

function isValidTimeFormat(time) {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [hours, minutes] = time.split(":").map(Number);
  return Number.isInteger(hours) && Number.isInteger(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
}

function isSlotAligned(time) {
  return isValidTimeFormat(time) && toMinutes(time) % SLOT_MINUTES === 0;
}

function seededNumber(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeAttr(value) {
  return escapeHtml(String(value ?? ""));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
