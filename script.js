// Public configuration is shared with traffic-simulator.html.
const POSTHOG_KEY = window.ABC_POSTHOG_CONFIG?.key || "";
const POSTHOG_HOST = window.ABC_POSTHOG_CONFIG?.host || "";

const STORAGE_KEY = "abcTutoringBookings";

const tutors = [
  {
    id: "maya-chen",
    name: "Maya Chen",
    initials: "MC",
    avatarClass: "avatar-coral",
    subjects: ["Math", "Science"],
    gradeBands: ["Middle School", "High School"],
    gradeLabel: "Grades 6–10",
    rate: 48,
    qualification: "B.S. Mathematics · 6 years tutoring",
    bio: "Maya turns intimidating equations into manageable steps. Her calm, upbeat style is especially helpful for students rebuilding math confidence.",
    slots: [
      { date: "2026-09-08", time: "4:00 PM" },
      { date: "2026-09-09", time: "5:30 PM" },
      { date: "2026-09-12", time: "10:00 AM" }
    ]
  },
  {
    id: "jordan-brooks",
    name: "Jordan Brooks",
    initials: "JB",
    avatarClass: "avatar-blue",
    subjects: ["English", "Study Skills"],
    gradeBands: ["Elementary", "Middle School"],
    gradeLabel: "Grades 3–8",
    rate: 42,
    qualification: "M.Ed. Literacy Education · Former teacher",
    bio: "Jordan loves helping reluctant readers find books they enjoy and showing young writers how to organize their ideas without losing their voice.",
    slots: [
      { date: "2026-09-08", time: "3:30 PM" },
      { date: "2026-09-10", time: "4:30 PM" },
      { date: "2026-09-13", time: "11:00 AM" }
    ]
  },
  {
    id: "elena-rodriguez",
    name: "Elena Rodriguez",
    initials: "ER",
    avatarClass: "avatar-mint",
    subjects: ["Science", "Math"],
    gradeBands: ["Middle School", "High School"],
    gradeLabel: "Grades 7–12",
    rate: 55,
    qualification: "M.S. Biology · Lab research mentor",
    bio: "Elena makes science vivid with real-world examples and simple visuals. She helps students connect the big idea to the details they need for class.",
    slots: [
      { date: "2026-09-09", time: "4:00 PM" },
      { date: "2026-09-11", time: "6:00 PM" },
      { date: "2026-09-14", time: "5:00 PM" }
    ]
  },
  {
    id: "samir-patel",
    name: "Samir Patel",
    initials: "SP",
    avatarClass: "avatar-yellow",
    subjects: ["Math", "Test Prep"],
    gradeBands: ["High School"],
    gradeLabel: "Grades 9–12",
    rate: 52,
    qualification: "B.S. Engineering · SAT/ACT specialist",
    bio: "Samir combines strong math instruction with practical test strategy. Sessions are focused, encouraging, and tailored to each student's pace.",
    slots: [
      { date: "2026-09-10", time: "5:00 PM" },
      { date: "2026-09-12", time: "1:00 PM" },
      { date: "2026-09-15", time: "6:30 PM" }
    ]
  },
  {
    id: "grace-kim",
    name: "Grace Kim",
    initials: "GK",
    avatarClass: "avatar-lavender",
    subjects: ["English", "Test Prep"],
    gradeBands: ["Middle School", "High School"],
    gradeLabel: "Grades 6–12",
    rate: 50,
    qualification: "B.A. English · Writing center coach",
    bio: "Grace helps students say what they mean with clarity. She brings warmth and structure to essays, reading comprehension, and test preparation.",
    slots: [
      { date: "2026-09-08", time: "6:00 PM" },
      { date: "2026-09-11", time: "4:00 PM" },
      { date: "2026-09-16", time: "5:30 PM" }
    ]
  },
  {
    id: "theo-williams",
    name: "Theo Williams",
    initials: "TW",
    avatarClass: "avatar-sky",
    subjects: ["Math", "Study Skills"],
    gradeBands: ["Elementary", "Middle School"],
    gradeLabel: "Grades K–8",
    rate: 40,
    qualification: "B.A. Education · Youth mentor",
    bio: "Theo uses games, quick wins, and clear routines to keep younger learners engaged. He is a patient guide for homework and organization alike.",
    slots: [
      { date: "2026-09-09", time: "3:00 PM" },
      { date: "2026-09-12", time: "9:00 AM" },
      { date: "2026-09-14", time: "4:00 PM" }
    ]
  }
];

let selectedTutor = null;
let selectedSlot = null;
const viewedTutorIds = new Set();

const tutorGrid = document.querySelector("#tutor-grid");
const emptyState = document.querySelector("#empty-state");
const subjectFilter = document.querySelector("#subject-filter");
const gradeFilter = document.querySelector("#grade-filter");
const resultCount = document.querySelector("#result-count");
const bookingDialog = document.querySelector("#booking-dialog");
const confirmationDialog = document.querySelector("#confirmation-dialog");
const bookingForm = document.querySelector("#booking-form");
const toast = document.querySelector("#toast");

function initializePostHog() {
  if (!POSTHOG_KEY || !POSTHOG_HOST) return;

  const posthog = window.posthog = window.posthog || [];
  posthog._i = [];
  posthog.init = (key, config) => {
    ["capture", "identify", "alias", "reset", "register", "register_once", "unregister"].forEach((method) => {
      posthog[method] = (...args) => posthog.push([method, ...args]);
    });
    // The CDN bootstrap expects the default instance name as the third value.
    posthog._i.push([key, config, "posthog"]);
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    const assetHost = POSTHOG_HOST
      .replace(/\/$/, "")
      .replace(".i.posthog.com", "-assets.i.posthog.com");
    script.src = `${assetHost}/static/array.js`;
    document.head.appendChild(script);
  };
  posthog.__SV = 1;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    person_profiles: "identified_only"
  });
  track("$pageview", { $current_url: window.location.href });
}

function track(eventName, properties = {}) {
  if (window.posthog?.capture) window.posthog.capture(eventName, properties);
}

function getBookings() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveBookings(bookings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function slotId(tutorId, slot) {
  return `${tutorId}__${slot.date}__${slot.time}`;
}

function isBooked(tutorId, slot) {
  return getBookings().some((booking) => booking.slotId === slotId(tutorId, slot));
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date(`${dateValue}T12:00:00`));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function populateSubjects() {
  const subjects = [...new Set(tutors.flatMap((tutor) => tutor.subjects))].sort();
  subjectFilter.insertAdjacentHTML(
    "beforeend",
    subjects.map((subject) => `<option value="${subject}">${subject}</option>`).join("")
  );
}

function tutorCard(tutor) {
  const nextAvailable = tutor.slots.find((slot) => !isBooked(tutor.id, slot));
  const slots = tutor.slots.map((slot) => {
    const booked = isBooked(tutor.id, slot);
    const id = slotId(tutor.id, slot);
    const slotLabel = `${formatDate(slot.date)} at ${slot.time}`;
    return `<button class="slot-button${booked ? " unavailable" : ""}" type="button" data-tutor-id="${tutor.id}" data-slot-id="${id}" ${booked ? "disabled" : ""} aria-label="${slotLabel}${booked ? ", unavailable" : ", available"}" aria-pressed="false">
      <span>${formatDate(slot.date)} · ${slot.time}</span>${booked ? "<strong>Unavailable</strong>" : ""}
    </button>`;
  }).join("");

  return `<article class="tutor-card" data-tutor-card="${tutor.id}">
    <div class="tutor-top">
      <div class="avatar ${tutor.avatarClass}" role="img" aria-label="Friendly avatar of ${tutor.name}">${tutor.initials}</div>
      <div>
        <h3 class="tutor-name">${tutor.name}</h3>
        <p class="tutor-specialty">${tutor.subjects.join(" · ")}</p>
      </div>
      <div class="rate">$${tutor.rate}<small>/hour</small></div>
    </div>
    <div class="profile-scan">
      <div><span class="scan-label">Subjects</span><div class="tag-list">${tutor.subjects.map((subject) => `<span class="tag">${subject}</span>`).join("")}</div></div>
      <div><span class="scan-label">Grade levels</span><strong>${tutor.gradeLabel}</strong></div>
      <div><span class="scan-label">Qualifications</span><strong>${tutor.qualification}</strong></div>
      <div class="experience"><span class="scan-label">Experience</span><p>${tutor.bio}</p></div>
    </div>
    <div class="next-available${nextAvailable ? "" : " sold-out"}">
      <span>Next available</span>
      <strong>${nextAvailable ? `${formatDate(nextAvailable.date)} · ${nextAvailable.time}` : "No open times"}</strong>
    </div>
    <div class="availability">
      <h4>Choose an available time</h4>
      <div class="slot-list">${slots}</div>
      <button class="button button-primary card-action" type="button" data-book-tutor="${tutor.id}" disabled>Select a time to book</button>
    </div>
  </article>`;
}

function filteredTutors() {
  return tutors.filter((tutor) => {
    const subjectMatch = subjectFilter.value === "all" || tutor.subjects.includes(subjectFilter.value);
    const gradeMatch = gradeFilter.value === "all" || tutor.gradeBands.includes(gradeFilter.value);
    return subjectMatch && gradeMatch;
  });
}

function renderTutors() {
  const matches = filteredTutors();
  tutorGrid.innerHTML = matches.map(tutorCard).join("");
  tutorGrid.hidden = matches.length === 0;
  emptyState.hidden = matches.length !== 0;
  resultCount.textContent = `${matches.length} tutor${matches.length === 1 ? "" : "s"} available`;
  selectedTutor = null;
  selectedSlot = null;
  observeTutorCards();
}

function observeTutorCards() {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const tutor = tutors.find((item) => item.id === entry.target.dataset.tutorCard);
      if (tutor && !viewedTutorIds.has(tutor.id)) {
        viewedTutorIds.add(tutor.id);
        track("tutor_viewed", {
          tutor_name: tutor.name,
          tutor_subjects: tutor.subjects,
          grade_levels: tutor.gradeLabel,
          hourly_rate: tutor.rate
        });
      }
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.45 });
  document.querySelectorAll("[data-tutor-card]").forEach((card) => observer.observe(card));
}

function clearFilters() {
  subjectFilter.value = "all";
  gradeFilter.value = "all";
  renderTutors();
}

function selectSlot(button) {
  const tutor = tutors.find((item) => item.id === button.dataset.tutorId);
  if (!tutor) return;
  const slot = tutor.slots.find((item) => slotId(tutor.id, item) === button.dataset.slotId);
  if (!slot || isBooked(tutor.id, slot)) {
    renderTutors();
    showToast("That time was just booked. Please choose another opening.");
    return;
  }

  document.querySelectorAll(".slot-button").forEach((item) => item.setAttribute("aria-pressed", "false"));
  document.querySelectorAll("[data-book-tutor]").forEach((item) => { item.disabled = true; });
  button.setAttribute("aria-pressed", "true");
  const card = button.closest(".tutor-card");
  const bookButton = card.querySelector("[data-book-tutor]");
  bookButton.disabled = false;
  bookButton.textContent = `Book ${formatDate(slot.date)} at ${slot.time}`;
  selectedTutor = tutor;
  selectedSlot = slot;
}

function openBooking(tutorId) {
  if (!selectedTutor || !selectedSlot || selectedTutor.id !== tutorId) return;

  const subjectSelect = bookingForm.elements.subject;
  subjectSelect.innerHTML = selectedTutor.subjects.map((subject) => `<option>${subject}</option>`).join("");
  if (selectedTutor.subjects.includes(subjectFilter.value)) subjectSelect.value = subjectFilter.value;
  document.querySelector("#booking-summary").innerHTML = `
    <div><span>Tutor</span><strong>${selectedTutor.name}</strong></div>
    <div><span>Time</span><strong>${formatDate(selectedSlot.date)} · ${selectedSlot.time}</strong></div>
    <div><span>Rate</span><strong>$${selectedTutor.rate}/hour</strong></div>`;

  track("booking_started", {
    tutor_name: selectedTutor.name,
    subject: subjectSelect.value,
    selected_time: `${selectedSlot.date} ${selectedSlot.time}`,
    hourly_rate: selectedTutor.rate
  });
  bookingDialog.showModal();
}

function completeBooking(event) {
  event.preventDefault();
  if (!bookingForm.reportValidity() || !selectedTutor || !selectedSlot) return;

  const currentSlotId = slotId(selectedTutor.id, selectedSlot);
  const bookings = getBookings();
  if (bookings.some((booking) => booking.slotId === currentSlotId)) {
    bookingDialog.close();
    renderTutors();
    showToast("That time is no longer available. Please choose another.");
    return;
  }

  const formData = new FormData(bookingForm);
  const booking = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    slotId: currentSlotId,
    tutorId: selectedTutor.id,
    tutorName: selectedTutor.name,
    date: selectedSlot.date,
    time: selectedSlot.time,
    rate: selectedTutor.rate,
    parentName: formData.get("parentName"),
    parentEmail: formData.get("parentEmail"),
    studentName: formData.get("studentName"),
    studentGrade: formData.get("studentGrade"),
    subject: formData.get("subject"),
    phone: formData.get("phone") || ""
  };
  saveBookings([...bookings, booking]);

  // FUTURE EMAIL/TEXT NOTIFICATION HOOK:
  // Send `booking` to a secure server-side endpoint here. Never place provider
  // credentials in this static JavaScript file. The prototype intentionally
  // stores bookings only in this browser and does not claim to send messages.

  track("booking_completed", {
    tutor_name: booking.tutorName,
    subject: booking.subject,
    grade: booking.studentGrade,
    selected_time: `${booking.date} ${booking.time}`,
    hourly_rate: booking.rate
  });

  document.querySelector("#confirmation-details").innerHTML = `
    <div class="reservation-status"><span aria-hidden="true">✓</span><strong>Reserved</strong></div>
    <dl>
      <div><dt>Student</dt><dd>${escapeHtml(booking.studentName)}</dd></div>
      <div><dt>Tutor</dt><dd>${escapeHtml(booking.tutorName)}</dd></div>
      <div><dt>Subject</dt><dd>${escapeHtml(booking.subject)}</dd></div>
      <div><dt>Date & time</dt><dd>${formatDate(booking.date)} · ${escapeHtml(booking.time)}</dd></div>
      <div><dt>Grade</dt><dd>${escapeHtml(booking.studentGrade)}</dd></div>
      <div><dt>Hourly rate</dt><dd>$${booking.rate}/hour</dd></div>
    </dl>`;

  bookingDialog.close();
  bookingForm.reset();
  renderTutors();
  confirmationDialog.showModal();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3000);
}

subjectFilter.addEventListener("change", () => {
  track("subject_filter_selected", { subject: subjectFilter.value });
  renderTutors();
});

gradeFilter.addEventListener("change", () => {
  track("grade_filter_selected", { grade: gradeFilter.value });
  renderTutors();
});

document.querySelector("#clear-filters").addEventListener("click", clearFilters);
document.querySelector("[data-clear-filters]").addEventListener("click", clearFilters);

tutorGrid.addEventListener("click", (event) => {
  const slotButton = event.target.closest(".slot-button");
  if (slotButton) selectSlot(slotButton);
  const bookButton = event.target.closest("[data-book-tutor]");
  if (bookButton) openBooking(bookButton.dataset.bookTutor);
});

document.querySelectorAll("[data-subject-jump]").forEach((button) => {
  button.addEventListener("click", () => {
    subjectFilter.value = button.dataset.subjectJump;
    track("subject_filter_selected", { subject: subjectFilter.value });
    renderTutors();
    document.querySelector("#tutors").scrollIntoView();
  });
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => bookingDialog.close()));
document.querySelector("[data-close-confirmation]").addEventListener("click", () => confirmationDialog.close());
document.querySelector("[data-book-another]").addEventListener("click", () => {
  confirmationDialog.close();
  document.querySelector("#tutors").scrollIntoView({ behavior: "smooth" });
});
bookingForm.addEventListener("submit", completeBooking);

document.querySelector("#reset-bookings").addEventListener("click", () => {
  if (!getBookings().length) {
    showToast("There are no demo bookings to reset.");
    return;
  }
  if (window.confirm("Reset all demo bookings on this device?")) {
    localStorage.removeItem(STORAGE_KEY);
    renderTutors();
    showToast("Demo bookings have been reset.");
  }
});

const menuButton = document.querySelector(".menu-button");
const mainNav = document.querySelector("#main-nav");
menuButton.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});
mainNav.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
});

document.querySelector("#current-year").textContent = new Date().getFullYear();
populateSubjects();
renderTutors();
initializePostHog();
