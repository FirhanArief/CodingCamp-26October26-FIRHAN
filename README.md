# 💰 Expense & Budget Visualizer

A mobile-friendly, zero-dependency web app for tracking daily spending. No server, no signup — just open and go.

---

## Features

| Feature | Description |
|---------|-------------|
| **Total Balance** | Displays your cumulative spending, auto-updates on every add/delete |
| **Add Transaction** | Input form with Item Name, Amount, and Category; validates all fields |
| **Transaction List** | Scrollable list with category badge, date, and per-item delete button |
| **Pie Chart** | Visual breakdown of spending by category (Chart.js); shows friendly empty state when empty |
| **Custom Categories** | Add your own categories (Health, Entertainment, etc.) — persisted in Local Storage |
| **Monthly Summary** | Month selector showing total and per-category breakdown for any month |
| **Sort Transactions** | Sort by: Newest/Oldest, Amount (High→Low / Low→High), Category (A→Z) |

---

## Tech Stack

- **HTML5** — semantic structure
- **CSS3** — custom properties, flexbox, mobile-first responsive layout
- **Vanilla JavaScript** (ES6+) — no frameworks
- **[Chart.js 4](https://www.chartjs.org/)** — loaded via CDN for the pie chart
- **LocalStorage** — all data persisted client-side

---

## How to Run

### Option A — Open directly

1. Clone or download this repository.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).

```bash
# If you have git installed
git clone https://github.com/your-username/expense-budget-visualizer.git
cd expense-budget-visualizer
# Then just open index.html
```

### Option B — GitHub Pages

1. Push the repository to GitHub.
2. Go to **Settings → Pages**.
3. Set the source to the `main` branch, root (`/`) folder.
4. GitHub will provide a URL like `https://your-username.github.io/expense-budget-visualizer/`.

> No build step required — everything is static.

---

## Folder Structure

```
/
├── index.html          # App shell and markup
├── css/
│   └── style.css       # All styles (mobile-first)
├── js/
│   └── app.js          # All application logic
└── README.md
```

---

## Data Storage

All data lives in your browser's **LocalStorage** under two keys:

| Key | Contents |
|-----|----------|
| `expense_transactions` | Array of transaction objects |
| `expense_categories` | Array of category strings (including custom ones) |

To reset all data, open DevTools → Application → Local Storage → delete the two keys above.

---

## Browser Support

Works in any modern browser that supports ES6, LocalStorage, and Canvas:

- Chrome / Edge 80+
- Firefox 75+
- Safari 13.1+

---

## Credits

Built with ❤️ for the RevoU CodingCamp project — Vanilla JS only.
