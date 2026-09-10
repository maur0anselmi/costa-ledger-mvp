# Costa Ledger MVP - Post-MVP Backlog & Future Roadmap

This document records planned features, optimizations, and technical tasks deferred post-MVP launch.

## 1. Backend & Email API Integration
- [ ] **Transactional Email Endpoint:** Replace current simulated submission (`setTimeout`) with an active backend API endpoint (e.g., Cloudflare Workers + Resend, SendGrid, or ConvertKit).
- [ ] **Double Opt-In Flow:** Implement real-time email dispatch for subscription verification links (`/join`) and automated PDF download delivery (`/report`).
- [ ] **Form Spam Protection:** Integrate Turnstile or honeypot verification on `BriefingForm.astro` to prevent automated submissions.

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