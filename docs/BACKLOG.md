# Costa Ledger MVP - Post-MVP Backlog & Future Roadmap

This document records planned features, optimizations, and technical tasks deferred post-MVP launch.

## 1. Backend & Email API Integration
- [x] **Transactional Email Endpoint:** Serverless endpoint implemented at `src/pages/api/subscribe.js` via `@astrojs/cloudflare` adapter.
- [x] **Telemetry & Lead Capture Pipeline:** Automated UTM, source page, and consent version ingestion into Klaviyo custom profile properties.
- [ ] **Klaviyo Consent & Hosted Pages Customization:** Align all default Klaviyo transactional touchpoints with Costa Ledger brand styling (`#121212` background accents, serif typography, `#C5A059` gold branding):
  - [ ] **Email Confirmation:** Custom HTML template for Double Opt-In verification email.
  - [ ] **Subscription Confirmation Page:** Custom thank-you page displayed after confirming email.
  - [ ] **Preferences Page:** Custom UI for subscribers to update interest topics.
  - [ ] **Unsubscribe Page:** Branded opt-out confirmation screen.
- [ ] **Form Spam Protection:** Integrate Cloudflare Turnstile or honeypot verification on `BriefingForm.astro` to prevent automated bot submissions.

## 2. Developer Experience & Maintenance
- [ ] **VS Code Maintenance Agents:** Configure `.cursorrules` or `AGENTS.md` rulesets to automate code audits, accessibility checks, and Tailwind style enforcement.
- [ ] **Automated CI/CD Quality Checks:** Add GitHub Actions for ESLint, Astro check, and build verification prior to merging PRs into `main`.

## 3. SEO & Analytics
- [ ] **Privacy-First Web Analytics:** Integrate lightweight, cookie-free analytics (e.g., Plausible or Cloudflare Web Analytics).
- [ ] **Automated Sitemap & Robots:** Add `@astrojs/sitemap` to dynamically generate `sitemap.xml` on every build.
- [ ] **Dynamic OpenGraph (OG) Images:** Implement automated social share preview card generation for articles and reports.

## 4. Platform & Search Features
- [ ] **Content Search & Advanced Filtering:** Add instant text search and dynamic pillar filtering on `/categories`.
- [ ] **Reader Bookmarking / Offline Reading:** Allow users to save intelligence articles locally via `localStorage`.