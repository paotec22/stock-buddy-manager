import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Lock,
  FileText,
  Printer,
  Search,
  Building2,
  Scale,
  Globe,
  Users,
  Server,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Mail,
  Calendar,
  Eye,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface PolicySection {
  id: string;
  title: string;
  badge: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  const handlePrint = () => {
    window.print();
  };

  const sections: PolicySection[] = useMemo(() => [
    {
      id: "overview",
      title: "1. Overview & Data Controller",
      badge: "Governance",
      icon: Building2,
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Welcome to <strong className="text-foreground">SI Manager</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We are committed to protecting the privacy, confidentiality, and integrity of your commercial data, personal records, and business accounts.
          </p>
          <div className="p-4 rounded-xl border bg-muted/40 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-semibold text-foreground block">Data Controller:</span>
              <span>SI Manager Platform Operations</span>
            </div>
            <div>
              <span className="font-semibold text-foreground block">Data Protection Officer:</span>
              <span>paotec22@gmail.com</span>
            </div>
            <div>
              <span className="font-semibold text-foreground block">Global Standards:</span>
              <span>GDPR (EU/UK), CCPA/CPRA (California), NDPA 2023 (Nigeria)</span>
            </div>
            <div>
              <span className="font-semibold text-foreground block">Effective Date:</span>
              <span>October 6, 2026 (Version 2.1)</span>
            </div>
          </div>
          <p>
            This Privacy Policy governs your use of our cloud platform, point-of-sale recorder, customer CRM ledger, invoice generation tools, and client-side PDF document parser.
          </p>
        </div>
      ),
    },
    {
      id: "data-collection",
      title: "2. Categories of Data We Collect",
      badge: "Data Minimization",
      icon: FileText,
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            In strict compliance with the international principle of <strong>Data Minimization</strong> (GDPR Art. 5), we collect solely the information required to execute point-of-sale operations, customer ledger tracking, stock control, and financial reporting:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg border bg-card space-y-1.5">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <Users className="h-4 w-4 text-primary" />
                Customer CRM & Debt Ledger
              </div>
              <p className="text-xs text-muted-foreground">
                Client full name, phone number, WhatsApp contact, delivery address, project notes, transaction payment history, and outstanding balance debts.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border bg-card space-y-1.5">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <Lock className="h-4 w-4 text-primary" />
                User Authentication & Profiles
              </div>
              <p className="text-xs text-muted-foreground">
                Email address, salted & hashed password credentials, user identification tokens, and role-based permissions (<code className="text-[11px] bg-muted px-1 py-0.5 rounded">super_admin</code>, <code className="text-[11px] bg-muted px-1 py-0.5 rounded">admin</code>, <code className="text-[11px] bg-muted px-1 py-0.5 rounded">inventory_manager</code>).
              </p>
            </div>

            <div className="p-3.5 rounded-lg border bg-card space-y-1.5">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                Sales, Invoicing & Bank Ledgers
              </div>
              <p className="text-xs text-muted-foreground">
                Product line items, unit rates, tax/VAT calculations, discounts, payment channels (Bank Transfer, POS, Cash, Cheque), bank settlement references, and account ledger logs.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border bg-card space-y-1.5">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <Server className="h-4 w-4 text-primary" />
                Client-Side PDF Invoices
              </div>
              <p className="text-xs text-muted-foreground">
                Vector and text PDFs uploaded for parsing are processed <strong>client-side directly in your browser</strong> using sandboxed WebAssembly (<code className="text-[11px] bg-muted px-1 py-0.5 rounded">pdfjs-dist</code>). Raw PDFs are never scraped or fed into external AI training datasets.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "legal-bases",
      title: "3. Legal Bases for Processing",
      badge: "GDPR Art. 6 / NDPA",
      icon: Scale,
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Every processing activity conducted by SI Manager is justified under one or more recognized legal bases:
          </p>
          <ul className="space-y-2 text-xs">
            <li className="flex items-start gap-2 p-2.5 rounded-lg border bg-card">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Contractual Necessity (GDPR Art. 6(1)(b)):</strong> Providing invoicing, sales tracking, stock adjustments, and account logins requested by the user.
              </div>
            </li>
            <li className="flex items-start gap-2 p-2.5 rounded-lg border bg-card">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Legitimate Business Interests (GDPR Art. 6(1)(f)):</strong> Maintaining inventory balances across branches (Ikeja, Cement), preventing cash leakages through bank reconciliation, and protecting database integrity.
              </div>
            </li>
            <li className="flex items-start gap-2 p-2.5 rounded-lg border bg-card">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Legal & Financial Compliance (GDPR Art. 6(1)(c)):</strong> Retaining fiscal transaction receipts and invoice records required by statutory corporate tax and bookkeeping standards.
              </div>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "security",
      title: "4. Information Security & Technical Safeguards",
      badge: "ISO 27001 Baseline",
      icon: ShieldCheck,
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            We implement defense-in-depth technical and organizational measures (TOMs) to safeguard your commercial data against accidental loss, unauthorized access, or destruction:
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              <Lock className="h-4 w-4 text-primary shrink-0" />
              <div>
                <span className="font-semibold text-foreground">TLS 1.3 Encryption in Transit:</span> All data exchanged between your browser and our servers is encrypted using modern high-cipher TLS 1.3 with HTTPS enforcement.
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              <Server className="h-4 w-4 text-primary shrink-0" />
              <div>
                <span className="font-semibold text-foreground">AES-256 Encryption at Rest:</span> Primary database tables and storage backups are encrypted at rest on enterprise cloud storage.
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <div>
                <span className="font-semibold text-foreground">PostgreSQL Row-Level Security (RLS):</span> Data records are protected by strict RLS policies, ensuring access is strictly restricted to authenticated and authorized tenant profiles.
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              <Lock className="h-4 w-4 text-primary shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Protected Danger Zone:</span> Destructive operations (such as resetting sales, expenses, or database tables) require explicit Super Admin password re-authentication restricted to <code className="text-foreground font-mono">paotec22</code>.
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "statutory-rights",
      title: "5. Your Statutory Privacy Rights",
      badge: "Global Rights",
      icon: Globe,
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Regardless of your geographic location, SI Manager provides users with the full suite of international privacy rights:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-primary" />
                Right of Access & Portability
              </div>
              <p className="text-muted-foreground text-[11px]">
                Export all customer directories, sales records, and inventory data into structured, portable CSV files at any time.
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Right to Rectification
              </div>
              <p className="text-muted-foreground text-[11px]">
                Instantly correct or update customer profiles, contact numbers, delivery addresses, and payment records.
              </p>
            </div>
            <div className="p-3 rounded-lg border bg-card space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5 text-primary" />
                Right to Erasure (Be Forgotten)
              </div>
              <p className="text-muted-foreground text-[11px]">
                Request permanent deletion of customer accounts, CRM profiles, or obsolete operational records subject to statutory tax laws.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border bg-amber-500/5 border-amber-500/20 text-xs space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              California Notice (CCPA / CPRA): Zero Sale of Personal Information
            </div>
            <p className="text-muted-foreground text-[11px]">
              <strong>SI Manager does NOT sell or share personal information</strong> with third-party advertisers, brokers, or data analytics firms for commercial monetization.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "retention-subprocessors",
      title: "6. Data Retention & Sub-processors",
      badge: "Compliance",
      icon: Server,
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            We retain business and customer records for the duration of your active business operations, plus standard statutory periods (typically 6 financial years) required by corporate audit and tax regulations.
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg border bg-card flex items-start justify-between">
              <div>
                <span className="font-semibold text-foreground block">Database & Auth Hosting:</span>
                <span className="text-muted-foreground">Supabase Inc. (SOC 2 Type II certified cloud infrastructure, encrypted PostgreSQL)</span>
              </div>
              <Badge variant="outline" className="text-[10px]">Primary Host</Badge>
            </div>
            <div className="p-3 rounded-lg border bg-card flex items-start justify-between">
              <div>
                <span className="font-semibold text-foreground block">Application Delivery & Edge Network:</span>
                <span className="text-muted-foreground">Google Cloud Platform & Edge CDN with automatic TLS termination</span>
              </div>
              <Badge variant="outline" className="text-[10px]">Cloud Run</Badge>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "contact",
      title: "7. Supervisory Authorities & Contact",
      badge: "Inquiries",
      icon: Mail,
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            If you have questions, privacy requests, or wish to exercise your rights, contact our Data Protection Officer directly:
          </p>
          <div className="p-4 rounded-xl border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Data Protection Compliance Office
              </div>
              <div className="text-xs text-muted-foreground">
                Email: <span className="font-mono text-foreground">paotec22@gmail.com</span> / <span className="font-mono text-foreground">privacy@simanager.app</span>
              </div>
            </div>
            <Button size="sm" asChild>
              <a href="mailto:paotec22@gmail.com?subject=Privacy%20Policy%20Inquiry%20-%20SI%20Manager">
                Send Privacy Request
              </a>
            </Button>
          </div>
          <p className="text-xs">
            You also have the statutory right to lodge a complaint with your respective supervisory authority: <strong>Nigeria Data Protection Commission (NDPC)</strong>, the <strong>European Data Protection Board (EDPB)</strong>, or the <strong>UK Information Commissioner&apos;s Office (ICO)</strong>.
          </p>
        </div>
      ),
    },
  ], []);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [sections, searchQuery]);

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto print:p-0 print:max-w-none">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-xs print:border-none print:shadow-none print:p-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 print:hidden"
              onClick={() => navigate(-1)}
              title="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Privacy Policy & Data Charter</h1>
          </div>
          <p className="text-xs text-muted-foreground pl-10">
            International privacy, data protection, and commercial security governance (GDPR • CCPA/CPRA • NDPA 2023)
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden pl-10 md:pl-0">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 text-xs">
            <Printer className="h-3.5 w-3.5" />
            Print / Save PDF
          </Button>
          <Button size="sm" asChild className="gap-2 text-xs">
            <Link to="/settings">
              <Lock className="h-3.5 w-3.5" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Search & Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:hidden">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search privacy clauses (e.g., cookies, deletion, PDF, GDPR, security)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center justify-between px-3 py-2 border rounded-lg bg-card text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Version 2.1
          </span>
          <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200">
            Compliant
          </Badge>
        </div>
      </div>

      {/* Main Layout: Sidebar Navigation + Policy Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar (Desktop) */}
        <div className="hidden lg:block lg:col-span-1 space-y-2 sticky top-20 print:hidden">
          <div className="p-3 rounded-lg border bg-card space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2">
              Table of Contents
            </span>
            <div className="space-y-0.5 pt-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isSelected = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      const el = document.getElementById(section.id);
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-md transition-colors text-left ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{section.title}</span>
                    </span>
                    <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-lg border bg-primary/5 space-y-2 text-xs">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-primary" />
              Need Legal Clarification?
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal">
              For commercial enterprise data processing agreements (DPAs), contact our compliance office.
            </p>
            <Button size="xs" variant="outline" className="w-full text-[11px]" asChild>
              <a href="mailto:paotec22@gmail.com?subject=DPA%20Request%20-%20SI%20Manager">
                Request Custom DPA
              </a>
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="lg:col-span-3 space-y-5">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} id={section.id} className="scroll-mt-24 shadow-xs print:border-none print:shadow-none">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base sm:text-lg font-bold">
                        {section.title}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0 font-medium">
                      {section.badge}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  {section.content}
                </CardContent>
              </Card>
            );
          })}

          {filteredSections.length === 0 && (
            <div className="p-12 text-center rounded-xl border bg-card space-y-2 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto opacity-50" />
              <p className="text-sm font-medium">No policy sections match your search query &ldquo;{searchQuery}&rdquo;</p>
              <Button size="sm" variant="ghost" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
