# SI Manager

> A modern, comprehensive, and responsive business management platform for inventory control, point-of-sale recording, customer relationship management, professional PDF invoicing, product catalogue sharing, and financial analytics.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

---

## 🌟 Overview

**SI Manager** is an enterprise-ready business operations hub engineered for retail showrooms, wholesale distributors, and multi-location commercial businesses. It seamlessly connects stock management, customer invoicing, accounts receivable, digital product showrooms, and profit analytics into one cohesive, accessible interface on both desktop and mobile devices.

---

## 🚀 Key Features & Capabilities

### 👥 1. Customer Directory & CRM Ledger (`/customers`)
- **Full Client Profiles**: Record customer names, phone numbers, emails, physical delivery addresses, and custom project notes.
- **Accounts Receivable & Debt Tracking**: Real-time monitoring of customer balances, total amount spent, total paid, and outstanding debt.
- **Direct Debt Removal & Settle Modal**: 1-click **"Clear Debt"** action on customer cards, table rows, and profile drawers. Supports:
  - **Full Debt Clearance (100% Paid)**: Immediately clears outstanding debt and marks all associated customer sales as fully paid.
  - **Partial Debt Installment**: Record custom payment amounts, auto-distributed sequentially across outstanding sales transactions.
  - **Debt Write-off / Waiver**: Zero out customer debt with audit trail tracking without collecting cash.
  - **Multi-channel Logging**: Settle via Bank Transfer, Cash, POS/Card, Cheque, or Store Credit.
- **Smart Filtering**: One-click filters for **All Clients**, **With Debt**, **VIP (₦100k+ Spent)**, and **Recently Active**.
- **Dual Display Modes**: Toggle between interactive **Grid Cards** with financial badges and dense **Data Table** views.
- **Customer Transaction History**: Detailed modal drawer showing all linked sales transactions, itemized products purchased, dates, and invoice records.
- **1-Click WhatsApp Integration**: Open pre-filled WhatsApp conversations directly with clients using sanitized international phone formats (`+234...`).
- **Sync Clients from Invoices**: Automatically scan past invoices in the database and import unlisted client profiles in a single click.
- **CSV Directory Export**: Export the complete client directory with transaction metrics and contact details.

---

### 🧾 2. Professional Invoicing & Billing Engine (`/create-invoice`)
- **Dynamic Invoice Builder**: Add and remove line items, select products from inventory with auto-filled prices, or type custom custom descriptions.
- **Flexible Pricing Controls**: Apply percentage or fixed discounts, toggle VAT/tax computation, and input upfront customer deposits (`Amount Paid`).
- **Multi-Currency Support**: Switch between multiple currencies (**NGN ₦**, **USD $**, **EUR €**, **GBP £**, etc.) with automatic symbol and thousand-separator formatting.
- **Smart Print Layouts**: High-definition print engine supporting thermal receipts, standard A4 invoices, and PDF export. Blank customer fields are automatically omitted for clean, professional presentation.
- **Receipt vs. Invoice Intelligence**: Automatically updates header terminology and styling to **"Official Receipt"** when paid in full, or **"Commercial Invoice"** when a balance remains.
- **Saved Invoices Drawer**: Access, reload, reprint, or delete previously generated invoices and receipts.
- **Mobile Quick-Action Dock**: Dedicated floating toolbar on mobile devices for 1-tap PDF imports, saved invoice lookup, PDF downloads, printing, and saving.

---

### 📄 3. Intelligent PDF Invoice Importer (Client-Side AI/Regex Engine)
- **Zero-Server Client-Side Parsing**: Parses vector and text-based PDF invoices and receipts in real time using `pdfjs-dist`.
- **Automatic Field Extraction**:
  - **Invoice & Receipt Identifiers**: Automatically matches `INV-...`, `REC-...`, `Invoice #`, and sequential billing codes.
  - **Issue & Due Dates**: Detects standard dates (`DD/MM/YYYY`, `YYYY-MM-DD`, written month formats).
  - **Customer Information**: Extracts client names, Nigerian and international phone numbers, emails, and street addresses.
  - **Line Item Tables**: Parses descriptions, item quantities, unit rates, and row subtotals.
  - **Financial Summary**: Identifies subtotals, VAT/taxes, discounts, amount paid, balance due, and currency symbols.
- **Live Interactive Extraction Preview**: Inspect and fine-tune extracted data, verify customer profile matches, and link line items before applying.
- **Dual Integration Points**:
  - **Create Invoice Page**: 1-click **"Import PDF"** button to auto-fill the invoice builder form.
  - **Record Sales Modal**: Dedicated **"Upload PDF Invoice"** tab to convert paper/PDF invoices directly into logged showroom sales and inventory decrements.

---

### 💼 4. Sales & Order Processing (`/sales`)
- **Fast Order Recording**: Multi-line item entry with instant showroom stock validation and live price calculation.
- **Location-Specific Stock Decrementing**: Automatically updates inventory counts at the selected branch (Ikeja, Lekki, Abuja, Port Harcourt, etc.).
- **Flexible Payment Statuses**: Track transactions as **Paid**, **Partial**, or **Credit / Outstanding**.
- **Partial Payment Installment Management**: Record partial customer payments with instant recalculation of remaining balance and automatic transition to "Paid" once fully settled.
- **Executive KPI Cards**: Real-time sales overview cards displaying gross revenue, total units sold, pending receivables, and average order value.
- **Interactive Visual Charts**: Daily and monthly revenue trend charts powered by Recharts with date range selectors.
- **Bulk CSV Sales Import**: Ingest historical sales datasets with schema validation and error reporting.
- **Data Exporting**: Export sales records and financial journals into CSV and Excel formats.

---

### 📦 5. Stock & Inventory Management (`/inventory`)
- **Multi-Branch Tracking**: Maintain independent stock counts across multiple warehouse and showroom locations.
- **Stock Status Badging**: Instant color-coded badges for **In Stock**, **Low Stock (≤ 5 units)**, and **Out of Stock**.
- **Inline Quantity Adjustments**: 1-click increment and decrement buttons for fast floor count corrections.
- **Product Imagery**: Upload and display product photos directly alongside stock entries.
- **Batch Operations**: Multi-select items with an ergonomic selector for bulk deletion, location transfers, and bulk updates.
- **Accessories & Spares Catalog (`/inventory/accessories`)**: Dedicated catalog for managing spare parts, unpriced hardware components, and motorized track accessories.

---

### 🛍️ 6. Digital Catalogue & Public Showcase (`/catalogue`)
- **Visual Showroom Grid**: Browse inventory with high-resolution imagery, category tags, retail pricing, and live availability.
- **Public Customer Showcase Link (`/share/catalogue`)**: Shareable, client-ready public catalogue URL allowing prospective customers to browse products without needing an account.

---

### 📈 7. Profit Analysis & Expense Management (`/profit-analysis` & `/expenses`)
- **Cost of Goods Sold (COGS)**: Track unit acquisition costs and calculate true gross profit margins per sale.
- **Operating Expense Ledger**: Categorize operational expenses, utilities, logistics, installation fees, and office rent.
- **Net Margin Insights**: Deducts operational expenses from gross profit to report actual net business earnings.
- **Executive Business Reports (`/reports`)**: Monthly performance summaries, top-selling inventory items, and branch comparisons.

---

### 📱 8. Mobile-First Parity & Responsive Experience
- **100% Feature Parity on Mobile**: Every feature available on desktop is fully accessible and optimized for mobile screens.
- **Mobile Bottom Navigation Bar**: 1-touch navigation bar providing immediate access to Stock, Sales, Invoice, Clients, Expenses, and Reports.
- **Categorized Hamburger Drawer**: Complete navigation sheet organizing all 11+ app modules, search, theme toggle, and account settings.
- **Floating Action Buttons (FAB)**: Accessible speed-dial floating action buttons on mobile views for rapid sales recording and item creation.
- **Touch-Friendly Controls**: Minimum 44px touch targets, responsive sheets, smooth modal drawers, and horizontal swipe tables.

---

### 🔐 9. Role-Based Access Control (RBAC) & Security
- **Multi-Role Permissions**:
  - **Super Admin**: Complete system access, user role assignments, audit logs, and global settings.
  - **Admin**: Full access to commerce, inventory, financial analytics, and reports.
  - **Inventory Manager**: Dedicated stock and catalog management views.
  - **Uploader / Staff**: Point-of-sale recording and stock adjustment permissions.
- **Supabase Authentication**: Secure email/password login with JWT session persistence.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Backend & Database** | [Supabase](https://supabase.com/) (PostgreSQL & Supabase Auth) |
| **Data Fetching** | [TanStack React Query](https://tanstack.com/query/latest) |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **PDF Engine & Extraction**| [pdfjs-dist](https://mozilla.github.io/pdf.js/) & [jsPDF](https://github.com/parallax/jsPDF) |
| **Data Import/Export** | [PapaParse](https://www.papaparse.com/) (CSV) & [SheetJS (xlsx)](https://sheetjs.com/) |

---

## 📁 Project Structure

```text
├── public/                     # Static assets and PWA icons
├── src/
│   ├── components/             # Modular UI and domain components
│   │   ├── accessories/        # Accessory management dialogs & tables
│   │   ├── auth/               # Supabase authentication forms
│   │   ├── catalogue/          # Product catalogue & visual grid views
│   │   ├── customers/          # Customer directory, debt ledgers & detail drawers
│   │   ├── dashboard/          # Summary KPIs, overview cards & charts
│   │   ├── expenses/           # Expense tracking forms & tables
│   │   ├── inventory/          # Stock tables, batch selectors & edit modals
│   │   ├── invoice/            # Invoice builder, print layouts & PDF parser modals
│   │   ├── profit/             # Profit margin calculators & COGS breakdowns
│   │   ├── reports/            # Performance analytics & branch metrics
│   │   ├── sales/              # Order entry, import invoice dialogs & sales cards
│   │   ├── ui/                 # shadcn/ui and Radix UI base components
│   │   ├── AppLayout.tsx       # Master responsive layout wrapper
│   │   ├── MobileBottomNav.tsx # Primary mobile bottom navigation bar
│   │   ├── MobileFAB.tsx       # Mobile speed-dial floating action button
│   │   └── TopNavbar.tsx       # Top navigation header & categorized mobile drawer
│   ├── hooks/                  # Custom React hooks (invoicing, validation, etc.)
│   ├── integrations/           # Supabase client and query bindings
│   ├── pages/                  # Application page routes
│   │   ├── Accessories.tsx     # Spare parts & hardware management
│   │   ├── Catalogue.tsx       # Internal visual product catalogue
│   │   ├── CreateInvoice.tsx   # Dynamic invoice builder & PDF importer
│   │   ├── Customers.tsx       # Customer directory & receivables ledger
│   │   ├── Dashboard.tsx       # Executive operations dashboard
│   │   ├── Expenses.tsx        # Operational expense ledger
│   │   ├── Inventory.tsx       # Multi-location stock management
│   │   ├── ProfitAnalysis.tsx  # Gross/net profit & COGS analysis
│   │   ├── PublicCatalogue.tsx # Client-facing shareable showcase
│   │   ├── Reports.tsx         # Business summaries & bestsellers
│   │   ├── Request.tsx         # Branch stock transfers & requisitions
│   │   ├── Sales.tsx           # Sales operations & invoice import
│   │   └── Settings.tsx        # System settings & role management
│   ├── utils/                  # Formatting, PDF extraction & export helpers
│   │   ├── formatters.ts       # Currency and number formatting
│   │   ├── invoicePrint.ts     # Print layout and title styling
│   │   ├── pdfInvoiceParser.ts # Client-side PDF invoice extraction engine
│   │   └── roles.ts            # RBAC role helpers
│   ├── App.tsx                 # Root application component & router setup
│   ├── index.css               # Global Tailwind CSS stylesheet
│   └── main.tsx                # Application bootstrap entry point
├── index.html                  # HTML entry point
├── package.json                # Project dependencies and npm scripts
├── tailwind.config.ts          # Tailwind CSS design system configuration
└── vite.config.ts              # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/) package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone <REPOSITORY_URL>
   cd <PROJECT_FOLDER>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` (or `http://localhost:5173`) in your browser.

---

## 📋 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with Hot Module Replacement. |
| `npm run build` | Compiles TypeScript and creates an optimized production bundle in `dist/`. |
| `npm run preview` | Locally previews the production build output. |
| `npm run lint` | Runs ESLint to check for code quality and syntax issues. |

---

## 📱 Mobile Quick Reference

SI Manager is built with a responsive design philosophy:
- **Navigation**: Switch between key modules with the **Mobile Bottom Navigation Bar** or open the **Top Right Menu Drawer** for all administrative and system tools.
- **Sales & Invoicing**: Access the **Mobile Quick Dock** on `/create-invoice` or tap the **Floating Action Button (+)** on `/sales` and `/inventory` to initiate transactions instantly on any smartphone or tablet.
- **PDF Uploads**: Use the mobile file picker to upload PDF invoices and receipts directly from your mobile camera scanner or cloud storage.

---

## 📄 License

This project is licensed under the MIT License.
