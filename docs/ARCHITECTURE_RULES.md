## 5. Analytics, Event Delegation & Hybrid Tracking

Telemetry is managed using a hybrid approach (Frontend delegation for intent + Server-Side for conversions) to ensure accuracy and bypass aggressive ad-blockers.

- **Body Tag Context:** Renders `data-page-type="advertorial"` when `isAdvertorial={true}`, otherwise defaults to `data-page-type="vault"`.
- **Frontend CTA Click Delegation (Plausible):**
  - Listens globally for clicks on conversion links (`/join`, `/report`, `/special/apply` or links with `data-track="cta"`).
  - Triggers `CTAClickAdvertorial` if `data-page-type="advertorial"`, or `CTAClickVault` for organic vault pages.
- **Dynamic Campaign Attribution (`?src=` Auto-Append):**
  - On advertorial pages, JS automatically appends the current path (`?src=/special/page-name`) to all conversion links upon `DOMContentLoaded`.
  - Enables effortless A/B testing across multiple funnel variants (`/special/apply`, `/special/apply2`) without manual parameter wiring.
- **Server-Side Conversion Tracking:**
  - Conversion events (`LeadCapture`, `PartnerLeadCapture`, and Meta `Lead`/`Subscribe`) are completely decoupled from the frontend browser and handled securely via `src/pages/api/subscribe.js` upon successful form submission.

---

## 6. Serverless Backend & Cloudflare Adapter (`src/pages/api/subscribe.js`)

The backend runs on Cloudflare Workers via `@astrojs/cloudflare` in SSR mode (`export const prerender = false`). It orchestrates a 3-part data flow: CRM, Ad Network, and Analytics.

### Execution Flow
1. **Dynamic List Routing (Klaviyo):**
   - Evaluates `list_type`, `source_page`, and `form_used` to resolve target Klaviyo List IDs:
     - `advisory` / `/apply` ➔ `KLAVIYO_LIST_ADVISORY`
     - `report` / `/report` ➔ `KLAVIYO_LIST_REPORT`
     - Default ➔ `KLAVIYO_LIST_GENERAL`
2. **Profile Creation/Patching & Subscription (Klaviyo):**
   - Upserts profile with attributes and custom telemetry properties (`utm_source`, `consent_version`, etc.). Handles HTTP 409 profile conflicts by retrieving duplicate profile IDs and patching records, then assigns the profile to the resolved list ID.
3. **Meta Conversions API (CAPI):**
   - **Data Security:** Hashes `email` and `first_name` using strict SHA-256 encoding.
   - **Event Match Quality (EMQ):** Extracts and forwards `CF-Connecting-IP` (or `x-forwarded-for`) and `user-agent` from request headers.
   - **Routing:** Sends `Lead` for Advisory/Report, and `Subscribe` for general newsletters.
4. **Plausible Events API (Server-Side):**
   - Triggers `LeadCapture` or `PartnerLeadCapture` directly to Plausible's `/api/event` endpoint.
   - Forwards network headers (`X-Forwarded-For` and `User-Agent`) to accurately attribute unique visitors while bypassing frontend ad-blockers.

### Environment Variable Resolution
Secrets resolve via `locals.cloudflare.env` with fallback environment keys:
- `KLAVIYO_PRIVATE_API_KEY`: Klaviyo private API key (`pk_*`).
- `KLAVIYO_LIST_GENERAL` / `KLAVIYO_LIST_REPORT` / `KLAVIYO_LIST_ADVISORY`: Target audience lists.
- `META_ACCESS_TOKEN`: Long-lived access token for Meta Graph API.