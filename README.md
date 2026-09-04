# ABC Tutoring Prototype

A polished, responsive static prototype for a friendly K–12 tutoring service. The site lets parents filter realistic tutor profiles by subject and grade level, select a specific available time, and complete a booking form.

## Features

- Six sample tutors with specialties, qualifications, rates, grade levels, and availability
- Subject and grade-level filtering
- Accessible booking dialog with built-in form validation
- Booking persistence in `localStorage`
- Immediate slot locking to prevent double-booking on the same device
- Friendly confirmation details without pretending to send email or SMS
- Optional PostHog product analytics with no booking PII in event properties
- Responsive desktop and mobile layouts

## Run locally

No build step or dependencies are required. Open `index.html` directly, or serve the directory with any static web server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages

The site uses only relative paths and works directly from the repository root. In the repository settings, configure GitHub Pages to deploy from the `main` branch and root (`/`) directory.

## PostHog setup

At the beginning of `script.js`, replace the empty `POSTHOG_KEY` and `POSTHOG_HOST` values with the **Project API Key** and host shown in the PostHog project settings. Do not use a personal API key.

The prototype tracks page views plus:

- `tutor_viewed`
- `subject_filter_selected`
- `grade_filter_selected`
- `booking_started`
- `booking_completed`

Names, email addresses, phone numbers, and other personally identifying booking details are never included in PostHog event properties.

## Demo data

Bookings are stored only in the current browser under the `abcTutoringBookings` local-storage key. Use the subtle **Reset demo bookings** link in the footer to clear them during testing.
