# Costa Ledger - Architecture Rules & Technical Standards

This guide outlines the technical architecture, design patterns, and deployment rules for the Costa Ledger platform to maintain code integrity and prevent regressions.

---

## 1. Header Navigation System

The layout system (`src/layouts/Layout.astro`) supports two distinct header states controlled by the `minimalHeader` boolean prop:

- **Full Navigation Header (`minimalHeader={false}`):**
  - Used on primary content pages (`/`, `/categories`, `/intelligence/*`).
  - Includes top announcements ticker, full desktop navigation links, search/filter entry points, and the slide-over mobile drawer.
- **Minimal Header (`minimalHeader={true}`):**
  - Used strictly on high-conversion landing pages (`/join`, `/report`).
  - Removes all navigation links and top tickers to eliminate exit routes and maximize conversion rate.

---

## 2. Footer & Mobile Drawer Architecture

- **Global Footer:** Rendered at the bottom of `Layout.astro`. Contains required regulatory disclosures, legal navigation (`/privacy`, `/terms`, `/disclosures`, `/cookies`), and unified copyright labels.
- **Mobile Navigation Drawer:** A full-screen overlay contained within `Layout.astro`. It uses inline vanilla JavaScript (`is:inline`) for zero-framework client execution and instant response on mobile devices.

---

## 3. Subscription Form Component (`BriefingForm.astro`)

The subscription and lead capture system is unified inside `src/components/BriefingForm.astro`:

### Shared Logic & Telemetry Capture
- **Required Fields:** Full Name and Email Address.
- **Interests Multi-Select:** Requires at least one interest area selected before submission. Validated on the client side via custom JS.
- **Telemetry & Attribution Payload:** The client script automatically extracts URL query parameters (`utm_source`, `utm_medium`, `utm_campaign`), current pathname (`source_page`), consent metadata (`consent_version`), and selected interests before posting to `/api/subscribe`.
- **Success Modal & Feedback:** Displays visual loading states on the submit button, pops the success modal upon HTTP 200, and returns verbose debug feedback via client alerts if API synchronization fails.

### Page-Specific Variants
- **Join Page (`/join`):** Uses `showCheckboxes={false}`. Displays single double opt-in confirmation text beneath the primary submit button.
- **Report Page (`/report`):** Uses `showCheckboxes={true}`. Enables mandatory Privacy Policy checkbox and optional communications opt-in checkbox.

---

## 4. Serverless Backend & Cloudflare Adapter (`src/pages/api/subscribe.js`)

The platform uses `@astrojs/cloudflare` on hybrid SSR mode to execute serverless backend routines on Cloudflare Workers.

### Execution Flow & Klaviyo Dual-Sync Strategy
1. **Profile Sync (`/api/profiles/`):** First creates or patches the Klaviyo profile storing `first_name` and custom telemetry properties (`utm_source`, `utm_medium`, `utm_campaign`, `source_page`, `interests`, `consent_version`, `subscriber_lifecycle_status`). Handles HTTP 409 conflicts gracefully by patching existing profile IDs.
2. **Subscription Job (`/api/profile-subscription-bulk-create-jobs/`):** Adds the email to the designated list (`KLAVIYO_LIST_GENERAL` or `KLAVIYO_LIST_REPORT`) with `consent: "SUBSCRIBED"`, triggering Klaviyo's native double opt-in verification flow.

### Environment Variable Resolution
Runtime secrets are accessed dynamically via `locals.cloudflare.env` with fallback environment keys:
- `KLAVIYO_PRIVATE_API_KEY`: Klaviyo private API key (`pk_*`).
- `KLAVIYO_LIST_GENERAL`: Primary briefing list ID (`RkLAuk`).
- `KLAVIYO_LIST_REPORT`: Specialized report access list ID (`VFDECK`).