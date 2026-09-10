# Costa Ledger - Visual Asset & Image Tracker

Use this document to track image filenames, their references in code, and their design completion status. Place all production images in the `/public/` directory.

| Source Route / Component | Code Reference / Purpose | Target Filename (`/public/`) | Status |
| :--- | :--- | :--- | :--- |
| `src/layouts/Layout.astro` | Browser Favicon | `favicon.png` | 🟢 Ready |
| `src/pages/index.astro` | Homepage Hero Background Image | `hero-bg.jpg` | 🟢 Ready |
| `src/content/intelligence/2026-08-beckham-law-update.md` | Beckham Law Article Cover | `beckham-cover.jpg` | 🟢 Ready |
| `src/content/intelligence/2026-09-portugal-emerging-markets.md` | Portugal Emerging Markets Cover | `portugal-emerging-cover.jpg` | 🟡 Pending |
| `src/content/intelligence/2026-09-portugal-golden-visa-audit.md` | Golden Visa Audit Cover | `portugal-visa-cover.jpg` | 🟡 Pending |
| `src/content/intelligence/2026-09-portugal-market-outlook.md` | Portugal Market Outlook Cover | `portugal-outlook-cover.jpg` | 🟡 Pending |
| `src/pages/report.astro` | PDF Executive Briefing Mockup Card | `report-cover-2026.png` | 🟡 Pending |

---

### Workflow for Adding New Images
1. Save the new image in web-optimized format (`.jpg`, `.png`, or `.webp`).
2. Rename the file to match the exact filename listed in the **Target Filename** column.
3. Upload the file to the `/public/` folder in the project root.
4. Update the **Status** column in this file to `🟢 Ready`.