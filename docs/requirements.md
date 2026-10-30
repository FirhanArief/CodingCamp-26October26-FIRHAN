# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web app that lets a user record spending transactions, review them in a scrollable list, see a running total balance, and view a pie chart of spending by category. It is built with HTML, CSS, and vanilla JavaScript, has no backend, and persists data in the browser Local Storage. It runs in modern browsers (Chrome, Firefox, Edge, Safari).

## Glossary

- **Visualizer**: The Expense & Budget Visualizer web application as a whole.
- **Input_Form**: The form containing the Item Name, Amount, and Category fields and a submit control.
- **Transaction**: A record consisting of a unique identifier, an item name, an amount, and a category.
- **Category**: One of the fixed values Food, Transport, or Fun.
- **Transaction_List**: The scrollable UI region that displays all Transactions.
- **Total_Balance**: The sum of the amounts of all Transactions, displayed at the top of the page.
- **Spending_Chart**: A pie chart showing the share of total spending per Category.
- **Storage**: The browser Local Storage API used to persist Transactions.
- **Chart_Library**: A simple third-party charting library (Chart.js) used to render the Spending_Chart.

---

## Requirements

### Requirement 1: Add a Transaction

**User Story:** As a user, I want to enter an item name, amount, and category in a form, so that I can record my spending.

#### Acceptance Criteria

1. THE Input_Form SHALL provide an Item Name text field accepting a maximum of 100 characters, an Amount numeric field, and a Category selector offering exactly the options Food, Transport, and Fun.
2. WHEN the user submits the Input_Form with valid data, THE Visualizer SHALL add a new Transaction within 500 milliseconds.
3. WHEN a Transaction is added, THE Input_Form SHALL clear the Item Name and Amount fields, reset the Category selector, and remove any displayed error messages.
4. IF the Item Name is empty or whitespace, THEN display an error, do not add a Transaction, retain other field values.
5. IF the Amount is empty or non-numeric, THEN display an error, do not add a Transaction, retain other field values.
6. IF no Category is selected, THEN display an error, do not add a Transaction, retain other field values.
7. IF the Amount is ≤ 0, THEN display an error stating the Amount must be greater than zero.
8. IF the Amount > 999,999,999.99 or has more than 2 decimal places, THEN display an error identifying the field and permitted range/precision.
9. IF more than one field is invalid, THEN display all errors simultaneously and do not add a Transaction.

---

### Requirement 2: Display the Transaction List

**User Story:** As a user, I want to see all my transactions in a list, so that I can review what I have spent.

#### Acceptance Criteria

1. THE Transaction_List SHALL display item name, amount, and Category for each Transaction.
2. WHEN Transactions exceed visible height, THE Transaction_List SHALL provide vertical scrolling (up to 1,000 Transactions) without the page itself scrolling.
3. WHEN a Transaction is added, it SHALL appear as the first entry within 500 milliseconds.
4. WHILE no Transactions exist, display an empty-state message.
5. Format each amount with a currency symbol, thousands separator, and exactly two decimal places (e.g., Rp 1,234).
6. IF an item name exceeds the list entry width, wrap it without truncating or overlapping other content.
7. WHEN the first Transaction is added, remove the empty-state message within 500 milliseconds.

---

### Requirement 3: Delete a Transaction

**User Story:** As a user, I want to delete a transaction, so that I can correct mistakes or remove outdated entries.

#### Acceptance Criteria

1. THE Transaction_List SHALL display exactly one delete control per Transaction, operable by click, tap, and keyboard (Enter/Space).
2. WHEN delete is activated, remove that Transaction from the list within 500 milliseconds.
3. WHEN delete is activated, leave all other Transactions unchanged in content and order.
4. WHEN delete is activated, remove that Transaction from persistent storage so it does not reappear on reload.
5. WHEN a Transaction is deleted, update the total balance and chart within 500 milliseconds.

---

### Requirement 4: Show the Total Balance

**User Story:** As a user, I want to see my total spending at the top of the page.

#### Acceptance Criteria

1. THE Visualizer SHALL display the Total_Balance above all other content at all scroll positions.
2. Calculate Total_Balance as the sum of all Transaction amounts, rounded to 2 decimal places.
3. Display with exactly 2 decimal places, thousands separator, and a currency symbol/label (Rp).
4. Update within 100 ms when a Transaction is added or deleted.
5. WHILE no Transactions exist, display Rp 0.
6. On page load, display the sum of stored Transactions within 500 ms.
7. IF the sum exceeds 999,999,999.99, display an overflow indicator and preserve all Transactions.

---

### Requirement 5: Visualize Spending by Category

**User Story:** As a user, I want a pie chart of my spending by category.

#### Acceptance Criteria

1. Render a pie chart using Chart.js.
2. Each Category with at least one Transaction gets a distinct color and legend label.
3. Each slice is proportional to that Category's sum divided by the total.
4. Omit Categories with a sum of 0.
5. Update within 100 ms when a Transaction is added or deleted.
6. WHILE no Transactions exist, display a placeholder message instead of the chart.
7. IF Chart.js fails to load or render, display a "chart unavailable" message and leave data unchanged.

---

### Requirement 6: Persist Data Locally

**User Story:** As a user, I want my transactions saved in my browser.

#### Acceptance Criteria

1. Write to Storage within 100 ms of any add or delete.
2. On page load, read from Storage and render everything within 1 second.
3. IF stored data is unparseable, start with an empty list and show a "could not load" message.
4. IF writing to Storage fails, keep the change in memory and show a "data not saved" message.
5. IF Storage is empty on load, render empty state without an error message.
6. All data stays in the browser — no network requests.
7. Serializing then deserializing any valid Transaction list produces an identical list (round-trip property).

---

### Requirement 7: Project Structure and Technology

**User Story:** As a developer, I want a simple, framework-free project layout.

#### Acceptance Criteria

1. HTML, CSS, Vanilla JS only. No frameworks, no npm, no build step. Chart.js via CDN is the only allowed third-party script.
2. Exactly one CSS file in `css/`, one HTML at root, referenced by a single stylesheet link.
3. Exactly one JS file in `js/`, referenced by a single script tag.
4. Opening `index.html` via `file://` renders and accepts input within 2 seconds — no build or server required.
5. Works in the latest two major releases of Chrome, Firefox, Edge, and Safari with zero console errors.
6. IF JavaScript is disabled, display a visible message saying JavaScript is required.

---

### Requirement 8: Usability, Performance, and Visual Design

**User Story:** As a user, I want a clean and responsive interface.

#### Acceptance Criteria

1. Balance displayed in a font at least 1.5× body font size, above the form, list, and chart.
2. Full page load (balance, form, list, chart) within 2 seconds on ≥ 10 Mbps.
3. Add/delete updates balance, list, and chart within 100 ms for up to 500 stored Transactions.
4. Body font ≥ 16 px, contrast ratio ≥ 4.5:1 for all text/background pairs.
5. A visible text label adjacent to each form field, remaining visible while the field has a value.
6. No horizontal scrolling between 360 px and 1920 px viewport width.
7. Below 360 px, horizontal scroll is permitted; form and list must remain operable.

---

## Optional Challenges (Implemented)

| # | Feature |
|---|---------|
| OC-1 | **Custom categories** — users can add their own categories; persisted in LocalStorage |
| OC-2 | **Monthly summary view** — selector + total + per-category breakdown grouped by month |
| OC-3 | **Sort transactions** — by date (newest/oldest), amount (high/low), category (A→Z) |
