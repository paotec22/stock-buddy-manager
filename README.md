# SI Manager

> A modern, responsive web application for managing inventory, sales, invoicing, catalogue, customer accounts, and financial reports.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

---

## Overview

**SI Manager** is an all-in-one business management platform built for retail, wholesale, and multi-location businesses. It streamlines stock tracking, point-of-sale recording, customer receivable tracking, professional PDF invoice creation, product catalogue sharing, and profit & expense analysis in a unified, intuitive dashboard.

---

## Key Features

### 📦 Inventory Management
- **Multi-Location Stock Tracking**: Manage inventory across multiple branches (e.g., Garki, Wuse, Karu, Abuja) with location-specific counts.
- **Stock Status Badging**: Instant visibility into stock levels (In Stock, Low Stock, Out of Stock) with automatic threshold alerts.
- **Quick Quantity Adjustments**: Increment or decrement quantities on-the-fly or edit unit costs and retail prices inline.
- **Product Imagery**: Upload and associate product thumbnail photos directly with inventory items.
- **Batch Operations**: Multi-select items with an ergonomic selector for bulk deletion and bulk updates.
- **Data Import & Export**: Full support for importing and exporting inventory data in CSV and Excel formats.

### 💼 Sales & Order Processing
- **Point-of-Sale Recording**: Fast, keyboard-accessible order entry and customer receipt generation.
- **Payment Status Tracking**: Track orders as **Paid**, **Partial**, or **Credit / Outstanding** to monitor accounts receivable.
- **Partial Payment Installments**: Record installment payments with updated remaining balances and automatic payment status recalculations.
- **Executive Sales Overview**: Real-time KPI cards displaying gross revenue, units sold, outstanding receivables, and average order value.
- **Interactive Sales Charts**: Daily and monthly trend visualizations powered by Recharts with date range filtering.

### 🧾 Professional Invoicing & Billing
- **Dynamic Invoice Builder**: Add line items, apply percentage or fixed discounts, configure taxes, and input custom banking/payment terms.
- **Multi-Currency Support**: Switch seamlessly between currencies (NGN ₦, USD $, EUR €, GBP £, etc.).
- **Print & PDF Generation**: Export high-resolution vector PDF invoices or print directly using customized thermal or A4 page layouts.
- **Smart Print Visibility**: Only filled customer fields are rendered during printing—unfilled contact rows are automatically hidden to keep receipts crisp and professional.

### 🛍️ Digital Catalogue & Public Showcase
- **Interactive Product Catalogue**: Browse items with image previews, category tags, pricing, and live availability.
- **Public Customer Showcase**: Shareable, read-only public catalogue allowing prospective clients to browse products without needing an account.

### 📈 Profit Analysis & Expense Management
- **Cost of Goods Sold (COGS)**: Track acquisition costs and calculate true gross margins per sale.
- **Expense Tracking**: Categorize daily operating expenses, overhead costs, logistics, and rent.
- **Net Profit Calculations**: Automatic deduction of operational expenses from gross margins to display net financial health.

### 👥 Customer Directory & Receivables
- **Customer Profiles**: Maintain contact details, addresses, and transaction histories.
- **Debt & Credit Ledger**: Track outstanding customer balances with quick links to associated unpaid sales.

### 📊 Business Reports & Analytics
- **Location Performance**: Compare revenue, transaction counts, and margins across different branches.
- **Activity Timelines**: Audit trails of inventory changes, sales transactions, and expense logs.
- **Custom Date Filtering**: Filter any metric by day, week, month, quarter, or custom range.

---

## Technology Stack

- **Frontend Framework**: [React 18](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Programming Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling & UI Components**:
  - [Tailwind CSS](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/) primitives
  - [Lucide React](https://lucide.dev/) icons
  - [Framer Motion](https://www.framer.com/motion/)
- **Database & Authentication**: [Supabase](https://supabase.com/) (PostgreSQL & Supabase Auth)
- **Data Fetching & State**: [TanStack React Query](https://tanstack.com/query/latest)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Document Export & Parsing**:
  - [jsPDF](https://github.com/parallax/jsPDF) & [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
  - [PapaParse](https://www.papaparse.com/) (CSV)
  - [SheetJS (xlsx)](https://sheetjs.com/)

---

## Project Structure

```text
├── public/                     # Static assets and icons
├── src/
│   ├── components/             # Reusable UI and domain components
│   │   ├── accessories/        # Accessory management dialogs & tables
│   │   ├── auth/               # Supabase authentication forms
│   │   ├── catalogue/          # Product catalogue & visual grid views
│   │   ├── customers/          # Customer profiles & debt ledgers
│   │   ├── dashboard/          # Summary KPIs, overview cards & charts
│   │   ├── expenses/           # Expense tracking forms & tables
│   │   ├── inventory/          # Stock tables, batch selectors & edit modals
│   │   ├── invoice/            # Invoice generator, print layouts & PDF export
│   │   ├── profit/             # Profit margin calculators & COGS modals
│   │   ├── reports/            # Performance analytics & location metrics
│   │   ├── sales/              # Order entry, table views & sales cards
│   │   └── ui/                 # shadcn/ui and Radix UI base components
│   ├── hooks/                  # Custom React hooks
│   ├── integrations/           # Third-party integrations (Supabase client)
│   ├── pages/                  # Top-level page routes (React Router)
│   ├── utils/                  # Formatting, calculation, and export helpers
│   ├── App.tsx                 # Root application component & router setup
│   ├── index.css               # Global Tailwind CSS stylesheet
│   └── main.tsx                # Application bootstrap entry point
├── index.html                  # HTML entry point
├── package.json                # Project dependencies and npm scripts
├── tailwind.config.ts          # Tailwind CSS design system configuration
└── vite.config.ts              # Vite configuration
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or later recommended)
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
   Create a `.env` file in the root directory and configure your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000` (or `http://localhost:5173` depending on your setup).

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the Vite development server with Hot Module Replacement. |
| `npm run build` | Compiles TypeScript and creates an optimized production bundle in `dist/`. |
| `npm run preview` | Locally previews the production build output. |
| `npm run lint` | Runs ESLint to identify and report code quality issues. |

---

## Deployment

To deploy this application to production:

1. **Build the production bundle**:
   ```bash
   npm run build
   ```
2. **Deploy the `dist/` folder** to any modern static hosting provider or container platform, such as:
   - **Vercel / Netlify**: Configure the build command as `npm run build` and output directory as `dist`.
   - **Docker / Cloud Run / Nginx**: Serve the static files from `dist/` with standard SPA fallback routing to `index.html`.

Make sure to configure the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in your deployment hosting dashboard.

---

## License

This project is licensed under the MIT License.
