import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Landmark,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Plus,
  RefreshCw,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  Building2,
  CreditCard,
  Wallet,
  DollarSign,
  HelpCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { getSecureItem, setSecureItem } from "@/utils/secureStorage";

// Types
export interface CompanyAccount {
  id: string;
  name: string;
  account_number: string;
  bank_name: string;
  type: "bank" | "pos" | "cash_till";
  opening_balance: number;
  current_balance: number;
}

export interface BankTransaction {
  id: string;
  account_id: string;
  account_name: string;
  transaction_date: string;
  amount: number;
  type: "deposit" | "withdrawal";
  reference: string;
  description: string;
  payment_method: string;
  reconciled: boolean;
  matched_sale_id?: string | null;
  matched_expense_id?: string | null;
}

export interface UnreconciledSale {
  id: string;
  sale_date: string;
  total_amount: number;
  amount_paid: number;
  payment_status: string;
  notes?: string;
  item_name?: string;
  customer_name?: string;
}

// Local storage helpers for mock persistence if backend table isn't migrated
const STORAGE_KEY_ACCOUNTS = "si_manager_company_accounts";
const STORAGE_KEY_BANK_TXNS = "si_manager_bank_transactions";

const DEFAULT_ACCOUNTS: CompanyAccount[] = [
  {
    id: "acc_1",
    name: "FirstBank Main Business",
    account_number: "3081234567",
    bank_name: "First Bank of Nigeria",
    type: "bank",
    opening_balance: 1500000,
    current_balance: 3450000,
  },
  {
    id: "acc_2",
    name: "GTBank Sales & POS",
    account_number: "0129876543",
    bank_name: "Guaranty Trust Bank",
    type: "pos",
    opening_balance: 500000,
    current_balance: 1820000,
  },
  {
    id: "acc_3",
    name: "Showroom Cash Till",
    account_number: "CASH-TILL-01",
    bank_name: "Petty Cash",
    type: "cash_till",
    opening_balance: 100000,
    current_balance: 245000,
  },
];

export default function Reconciliation() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("reconciliation");

  // Account Modal state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccNumber, setNewAccNumber] = useState("");
  const [newBankName, setNewBankName] = useState("");
  const [newAccType, setNewAccType] = useState<"bank" | "pos" | "cash_till">("bank");
  const [newAccBalance, setNewAccBalance] = useState("");

  // Bank Txn Modal state
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [txnAccId, setTxnAccId] = useState("");
  const [txnAmount, setTxnAmount] = useState("");
  const [txnType, setTxnType] = useState<"deposit" | "withdrawal">("deposit");
  const [txnRef, setTxnRef] = useState("");
  const [txnDesc, setTxnDesc] = useState("");
  const [txnDate, setTxnDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [txnMethod, setTxnMethod] = useState("Bank Transfer");

  // CSV Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importAccountId, setImportAccountId] = useState("");
  const [csvText, setCsvText] = useState("");

  // Match Modal
  const [selectedTxnToMatch, setSelectedTxnToMatch] = useState<BankTransaction | null>(null);

  // 1. Fetch Accounts
  const { data: accounts = DEFAULT_ACCOUNTS } = useQuery<CompanyAccount[]>({
    queryKey: ["companyAccounts"],
    queryFn: async () => {
      const data = getSecureItem<CompanyAccount[]>(STORAGE_KEY_ACCOUNTS, DEFAULT_ACCOUNTS);
      return data;
    },
  });

  // 2. Fetch Bank Transactions
  const { data: bankTransactions = [], refetch: refetchTxns } = useQuery<BankTransaction[]>({
    queryKey: ["bankTransactions"],
    queryFn: async () => {
      // Generate initial demo bank statement records
      const initialTxns: BankTransaction[] = [
        {
          id: "txn_101",
          account_id: "acc_1",
          account_name: "FirstBank Main Business",
          transaction_date: format(new Date(), "yyyy-MM-dd"),
          amount: 250000,
          type: "deposit",
          reference: "NIP/FT/2026100201",
          description: "Transfer from CHIDI OKAFOR - Invoice Payment",
          payment_method: "Bank Transfer",
          reconciled: true,
        },
        {
          id: "txn_102",
          account_id: "acc_2",
          account_name: "GTBank Sales & POS",
          transaction_date: format(new Date(), "yyyy-MM-dd"),
          amount: 180000,
          type: "deposit",
          reference: "POS/MERCH/882190",
          description: "Terminal Settlement POS 882190",
          payment_method: "POS",
          reconciled: false,
        },
        {
          id: "txn_103",
          account_id: "acc_1",
          account_name: "FirstBank Main Business",
          transaction_date: format(new Date(Date.now() - 86400000), "yyyy-MM-dd"),
          amount: 450000,
          type: "deposit",
          reference: "NIP/FT/998122",
          description: "Bulk Hardware Payment",
          payment_method: "Bank Transfer",
          reconciled: false,
        },
      ];
      return getSecureItem<BankTransaction[]>(STORAGE_KEY_BANK_TXNS, initialTxns);
    },
  });

  // 3. Fetch Recorded Sales from Supabase
  const { data: recordedSales = [] } = useQuery({
    queryKey: ["salesForReconciliation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id,
          sale_date,
          total_amount,
          amount_paid,
          payment_status,
          notes,
          customer_id,
          "inventory list" (
            "Item Description"
          )
        `)
        .order("sale_date", { ascending: false });

      if (error) {
        console.error("Error fetching sales for reconciliation:", error);
        return [];
      }

      return (data || []).map((s: any) => ({
        id: s.id,
        sale_date: s.sale_date,
        total_amount: s.total_amount,
        amount_paid: s.amount_paid || s.total_amount,
        payment_status: s.payment_status,
        notes: s.notes,
        item_name: s["inventory list"]?.["Item Description"] || "General Product Sale",
      }));
    },
  });

  // Calculate Metrics
  const totalSalesRecorded = useMemo(() => {
    return recordedSales.reduce((acc, sale) => acc + (sale.amount_paid || sale.total_amount || 0), 0);
  }, [recordedSales]);

  const totalBankDeposits = useMemo(() => {
    return bankTransactions
      .filter((t) => t.type === "deposit")
      .reduce((acc, t) => acc + t.amount, 0);
  }, [bankTransactions]);

  const reconciledDeposits = useMemo(() => {
    return bankTransactions
      .filter((t) => t.type === "deposit" && t.reconciled)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [bankTransactions]);

  const unreconciledBankTxns = useMemo(() => {
    return bankTransactions.filter((t) => !t.reconciled);
  }, [bankTransactions]);

  const accountBalancesSum = useMemo(() => {
    return accounts.reduce((acc, a) => acc + a.current_balance, 0);
  }, [accounts]);

  const reconciliationGap = totalSalesRecorded - totalBankDeposits;

  // Filtered Bank Transactions
  const filteredTxns = useMemo(() => {
    return bankTransactions.filter((t) => {
      const matchesAccount = selectedAccountId === "all" || t.account_id === selectedAccountId;
      const matchesSearch =
        !searchQuery ||
        t.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.amount.toString().includes(searchQuery);
      return matchesAccount && matchesSearch;
    });
  }, [bankTransactions, selectedAccountId, searchQuery]);

  // Handle Add Account
  const handleAddAccount = () => {
    if (!newAccName || !newAccNumber) {
      toast.error("Please fill in the account name and number.");
      return;
    }
    const newAcc: CompanyAccount = {
      id: `acc_${Date.now()}`,
      name: newAccName,
      account_number: newAccNumber,
      bank_name: newBankName || "Commercial Bank",
      type: newAccType,
      opening_balance: parseFloat(newAccBalance) || 0,
      current_balance: parseFloat(newAccBalance) || 0,
    };

    const updated = [...accounts, newAcc];
    setSecureItem(STORAGE_KEY_ACCOUNTS, updated);
    queryClient.setQueryData(["companyAccounts"], updated);
    toast.success("Account added successfully!");
    setIsAccountModalOpen(false);
    setNewAccName("");
    setNewAccNumber("");
    setNewBankName("");
    setNewAccBalance("");
  };

  // Handle Log Bank Transaction
  const handleAddTxn = () => {
    if (!txnAccId || !txnAmount) {
      toast.error("Please select an account and specify an amount.");
      return;
    }

    const acc = accounts.find((a) => a.id === txnAccId);
    const amountNum = parseFloat(txnAmount);

    const newTxn: BankTransaction = {
      id: `txn_${Date.now()}`,
      account_id: txnAccId,
      account_name: acc ? acc.name : "Company Account",
      transaction_date: txnDate,
      amount: amountNum,
      type: txnType,
      reference: txnRef || `REF/${Date.now().toString().slice(-6)}`,
      description: txnDesc || `${txnType === "deposit" ? "Sale Deposit" : "Expense Payment"}`,
      payment_method: txnMethod,
      reconciled: false,
    };

    const updatedTxns = [newTxn, ...bankTransactions];
    setSecureItem(STORAGE_KEY_BANK_TXNS, updatedTxns);
    queryClient.setQueryData(["bankTransactions"], updatedTxns);

    // Update account balance
    if (acc) {
      const balanceDelta = txnType === "deposit" ? amountNum : -amountNum;
      const updatedAccounts = accounts.map((a) =>
        a.id === acc.id ? { ...a, current_balance: a.current_balance + balanceDelta } : a
      );
      setSecureItem(STORAGE_KEY_ACCOUNTS, updatedAccounts);
      queryClient.setQueryData(["companyAccounts"], updatedAccounts);
    }

    toast.success("Bank transaction logged successfully!");
    setIsTxnModalOpen(false);
    setTxnAmount("");
    setTxnRef("");
    setTxnDesc("");
  };

  // Handle CSV Import
  const handleImportCSV = () => {
    if (!importAccountId || !csvText.trim()) {
      toast.error("Please select an account and paste CSV statement rows.");
      return;
    }

    const acc = accounts.find((a) => a.id === importAccountId);
    const lines = csvText.trim().split("\n");
    const newTxns: BankTransaction[] = [];
    let addedCount = 0;

    lines.forEach((line, index) => {
      // Skip header if detected
      if (index === 0 && line.toLowerCase().includes("date")) return;

      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        const dateStr = parts[0] || format(new Date(), "yyyy-MM-dd");
        const amountNum = Math.abs(parseFloat(parts[1]) || 0);
        const desc = parts[2] || "Imported Bank Statement Deposit";
        const ref = parts[3] || `CSV-REF-${index + 1}`;
        const typeStr = (parts[4] || "").toLowerCase().includes("out") ? "withdrawal" : "deposit";

        if (amountNum > 0) {
          newTxns.push({
            id: `txn_csv_${Date.now()}_${index}`,
            account_id: importAccountId,
            account_name: acc ? acc.name : "Imported Account",
            transaction_date: dateStr,
            amount: amountNum,
            type: typeStr,
            reference: ref,
            description: desc,
            payment_method: "Bank Transfer",
            reconciled: false,
          });
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      const updatedTxns = [...newTxns, ...bankTransactions];
      setSecureItem(STORAGE_KEY_BANK_TXNS, updatedTxns);
      queryClient.setQueryData(["bankTransactions"], updatedTxns);
      toast.success(`Imported ${addedCount} statement lines successfully!`);
      setIsImportModalOpen(false);
      setCsvText("");
    } else {
      toast.error("No valid transactions could be parsed from the CSV text.");
    }
  };

  // Handle Auto Match
  const handleAutoReconcile = () => {
    let matchedCount = 0;
    const updated = bankTransactions.map((txn) => {
      if (txn.reconciled) return txn;

      // Find an unreconciled sale with exact/similar amount
      const matchingSale = recordedSales.find(
        (sale) => Math.abs((sale.amount_paid || sale.total_amount) - txn.amount) < 5
      );

      if (matchingSale && txn.type === "deposit") {
        matchedCount++;
        return {
          ...txn,
          reconciled: true,
          matched_sale_id: matchingSale.id,
        };
      }

      return txn;
    });

    if (matchedCount > 0) {
      setSecureItem(STORAGE_KEY_BANK_TXNS, updated);
      queryClient.setQueryData(["bankTransactions"], updated);
      toast.success(`Auto-reconciled ${matchedCount} bank deposits with sales records!`);
    } else {
      toast.info("No exact matching sales found for outstanding bank deposits.");
    }
  };

  // Single Reconcile Toggle
  const toggleReconcile = (txnId: string) => {
    const updated = bankTransactions.map((t) => {
      if (t.id === txnId) {
        const nextState = !t.reconciled;
        toast.success(nextState ? "Transaction marked as Reconciled" : "Transaction marked as Unreconciled");
        return { ...t, reconciled: nextState };
      }
      return t;
    });
    setSecureItem(STORAGE_KEY_BANK_TXNS, updated);
    queryClient.setQueryData(["bankTransactions"], updated);
  };

  // Manual Match Txn with Sale
  const handleMatchWithSale = (saleId: string) => {
    if (!selectedTxnToMatch) return;

    const updated = bankTransactions.map((t) => {
      if (t.id === selectedTxnToMatch.id) {
        return {
          ...t,
          reconciled: true,
          matched_sale_id: saleId,
        };
      }
      return t;
    });

    setSecureItem(STORAGE_KEY_BANK_TXNS, updated);
    queryClient.setQueryData(["bankTransactions"], updated);
    toast.success("Successfully matched bank deposit with sale record!");
    setSelectedTxnToMatch(null);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Bank & Account Reconciliation</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Track and reconcile your bank statement deposits, POS settlements, and cash tills directly against recorded sales and expenses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleAutoReconcile} className="bg-primary hover:bg-primary/90 gap-2">
            <Sparkles className="h-4 w-4" />
            Auto-Reconcile
          </Button>

          <Button variant="outline" onClick={() => setIsTxnModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Log Statement Line
          </Button>

          <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>

          <Button variant="secondary" onClick={() => setIsAccountModalOpen(true)} className="gap-2">
            <Building2 className="h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Advice & Guidance Box */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              <Scale className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                How Bank Reconciliation Protects Your Business Revenue
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Recording a sale in your POS/Sales ledger only confirms that a customer bought products. <strong>Account reconciliation</strong> verifies that the money actually landed safely inside your FirstBank, GTBank, or POS account. This helps identify missing transfer receipts, uncollected POS payments, delayed cash deposits, and unaccounted bank charges.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Total Recorded Sales Ledger</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {formatCurrency(totalSalesRecorded)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1">
            <CreditCard className="h-3.5 w-3.5 text-primary" />
            <span>Sales recorded in system</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Bank Statement Deposits</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalBankDeposits)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1">
            <ArrowDownRight className="h-3.5 w-3.5 text-emerald-600" />
            <span>Actual funds in accounts</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Reconciled Cash / Bank Ratio</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600">
              {totalBankDeposits > 0
                ? `${Math.round((reconciledDeposits / totalBankDeposits) * 100)}%`
                : "100%"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
            <span>{formatCurrency(reconciledDeposits)} verified</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Variance / Gap to Reconcile</CardDescription>
            <CardTitle
              className={`text-2xl font-bold ${
                reconciliationGap > 0 ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {formatCurrency(Math.abs(reconciliationGap))}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1">
            {reconciliationGap > 0 ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>Sales awaiting bank deposit</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Accounts perfectly balanced</span>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business Accounts List Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Connected Company Accounts & Tills
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setIsAccountModalOpen(true)} className="gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add New Account
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <Card
              key={acc.id}
              className={`cursor-pointer transition-all border ${
                selectedAccountId === acc.id ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedAccountId(selectedAccountId === acc.id ? "all" : acc.id)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant={acc.type === "bank" ? "default" : acc.type === "pos" ? "secondary" : "outline"} className="capitalize mb-1">
                      {acc.type.replace("_", " ")}
                    </Badge>
                    <h3 className="font-semibold text-foreground text-base">{acc.name}</h3>
                    <p className="text-xs text-muted-foreground">{acc.bank_name} • {acc.account_number}</p>
                  </div>
                  <div className="p-2 rounded-full bg-muted">
                    {acc.type === "bank" ? (
                      <Landmark className="h-5 w-5 text-primary" />
                    ) : acc.type === "pos" ? (
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Wallet className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Current Balance</span>
                  <span className="font-bold text-base text-foreground">{formatCurrency(acc.current_balance)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Table Tabs & Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-2 w-full md:w-auto">
                <TabsTrigger value="reconciliation">
                  Bank Statement Lines ({filteredTxns.length})
                </TabsTrigger>
                <TabsTrigger value="unreconciled_sales">
                  Unreconciled Sales ({recordedSales.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ref, desc, amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <TabsContent value="reconciliation" className="mt-0">
            {filteredTxns.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground space-y-3">
                <Landmark className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-sm">No bank statement lines recorded for this filter.</p>
                <Button size="sm" variant="outline" onClick={() => setIsTxnModalOpen(true)}>
                  Log First Bank Line
                </Button>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Reference / Description</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTxns.map((txn) => (
                      <TableRow key={txn.id} className={txn.reconciled ? "bg-emerald-500/5" : ""}>
                        <TableCell className="text-xs whitespace-nowrap font-medium">
                          {txn.transaction_date}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap font-medium">
                          {txn.account_name}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-semibold text-foreground">{txn.reference}</div>
                          <div className="text-muted-foreground text-[11px] truncate max-w-[240px]">
                            {txn.description}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-[10px]">
                            {txn.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-xs font-bold text-right whitespace-nowrap ${
                            txn.type === "deposit" ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {txn.type === "deposit" ? "+" : "-"}
                          {formatCurrency(txn.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          {txn.reconciled ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 gap-1 text-[10px]">
                              <CheckCircle2 className="h-3 w-3" /> Reconciled
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 gap-1 text-[10px]">
                              <Clock className="h-3 w-3" /> Pending Match
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap space-x-2">
                          {!txn.reconciled && (
                            <Button
                              size="xs"
                              variant="default"
                              onClick={() => setSelectedTxnToMatch(txn)}
                              className="h-7 text-xs gap-1"
                            >
                              Match Sale
                            </Button>
                          )}
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => toggleReconcile(txn.id)}
                            className="h-7 text-xs"
                          >
                            {txn.reconciled ? "Unmatch" : "Mark Reconciled"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="unreconciled_sales" className="mt-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale Date</TableHead>
                    <TableHead>Item / Notes</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead className="text-center">Reconciliation Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordedSales.map((sale) => {
                    const isMatchedInBank = bankTransactions.some((t) => t.matched_sale_id === sale.id || (t.reconciled && Math.abs(t.amount - (sale.amount_paid || sale.total_amount)) < 5));
                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="text-xs whitespace-nowrap font-medium">
                          {sale.sale_date ? format(new Date(sale.sale_date), "yyyy-MM-dd") : "N/A"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium text-foreground">{sale.item_name}</div>
                          {sale.notes && <div className="text-[11px] text-muted-foreground">{sale.notes}</div>}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge
                            variant={
                              sale.payment_status === "paid"
                                ? "default"
                                : sale.payment_status === "part_paid"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-[10px] capitalize"
                          >
                            {sale.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-right">
                          {formatCurrency(sale.total_amount)}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-right text-emerald-600">
                          {formatCurrency(sale.amount_paid || sale.total_amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          {isMatchedInBank ? (
                            <Badge className="bg-emerald-600 gap-1 text-[10px]">
                              <CheckCircle2 className="h-3 w-3" /> Bank Deposit Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 gap-1 text-[10px]">
                              <AlertTriangle className="h-3 w-3" /> Awaiting Bank Credit
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </CardContent>
      </Card>

      {/* Add Account Modal */}
      <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Business Account or Cash Till</DialogTitle>
            <DialogDescription>
              Add a bank account, POS merchant account, or physical cash till to reconcile against sales.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Account Name</label>
              <Input
                placeholder="e.g. FirstBank Main Operating"
                value={newAccName}
                onChange={(e) => setNewAccName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Bank / Merchant Name</label>
              <Input
                placeholder="e.g. First Bank, GTBank, Moniepoint"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Account / Terminal Number</label>
              <Input
                placeholder="e.g. 3081234567 or POS-8812"
                value={newAccNumber}
                onChange={(e) => setNewAccNumber(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Account Type</label>
              <Select value={newAccType} onValueChange={(val: any) => setNewAccType(val)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Commercial Bank Account</SelectItem>
                  <SelectItem value="pos">POS Terminal Merchant Account</SelectItem>
                  <SelectItem value="cash_till">Physical Cash Till / Petty Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Opening Balance (₦)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={newAccBalance}
                onChange={(e) => setNewAccBalance(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccountModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAccount}>Save Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Bank Transaction Modal */}
      <Dialog open={isTxnModalOpen} onOpenChange={setIsTxnModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Log Bank Statement Line</DialogTitle>
            <DialogDescription>
              Manually record a bank transfer deposit, POS credit, or expense debit from your statement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Select Company Account</label>
              <Select value={txnAccId} onValueChange={setTxnAccId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.bank_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Transaction Type</label>
                <Select value={txnType} onValueChange={(v: any) => setTxnType(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit / Credit (+)</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal / Debit (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Amount (₦)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={txnAmount}
                  onChange={(e) => setTxnAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Transaction Date</label>
                <Input
                  type="date"
                  value={txnDate}
                  onChange={(e) => setTxnDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Payment Channel</label>
                <Select value={txnMethod} onValueChange={setTxnMethod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer (NIP)</SelectItem>
                    <SelectItem value="POS">POS Terminal Card</SelectItem>
                    <SelectItem value="Cash">Cash Deposit</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Bank Reference No. / Session ID</label>
              <Input
                placeholder="e.g. NIP/FT/2026100299"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Statement Description / Narration</label>
              <Input
                placeholder="e.g. Transfer from JOHN DOE for solar inverter"
                value={txnDesc}
                onChange={(e) => setTxnDesc(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTxnModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTxn}>Save Statement Line</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Bank Statement (CSV / Text)</DialogTitle>
            <DialogDescription>
              Paste bank statement lines exported from online banking. Format: <code>Date, Amount, Description, Reference</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Select Target Account</label>
              <Select value={importAccountId} onValueChange={setImportAccountId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.bank_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Paste Statement Text / CSV Lines</label>
              <textarea
                rows={6}
                placeholder={`2026-10-02, 150000, Transfer from Client A, NIP100291\n2026-10-01, 85000, POS Merchant Settlement, POS8821`}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full mt-1 p-2 text-xs font-mono rounded-md border bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportCSV}>Import Lines</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Match Txn Modal */}
      <Dialog open={!!selectedTxnToMatch} onOpenChange={(open) => !open && setSelectedTxnToMatch(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Match Deposit with Recorded Sale</DialogTitle>
            <DialogDescription>
              Select the sales record that corresponds to bank deposit of{" "}
              <strong>{selectedTxnToMatch ? formatCurrency(selectedTxnToMatch.amount) : "₦0"}</strong> on{" "}
              {selectedTxnToMatch?.transaction_date}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[350px] overflow-y-auto">
            {recordedSales.map((sale) => (
              <div
                key={sale.id}
                className="p-3 border rounded-lg hover:border-primary cursor-pointer flex items-center justify-between transition-colors bg-card"
                onClick={() => handleMatchWithSale(sale.id)}
              >
                <div>
                  <div className="font-semibold text-xs text-foreground">{sale.item_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Date: {sale.sale_date} • Status: {sale.payment_status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-emerald-600">
                    {formatCurrency(sale.amount_paid || sale.total_amount)}
                  </div>
                  <Button size="xs" variant="secondary" className="h-6 text-[10px] mt-1">
                    Select & Match
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
