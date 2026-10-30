# Design System — Expense & Budget Visualizer

Dokumen ini mendokumentasikan semua keputusan desain visual proyek.
Ikuti panduan ini setiap kali mengubah `css/style.css` atau `js/app.js`.

---

## Warna & Tema

### Background Utama
| Mode | Warna | Hex |
|------|-------|-----|
| Light | Merah maroon | `#6b1a1a` |
| Dark | Merah maroon gelap | `#1a0a0a` |

### Brand / Primary Color
| Mode | Warna | Hex |
|------|-------|-----|
| Light | Hitam | `#1a1a1a` |
| Dark | Abu gelap | `#444444` |

### Header & Footer
| Mode | Hex |
|------|-----|
| Light | `#4a0f0f` |
| Dark | `#0f0505` |

### Cards
| Mode | Hex |
|------|-----|
| Light | `#ffffff` |
| Dark | `#2d1b1b` |

### Balance Card Gradient
| Mode | Gradient |
|------|----------|
| Light | `#1a1a1a` → `#3a3a3a` |
| Dark | `#111111` → `#2a2a2a` |

### Status Colors (tidak berubah antar mode)
| Token | Hex | Kegunaan |
|-------|-----|----------|
| `--color-danger` | `#ef4444` | Delete button, amount text |
| `--color-success` | `#22c55e` | Save category button |

---

## Dark / Light Mode

- Toggle diimplementasikan via `data-theme` attribute di `<html>`.
- Semua warna didefinisikan dengan **CSS Custom Properties** di `:root` (light) dan `[data-theme="dark"]`.
- Preferensi disimpan di `localStorage` dengan key `expense_theme`.
- Logika toggle ada di modul `Theme` dalam `js/app.js`.
- Tombol toggle ada di **header kanan atas**, menampilkan ikon:
  - 🌙 Dark → untuk masuk ke dark mode
  - ☀️ Light → untuk kembali ke light mode
- Semua elemen menggunakan `transition: background-color 0.3s ease` untuk animasi halus.

---

## Tipografi

| Property | Value |
|----------|-------|
| Font stack | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` |
| Base font size | `16px` |
| Balance font size | `2.2rem` (mobile) / `2.8rem` (≥ 600px) |
| Section title | `1rem`, weight `600` |
| Form label | `0.83rem`, uppercase, letter-spacing `0.04em` |

---

## Spacing & Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | `6px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `18px` |
| Card padding | `20px` (mobile) / `28px` (≥ 600px) |
| Card margin | `16px 0` |

---

## Breakpoints

| Breakpoint | Target |
|------------|--------|
| Default | Mobile (< 600px) |
| `min-width: 600px` | Tablet+ |
| `min-width: 768px` | Desktop |

---

## Struktur File

| File | Tanggung Jawab |
|------|----------------|
| `index.html` | Markup semantik, satu-satunya HTML |
| `css/style.css` | Semua styling, mobile-first, satu file |
| `js/app.js` | Semua logika (Storage, State, Render, Form, Events, Theme) |
| `docs/` | Dokumentasi (tidak mempengaruhi runtime) |

**Jangan tambah file CSS atau JS baru.** Semua perubahan styling masuk ke `style.css`, semua logika masuk ke `app.js`.

---

## Konvensi Kode

- Gunakan **CSS Custom Properties** untuk semua warna — jangan hardcode hex langsung di luar `:root`.
- Semua input user wajib di-escape dengan `escapeHTML()` sebelum dimasukkan ke DOM.
- `localStorage` selalu dibungkus `try/catch` via modul `Storage`.
- Format mata uang menggunakan `formatCurrency()` (IDR, `Intl.NumberFormat`).
- Tidak ada framework — Vanilla JS saja.
- ID generator: `genId()` = timestamp + random string.

---

## Chart Colors (Kategori)

Warna ditentukan secara deterministik berdasarkan index kategori di `State.categories[]`:

```js
const CHART_COLORS = [
  '#6c63ff', '#f97316', '#22c55e', '#facc15',
  '#ec4899', '#14b8a6', '#8b5cf6', '#f43f5e',
  '#0ea5e9', '#a16207', '#16a34a', '#db2777',
];
```

---

## Deployment

- Static files, tidak ada build step.
- Buka langsung via `index.html` di browser.
- Deploy via **GitHub Pages** (branch `main`, root `/`).
- URL: `https://firhanarief.github.io/CodingCamp-26October26-FIRHAN/`
