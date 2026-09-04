const POSTHOG_KEY = window.ABC_POSTHOG_CONFIG?.key || "";
const POSTHOG_HOST = window.ABC_POSTHOG_CONFIG?.host || "";

const SIMULATED_TUTORS = [
  { name: "Maya Chen", subjects: ["Math", "Science"], grades: "Grades 6–10", rate: 48, time: "2026-09-08 4:00 PM" },
  { name: "Jordan Brooks", subjects: ["English", "Study Skills"], grades: "Grades 3–8", rate: 42, time: "2026-09-10 4:30 PM" },
  { name: "Elena Rodriguez", subjects: ["Science", "Math"], grades: "Grades 7–12", rate: 55, time: "2026-09-11 6:00 PM" },
  { name: "Samir Patel", subjects: ["Math", "Test Prep"], grades: "Grades 9–12", rate: 52, time: "2026-09-12 1:00 PM" },
  { name: "Grace Kim", subjects: ["English", "Test Prep"], grades: "Grades 6–12", rate: 50, time: "2026-09-16 5:30 PM" },
  { name: "Theo Williams", subjects: ["Math", "Study Skills"], grades: "Grades K–8", rate: 40, time: "2026-09-14 4:00 PM" },
  { name: "Aisha Rahman", subjects: ["History", "English"], grades: "Grades 6–12", rate: 46, time: "2026-09-17 4:30 PM" },
  { name: "Lucas Martinez", subjects: ["Elementary Tutoring", "Math"], grades: "Grades K–5", rate: 43, time: "2026-09-20 10:00 AM" },
  { name: "Priya Shah", subjects: ["SAT/College Prep", "English"], grades: "Grades 10–12", rate: 55, time: "2026-09-23 6:00 PM" },
  { name: "Noah Bennett", subjects: ["Science", "History"], grades: "Grades 4–8", rate: 44, time: "2026-09-22 5:15 PM" }
];
const SUBJECTS = ["Math", "English", "Science", "History", "Test Prep", "SAT/College Prep", "Study Skills", "Elementary Tutoring"];
const GRADES = ["Elementary", "Middle School", "Middle School", "High School"];

function initializePostHog() {
  if (!POSTHOG_KEY || !POSTHOG_HOST) throw new Error("PostHog is not configured.");
  const posthog = window.posthog = window.posthog || [];
  posthog._i = [];
  posthog.init = (key, config) => {
    ["capture", "reset"].forEach((method) => {
      posthog[method] = (...args) => posthog.push([method, ...args]);
    });
    // The CDN bootstrap expects the default instance name as the third value.
    posthog._i.push([key, config, "posthog"]);
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    const assetHost = POSTHOG_HOST.replace(/\/$/, "").replace(".i.posthog.com", "-assets.i.posthog.com");
    script.src = `${assetHost}/static/array.js`;
    document.head.appendChild(script);
  };
  posthog.__SV = 1;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    person_profiles: "identified_only"
  });
}

function capture(eventName, properties) {
  window.posthog.capture(eventName, { ...properties, assessment_simulation: true });
}

function simulateJourney(index) {
  window.posthog.reset();
  capture("$pageview", { $current_url: new URL("index.html", window.location.href).href });

  const subject = SUBJECTS[index % SUBJECTS.length];
  const grade = GRADES[index % GRADES.length];
  capture("subject_filter_selected", { subject });
  if (index % 4 !== 0) capture("grade_filter_selected", { grade });

  const views = 1 + (index % 3);
  let bookingTutor = SIMULATED_TUTORS[index % SIMULATED_TUTORS.length];
  for (let viewIndex = 0; viewIndex < views; viewIndex += 1) {
    const tutor = SIMULATED_TUTORS[(index + viewIndex) % SIMULATED_TUTORS.length];
    bookingTutor = tutor;
    capture("tutor_viewed", {
      tutor_name: tutor.name,
      tutor_subjects: tutor.subjects,
      grade_levels: tutor.grades,
      hourly_rate: tutor.rate
    });
  }

  const startsBooking = index % 3 !== 0;
  if (!startsBooking) return { views, starts: 0, completions: 0 };
  const selectedSubject = bookingTutor.subjects.includes(subject) ? subject : bookingTutor.subjects[0];
  capture("booking_started", {
    tutor_name: bookingTutor.name,
    subject: selectedSubject,
    selected_time: bookingTutor.time,
    hourly_rate: bookingTutor.rate
  });

  const completesBooking = index % 4 === 1;
  if (completesBooking) {
    capture("booking_completed", {
      tutor_name: bookingTutor.name,
      subject: selectedSubject,
      grade,
      selected_time: bookingTutor.time,
      hourly_rate: bookingTutor.rate
    });
  }
  return { views, starts: 1, completions: completesBooking ? 1 : 0 };
}

async function runSimulation(visitorCount) {
  const buttons = document.querySelectorAll("[data-simulate]");
  const status = document.querySelector("#simulation-status");
  buttons.forEach((button) => { button.disabled = true; });
  const totals = { views: 0, starts: 0, completions: 0 };

  for (let index = 0; index < visitorCount; index += 1) {
    const journey = simulateJourney(index);
    totals.views += journey.views;
    totals.starts += journey.starts;
    totals.completions += journey.completions;
    status.textContent = `Simulating visitor ${index + 1} of ${visitorCount}…`;
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }

  status.innerHTML = `<strong>Simulation complete.</strong> ${visitorCount} anonymous visitors generated ${totals.views} tutor views, ${totals.starts} booking starts, and ${totals.completions} completed bookings.`;
  buttons.forEach((button) => { button.disabled = false; });
}

initializePostHog();
document.querySelectorAll("[data-simulate]").forEach((button) => {
  button.addEventListener("click", () => runSimulation(Number(button.dataset.simulate)));
});
