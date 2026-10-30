# Design Document — Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a single-page, client-side app built with HTML, CSS, and vanilla JavaScript. It has no backend and no build step. Transactions are persisted in `localStorage`, and a pie chart of spending by category is drawn with Chart.js (CDN).

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Fixed file layout** | `index.html` at root, one `css/style.css`, one `js/app.js`. Chart.js via CDN — no extra file in `js/`. |
| **CSS Custom Properties for theming** | All colors in `:root` (light) and `[data-theme="dark"]`. Switching themes is a single attribute change on `<html>`. |
| **Single state, full re-render** | In-memory `transactions[]` is the source of truth. Every change calls `Render.all()`. Fast enough for 500 items. |
| **Modular JS, no classes** | Code split into `Storage`, `State`, `Render`, `Form`, `Events`, `Theme` plain objects in one file. Readable without a bundler. |
| **escapeHTML on all user input** | User text is always escaped before `innerHTML`. Prevents XSS. |
| **try/catch around all Storage calls** | `localStorage` can throw (`SecurityError`, `QuotaExceededError`). All access is wrapped. |

---

## Architecture

```
index.html
  └── css/style.css          (all styles, mobile-first)
  └── js/app.js              (all logic)
       ├── Storage            wraps localStorage with try/catch
       ├── State              in-memory data, CRUD, sort, summary
       ├── Render             all DOM updates (balance, list, chart, monthly)
       ├── Form               form submit, validation, custom categories
       ├── Events             delegated listeners (delete, sort, month select)
       └── Theme              dark/light toggle, localStorage persistence
```

### Data Flow (Add Transaction)

```
User submits form
  → Form.handleSubmit()
      → validate fields
          ✗ → showError(), return
          ✓ → State.addTransaction()
                → Storage.set() (localStorage)
              → Render.all()
                  → Render.balance()
                  → Render.categoryDropdown()
                  → Render.list()
                  → Render.chart()
                  → Render.monthSelector()
                  → Render.monthlySummary()
```

### Data Flow (Delete Transaction)

```
User clicks Delete button
  → Events delegated click on #transactionList
      → State.deleteTransaction(id)
            → Storage.set()
      → Render.all()
```

---

## Component Details

### index.html

Page order (top to bottom):

1. `<header>` — app title, subtitle, theme toggle button
2. Balance card — `#balanceAmount`
3. Add Transaction form — `#transactionForm`
4. Monthly Summary — `#monthSelector`, `#monthlyTotal`, `#monthlyCategoryBreakdown`
5. Pie Chart — `#spendingChart` canvas, `#chartEmpty` placeholder
6. Transaction List — `#transactionList`, `#listEmpty`, `#sortSelect`
7. `<footer>` — author credit

### css/style.css

- **Mobile-first** — base styles for small screens, `@media (min-width: 600px)` and `768px` breakpoints.
- **CSS Custom Properties** — all colors in `:root` (light) and `[data-theme="dark"]`. No hardcoded hex outside `:root`.
- **Transitions** — `background-color`, `color`, `border-color` transition `0.3s ease` for smooth theme switching.
- **Color scheme:**

| Token | Light | Dark |
|-------|-------|------|
| `--color-bg` | `#6b1a1a` (maroon) | `#1a0a0a` |
| `--color-card` | `#ffffff` | `#2d1b1b` |
| `--color-primary` | `#1a1a1a` (black) | `#444444` |
| `--color-header-bg` | `#4a0f0f` | `#0f0505` |
| `--color-balance-bg` | gradient black | gradient dark |

### js/app.js — Module Responsibilities

#### `Storage`
- `get(key, fallback)` — JSON.parse with try/catch
- `set(key, value)` — JSON.stringify with try/catch

#### `State`
- `transactions[]` — array of `{ id, name, amount, category, date }`
- `categories[]` — default + custom categories
- `sortBy` — current sort key
- `selectedMonth` — current month filter
- `load()`, `saveTransactions()`, `saveCategories()`
- `addTransaction()`, `deleteTransaction()`, `addCategory()`
- `getSorted()` — returns sorted copy of transactions
- `getMonthlySummary()` — `{ 'YYYY-MM': { total, byCategory } }`
- `colorForCategory()` — deterministic color from CHART_COLORS[]

#### `Render`
- `balance()` — recalculate and display total
- `categoryDropdown()` — rebuild `<select>` from State.categories
- `list()` — re-render sorted transaction list with escapeHTML
- `chart()` — create/update/destroy Chart.js pie chart
- `monthSelector()` — rebuild month `<select>`
- `monthlySummary()` — render total + category chips for selected month
- `all()` — calls all of the above

#### `Form`
- Validates: name (non-empty), amount (> 0), category (selected)
- `showError()` / `clearError()`
- Custom category inline UI (show/hide input, save, cancel)

#### `Events`
- Delegated delete on `#transactionList`
- Sort change on `#sortSelect`
- Month change on `#monthSelector`

#### `Theme`
- `apply(mode)` — sets `data-theme` on `<html>`, updates icon/label
- `load()` — reads `expense_theme` from localStorage
- `toggle()` — switches mode and persists
- `init()` — wires toggle button click

---

## Data Model

```js
Transaction {
  id:       string,   // genId() — timestamp + random
  name:     string,   // 1–60 chars, escaped on render
  amount:   number,   // float, > 0
  category: string,   // from State.categories[]
  date:     string,   // ISO 8601 (new Date().toISOString())
}
```

LocalStorage keys:

| Key | Value |
|-----|-------|
| `expense_transactions` | `JSON.stringify(Transaction[])` |
| `expense_categories` | `JSON.stringify(string[])` (custom only) |
| `expense_theme` | `"light"` \| `"dark"` |

---

## Error Handling

| Situation | Behavior |
|-----------|----------|
| Form submitted with empty/invalid fields | Inline error message shown; transaction not added; form values retained |
| localStorage read throws | `Storage.get()` returns fallback; app continues with empty/default state |
| localStorage write throws | `Storage.set()` logs warning; in-memory state still updated |
| Chart.js not loaded (CDN blocked) | Canvas hidden; `#chartEmpty` placeholder shown |
| Corrupted localStorage data | `State.load()` falls back to `[]`; app starts fresh |
| User input in DOM | Always passed through `escapeHTML()` before `innerHTML` |

---

## Optional Challenges Implemented

### OC-1: Custom Categories
- Inline "＋" button next to category dropdown reveals an input row
- `State.addCategory(name)` deduplicates and persists to `expense_categories`
- New category immediately appears in dropdown and chart

### OC-2: Monthly Summary
- `State.getMonthlySummary()` aggregates transactions by `YYYY-MM` key
- Month `<select>` rebuilt on every `Render.all()` call
- "All Time" option aggregates everything

### OC-3: Sort Transactions
- 5 sort options: Newest, Oldest, Amount High→Low, Amount Low→High, Category A→Z
- Sort applied in `State.getSorted()` — original array never mutated
- Sort state persists for the session (not in localStorage)
