# Implementation Plan — Expense & Budget Visualizer

## Status Legend
- [x] Completed
- [ ] Pending

---

## Wave 0 — Project Scaffold

- [x] **T-1** Create `index.html`
  - Semantic structure: header, balance card, form, monthly summary, chart, transaction list, footer
  - Chart.js CDN script tag
  - Theme toggle button in header
  - All required IDs: `balanceAmount`, `transactionForm`, `itemName`, `itemAmount`, `itemCategory`, `spendingChart`, `monthSelector`, `sortSelect`, `formError`, `transactionList`
  - _Requirements: 1.1, 4.1, 7.1–7.3, 7.6, 8.1, 8.5_

- [x] **T-2** Create `css/style.css`
  - CSS Custom Properties for all colors (light + dark modes)
  - Background: maroon `#6b1a1a` (light), `#1a0a0a` (dark)
  - Primary/brand: black `#1a1a1a` (light), `#444444` (dark)
  - Mobile-first responsive layout, no horizontal scroll 360–1920 px
  - Dark/light mode via `[data-theme="dark"]` on `<html>`
  - Smooth transitions on theme switch
  - _Requirements: 2.2, 2.6, 8.1, 8.4, 8.6, 8.7_

---

## Wave 1 — Core Logic (js/app.js)

- [x] **T-3** Storage module
  - `Storage.get(key, fallback)` — JSON.parse in try/catch
  - `Storage.set(key, value)` — JSON.stringify in try/catch
  - _Requirements: 6.1–6.6_

- [x] **T-4** State module
  - `transactions[]`, `categories[]`, `sortBy`, `selectedMonth`
  - `load()` from localStorage, `saveTransactions()`, `saveCategories()`
  - `addTransaction(name, amount, category)` → `{ id, name, amount, category, date }`
  - `deleteTransaction(id)`
  - `addCategory(name)` — deduplication + persist
  - `getSorted()` — returns sorted copy (5 options)
  - `getMonthlySummary()` → `{ 'YYYY-MM': { total, byCategory } }`
  - `colorForCategory()` — deterministic from CHART_COLORS[]
  - _Requirements: 1.2, 2.3, 3.2–3.4, 6.1–6.7_

---

## Wave 2 — Render Layer

- [x] **T-5** `Render.balance()` — sum all amounts, update `#balanceAmount` with `formatCurrency()`
- [x] **T-6** `Render.categoryDropdown()` — rebuild `<select>` from `State.categories`
- [x] **T-7** `Render.list()` — render sorted transactions with escapeHTML, show/hide `#listEmpty`
- [x] **T-8** `Render.chart()` — create/update Chart.js pie; show `#chartEmpty` when no data
- [x] **T-9** `Render.monthSelector()` + `Render.monthlySummary()` — monthly breakdown with chips
- [x] **T-10** `Render.all()` — calls all render functions

---

## Wave 3 — Form & Events

- [x] **T-11** Form module
  - Validate: name non-empty, amount > 0, category selected
  - `showError()` / `clearError()`
  - Custom category inline UI (show/hide, save, cancel, Enter/Escape keys)
  - Clear form on successful submit
  - _Requirements: 1.1–1.9_

- [x] **T-12** Events module
  - Delegated delete click on `#transactionList`
  - Sort change on `#sortSelect`
  - Month change on `#monthSelector`
  - _Requirements: 2.3, 3.1–3.5, OC-3_

---

## Wave 4 — Theme & Polish

- [x] **T-13** Theme module
  - `apply(mode)` — sets `data-theme`, updates button icon 🌙/☀️ and label
  - `load()` — reads `expense_theme` from localStorage
  - `toggle()` — switches and persists
  - `init()` — wires `#themeToggle` click
  - _Design system requirement: dark/light persistence_

- [x] **T-14** `init()` bootstrap function
  - Order: Theme.init() → State.load() → Render.cacheEls() → Form.init() → Events.init() → Render.all()

---

## Wave 5 — README & Docs

- [x] **T-15** `README.md` — features table, tech stack, how to run, folder structure, GitHub Pages deploy steps
- [x] **T-16** `docs/requirements.md` — full requirements with acceptance criteria
- [x] **T-17** `docs/design.md` — architecture, data model, module responsibilities, error handling
- [x] **T-18** `docs/tasks.md` — this file
- [x] **T-19** `docs/design-system.md` — color tokens, theming rules, coding conventions
- [x] **T-20** `.kiro/steering/design-system.md` — always-included Kiro steering rule

---

## Optional Challenges

| ID | Feature | Status |
|----|---------|--------|
| OC-1 | Custom categories (+ button, persist) | ✅ Done |
| OC-2 | Monthly summary view (selector + breakdown chips) | ✅ Done |
| OC-3 | Sort transactions (5 options) | ✅ Done |

---

## Notes

- No build step — open `index.html` directly in any modern browser.
- All data stays in the browser (`localStorage`), no network requests.
- `escapeHTML()` used on every piece of user input before DOM insertion.
- `localStorage` always wrapped in `try/catch` via `Storage` module.
- Deployable to GitHub Pages (static files, relative paths only).
