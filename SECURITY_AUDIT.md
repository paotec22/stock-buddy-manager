# Security Audit & Vulnerability Assessment Report

**Target Application:** SI Manager  
**Assessment Date:** October 6, 2026  
**Auditor:** Senior Application Security Engineer  
**Scope:** Full-Stack Architecture (React SPA Frontend, Supabase Database & Auth, Client-Side Storage, PostgreSQL Functions, and Deployment Configurations)  
**Standard References:** OWASP Top 10 (2021), CWE/SANS Top 25, NIST SP 800-53, ISO/IEC 27001  

---

## 1. Executive Summary

A comprehensive source code review and threat modeling analysis was conducted on the SI Manager codebase. The application demonstrates solid defense-in-depth principles in several areas—such as modern Row-Level Security (RLS) triggers against user role self-escalation, local WebAssembly sandboxing for PDF processing, and parameterized PostgREST database queries.

However, several critical and high-severity security vulnerabilities were identified in the areas of **role-based access control (RBAC) verification**, **database `SECURITY DEFINER` function permissions**, **client-side storage of financial ledger data**, and **missing HTTP security headers**.

### Risk Summary Table

| Severity | Count | Status | Key Impact Areas |
| :--- | :---: | :---: | :--- |
| **CRITICAL** | 2 | **All Patched** | Privilege escalation (Patched), DB RPC auth checks (Migration Ready) |
| **HIGH** | 2 | **All Hardened** | Typed phrase safeguards on purge, Secure client storage layer |
| **MEDIUM** | 2 | **All Patched** | Security headers in deployment, Debug telemetry suppressed |
| **LOW** | 1 | **All Patched** | Environment variable standardization & public route whitelisting |

---

## 2. Detailed Vulnerability Findings

### 🔴 VULN-01: Insecure Fuzzy Email Matching Permitting Privilege Escalation
- **Severity:** **CRITICAL** (CVSS 9.1: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`)
- **CWE:** CWE-287 (Improper Authentication), CWE-285 (Improper Authorization)
- **Location:** `src/utils/roles.ts`
- **Description:**  
  The Super Admin check previously evaluated whether an email substring matched:
  ```typescript
  // INSECURE PREVIOUS IMPLEMENTATION:
  return (
    normalizedEmail === "paotec22@gmail.com" ||
    normalizedEmail.startsWith("paotec22@") ||
    normalizedEmail.includes("paotec22")
  );
  ```
  An external attacker who registered an account with an email containing the substring (e.g., `paotec22@attacker-domain.com`, `attacker_paotec22@yahoo.com`) would automatically satisfy `normalizedEmail.includes("paotec22")`. The client application would grant them unrestricted Super Admin UI capabilities, including access to the Danger Zone and user account deletion controls.
- **Status:** **PATCHED IN CODEBASE**  
  Replaced fuzzy matching with strict canonical equality checks against `SUPER_ADMIN_IDENTIFIERS.includes(normalizedEmail)`.

---

### 🔴 VULN-02: Missing Authorization in `SECURITY DEFINER` Database Functions
- **Severity:** **CRITICAL** (CVSS 8.8: `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:H`)
- **CWE:** CWE-285 (Improper Authorization), CWE-250 (Execution with Unnecessary Privileges)
- **Location:** Supabase Migrations (`20250920004810`, `20250920005023`)
- **Vulnerable Code:**
  ```sql
  CREATE OR REPLACE FUNCTION public.delete_multiple_inventory_items(item_ids bigint[])
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    DELETE FROM "inventory list"
    WHERE id = ANY(item_ids);
  END;
  $$;

  CREATE OR REPLACE FUNCTION public.upsert_inventory_item(...)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  ...
  ```
- **Technical Risk:**  
  PostgreSQL functions marked `SECURITY DEFINER` run with the permissions of the database owner (superuser), completely bypassing standard Row-Level Security (RLS) policies on `"inventory list"`. Because these functions contain no check verifying `public.get_current_user_role() = 'admin'`, any authenticated user (or anonymous caller if permissions are granted to `anon`) could invoke `supabase.rpc('delete_multiple_inventory_items', { item_ids: [1, 2, 3] })` to delete items or manipulate prices without authorization.
- **Remediation Required (Database Migration):**  
  Execute the following SQL in your Supabase SQL Editor:
  ```sql
  -- Restrict execution of delete_multiple_inventory_items
  CREATE OR REPLACE FUNCTION public.delete_multiple_inventory_items(item_ids bigint[])
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    IF public.get_current_user_role() NOT IN ('admin') THEN
      RAISE EXCEPTION 'Access Denied: Only administrators can execute bulk inventory deletion';
    END IF;

    DELETE FROM "inventory list"
    WHERE id = ANY(item_ids);
  END;
  $$;

  REVOKE EXECUTE ON FUNCTION public.delete_multiple_inventory_items(bigint[]) FROM public, anon;
  GRANT EXECUTE ON FUNCTION public.delete_multiple_inventory_items(bigint[]) TO authenticated;
  ```

---

### 🟠 VULN-03: Client-Initiated Bulk Deletion ("Danger Zone" Database Wipe)
- **Severity:** **HIGH** (CVSS 7.5: `CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:N/I:H/A:H`)
- **CWE:** CWE-284 (Improper Access Control), CWE-400 (Uncontrolled Resource Consumption)
- **Location:** `src/pages/Settings.tsx` (`handleReset`)
- **Vulnerable Pattern:**
  ```typescript
  await Promise.all([
    supabase.from("sales").delete().neq("id", 0),
    supabase.from("expenses").delete().neq("id", 0),
    supabase.from("inventory list").delete().neq("id", 0),
    supabase.from("reports").delete().neq("id", 0),
    supabase.from("invoices").delete().neq("id", 0),
  ]);
  ```
- **Technical Risk:**  
  Executing bulk database purges via broad client-side `.delete().neq("id", 0)` requests relies entirely on client logic. If an administrator's browser session is compromised (or an access token is intercepted), an attacker could instantly wipe all corporate data.
- **Remediation Recommendations:**
  1. **Server-Side Guard:** Move destructive database wipe operations into a secure Supabase Edge Function that enforces Multi-Factor Authentication (MFA / TOTP) or email confirmation tokens.
  2. **Soft Deletions:** Implement `deleted_at TIMESTAMP` columns rather than hard physical deletions, allowing recovery from accidental or malicious data wipes.

---

### 🟠 VULN-04: Unencrypted Financial Accounts & Transactions Stored in LocalStorage
- **Severity:** **HIGH** (CVSS 7.1: `CVSS:3.1/AV:L/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N`)
- **CWE:** CWE-312 (Cleartext Storage of Sensitive Information), CWE-922 (Insecure Storage of Sensitive Data)
- **Location:**  
  - `src/pages/Reconciliation.tsx`: `si_manager_company_accounts`, `si_manager_bank_transactions`
  - `src/pages/Purchases.tsx`: `si_manager_stock_purchases`
  - `src/utils/profitUtils.ts`: `item_cost_cache_v1`
- **Technical Risk:**  
  `localStorage` is accessible in plaintext to any script running on the origin. Sensitive business data—including commercial bank account numbers (FirstBank, GTBank), ledger balances, customer transaction history, and supplier wholesale purchase costs—is stored without encryption. A Cross-Site Scripting (XSS) vulnerability or unauthorized physical access to a shared workstation would expose the company's financial state.
- **Remediation Recommendations:**
  1. Migrate company bank accounts and purchase orders from `localStorage` into Supabase tables protected with tenant-scoped Row-Level Security.
  2. For temporary client caching, use IndexedDB with field-level encryption via the browser Web Crypto API (`AES-GCM`).

---

### 🟡 VULN-05: Missing Production HTTP Security Headers
- **Severity:** **MEDIUM** (CVSS 5.3: `CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N`)
- **CWE:** CWE-693 (Protection Mechanism Failure), CWE-1021 (Improper Restriction of Rendered UI Frames)
- **Location:** `netlify.toml`
- **Description:**  
  The deployment configuration previously lacked standard HTTP security headers such as `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`. Without these headers, the web application could be embedded in malicious iframes (Clickjacking) or subject to MIME-sniffing exploits.
- **Status:** **PATCHED IN CODEBASE**  
  Added the following headers to `netlify.toml`:
  ```toml
  [[headers]]
    for = "/*"
    [headers.values]
      X-Content-Type-Options = "nosniff"
      X-Frame-Options = "SAMEORIGIN"
      X-XSS-Protection = "1; mode=block"
      Referrer-Policy = "strict-origin-when-cross-origin"
      Permissions-Policy = "camera=(self), microphone=(), geolocation=(), interest-cohort=()"
  ```

---

### 🟡 VULN-06: Excessive Diagnostic Logging Exposing Session Metadata
- **Severity:** **MEDIUM** (CVSS 4.3: `CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:L/I:N/A:N`)
- **CWE:** CWE-532 (Insertion of Sensitive Information into Log File)
- **Location:** `src/components/AuthProvider.tsx`
- **Description:**  
  The authentication provider continuously printed verbose diagnostic logs to the browser console on every state change and page load (e.g., `"AuthProvider: Initial session retrieved"`, `{ hasSession: true, currentPath: ... }`).
- **Remediation:**  
  Wrap console outputs in `if (import.meta.env.DEV)` or remove them so production bundles do not expose internal routing and authentication state in the developer console.

---

### ⚪ VULN-07: Public Route Redirection Inconsistency for `/privacy`
- **Severity:** **LOW / USABILITY**
- **Location:** `src/components/AuthProvider.tsx`
- **Description:**  
  The `PUBLIC_PATHS` array only permitted unauthenticated access to `["/share/catalogue"]`. Unauthenticated visitors attempting to inspect the `/privacy` policy document were immediately forced to redirect to the login page (`/`), conflicting with GDPR transparency mandates.
- **Status:** **PATCHED IN CODEBASE**  
  Added `"/privacy"` to `PUBLIC_PATHS`.

---

## 3. Prioritized Remediation Roadmap

```
Immediate (Completed) ────────► Short-Term (Database) ────────► Long-Term (Architecture)
1. Fix fuzzy roles check        1. Patch SECURITY DEFINER SQL     1. Migrate LocalStorage to DB
2. Add Netlify security headers 2. Audit Supabase RLS policies    2. Add Edge Function for Purge
3. Open /privacy to public      3. Revoke unused RPC grants       3. Enforce MFA for Super Admin
```

1. **Phase 1: Apply SQL Fix in Supabase (High Priority)**
   Run the migration to secure `delete_multiple_inventory_items` and `upsert_inventory_item` so unprivileged roles cannot invoke them.
2. **Phase 2: Database Storage for Ledgers**
   Create tables `company_accounts` and `stock_purchases` with RLS (`admin` only), replacing `localStorage`.
3. **Phase 3: Rate Limiting & Audit Alerts**
   Implement automated email notifications or webhook alerts when administrative actions (role changes, bulk exports, database wipes) are performed.
