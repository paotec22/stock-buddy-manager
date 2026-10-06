# Privacy Policy & Data Protection Charter

**Effective Date:** October 6, 2026  
**Last Updated:** October 6, 2026  
**Application:** SI Manager (Web, Mobile & Commercial Operations Suite)  
**Governing Standards:** EU/UK General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA), Nigeria Data Protection Act (NDPA 2023), and International ISO/IEC 27701 Guidelines.

---

## 1. Introduction & Overview

Welcome to **SI Manager** ("we," "our," "us," or the "Application"). We are committed to protecting the privacy, confidentiality, and security of our users, business operators, and their end-customers.

This Privacy Policy explains how SI Manager collects, processes, stores, protects, and discloses personal data and commercial information when you access or use the SI Manager web application, point-of-sale interfaces, customer relationship management (CRM) ledgers, PDF invoice extraction tools, inventory portals, and associated services (collectively, the "Services").

By accessing or using SI Manager, you acknowledge that you have read, understood, and agreed to the practices described in this Privacy Policy.

---

## 2. Data Controller & Data Protection Officer (DPO)

- **Data Controller:** SI Manager Operations Team
- **Official Contact Email:** `privacy@simanager.app` / `paotec22@gmail.com`
- **Supervisory Lead / DPO:** Data Protection & Security Compliance Office
- **Physical Operations Notice:** Dual-region operations (Lagos, Nigeria & International Cloud Compute Europe/North America).

If you have questions regarding this Privacy Policy or wish to exercise any statutory rights, you may contact our Data Protection Officer directly at the email addresses listed above.

---

## 3. Key Definitions

To ensure transparency across global legal jurisdictions:
- **"Personal Data"** means any information relating to an identified or identifiable natural person ("Data Subject") as defined under GDPR Art. 4(1), NDPA 2023, and CCPA/CPRA § 1798.140.
- **"Processing"** means any operation performed on Personal Data, such as collection, recording, organization, structuring, storage, adaptation, retrieval, consultation, use, disclosure, or erasure.
- **"Commercial Records"** refers to inventory lists, stock costs, selling prices, warehouse locations, purchase orders, and supplier invoices.
- **"Customer CRM Records"** refers to client records maintained by business operators within SI Manager, including client names, contact numbers, delivery addresses, and ledger accounts.

---

## 4. Categories of Data We Collect

We adhere strictly to the principle of **Data Minimization** (GDPR Art. 5(1)(c)). We collect only the data necessary to provide seamless inventory tracking, invoicing, sales logging, and business reconciliation.

### A. Account & Authentication Information
- **User Identity:** Email address, user identification tokens, avatar URLs, and profile display names.
- **Access Credentials:** Hashed passwords (processed securely via Supabase Auth; raw passwords are never readable or stored in plaintext).
- **Role-Based Access Control (RBAC):** Administrative role assignments (`super_admin`, `admin`, `inventory_manager`, `uploader`).

### B. Customer & Accounts Receivable Information (CRM Data)
When business operators manage clients within SI Manager:
- **Client Identity:** Customer full name, company name.
- **Contact Details:** Phone number, WhatsApp international link format, email address.
- **Delivery Information:** Physical delivery address and warehouse drop-off notes.
- **Accounts Receivable Ledger:** Sales transactions, installment payments, recorded debts, debt clearance history, and settlement timestamps.

### C. Commercial Transactions, Invoicing & Bank Reconciliation Data
- **Transaction Metadata:** Date of sale, quantity sold, unit price, discounts, tax/VAT calculations, total amount, and installment balance.
- **Payment Method & Reference:** Payment channel (Bank Transfer, POS Terminal Card, Cash, Cheque) and payment reference codes (e.g., NIP session IDs, terminal sequence numbers).
- **Invoices & Receipts:** Itemized descriptions, currency identifiers (₦ NGN, $ USD, € EUR, £ GBP), and status indicators (Draft, Issued, Paid, Overdue).
- **Account Ledger Balances:** Internal reconciliation tags correlating bank statement line items with registered sales transactions.

### D. Vendor & Procurement Data
- **Supplier Information:** Vendor names, contact points, and vendor bill references.
- **Stock Procurement Costs:** Purchase order numbers, unit cost prices, markup margins, and restock batches.

### E. Client-Side Document Data (PDF Invoice Extraction)
- **Local PDF Processing:** When you upload a PDF invoice or paper receipt to SI Manager, the text and numeric coordinates are parsed **client-side directly within your browser runtime** using sandboxed WebAssembly/JavaScript rendering (`pdfjs-dist`). 
- **No Third-Party AI Scraping:** Raw uploaded PDF binaries are not transmitted to unauthorized third-party public AI models for training or scraping. Data extracted is solely presented to the authorized operator to confirm and apply to their invoice or sales record.

### F. Technical & Diagnostic Information
- **Session & Telemetry:** IP address, browser type, operating system, timestamp of access, referral URLs, and client error logs.
- **Offline & Cache Storage:** IndexedDB store keys (`inventory`, `sales`, `expenses`, `syncQueue`) and `localStorage` preferences (color themes, active currency, draft state) retained locally on your client machine for offline functionality.

---

## 5. Legal Bases for Processing (GDPR Art. 6 & NDPA 2023)

We process your data under the following recognized legal bases:

| Category of Processing | Legal Basis (GDPR / NDPA) | Justification |
| :--- | :--- | :--- |
| **User Account & Access** | **Contractual Necessity (Art. 6(1)(b))** | Necessary to authenticate you and grant access to your business database. |
| **Invoicing & Sales Operations** | **Contractual Necessity (Art. 6(1)(b))** | Required to generate commercial invoices, compute taxes, and track customer fulfillments. |
| **Financial Reconciliation & Accounting** | **Legal Obligation (Art. 6(1)(c)) & Legitimate Interest** | Required for accurate bookkeeping, corporate audits, tax records, and preventing cash leakage. |
| **Customer Debt & CRM Ledger** | **Legitimate Interest (Art. 6(1)(f))** | Necessary for tracking accounts receivable and managing business credit lines. |
| **Security, RBAC & Audit Trails** | **Legitimate Interest (Art. 6(1)(f))** | Protecting system integrity, preventing unauthorized database purges, and ensuring audit compliance. |
| **Marketing & Voluntary Alerts** | **Consent (Art. 6(1)(a))** | Where explicitly requested by the user, withdrawable at any time. |

---

## 6. How We Use and Disclose Data

We do **not** sell, rent, or trade your personal or business data to advertisers or data brokers under any circumstances.

We use your data solely for:
1. **Operating the Core Platform:** Providing inventory tracking, showroom catalogues, sales recording, and PDF invoice creation.
2. **Accounts Receivable & Debt Management:** Calculating customer debt, generating installment logs, and issuing payment receipts.
3. **Audit Trails & Security:** Enforcing Super Admin verification protocols before destructive operations (e.g., database table resets).
4. **Offline Resilience:** Syncing local changes to the cloud when connectivity is restored.

---

## 7. Sub-processors and Third-Party Infrastructure

We engage reputable cloud infrastructure and sub-processors adhering to SOC 2 Type II, ISO 27001, and GDPR standards:

- **Database & Authentication Hosting:** Supabase Inc. (PostgreSQL database with Row-Level Security, secure edge functions, and PKCE-authenticated sessions). Data stored in enterprise-grade data centers with continuous replication.
- **Application Delivery & Hosting:** Cloud Run / Edge CDN infrastructure with automated SSL/TLS termination and DDoS mitigation.
- **Font & CDN Assets:** Google Fonts / open-source static bundles served over secure HTTPS.

All sub-processors are bound by strict Data Processing Agreements (DPAs) requiring adherence to Standard Contractual Clauses (SCCs).

---

## 8. International Data Transfers

When data is transferred across international boundaries (e.g., between Nigeria, the European Union, the United Kingdom, and the United States):
- We ensure appropriate safeguards in accordance with GDPR Chapter V and NDPA provisions.
- We implement European Commission-approved **Standard Contractual Clauses (SCCs)** and UK International Data Transfer Agreements (IDTAs).
- Cloud storage providers utilize encrypted data centers meeting international privacy shield safeguards.

---

## 9. Data Retention & Erasure Schedule

We retain personal and commercial data only for as long as necessary to fulfill the purposes outlined in this Policy, or as mandated by statutory accounting and tax standards:

- **Active Business Records (Sales, Invoices, Expenses):** Retained for the duration of your active business subscription plus 6 (six) statutory financial years to comply with tax and audit laws.
- **Customer CRM Entries:** Retained until updated, anonymized, or deleted by an authorized system administrator.
- **Session & Offline Tokens:** Session credentials expire based on configurable auth policies; local cache storage can be cleared by the user at any time via browser storage settings.
- **Account Termination & Database Purge:** When a Super Admin executes a verified database reset or customer removal, the target records are permanently purged from primary active database tables.

---

## 10. Information Security & Technical Safeguards

We implement defense-in-depth technical and organizational measures (TOMs) meeting international cybersecurity baselines:

1. **Encryption in Transit:** All communications between client browsers and SI Manager servers enforce **TLS 1.3 / HTTPS** with HSTS headers.
2. **Encryption at Rest:** All relational data, profiles, and transaction records stored on Supabase/PostgreSQL utilize **AES-256** disk encryption.
3. **Row-Level Security (RLS):** Database tables enforce granular PostgreSQL Row-Level Security policies, ensuring users only access records belonging to authorized roles or tenants.
4. **Role-Based Access Control (RBAC):** Privileged actions (e.g., database reset, role assignment) require multi-factor or re-authentication with password verification strictly limited to verified Super Admin credentials (`paotec22`).
5. **No Plaintext Passwords:** Passwords are salted and hashed using modern key derivation algorithms (Bcrypt/Argon2).
6. **Client-Side PDF Sandboxing:** Uploaded invoice PDFs are evaluated entirely within client memory; file descriptors are discarded immediately after processing.

---

## 11. Your Statutory Privacy Rights

Depending on your geographic location and applicable data protection legislation (GDPR, UK GDPR, NDPA 2023, CCPA/CPRA, LGPD), you possess the following rights:

### A. European Union, United Kingdom & International (GDPR / UK GDPR)
- **Right to Access (Art. 15):** Request confirmation of whether your data is being processed and obtain a portable copy of your records.
- **Right to Rectification (Art. 16):** Correct inaccurate or incomplete personal or business information.
- **Right to Erasure / "Right to be Forgotten" (Art. 17):** Request the deletion of your personal data where retention is no longer legally required.
- **Right to Restriction of Processing (Art. 18):** Limit how we use your data while a dispute is being investigated.
- **Right to Data Portability (Art. 20):** Export your clients, sales, and inventory records in a structured, machine-readable format (CSV / JSON).
- **Right to Object (Art. 21):** Object to processing based on legitimate interest grounds.
- **Right to Withdraw Consent (Art. 7(3)):** Withdraw consent previously granted without affecting processing carried out prior to withdrawal.

### B. California Residents (CCPA / CPRA)
- **Notice at Collection:** Details regarding categories of personal information collected.
- **Right to Know:** The right to request disclosure of personal information collected, disclosed, or shared over the preceding 12 months.
- **Right to Delete:** Request deletion of personal information subject to legal exemptions.
- **Right to Correct:** Request correction of inaccurate personal information.
- **Non-Discrimination:** We will never deny services, charge different prices, or provide a different quality of service because you exercised your CCPA/CPRA rights.
- **"Do Not Sell or Share My Personal Information":** **SI Manager does NOT sell or share personal information with third parties for commercial gain or cross-context behavioral advertising.**

### C. Nigeria Residents (Nigeria Data Protection Act - NDPA 2023)
- Rights under Part V of the NDPA 2023, including the right to be informed, right of access, right to rectification, right to erasure, and the right to object to processing.
- Direct recourse to the **Nigeria Data Protection Commission (NDPC)** (`info@ndpc.gov.ng`).

---

## 12. Exercising Your Rights & Verification Process

To exercise any of your statutory rights:
1. Submit a written request to **`privacy@simanager.app`** or **`paotec22@gmail.com`**.
2. To protect your commercial confidentiality, we verify identity before executing requests. Verification may require authentication via your registered administrator account or confirmation of administrative role credentials.
3. We respond to all legitimate requests within **30 calendar days** (or 45 days where permitted under CCPA), free of charge.

---

## 13. Cookies & Local Storage Technologies

SI Manager uses modern web storage technologies to deliver its features:

- **Strictly Necessary Storage (Cannot be switched off):**
  - Supabase PKCE authentication tokens (persisting your secure login session).
  - CSRF and security validation cookies.
- **Functional Storage:**
  - `app-theme`: Stores your UI preference (`dark` or `light` mode).
  - `si_manager_company_accounts` & `si_manager_stock_purchases`: Local ledger state for reconciliation and procurement.
  - IndexedDB (`puido-offline-db`): Offline cache of inventory, sales, and pending sync queues.
- **No Third-Party Advertising Trackers:** SI Manager does **not** employ third-party behavioral ad trackers, pixel beacons, or data broker cookies.

---

## 14. Protection of Minors (COPPA & GDPR)

SI Manager is a professional commercial business management and point-of-sale platform designed strictly for use by adult business owners, operators, and staff members. It is not directed to, or intended for use by, individuals under 18 years of age (or under 16 years within the EU/EEA). We do not knowingly collect personal data from minors. If you believe a minor has provided data to our platform, please contact us immediately for prompt deletion.

---

## 15. Changes to This Privacy Policy

We may periodically revise this Privacy Policy to reflect modifications in our software features, cloud infrastructure, or statutory regulatory standards. 
- Significant revisions will be announced via an in-app notice, banner, or direct communication to registered administrators.
- The **"Last Updated"** date at the top of this document indicates the effective version. Continued use of SI Manager after changes are published constitutes acceptance of the amended terms.

---

## 16. Supervisory Authority Contacts

If you believe our processing of your personal data infringes applicable data protection legislation, you have the right to lodge a complaint with your competent supervisory authority:

- **Nigeria:** Nigeria Data Protection Commission (NDPC) — Website: [ndpc.gov.ng](https://ndpc.gov.ng)
- **European Union:** European Data Protection Board (EDPB) or your national DPA — Website: [edpb.europa.eu](https://edpb.europa.eu)
- **United Kingdom:** Information Commissioner's Office (ICO) — Website: [ico.org.uk](https://ico.org.uk)
- **United States:** California Privacy Protection Agency (CPPA) / California Attorney General — Website: [cppa.ca.gov](https://cppa.ca.gov)

---

## 17. Contact & Official Inquiries

For legal, privacy, compliance, or security inquiries:

- **Legal Entity:** SI Manager Platform Administration
- **Designated Contact:** Data Protection Compliance Officer
- **Email:** `paotec22@gmail.com`
- **Application Portal:** [SI Manager Dashboard Settings](/settings)
