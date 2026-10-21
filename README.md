# SI Manager

> A modern, comprehensive, and responsive business management platform for inventory control, point-of-sale recording, customer relationship management, professional PDF invoicing, interactive product catalogue sharing, financial analytics, and operational speed diagnostics.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

---

## 🌟 Overview

**SI Manager** is an enterprise-ready business operations hub engineered for retail showrooms, wholesale distributors, installation engineers, and multi-location commercial businesses. It seamlessly connects real-time stock control, point-of-sale recording, customer relationship management, digital interactive product showrooms, multi-currency quotation engines, accounts receivable, and net profit analytics into one cohesive, ultra-fast interface on both desktop and mobile devices.

---

## 🚀 Key Features & Capabilities

### ⚡ 1. Speed & Operational Health Pulse (`SystemSpeedHealthModal`)
- **Real-Time Network & DB Latency Diagnostics**: Live round-trip latency ping to database endpoints in milliseconds, color-graded (Optimal `<100ms`, Good `<300ms`, High Latency).
- **Client Cache Analytics**: Live TanStack React Query memory inspection tracking total cached queries, fresh vs. stale datasets, and garbage collection metrics.
- **Offline Storage & IndexedDB Pulse**: Monitors local storage consumption, offline queue readiness, and persistent IndexedDB sync health.
- **1-Click Speed & Storage Optimizer**: Instant purge of stale cache keys, garbage collection of unused query memory, and database cache defragmentation.
- **High-Performance Query Parallelization**: Database reads across Dashboard, Inventory, Sales, and Reports are parallelized via `Promise.all` with DNS pre-fetching for instant rendering.
- **Executive Quick Export Hub (`QuickExportHubModal`)**: 1-click instant export of the Complete Inventory Master, Sales Transactions Register, Operating Expenses & Installation Fees, and Urgent Stock Reorder intelligence in both CSV and JSON formats.

---

### 📊 2. Stock Runway & Inventory Runout Intelligence
- **30-Day Product Sales Velocity Engine**: Calculates daily and weekly sales burn rates per SKU based on rolling transaction volume.
- **Days of Stock Runway Left (`runwayDays`)**: Forecasts exactly how many days of inventory remain before a product sells out at current velocity.
- **Proactive Restock Recommendations**: Automatically computes optimal reorder quantities based on 30-day velocity, lead times, and current warehouse counts.
- **Runway Urgency Categorization**:
  - **Critical Urgency (≤ 7 Days)**: Prominently flagged with high-contrast warning badges.
  - **Low Stock Warning (≤ 14 Days)**: Proactive replenishment notification.
  - **Healthy Runway (> 14 Days)**: Safe stock status.
- **1-Click Reorder Action**: Direct action button to initiate branch stock requisition or supplier purchase orders directly from the dashboard.

---

### 🛍️ 3. Upgraded Product Catalogue Workspace (`/catalogue`)
- **Interactive Batch Selection Mode ("Select Mode")**: Checkbox selector across Grid, Compact, and List layouts to hand-pick product collections for custom client proposals or bulk exports.
- **Floating Selection Action Dock**: Bottom dock displaying live selection count, 1-click **Share Link**, **WhatsApp Multi-Item Quote Pitch** (with formatted line items, unit prices, and grand total), and **Clear Selection**.
- **Card Quick Actions**: Direct 1-click buttons on product card hover to copy item specifications or open the share proposal builder for that individual SKU.
- **Enhanced Catalogue Quick View Modal with Quotation Calculator**:
  - High-definition image inspection and lightbox zoom.
  - **Live Quotation & Installation Calculator**: Interactive quantity steppers with live subtotal calculation and an optional **Professional Installation Service** toggle (`+₦15,000/unit`) that recalculates the grand total on the fly.
  - One-click copy for WhatsApp pitch, direct public product link, or instant WhatsApp client dispatch.
  - Clean specification checklist and verified Ikeja showroom availability status.

---

### 🔗 4. Advanced Showroom Share Hub (`CatalogueShareDialog`)
- **Curated Collections & Presets**: Share the Entire Showroom, In-Stock Items Only, or specific categories (Smart Locks & Security, Curtains & Tracks, Solar & Energy, Switches & Panels, Hubs & Power).
- **Custom Hand-Picked Selector**: Searchable product checklist with category filter pills, select all/clear, and real-time product count.
- **In-Store Offline QR Code Generator**: Generates high-contrast QR codes directly in the browser via `qrcode` with download (PNG) and print actions for walk-in showroom visitors.
- **Proposal Customization**:
  - **Proposal Title**: Personalize client proposals (e.g. *"Smart Security Package for Lekki Villa"*), rendering an executive banner on the customer's page.
  - **Price Visibility Toggle**: Option to hide retail prices for wholesale or B2B consultations (displays as *"Price on Request"*).
  - **Target Currency**: Set the preferred currency for the link (**NGN ₦**, **USD $**, **EUR €**, **GBP £**).
  - **1-Click WhatsApp Direct Share**: Pre-formats a branded WhatsApp invitation message with live link, quote title, and item count.

---

### 🌐 5. Public Customer Showroom (`/share/catalogue`)
- **Dual-Tier Resilient Architecture**: Primary fetch via Edge Function with automated client-side Supabase query and storage signing fallback, guaranteeing 100% uptime for customers.
- **Personalized Proposal Banner**: Branded header greeting the customer with verified store credentials and an option to explore the full showroom.
- **Live Multi-Currency Conversion**: Instant real-time conversion across NGN (₦), USD ($), EUR (€), and GBP (£).
- **Interactive Enquiry Basket & WhatsApp Checkout**: Customers can add items, adjust quantities, specify delivery location and special notes, and submit their complete itemized purchase request directly to the store's WhatsApp sales line (`08131927116`).
- **Print & PDF Proposal Export**: Clean, print-optimized proposal sheet formatted as an official corporate quote document.

---

### 👥 6. Customer Directory & CRM Ledger (`/customers`)
- **Full Client Profiles**: Record customer names, phone numbers, emails, physical delivery addresses, and custom project notes.
- **Accounts Receivable & Debt Tracking**: Real-time monitoring of customer balances, total amount spent, total paid, and outstanding debt.
- **Direct Debt Removal & Settle Modal**: 1-click **"Clear Debt"** action supporting:
  - **Full Debt Clearance (100% Paid)**: Immediately clears outstanding debt and marks all associated customer sales as fully paid.
  - **Partial Debt Installment**: Record custom payment amounts, auto-distributed sequentially across outstanding sales transactions.
  - **Debt Write-off / Waiver**: Zero out customer debt with audit trail tracking without collecting cash.
  - **Multi-channel Logging**: Settle via Bank Transfer, Cash, POS/Card, Cheque, or Store Credit.
- **Smart Filtering**: One-click filters for **All Clients**, **With Debt**, **VIP (₦100k+ Spent)**, and **Recently Active**.
- **Customer Transaction History**: Detailed modal drawer showing all linked sales transactions, itemized products purchased, dates, and invoice records.
- **1-Click WhatsApp Integration**: Open pre-filled WhatsApp conversations directly with clients using sanitized international phone formats (`+234...`).
- **Sync Clients from Invoices**: Automatically scan past invoices in the database and import unlisted client profiles in a single click.

---

### 🧾 7. Professional Invoicing & Billing Engine (`/create-invoice`)
- **Dynamic Invoice Builder**: Add and remove line items, select products from inventory with auto-filled prices, or type custom descriptions.
- **Flexible Pricing Controls**: Apply percentage or fixed discounts, toggle VAT/tax computation, and input upfront customer deposits (`Amount Paid`).
- **Multi-Currency Support**: Switch between multiple currencies (**NGN ₦**, **USD $**, **EUR €**, **GBP £**, etc.) with automatic symbol and thousand-separator formatting.
- **Smart Print Layouts**: High-definition print engine supporting thermal receipts, standard A4 invoices, and PDF export. Blank customer fields are automatically omitted for clean, professional presentation.
- **Receipt vs. Invoice Intelligence**: Automatically updates header terminology and styling to **"Official Receipt"** when paid in full, or **"Commercial Invoice"** when a balance remains.
- **Saved Invoices Drawer**: Access, reload, reprint, or delete previously generated invoices and receipts.
- **Mobile Quick-Action Dock**: Dedicated floating toolbar on mobile devices for 1-tap PDF imports, saved invoice lookup, PDF downloads, printing, and saving.

---

### 📄 8. Intelligent PDF Invoice Importer (Client-Side AI/Regex Engine)
- **Zero-Server Client-Side Parsing**: Parses vector and text-based PDF invoices and receipts in real time using `pdfjs-dist`.
- **Automatic Field Extraction**:
  - **Invoice & Receipt Identifiers**: Matches `INV-...`, `REC-...`, `Invoice #`, and sequential billing codes.
  - **Issue & Due Dates**: Detects standard dates (`DD/MM/YYYY`, `YYYY-MM-DD`, written month formats).
  - **Customer Information**: Extracts client names, Nigerian and international phone numbers, emails, and street addresses.
  - **Line Item Tables**: Parses descriptions, item quantities, unit rates, and row subtotals.
  - **Financial Summary**: Identifies subtotals, VAT/taxes, discounts, amount paid, balance due, and currency symbols.
- **Live Interactive Extraction Preview**: Inspect and fine-tune extracted data, verify customer profile matches, and link line items before applying.
- **Dual Integration Points**: Available on both the Invoice Builder (`/create-invoice`) and the Record Sales Modal (`/sales`).

---

### 🏛️ 9. Bank Account & Sales Reconciliation Module (`/reconciliation`)
- **Company Accounts & Cash Tills Ledger**: Register and track multiple bank accounts (FirstBank, GTBank), POS merchant terminals, and showroom physical cash tills.
- **Statement Import & Transaction Logger**: Upload CSV bank statements or manually record bank deposits, POS card settlements, and cash drops.
- **Smart Automated Reconciliation Engine**:
  - **Auto-Reconcile**: Multi-point matching algorithm aligning bank deposits with recorded sales based on payment channel (NIP Transfer, POS, Cash), date, and amount.
  - **1-Click Manual Match**: Link incoming bank deposits to one or multiple logged sales/invoices.
  - **Unreconciled Sales Alerts**: Highlights sales logged in POS that have not yet hit the company bank account or cash till.
  - **Account Balance vs. Ledger Gap**: Monitors actual bank statement balances against system ledger calculations with discrepancy badges.

---

### 🛍️ 10. Stock Purchase & Procurement Analysis (`/purchases`)
- **Vendor Bill & Stock Arrival Logger**: Record inventory replenishment purchases with supplier name, unit cost price, quantity acquired, location, and payment account used.
- **Supplier Spend Leaderboard**: Ranks top wholesalers and importers by total expenditure and restock volume.
- **Cost Price vs. Retail Margin Analysis**: Evaluates gross margin percentages per item (Cost Price vs Retail Selling Price) to prevent low-margin selling and track supplier price inflation.
- **Procurement CSV Export**: Export comprehensive stock purchase logs and vendor reports.

---

### 💼 11. Sales & Order Processing (`/sales`)
- **Fast Order Recording**: Multi-line item entry with showroom stock validation and live price calculation.
- **Location-Specific Stock Decrementing**: Automatically updates inventory counts at the selected branch (Ikeja, Lekki, Abuja, Port Harcourt, etc.).
- **Flexible Payment Statuses & Delayed Payment Tracking**: Record sales as Fully Paid, Part Paid, or Delayed, with 1-click **"Record as Paid"** actions on table rows.
- **Partial Payment Installment Management**: Record partial customer deposits with instant recalculation of remaining balance.
- **Executive KPI Cards & Recharts Visualizations**: Gross revenue, units sold, pending receivables, average order value, and daily/monthly trends.
- **Bulk CSV Sales Import & Export**: Import historical sales datasets and export journals to CSV/Excel.

---

### 📦 12. Stock & Inventory Management (`/inventory`)
- **Multi-Branch Tracking**: Maintain independent stock counts across multiple warehouse and showroom locations.
- **Stock Status Badging**: Instant color-coded badges for **In Stock**, **Low Stock (≤ 10 units)**, and **Out of Stock**.
- **Inline Quantity Adjustments**: 1-click increment and decrement buttons for fast floor count corrections.
- **Product Imagery & WebP Optimizer**: Upload product photos directly alongside stock entries with built-in batch WebP optimization.
- **Batch Operations**: Multi-select items for bulk deletion, location transfers, and bulk updates.
- **Accessories & Spares Catalog (`/inventory/accessories`)**: Dedicated catalog for managing spare parts, unpriced hardware components, and motorized track accessories.

---

### 📈 13. Profit Analysis & Expense Management (`/profit-analysis` & `/expenses`)
- **Cost of Goods Sold (COGS)**: Track unit acquisition costs and calculate true gross profit margins per sale.
- **Operating Expense Ledger**: Categorize operational expenses, utilities, logistics, installation fees, and office rent.
- **Net Margin Insights**: Deducts operational expenses from gross profit to report actual net business earnings.
- **Executive Business Reports (`/reports`)**: Monthly performance summaries, top-selling inventory items, and branch comparisons.

---

### ⌨️ 14. Universal Command Palette (`Cmd+K` / `Ctrl+K`)
- **Instant Search & Jump**: Navigate to any module, trigger actions, access the System Speed Pulse (`G Z`), launch the Quick Export Hub, or switch branches in seconds.

---

### 📱 15. Mobile-First Parity & Responsive Experience
- **100% Feature Parity on Mobile**: Every feature available on desktop is fully accessible and optimized for mobile screens.
- **Mobile Bottom Navigation Bar**: 1-touch navigation bar providing immediate access to Stock, Sales, Invoice, Clients, Expenses, and Reports.
- **Categorized Hamburger Drawer**: Complete navigation sheet organizing all 11+ app modules, search, theme toggle, and account settings.
- **Floating Action Buttons (FAB)**: Accessible speed-dial floating action buttons on mobile views for rapid sales recording, item creation, and catalogue sharing.
- **Touch-Friendly Controls**: Minimum 44px touch targets, responsive sheets, smooth modal drawers, and horizontal swipe tables.

---

### 🔐 16. Role-Based Access Control (RBAC) & Security
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
| **Data Fetching & Cache** | [TanStack React Query](https://tanstack.com/query/latest) |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **PDF Engine & Extraction**| [pdfjs-dist](https://mozilla.github.io/pdf.js/) & [jsPDF](https://github.com/parallax/jsPDF) |
| **QR Code Engine** | [qrcode](https://www.npmjs.com/package/qrcode) |
| **Data Import/Export** | [PapaParse](https://www.papaparse.com/) (CSV) & [SheetJS (xlsx)](https://sheetjs.com/) |

---

## 📁 Project Structure

```text
├── public/                     # Static assets and PWA icons
├── src/
│   ├── components/             # Modular UI and domain components
│   │   ├── accessories/        # Accessory management dialogs & tables
│   │   ├── auth/               # Supabase authentication forms
│   │   ├── catalogue/          # Product catalogue, QR generator & share dialogs
│   │   ├── customers/          # Customer directory, debt ledgers & detail drawers
│   │   ├── dashboard/          # Summary KPIs, speed health pulse & export modals
│   │   ├── expenses/           # Expense tracking forms & tables
│   │   ├── inventory/          # Stock tables, batch selectors & edit modals
│   │   ├── invoice/            # Invoice builder, print layouts & PDF parser modals
│   │   ├── profit/             # Profit margin calculators & COGS breakdowns
│   │   ├── reports/            # Performance analytics & branch metrics
│   │   ├── sales/              # Order entry, import invoice dialogs & sales cards
│   │   ├── ui/                 # shadcn/ui and Radix UI base components
│   │   ├── AppLayout.tsx       # Master responsive layout wrapper
│   │   ├── CommandPalette.tsx  # Universal Cmd+K shortcut navigation hub
│   │   ├── MobileBottomNav.tsx # Primary mobile bottom navigation bar
│   │   ├── MobileFAB.tsx       # Mobile speed-dial floating action button
│   │   └── TopNavbar.tsx       # Top navigation header & categorized mobile drawer
│   ├── hooks/                  # Custom React hooks (dashboard data, invoicing, etc.)
│   ├── integrations/           # Supabase client and query bindings
│   ├── pages/                  # Application page routes
│   │   ├── Accessories.tsx     # Spare parts & hardware management
│   │   ├── Catalogue.tsx       # Internal visual product catalogue & batch selection
│   │   ├── CreateInvoice.tsx   # Dynamic invoice builder & PDF importer
│   │   ├── Customers.tsx       # Customer directory & receivables ledger
│   │   ├── Dashboard.tsx       # Executive operations dashboard & runway alerts
│   │   ├── Expenses.tsx        # Operational expense ledger
│   │   ├── Inventory.tsx       # Multi-location stock management
│   │   ├── ProfitAnalysis.tsx  # Gross/net profit & COGS analysis
│   │   ├── PublicCatalogue.tsx # Client-facing shareable showcase & WhatsApp order enquiry
│   │   ├── Purchases.tsx       # Procurement & supplier spend analysis
│   │   ├── Reconciliation.tsx  # Bank statement & POS settlement reconciliation
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
- **Catalogue & Share**: Toggle **Select Mode** on `/catalogue` to generate customized multi-product quotation proposals or scan the in-store QR code directly on mobile.
- **PDF Uploads**: Use the mobile file picker to upload PDF invoices and receipts directly from your mobile camera scanner or cloud storage.

---

## 🔒 Data Protection, Privacy & International Compliance

SI Manager is architected with strict adherence to international data protection, privacy, and commercial compliance standards:
- **Comprehensive Privacy Document**: Read our full [Privacy Policy & Data Protection Charter](PRIVACY_POLICY.md) governing global operations.
- **In-App Interactive Portal**: Accessible directly at the [`/privacy`](/privacy) route with search, section jumping, and print/PDF export.
- **Standards Complied With**:
  - **EU/UK GDPR**: Art. 5 Data Minimisation, Art. 6 Lawful Bases, Art. 15-22 Data Subject Rights (Access, Portability, Erasure).
  - **California CCPA / CPRA**: Notice at collection, consumer rights, and zero commercial sale/sharing of personal data.
  - **Nigeria Data Protection Act (NDPA 2023)**: Full compliance with the NDPC requirements for commercial business operations.
  - **Client-Side PDF Sandboxing**: PDF document parsing runs completely inside the client's browser memory via sandboxed WebAssembly (`pdfjs-dist`). Raw invoices are never sent to external AI scrapers.

---

## 📄 License

This project is licensed under the MIT License.
