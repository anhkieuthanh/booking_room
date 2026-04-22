const rooms = [
  {
    id: "atlas",
    name: "Atlas",
    floor: "12th Floor",
    building: "North Tower",
    zone: "Collaboration Wing",
    capacity: 14,
    equipment: ["4K screen", "Video conferencing", "Whiteboard", "Teams Room"],
    theme: "linear-gradient(145deg, #234a72, #4f7396 52%, #84a9c8)",
    summary: "A bright room with a glass wall and a strong hybrid-meeting setup.",
  },
  {
    id: "harbor",
    name: "Harbor",
    floor: "8th Floor",
    building: "South Tower",
    zone: "Client Suite",
    capacity: 8,
    equipment: ["Video conferencing", "Phone dial-in", "Whiteboard"],
    theme: "linear-gradient(145deg, #0f3b52, #2f6f82 56%, #71a3ad)",
    summary: "Best for client calls, quick reviews, and focused working sessions.",
  },
  {
    id: "cove",
    name: "Cove",
    floor: "5th Floor",
    building: "North Tower",
    zone: "Focus Bar",
    capacity: 6,
    equipment: ["Monitor", "Whiteboard", "Standing desk"],
    theme: "linear-gradient(145deg, #71533d, #9e7650 52%, #ceb48b)",
    summary: "A compact room for interviews, planning sessions, and private check-ins.",
  },
  {
    id: "summit",
    name: "Summit",
    floor: "15th Floor",
    building: "Executive Tower",
    zone: "Board Level",
    capacity: 20,
    equipment: ["4K screen", "Video conferencing", "Whiteboard", "Poly audio", "Presentation clicker"],
    theme: "linear-gradient(145deg, #2a3a57, #50698f 48%, #91b0d0)",
    summary: "A polished boardroom built for leadership reviews and large hybrid meetings.",
  },
  {
    id: "lumen",
    name: "Lumen",
    floor: "10th Floor",
    building: "Innovation Hub",
    zone: "Sprint Studio",
    capacity: 12,
    equipment: ["4K screen", "Video conferencing", "Whiteboard", "Sticky wall"],
    theme: "linear-gradient(145deg, #274c5f, #4c7a8d 52%, #7ab0bd)",
    summary: "A flexible workshop space for retros, ideation, and sprint planning.",
  },
  {
    id: "equinox",
    name: "Equinox",
    floor: "7th Floor",
    building: "West Wing",
    zone: "Quiet Rooms",
    capacity: 4,
    equipment: ["Monitor", "Phone dial-in"],
    theme: "linear-gradient(145deg, #543e61, #7b5c8b 52%, #b49dc0)",
    summary: "An intimate room for private interviews, check-ins, and manager 1:1s.",
  },
];

const officeHours = { start: 8, end: 18 };
const slotMinutes = 30;
const equipmentList = Array.from(new Set(rooms.flatMap((room) => room.equipment)));
const locations = Array.from(new Set(rooms.map((room) => room.building)));
const today = new Date();
const todayISO = toDateInputValue(today);

const state = {
  search: "",
  location: "all",
  capacity: 12,
  availableOnly: false,
  equipmentFilters: new Set(),
  selectedRoomId: rooms[0].id,
  bookingDate: todayISO,
  startTime: null,
  duration: 60,
  attendees: 8,
  requiredEquipment: new Set(["Video conferencing"]),
  notes: "",
  confirmation: null,
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  seedControls();
  bindEvents();
  renderAll();
});

function cacheElements() {
  const ids = [
    "hero-stats",
    "timeline-summary",
    "search-input",
    "location-filter",
    "capacity-filter",
    "capacity-value",
    "availability-filter",
    "equipment-filters",
    "date-filter",
    "result-count",
    "selected-count",
    "rooms-grid",
    "room-detail",
    "booking-room-pill",
    "booking-form",
    "booking-date",
    "start-time",
    "duration",
    "attendees",
    "required-equipment",
    "booking-notes",
    "booking-summary",
    "booking-error",
    "fill-next-slot",
    "confirmation-body",
    "reset-filters",
  ];

  ids.forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function seedControls() {
  els["location-filter"].innerHTML = [
    `<option value="all">All locations</option>`,
    ...locations.map((location) => `<option value="${location}">${location}</option>`),
  ].join("");

  els["capacity-filter"].value = String(state.capacity);
  els["capacity-value"].textContent = state.capacity;
  els["availability-filter"].checked = state.availableOnly;
  els["date-filter"].value = state.bookingDate;
  els["booking-date"].value = state.bookingDate;
  els["search-input"].value = state.search;

  renderEquipmentChips();
  renderRequiredEquipmentChips();
}

function bindEvents() {
  els["search-input"].addEventListener("input", (event) => {
    state.search = event.target.value;
    renderAll();
  });

  els["location-filter"].addEventListener("change", (event) => {
    state.location = event.target.value;
    renderAll();
  });

  els["capacity-filter"].addEventListener("input", (event) => {
    state.capacity = Number(event.target.value);
    els["capacity-value"].textContent = state.capacity;
    renderAll();
  });

  els["availability-filter"].addEventListener("change", (event) => {
    state.availableOnly = event.target.checked;
    renderAll();
  });

  els["date-filter"].addEventListener("change", (event) => {
    state.bookingDate = event.target.value || todayISO;
    els["booking-date"].value = state.bookingDate;
    renderAll();
  });

  els["booking-date"].addEventListener("change", (event) => {
    state.bookingDate = event.target.value || todayISO;
    els["date-filter"].value = state.bookingDate;
    renderAll();
  });

  els["duration"].addEventListener("change", (event) => {
    state.duration = Number(event.target.value);
    renderBookingSummary();
  });

  els["attendees"].addEventListener("input", (event) => {
    state.attendees = Number(event.target.value || 0);
    renderBookingSummary();
  });

  els["booking-notes"].addEventListener("input", (event) => {
    state.notes = event.target.value;
  });

  els["booking-form"].addEventListener("submit", handleSubmit);
  els["fill-next-slot"].addEventListener("click", fillNextAvailableSlot);
  els["reset-filters"].addEventListener("click", resetFilters);
}

function renderAll() {
  const filtered = getFilteredRooms();

  if (filtered.length && !filtered.some((room) => room.id === state.selectedRoomId)) {
    state.selectedRoomId = filtered[0]?.id || rooms[0].id;
  }

  const selectedRoom = rooms.find((room) => room.id === state.selectedRoomId) || rooms[0];
  const selectedAvailability = getAvailability(selectedRoom, state.bookingDate);

  if (!state.startTime || !selectedAvailability.some((slot) => slot.time === state.startTime && slot.status === "available")) {
    state.startTime = selectedAvailability.find((slot) => slot.status === "available")?.time || null;
  }

  renderStats();
  renderTimeline();
  renderRooms(filtered);
  renderSelectedRoom(selectedRoom);
  renderStartTimes(selectedRoom);
  renderRequiredEquipmentChips();
  renderBookingSummary();
  renderConfirmation();
}

function renderStats() {
  const availableCount = rooms.filter((room) => getAvailability(room, state.bookingDate).some((slot) => slot.status === "available")).length;
  const avgCapacity = Math.round(rooms.reduce((sum, room) => sum + room.capacity, 0) / rooms.length);

  els["hero-stats"].innerHTML = [
    metricCard(`${rooms.length} rooms`, "across three office zones"),
    metricCard(`${availableCount} ready`, "open on the selected date"),
    metricCard(`${avgCapacity} seats`, "average room capacity"),
  ].join("");
}

function metricCard(value, label) {
  return `
    <div class="metric">
      <strong>${value}</strong>
      <span>${label}</span>
    </div>
  `;
}

function renderTimeline() {
  const roomsByAvailability = rooms
    .map((room) => ({
      room,
      availability: getAvailability(room, state.bookingDate),
    }))
    .sort((left, right) => countAvailableSlots(right.availability) - countAvailableSlots(left.availability))
    .slice(0, 3);

  els["timeline-summary"].innerHTML = roomsByAvailability
    .map(({ room, availability }) => {
      const openSlots = countAvailableSlots(availability);
      const nextSlot = availability.find((slot) => slot.status === "available")?.time || "No open slot";
      return `
        <div class="timeline-card">
          <div>
            <strong>${room.name}</strong>
            <p>${room.floor}</p>
          </div>
          <div>
            <strong>${nextSlot}</strong>
            <p>${room.zone}</p>
          </div>
          <span class="timeline-availability">${openSlots} open</span>
        </div>
      `;
    })
    .join("");
}

function renderEquipmentChips() {
  els["equipment-filters"].innerHTML = equipmentList
    .map((equipment) => {
      const active = state.equipmentFilters.has(equipment);
      return `
        <label class="chip ${active ? "active" : ""}">
          <input type="checkbox" value="${equipment}" ${active ? "checked" : ""} />
          <span>${equipment}</span>
        </label>
      `;
    })
    .join("");

  els["equipment-filters"].querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const { value, checked } = event.target;
      if (checked) {
        state.equipmentFilters.add(value);
      } else {
        state.equipmentFilters.delete(value);
      }
      renderAll();
    });
  });
}

function renderRequiredEquipmentChips() {
  els["required-equipment"].innerHTML = equipmentList
    .map((equipment) => {
      const active = state.requiredEquipment.has(equipment);
      const room = rooms.find((item) => item.id === state.selectedRoomId) || rooms[0];
      const supported = room.equipment.includes(equipment);
      return `
        <label class="chip ${active ? "active" : ""} ${supported ? "" : "disabled"}">
          <input type="checkbox" value="${equipment}" ${active ? "checked" : ""} ${supported ? "" : "disabled"} />
          <span>${equipment}</span>
        </label>
      `;
    })
    .join("");

  els["required-equipment"].querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const { value, checked } = event.target;
      if (checked) {
        state.requiredEquipment.add(value);
      } else {
        state.requiredEquipment.delete(value);
      }
      renderBookingSummary();
    });
  });
}

function getFilteredRooms() {
  const query = state.search.trim().toLowerCase();

  return rooms
    .filter((room) => room.capacity >= state.capacity)
    .filter((room) => (state.location === "all" ? true : room.building === state.location))
    .filter((room) => {
      if (!query) return true;
      return [room.name, room.floor, room.building, room.zone, room.summary, ...room.equipment]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .filter((room) => {
      if (!state.availableOnly) return true;
      return getAvailability(room, state.bookingDate).some((slot) => slot.status === "available");
    })
    .filter((room) => {
      if (!state.equipmentFilters.size) return true;
      return [...state.equipmentFilters].every((item) => room.equipment.includes(item));
    })
    .sort((left, right) => {
      const leftScore = scoreRoom(left);
      const rightScore = scoreRoom(right);
      return rightScore - leftScore;
    });
}

function scoreRoom(room) {
  const availability = countAvailableSlots(getAvailability(room, state.bookingDate));
  const equipmentMatch = [...state.equipmentFilters].filter((item) => room.equipment.includes(item)).length;
  return availability * 10 + equipmentMatch * 20 + room.capacity;
}

function renderRooms(filteredRooms) {
  els["result-count"].textContent = `${filteredRooms.length} room${filteredRooms.length === 1 ? "" : "s"} found`;
  els["selected-count"].textContent = `${countAvailableSlots(getAvailability(rooms.find((room) => room.id === state.selectedRoomId) || rooms[0], state.bookingDate))} open slots`;

  if (!filteredRooms.length) {
    els["rooms-grid"].innerHTML = `
      <div class="empty-state">
        <strong>No rooms match these filters.</strong>
        <p>Try widening the capacity range, removing an equipment filter, or switching the date.</p>
      </div>
    `;
    return;
  }

  els["rooms-grid"].innerHTML = filteredRooms
    .map((room) => {
      const availability = getAvailability(room, state.bookingDate);
      const openSlots = countAvailableSlots(availability);
      const selected = room.id === state.selectedRoomId;
      const nextSlot = availability.find((slot) => slot.status === "available")?.time || "No availability";
      return `
        <article class="room-card ${selected ? "active" : ""}">
          <div class="room-photo" style="--room-gradient: ${room.theme}">
            <strong>${room.name.slice(0, 1)}</strong>
            <span>${room.floor}</span>
          </div>
          <div class="room-copy">
            <div class="room-header">
              <div>
                <h4>${room.name}</h4>
                <p>${room.summary}</p>
              </div>
              <button class="ghost-button" data-select-room="${room.id}" type="button">
                ${selected ? "Selected" : "Review"}
              </button>
            </div>
            <div class="room-meta">
              <span class="pill pill-neutral">${room.capacity} seats</span>
              <span class="pill pill-neutral">${room.building}</span>
              <span class="pill pill-soft">${room.zone}</span>
            </div>
            <div class="availability-line">
              <span>${room.equipment.slice(0, 3).join(" · ")}</span>
              <span>${openSlots} open today</span>
            </div>
            <div class="availability-line">
              <span>Next slot</span>
              <strong>${nextSlot}</strong>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  els["rooms-grid"].querySelectorAll("[data-select-room]").forEach((button) => {
    button.addEventListener("click", (event) => {
      selectRoom(event.currentTarget.getAttribute("data-select-room"));
    });
  });
}

function selectRoom(roomId) {
  state.selectedRoomId = roomId;
  state.requiredEquipment = new Set(["Video conferencing"]);
  state.confirmation = null;
  state.bookingDate = state.bookingDate || todayISO;
  els["booking-date"].value = state.bookingDate;
  renderAll();
  document.getElementById("booking").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderSelectedRoom(room) {
  const availability = getAvailability(room, state.bookingDate);
  const availableSlots = availability.filter((slot) => slot.status === "available");
  const upcoming = availableSlots.slice(0, 4);
  const safeRequired = [...state.requiredEquipment].filter((item) => room.equipment.includes(item));
  state.requiredEquipment = new Set(safeRequired.length ? safeRequired : room.equipment.slice(0, 1));

  els["booking-room-pill"].textContent = room.name;

  els["room-detail"].innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Room detail</p>
        <h3 id="detail-title">${room.name}</h3>
      </div>
      <span class="pill pill-neutral">${room.capacity} capacity</span>
    </div>

    <div class="detail-media">
      <div class="hero-photo" style="--room-gradient: ${room.theme}">
        <p>${room.building} · ${room.floor}</p>
        <h4>${room.zone}</h4>
        <p>${room.summary}</p>
      </div>
      <div class="photo-stack">
        <div class="mini-photo" style="--room-gradient: ${room.theme}">
          <p>Natural light, hybrid setup, and privacy glass.</p>
        </div>
        <div class="mini-photo" style="--room-gradient: linear-gradient(145deg, #153252, #4e6f91)">
          <p>Ready for quick bookings, workshops, and client calls.</p>
        </div>
      </div>
    </div>

    <div class="detail-facts">
      <span class="fact">${room.floor}</span>
      <span class="fact">${room.building}</span>
      <span class="fact">${room.zone}</span>
    </div>

    <div class="field" style="margin-top: 1rem;">
      <span>Amenities</span>
      <div class="amenity-list">
        ${room.equipment.map((item) => `<span class="pill pill-neutral">${item}</span>`).join("")}
      </div>
    </div>

    <div class="field">
      <span>Time slots for ${formatDate(state.bookingDate)}</span>
      <div class="availability-grid">
        ${availability
          .map((slot) => `
            <button
              class="slot ${slot.status} ${state.startTime === slot.time ? "selected" : ""}"
              type="button"
              data-slot-time="${slot.time}"
              ${slot.status !== "available" ? "disabled" : ""}
            >
              ${slot.time}
            </button>
          `)
          .join("")}
      </div>
      <div class="availability-line">
        <span>${availableSlots.length} slots available on this date</span>
        <span>${upcoming.length ? `Next open: ${upcoming[0].time}` : "No open slots remaining"}</span>
      </div>
    </div>
  `;

  els["room-detail"].querySelectorAll("[data-slot-time]").forEach((button) => {
    button.addEventListener("click", (event) => {
      state.startTime = event.currentTarget.getAttribute("data-slot-time");
      els["start-time"].value = state.startTime;
      renderBookingSummary();
      renderSelectedRoom(room);
    });
  });
}

function renderStartTimes(room) {
  const availability = getAvailability(room, state.bookingDate);
  const availableSlots = availability.filter((slot) => slot.status === "available");

  els["start-time"].innerHTML = availableSlots
    .map((slot) => `<option value="${slot.time}">${slot.time}</option>`)
    .join("");

  if (state.startTime && availableSlots.some((slot) => slot.time === state.startTime)) {
    els["start-time"].value = state.startTime;
  } else {
    state.startTime = availableSlots[0]?.time || null;
    els["start-time"].value = state.startTime || "";
  }

  els["start-time"].onchange = (event) => {
    state.startTime = event.target.value;
    renderSelectedRoom(room);
    renderBookingSummary();
  };
}

function renderBookingSummary() {
  const room = rooms.find((item) => item.id === state.selectedRoomId) || rooms[0];
  const required = [...state.requiredEquipment];
  const missingEquipment = required.filter((item) => !room.equipment.includes(item));
  const attendeesValid = Number.isFinite(state.attendees) && state.attendees > 0 && state.attendees <= room.capacity;
  const slotsOk = isBookingWindowAvailable(room, state.bookingDate, state.startTime, state.duration);

  els["booking-summary"].innerHTML = `
    <strong>${room.name}</strong><br />
    ${formatDate(state.bookingDate)} · ${state.startTime || "Select a time"} · ${state.duration} minutes<br />
    ${state.attendees || 0} attendee${state.attendees === 1 ? "" : "s"} · ${room.capacity} seat capacity
    ${
      missingEquipment.length
        ? `<br /><span style="color: #b23b3b;">Missing equipment: ${missingEquipment.join(", ")}</span>`
        : ""
    }
    ${
      !attendeesValid
        ? `<br /><span style="color: #b23b3b;">Attendee count must be between 1 and ${room.capacity}.</span>`
        : ""
    }
    ${
      !slotsOk
        ? `<br /><span style="color: #b23b3b;">Selected window is not fully available.</span>`
        : ""
    }
  `;
}

function handleSubmit(event) {
  event.preventDefault();
  const room = rooms.find((item) => item.id === state.selectedRoomId) || rooms[0];
  const bookingDate = els["booking-date"].value || state.bookingDate;
  const startTime = els["start-time"].value || state.startTime;
  const duration = Number(els["duration"].value);
  const attendees = Number(els["attendees"].value);
  const required = [...state.requiredEquipment];

  const errors = [];

  if (!bookingDate) {
    errors.push("Choose a booking date.");
  }
  if (!startTime) {
    errors.push("Choose a start time.");
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    errors.push("Choose a valid duration.");
  }
  if (!Number.isFinite(attendees) || attendees < 1 || attendees > room.capacity) {
    errors.push(`Attendee count must be between 1 and ${room.capacity}.`);
  }
  if (required.some((item) => !room.equipment.includes(item))) {
    errors.push("Selected required equipment is not available in this room.");
  }
  if (!isBookingWindowAvailable(room, bookingDate, startTime, duration)) {
    errors.push("The requested time window is not fully available.");
  }

  if (errors.length) {
    els["booking-error"].textContent = errors[0];
    return;
  }

  els["booking-error"].textContent = "";
  state.confirmation = {
    reference: `MR-${Math.floor(100000 + Math.random() * 900000)}`,
    room,
    bookingDate,
    startTime,
    duration,
    attendees,
    required,
    notes: state.notes.trim(),
    createdAt: new Date(),
  };

  renderConfirmation();
  document.getElementById("confirmation").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderConfirmation() {
  if (!state.confirmation) {
    els["confirmation-body"].innerHTML = `<p class="placeholder">Your booking confirmation will appear here after you reserve a room.</p>`;
    els["confirmation"].dataset.state = "idle";
    return;
  }

  const { room, bookingDate, startTime, duration, attendees, required, notes, reference, createdAt } = state.confirmation;

  els["confirmation"].dataset.state = "ready";
  els["confirmation-body"].innerHTML = `
    <div class="confirmation-banner">
      <p class="eyebrow" style="color: rgba(255,255,255,0.78);">Reservation complete</p>
      <h4>${room.name} is booked</h4>
      <p>${formatDate(bookingDate)} · ${startTime} · ${duration} minutes</p>
      <p>Reference ${reference}</p>
    </div>

    <div class="confirmation-grid">
      <div class="confirmation-item">
        <span>Room</span>
        <strong>${room.name} · ${room.floor}</strong>
      </div>
      <div class="confirmation-item">
        <span>Attendees</span>
        <strong>${attendees}</strong>
      </div>
      <div class="confirmation-item">
        <span>Required equipment</span>
        <strong>${required.length ? required.join(", ") : "None"}</strong>
      </div>
      <div class="confirmation-item">
        <span>Booked at</span>
        <strong>${new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(createdAt)}</strong>
      </div>
    </div>

    ${
      notes
        ? `<div class="confirmation-item"><span>Notes</span><strong>${escapeHtml(notes)}</strong></div>`
        : ""
    }

    <div class="confirmation-actions">
      <button class="button button-primary button-link" id="view-booking" type="button">View booking</button>
      <button class="button button-secondary button-link" id="book-another" type="button">Book another room</button>
    </div>
  `;

  document.getElementById("view-booking").addEventListener("click", () => {
    document.getElementById("booking").scrollIntoView({ behavior: "smooth", block: "start" });
    els["booking-date"].focus();
  });

  document.getElementById("book-another").addEventListener("click", () => {
    state.confirmation = null;
    state.notes = "";
    state.requiredEquipment = new Set(["Video conferencing"]);
    els["booking-notes"].value = "";
    renderAll();
    document.getElementById("rooms").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function fillNextAvailableSlot() {
  const room = rooms.find((item) => item.id === state.selectedRoomId) || rooms[0];
  const nextSlot = getAvailability(room, state.bookingDate).find((slot) => slot.status === "available");
  if (nextSlot) {
    state.startTime = nextSlot.time;
    els["start-time"].value = nextSlot.time;
    renderSelectedRoom(room);
    renderBookingSummary();
  }
}

function resetFilters() {
  state.search = "";
  state.location = "all";
  state.capacity = 12;
  state.availableOnly = false;
  state.equipmentFilters = new Set();
  state.bookingDate = todayISO;
  state.startTime = null;

  els["search-input"].value = "";
  els["location-filter"].value = "all";
  els["capacity-filter"].value = "12";
  els["capacity-value"].textContent = "12";
  els["availability-filter"].checked = false;
  els["date-filter"].value = todayISO;
  els["booking-date"].value = todayISO;
  renderAll();
}

function getAvailability(room, date) {
  const slots = [];
  for (let minutes = officeHours.start * 60; minutes < officeHours.end * 60; minutes += slotMinutes) {
    const time = minutesToLabel(minutes);
    const score = seededNumber(`${room.id}-${date}-${time}`);
    const preferredBusy = [11, 12, 13, 16].includes(Number(time.split(":")[0]));
    const unavailable = score % (preferredBusy ? 4 : 6) === 0 || score % 17 === 0;
    slots.push({
      time,
      status: unavailable ? "unavailable" : "available",
    });
  }
  return slots;
}

function isBookingWindowAvailable(room, date, startTime, duration) {
  if (!startTime || !date) return false;
  const availability = getAvailability(room, date);
  const startIndex = availability.findIndex((slot) => slot.time === startTime && slot.status === "available");
  if (startIndex < 0) return false;

  const neededSlots = Math.ceil(duration / slotMinutes);
  const selectedSlots = availability.slice(startIndex, startIndex + neededSlots);
  return selectedSlots.length === neededSlots && selectedSlots.every((slot) => slot.status === "available");
}

function countAvailableSlots(availability) {
  return availability.filter((slot) => slot.status === "available").length;
}

function minutesToLabel(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function seededNumber(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateValue}T12:00:00`));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
