# Costa Ledger - Architecture Rules & Technical Standards

This guide outlines the technical architecture, design patterns, and deployment rules for the Costa Ledger platform to maintain code integrity, ensure privacy compliance, and prevent regressions.

---

## 1. Header Navigation System

The layout system (`src/layouts/Layout.astro`) supports two distinct header states controlled by props:

- **Full Navigation Header (`minimalHeader={false}`):**
  - Used on primary content pages (`/`, `/categories`, `/intelligence/*`).
  - Includes full desktop navigation links, search/filter entry points, and the slide-over mobile drawer.
- **Minimal / Funnel Header (`minimalHeader={true}`):**
  - Used on high-conversion landing pages (`/join`, `/report`) and Advertorial pages (`src/pages/special/*`).
  - Removes main menu links to eliminate exit routes.
  - Displays a custom section tag via the `headerLabel` prop (e.g., `SPECIAL INTELLIGENCE REPORT` or `SECURE PARTNER PORTAL`).
- **Logo Link Control (`disableLogoLink={boolean}`):**
  - Defaults to `true` when `isAdvertorial={true}`.
  - Renders the brand logo as a static element to prevent users from navigating away from conversion funnels.
- **Top Blue Ticker:**
  - Remains persistently visible across both header modes to reinforce brand authority.

---

## 2. Footer & Mobile Drawer Architecture

- **Global Footer:** Rendered at the bottom of `Layout.astro`. Contains regulatory disclosures, copyright labels, and legal navigation (`/privacy`, `/terms`, `/disclosures`, `/cookies`). All legal links strictly enforce `target="_blank" rel="noopener noreferrer"`.
- **Mobile Navigation Drawer:** A full-screen overlay in `Layout.astro` executed via zero-framework inline Vanilla JS (`is:inline`) for instant mobile response.

---

## 3. Lead Capture & Consultation Components

The platform separates top-of-funnel email capture from bottom-of-funnel advisory requests using two distinct components:

### A. Subscription Form (`BriefingForm.astro`)
- **Purpose:** Handles newsletter subscriptions (`/join`) and report downloads (`/report`).
- **Variants:**
  - **Join Page (`/join`):** `showCheckboxes={false}` with double opt-in text.
  - **Report Page (`/report`):** `showCheckboxes={true}` with mandatory privacy checkbox.
- **Routing:** Routes entries to `KLAVIYO_LIST_GENERAL` or `KLAVIYO_LIST_REPORT`.

### B. Partner Consultation Form (`ConsultationForm.astro`)
- **Purpose:** Captures high-intent partner advisory leads (`/special/apply`).
- **Fields:** Full Name, Email Address, Phone Number (optional), and Primary Interest dropdown.
- **Privacy & Data Handoff Compliance:**
  - Enforces two explicit, non-pre-checked checkboxes (`required`):
    1. Direct contact authorization by Costa Ledger.
    2. Explicit consent to share necessary request details with regulated third-party partners, including explicit disclosure of potential affiliate compensation.
- **Routing:** Sends `list_type: "advisory"`, mapping submissions directly to `KLAVIYO_LIST_ADVISORY`.

---

## 4. Advertorial & Sandbox Funnel Architecture (`src/pages/special/*`)

Advertorial pages live isolated inside `src/pages/special/` to serve paid or private campaign traffic without cluttering organic Vault indexes.

- **Layout Configuration:** Instantiated with `<Layout minimalHeader={true} headerLabel="SPECIAL INTELLIGENCE REPORT" isAdvertorial={true}>`.
- **Typography & Aesthetics:** Matches The Vault's design language (`font-sans` body, `font-serif` headings, left-aligned article header with a vertical gold accent line `border-l-2 border-[#C5A059]`).
- **Clean Drop Caps:** Uses standard left-aligned paragraphs for uniform cross-browser rendering (avoids unaligned floating `:first-letter` CSS pseudo-elements).
- **Image Captions:** Styled at `text-xs sm:text-sm text-[#666666] italic`.
- **CTA Callout Block:** Standardized callout container replacing embedded forms to push readers toward dedicated application funnels (`/special/apply`).

---

## 5. Analytics & Event Delegation (Plausible Integration)

Telemetry is managed globally in `Layout.astro` using `is:inline` event delegation and data attributes:

- **Body Tag Context:** Renders `data-page-type="advertorial"` when `isAdvertorial={true}`, otherwise defaults to `data-page-type="vault"`.
- **CTA Click Delegation:**
  - Listens globally for clicks on conversion links (`/join`, `/report`, `/special/apply` or links with `data-track="cta"`).
  - Triggers `CTAClickAdvertorial` if `data-page-type="advertorial"`, or `CTAClickVault` for organic vault pages.
- **Dynamic Campaign Attribution (`?src=` Auto-Append):**
  - On advertorial pages, JS automatically appends the current path (`?src=/special/page-name`) to all conversion links upon `DOMContentLoaded`.
  - Enables effortless A/B testing across multiple funnel variants (`/special/apply`, `/special/apply2`) without manual parameter wiring.
- **Conversion Tracking (`PartnerLeadCapture`):**
  - Fired upon successful HTTP 200 response from `ConsultationForm.astro`.
  - Passes custom properties: `page_path`, `source_advertorial`, `source_button`, and `service_requested`.

---

## 6. Serverless Backend & Cloudflare Adapter (`src/pages/api/subscribe.js`)

The backend runs on Cloudflare Workers via `@astrojs/cloudflare` in SSR mode (`export const prerender = false`).

### Execution Flow & Klaviyo 3-List Router
1. **Dynamic List Routing:**
   - Evaluates `list_type`, `source_page`, and `form_used` to resolve target Klaviyo List IDs:
     - `advisory` / `/apply` / `ConsultationForm` ➔ `KLAVIYO_LIST_ADVISORY` (`T6saqJ`)
     - `report` / `/report` ➔ `KLAVIYO_LIST_REPORT` (`VFDECK`)
     - Default ➔ `KLAVIYO_LIST_GENERAL` (`RkLAuk`)
2. **Profile Creation/Patching (`/api/profiles/`):**
   - Upserts profile with attributes (`first_name`, `phone_number`) and custom telemetry properties (`utm_source`, `utm_medium`, `utm_campaign`, `source_page`, `primary_interest`, `consent_version`, `subscriber_lifecycle_status`, `partner_consent_granted`, `contact_consent_granted`).
   - Handles HTTP 409 profile conflicts by retrieving duplicate profile IDs and patching records.
3. **Bulk Subscription Job (`/api/profile-subscription-bulk-create-jobs/`):**
   - Assigns profile to the resolved list ID with `consent: "SUBSCRIBED"`.

### Environment Variable Resolution
Secrets resolve via `locals.cloudflare.env` with fallback environment keys:
- `KLAVIYO_PRIVATE_API_KEY`: Klaviyo private API key (`pk_*`).
- `KLAVIYO_LIST_GENERAL`: Master subscriber list ID (`RkLAuk`).
- `KLAVIYO_LIST_REPORT`: Special report access list ID (`VFDECK`).
- `KLAVIYO_LIST_ADVISORY`: Partner advisory lead list ID (`T6saqJ`).