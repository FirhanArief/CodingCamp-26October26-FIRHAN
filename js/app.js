/**
 * Expense & Budget Visualizer — app.js
 * Single-file Vanilla JS application.
 * Modules: Storage, State, Render (Balance/List/Chart/Monthly), Form, Sort, Init
 */

/* ============================================================
   1. CONSTANTS & CONFIG
   ============================================================ */

const STORAGE_KEYS = {
  transactions: 'expense_transactions',
  categories:   'expense_categories',
  theme:        'expense_theme',
};

/** Default categories always available */
const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];

/**
 * Color palette for chart segments and transaction dots.
 * Index maps to sorted category position.
 */
const CHART_COLORS = [
  '#6c63ff', '#f97316', '#22c55e', '#facc15',
  '#ec4899', '#14b8a6', '#8b5cf6', '#f43f5e',
  '#0ea5e9', '#a16207', '#16a34a', '#db2777',
];

/** Currency formatter (Indonesian Rupiah) */
const formatCurrency = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

/** Month label formatter */
const formatMonth = (isoDate) => {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
};

/** Month key (YYYY-MM) from an ISO date string */
const monthKey = (isoDate) => isoDate.slice(0, 7);

/**
 * Escape HTML special chars to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
const escapeHTML = (str) => {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * Generate a simple unique ID (timestamp + random).
 * @returns {string}
 */
const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/* ============================================================
   2. STORAGE MODULE
   Wraps localStorage in try/catch to avoid crashes on
   corrupted data or private browsing restrictions.
   ============================================================ */

const Storage = {
  /**
   * Read and JSON-parse an item from localStorage.
   * @param {string} key
   * @param {*} fallback  Returned when key missing or parse fails.
   */
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[Storage] Failed to read "${key}":`, e);
      return fallback;
    }
  },

  /**
   * JSON-stringify and save a value to localStorage.
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[Storage] Failed to write "${key}":`, e);
    }
  },
};

/* ============================================================
   3. STATE MODULE
   In-memory application state — single source of truth.
   ============================================================ */

const State = {
  /** @type {Array<{id:string, name:string, amount:number, category:string, date:string}>} */
  transactions: [],

  /** @type {string[]} All categories (defaults + custom) */
  categories: [],

  /** Current sort key */
  sortBy: 'date-desc',

  /** Currently selected month key (YYYY-MM) or 'all' */
  selectedMonth: 'all',

  /** Load state from LocalStorage */
  load() {
    this.transactions = Storage.get(STORAGE_KEYS.transactions, []);
    const saved = Storage.get(STORAGE_KEYS.categories, []);
    // Merge defaults with saved custom categories, preserving order
    const merged = [...DEFAULT_CATEGORIES];
    saved.forEach((cat) => {
      if (!merged.includes(cat)) merged.push(cat);
    });
    this.categories = merged;
  },

  /** Persist transactions to LocalStorage */
  saveTransactions() {
    Storage.set(STORAGE_KEYS.transactions, this.transactions);
  },

  /** Persist categories to LocalStorage */
  saveCategories() {
    Storage.set(STORAGE_KEYS.categories, this.categories);
  },

  /** Add a transaction and persist */
  addTransaction(name, amount, category) {
    const txn = {
      id: genId(),
      name,
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString(),
    };
    this.transactions.unshift(txn); // newest first
    this.saveTransactions();
    return txn;
  },

  /** Remove a transaction by id and persist */
  deleteTransaction(id) {
    this.transactions = this.transactions.filter((t) => t.id !== id);
    this.saveTransactions();
  },

  /** Add a custom category and persist */
  addCategory(name) {
    if (!this.categories.includes(name)) {
      this.categories.push(name);
      this.saveCategories();
      return true;
    }
    return false; // already exists
  },

  /** Return transactions sorted per current sortBy */
  getSorted() {
    const list = [...this.transactions];
    switch (this.sortBy) {
      case 'amount-desc':   return list.sort((a, b) => b.amount - a.amount);
      case 'amount-asc':    return list.sort((a, b) => a.amount - b.amount);
      case 'category-asc':  return list.sort((a, b) => a.category.localeCompare(b.category));
      case 'date-asc':      return list.sort((a, b) => new Date(a.date) - new Date(b.date));
      case 'date-desc':
      default:              return list.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  },

  /** Return a map of { monthKey: total } for all transactions */
  getMonthlySummary() {
    const map = {};
    this.transactions.forEach(({ date, amount, category }) => {
      const key = monthKey(date);
      if (!map[key]) map[key] = { total: 0, byCategory: {} };
      map[key].total += amount;
      map[key].byCategory[category] = (map[key].byCategory[category] || 0) + amount;
    });
    return map;
  },

  /**
   * Return the color string for a given category name.
   * Color is deterministic based on sorted index.
   */
  colorForCategory(category) {
    const idx = this.categories.indexOf(category);
    return CHART_COLORS[idx % CHART_COLORS.length] ?? '#94a3b8';
  },
};

/* ============================================================
   4. RENDER MODULE
   All DOM update functions. Never read from DOM for data —
   always use State as the source of truth.
   ============================================================ */

const Render = {
  // ── DOM references (cached on init) ──
  els: {},

  /** Cache frequently used DOM nodes */
  cacheEls() {
    this.els = {
      balanceAmount:          document.getElementById('balanceAmount'),
      transactionList:        document.getElementById('transactionList'),
      listEmpty:              document.getElementById('listEmpty'),
      spendingChart:          document.getElementById('spendingChart'),
      chartEmpty:             document.getElementById('chartEmpty'),
      itemCategory:           document.getElementById('itemCategory'),
      monthSelector:          document.getElementById('monthSelector'),
      monthlyTotal:           document.getElementById('monthlyTotal'),
      monthlyCategoryBreakdown: document.getElementById('monthlyCategoryBreakdown'),
    };
  },

  /** Chart.js instance (kept so we can update/destroy it) */
  chartInstance: null,

  /* ── Balance ─────────────────────────────────────────────── */

  /** Recalculate and display total balance */
  balance() {
    const total = State.transactions.reduce((sum, t) => sum + t.amount, 0);
    this.els.balanceAmount.textContent = formatCurrency(total);
  },

  /* ── Category Dropdown ───────────────────────────────────── */

  /** Rebuild the category <select> from State.categories */
  categoryDropdown() {
    const sel = this.els.itemCategory;
    const current = sel.value; // preserve selection if possible
    sel.innerHTML = '';
    State.categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = escapeHTML(cat);
      opt.textContent = escapeHTML(cat);
      sel.appendChild(opt);
    });
    // Restore previous selection if still valid
    if ([...sel.options].some((o) => o.value === current)) sel.value = current;
  },

  /* ── Transaction List ────────────────────────────────────── */

  /** Re-render the full transaction list */
  list() {
    const ul = this.els.transactionList;
    const empty = this.els.listEmpty;
    const sorted = State.getSorted();

    ul.innerHTML = '';

    if (sorted.length === 0) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    sorted.forEach((txn) => {
      const li = document.createElement('li');
      li.className = 'transaction-item';
      li.dataset.id = txn.id;

      const color = State.colorForCategory(txn.category);
      const dateStr = new Date(txn.date).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });

      li.innerHTML = `
        <span class="txn-dot" style="background:${color};" aria-hidden="true"></span>
        <div class="txn-info">
          <div class="txn-name">${escapeHTML(txn.name)}</div>
          <div class="txn-meta">${escapeHTML(txn.category)} · ${dateStr}</div>
        </div>
        <span class="txn-amount">${formatCurrency(txn.amount)}</span>
        <button
          class="btn-delete"
          data-id="${escapeHTML(txn.id)}"
          aria-label="Delete ${escapeHTML(txn.name)}"
        >Delete</button>
      `;
      ul.appendChild(li);
    });
  },

  /* ── Pie Chart ───────────────────────────────────────────── */

  /** Build / refresh the Chart.js pie chart */
  chart() {
    const ctx = this.els.spendingChart;
    const emptyMsg = this.els.chartEmpty;

    // Aggregate totals by category
    const totals = {};
    State.transactions.forEach(({ category, amount }) => {
      totals[category] = (totals[category] || 0) + amount;
    });

    const labels = Object.keys(totals);
    const data   = Object.values(totals);

    // Show empty state when no data
    if (labels.length === 0) {
      ctx.hidden = true;
      emptyMsg.hidden = false;
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }
      return;
    }

    ctx.hidden = false;
    emptyMsg.hidden = true;

    const colors = labels.map((l) => State.colorForCategory(l));

    const chartData = {
      labels,
      datasets: [{
        data,
        backgroundColor:  colors,
        hoverBackgroundColor: colors.map((c) => c + 'cc'), // slight transparency on hover
        borderWidth: 2,
        borderColor: '#fff',
      }],
    };

    if (this.chartInstance) {
      // Update existing chart for smooth transition
      this.chartInstance.data = chartData;
      this.chartInstance.update();
    } else {
      // Create fresh chart
      this.chartInstance = new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 14,
                boxWidth: 12,
                font: { size: 12 },
              },
            },
            tooltip: {
              callbacks: {
                label(context) {
                  const val = context.parsed;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = ((val / total) * 100).toFixed(1);
                  return ` ${formatCurrency(val)} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }
  },

  /* ── Monthly Summary ─────────────────────────────────────── */

  /** Rebuild month selector <select> based on available data */
  monthSelector() {
    const sel = this.els.monthSelector;
    const summary = State.getMonthlySummary();
    const keys = Object.keys(summary).sort().reverse(); // newest first

    sel.innerHTML = '';

    if (keys.length === 0) {
      const opt = document.createElement('option');
      opt.value = 'all';
      opt.textContent = 'No data yet';
      sel.appendChild(opt);
      return;
    }

    // "All time" option
    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = 'All Time';
    sel.appendChild(allOpt);

    keys.forEach((key) => {
      const opt = document.createElement('option');
      opt.value = key;
      // Format YYYY-MM → "October 2026"
      opt.textContent = formatMonth(`${key}-01`);
      sel.appendChild(opt);
    });

    // Restore saved selection if still valid
    if ([...sel.options].some((o) => o.value === State.selectedMonth)) {
      sel.value = State.selectedMonth;
    } else {
      sel.value = keys[0] || 'all';
      State.selectedMonth = sel.value;
    }
  },

  /** Render the monthly total + per-category chips */
  monthlySummary() {
    const summary = State.getMonthlySummary();
    const key = State.selectedMonth;
    const container = this.els.monthlyCategoryBreakdown;
    const totalEl   = this.els.monthlyTotal;

    let monthData;
    if (key === 'all') {
      // Aggregate everything
      const total = State.transactions.reduce((s, t) => s + t.amount, 0);
      const byCategory = {};
      State.transactions.forEach(({ category, amount }) => {
        byCategory[category] = (byCategory[category] || 0) + amount;
      });
      monthData = { total, byCategory };
    } else {
      monthData = summary[key] || { total: 0, byCategory: {} };
    }

    totalEl.textContent = formatCurrency(monthData.total);

    container.innerHTML = '';
    Object.entries(monthData.byCategory)
      .sort(([, a], [, b]) => b - a) // highest category first
      .forEach(([cat, amt]) => {
        const chip = document.createElement('span');
        chip.className = 'monthly-chip';
        chip.innerHTML = `<strong>${escapeHTML(cat)}</strong>: ${formatCurrency(amt)}`;
        container.appendChild(chip);
      });
  },

  /** Run all render functions (full refresh) */
  all() {
    this.balance();
    this.categoryDropdown();
    this.list();
    this.chart();
    this.monthSelector();
    this.monthlySummary();
  },
};

/* ============================================================
   5. FORM MODULE
   Handles form submission, validation, and custom categories.
   ============================================================ */

const Form = {
  // DOM refs
  form:                null,
  nameInput:           null,
  amountInput:         null,
  categorySelect:      null,
  errorEl:             null,
  addCategoryBtn:      null,
  customCategoryGroup: null,
  customCategoryInput: null,
  saveCategoryBtn:     null,
  cancelCategoryBtn:   null,

  init() {
    this.form                = document.getElementById('transactionForm');
    this.nameInput           = document.getElementById('itemName');
    this.amountInput         = document.getElementById('itemAmount');
    this.categorySelect      = document.getElementById('itemCategory');
    this.errorEl             = document.getElementById('formError');
    this.addCategoryBtn      = document.getElementById('addCategoryBtn');
    this.customCategoryGroup = document.getElementById('customCategoryGroup');
    this.customCategoryInput = document.getElementById('customCategoryInput');
    this.saveCategoryBtn     = document.getElementById('saveCategoryBtn');
    this.cancelCategoryBtn   = document.getElementById('cancelCategoryBtn');

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    this.addCategoryBtn.addEventListener('click', () => this.showCustomCategoryInput());
    this.saveCategoryBtn.addEventListener('click', () => this.saveCustomCategory());
    this.cancelCategoryBtn.addEventListener('click', () => this.hideCustomCategoryInput());

    // Allow pressing Enter in custom category input to save
    this.customCategoryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.saveCustomCategory(); }
      if (e.key === 'Escape') this.hideCustomCategoryInput();
    });
  },

  /** Validate and submit a new transaction */
  handleSubmit() {
    const name     = this.nameInput.value.trim();
    const amount   = this.amountInput.value.trim();
    const category = this.categorySelect.value;

    // Clear previous errors
    this.clearError();

    // Validation
    if (!name) {
      return this.showError('Item name is required.');
    }
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return this.showError('Please enter a valid amount greater than 0.');
    }
    if (!category) {
      return this.showError('Please select a category.');
    }

    // Add to state & persist
    State.addTransaction(name, parseFloat(amount), category);

    // Clear form
    this.nameInput.value   = '';
    this.amountInput.value = '';
    this.nameInput.focus();

    // Full UI refresh
    Render.all();
  },

  /** Show the custom category input row */
  showCustomCategoryInput() {
    this.customCategoryGroup.hidden = false;
    this.customCategoryInput.focus();
    this.addCategoryBtn.disabled = true;
  },

  /** Hide the custom category input row */
  hideCustomCategoryInput() {
    this.customCategoryGroup.hidden = true;
    this.customCategoryInput.value  = '';
    this.addCategoryBtn.disabled    = false;
  },

  /** Save the typed custom category */
  saveCustomCategory() {
    const name = this.customCategoryInput.value.trim();

    if (!name) {
      this.customCategoryInput.classList.add('input-error');
      this.customCategoryInput.focus();
      return;
    }
    this.customCategoryInput.classList.remove('input-error');

    if (!State.addCategory(name)) {
      // Already exists — just select it
      this.categorySelect.value = name;
    }

    this.hideCustomCategoryInput();
    // Rebuild dropdown (now includes new category) and select it
    Render.categoryDropdown();
    this.categorySelect.value = name;
  },

  /** Show an error message and visually highlight fields */
  showError(msg) {
    this.errorEl.textContent = `⚠ ${msg}`;
    this.errorEl.hidden = false;
  },

  /** Clear the error state */
  clearError() {
    this.errorEl.hidden = true;
    this.errorEl.textContent = '';
  },
};

/* ============================================================
   6. EVENT LISTENERS MODULE
   Global delegated listeners and sort/month wiring.
   ============================================================ */

const Events = {
  init() {
    // ── Delete transaction (event delegation on list) ──
    document.getElementById('transactionList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-id]');
      if (!btn) return;
      const id = btn.dataset.id;
      State.deleteTransaction(id);
      Render.all();
    });

    // ── Sort select ──
    document.getElementById('sortSelect').addEventListener('change', (e) => {
      State.sortBy = e.target.value;
      Render.list(); // only list needs re-render for sort
    });

    // ── Month selector ──
    document.getElementById('monthSelector').addEventListener('change', (e) => {
      State.selectedMonth = e.target.value;
      Render.monthlySummary();
    });
  },
};

/* ============================================================
   7. THEME MODULE
   Handles dark / light mode toggle.
   Persists preference in LocalStorage.
   ============================================================ */

const Theme = {
  /** Apply a theme ('dark' | 'light') to the document */
  apply(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    const icon  = document.getElementById('toggleIcon');
    const label = document.getElementById('toggleLabel');
    if (mode === 'dark') {
      if (icon)  icon.textContent  = '☀️';
      if (label) label.textContent = 'Light';
    } else {
      if (icon)  icon.textContent  = '🌙';
      if (label) label.textContent = 'Dark';
    }
  },

  /** Load saved preference and apply it */
  load() {
    const saved = Storage.get(STORAGE_KEYS.theme, 'light');
    this.apply(saved);
  },

  /** Toggle between dark and light, persist the result */
  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next    = current === 'dark' ? 'light' : 'dark';
    this.apply(next);
    Storage.set(STORAGE_KEYS.theme, next);
  },

  /** Wire the toggle button */
  init() {
    this.load();
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', () => this.toggle());
  },
};

/* ============================================================
   8. INIT — Bootstrap the application
   ============================================================ */

function init() {
  // 1. Load theme preference first (before paint)
  Theme.init();

  // 2. Load data from LocalStorage
  State.load();

  // 3. Cache DOM elements
  Render.cacheEls();

  // 4. Wire up form and event listeners
  Form.init();
  Events.init();

  // 5. Initial full render
  Render.all();
}

// Run after DOM is ready (script is deferred, so DOM is guaranteed)
init();
