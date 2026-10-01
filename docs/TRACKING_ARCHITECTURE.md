# Costa Ledger - Analytics & Tracking Architecture

## 1. Overview
This document outlines the hybrid tracking architecture for `costaledger.com`. The system utilizes a dual-tracking approach (Client-Side + Server-Side) to ensure data accuracy, bypass aggressive ad-blockers, and feed high-quality conversion data to ad platforms and analytics dashboards.

**Core Stack:**
* **Frontend:** Astro
* **Backend API:** Cloudflare Workers (`/api/subscribe.js`)
* **CRM:** Klaviyo
* **Ad Network:** Meta Conversions API (CAPI)
* **Analytics:** Plausible Analytics (Events API)

---

## 2. Global Event Routing & Nomenclature

The backend API (`subscribe.js`) conditionally routes payloads based on the `list_type`, `source_page`, and `form_used` parameters sent from the frontend.

### A. General Newsletter (Brief)
* **Pages Affected:** `/join` (and standard footer forms)
* **Klaviyo:** Routed to `KLAVIYO_LIST_GENERAL`
* **Meta CAPI:** 
  * Event Name: `Subscribe`
  * Content Name: `Vault Newsletter`
* **Plausible:**
  * Event Name: `LeadCapture`
  * Props: `source: general`, `page_path: <URL>`

### B. Intelligence Report
* **Pages Affected:** `/report`
* **Klaviyo:** Routed to `KLAVIYO_LIST_REPORT`
* **Meta CAPI:** 
  * Event Name: `Lead`
  * Content Name: `Intelligence Report`
* **Plausible:**
  * Event Name: `LeadCapture`
  * Props: `source: report`, `page_path: <URL>`

### C. Partner Advisory & Paid Advertorials
* **Pages Affected:** `/apply`, `/special/**` (e.g., `/special/capital-shift/`)
* **Klaviyo:** Routed to `KLAVIYO_LIST_ADVISORY`
* **Meta CAPI:** 
  * Event Name: `Lead`
  * Content Name: `Partner Advisory`
* **Plausible:**
  * Event Name: `PartnerLeadCapture`
  * Props: `service_requested: advisory`, `page_path: <URL>`

---

## 3. Server-Side APIs Configuration

### Meta Conversions API (CAPI)
To ensure highest Event Match Quality (EMQ) and deduplication with the frontend Meta Pixel, the server payload strictly includes:
* **Event Time:** Unix timestamp.
* **Action Source:** `website`.
* **Event Source URL:** Exact request origin and pathname.
* **User Data Hashing:** `email` and `first_name` are hashed using **SHA-256** prior to transmission.
* **Network Data:** `client_ip_address` (via CF-Connecting-IP) and `client_user_agent` are captured and forwarded.

### Plausible Events API
Plausible operates privacy-first without requiring user identifiers. The server mimics frontend requests by forwarding:
* **Headers:** `User-Agent` and `X-Forwarded-For` (IP).
* **Payload:** Target `domain` (costaledger.com), `url`, `name` (Event), and custom `props`.

---

## 4. Plausible Analytics Dashboard Setup

To properly visualize the server-side data, the Plausible dashboard is explicitly configured with the following Goals and Funnels.

### A. Registered Goals
All custom server and frontend events must be declared as Goals to appear on the dashboard.
* **Custom Events:**
  * `LeadCapture`
  * `PartnerLeadCapture`
  * `Vault CTA Clicks`
  * `Advertorial CTA Clicks`
* **Pageview Goals:**
  * `Visit /report/`
  * `Visit /join/`
  * `Visit /special/**` *(Note: Uses `**` wildcard to capture all advertorial sub-pages).*

### B. Conversion Funnels
Funnels are set to **Sequential** type to track the exact user drop-off across the 3-step journey: Landing -> Intent (CTA Click) -> Conversion (Server-side Event).

**1. Report Conversion**
* Step 1: `Visit /report/`
* Step 2: `Vault CTA Clicks`
* Step 3: `LeadCapture`

**2. Brief Conversion**
* Step 1: `Visit /join/`
* Step 2: `Vault CTA Clicks`
* Step 3: `LeadCapture`

**3. Advertorial to Lead (Paid)**
* Step 1: `Visit /special/**`
* Step 2: `Advertorial CTA Clicks`
* Step 3: `LeadCapture` / `PartnerLeadCapture` (Depending on specific advertorial setup)

**4. Partner Advisory Application**
* Step 1: Pageview (e.g., `/apply`)
* Step 2: `PartnerLeadCapture`

---
*Note: Drop-off rates per specific article/page can be analyzed without funnels by clicking the `LeadCapture` goal in Plausible and viewing the "Top Pages" breakdown filtered by CR (Conversion Rate).*