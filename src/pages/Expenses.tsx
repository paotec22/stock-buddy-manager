import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarIcon,
  Wrench,
  DollarSign,
  PlusCircle,
  Clock,
  Trash2,
  Search,
  MapPin,
  TrendingDown,
  Receipt,
  Loader2,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatters";

const EXPENSE_CATEGORIES = [
  "Utilities",
  "Rent",
  "Salaries",
  "Supplies",
  "Maintenance",
  "Transport",
  "Other",
];

const LOCATIONS = ["Ikeja", "Cement"];

interface ExpenseRecord {
  id: number;
  description: string;
  amount: number;
  category: string;
  location: string;
  expense_date: string;
  created_at: string;
}

interface InstallationRecord {
  id: number;
  description: string;
  amount: number;
  installation_date: string;
  created_at: string;
}

export default function Expenses() {
  const queryClient = useQueryClient();

  // Expense form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Installation form state
  const [installationDescription, setInstallationDescription] = useState("");
  const [installationAmount, setInstallationAmount] = useState("");
  const [installationDate, setInstallationDate] = useState<Date>(new Date());
  const [isSubmittingInstallation, setIsSubmittingInstallation] = useState(false);

  // History filtering state
  const [searchFilter, setSearchFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch recent expenses
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["expenses-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as ExpenseRecord[];
    },
  });

  // Fetch recent installations
  const { data: installations = [], isLoading: isLoadingInstallations } = useQuery({
    queryKey: ["installations-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("installations")
        .select("*")
        .order("installation_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as InstallationRecord[];
    },
  });

  // Calculations for current month KPIs
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    return d >= monthStart && d <= monthEnd;
  });

  const thisMonthTotalExpense = thisMonthExpenses.reduce(
    (acc, curr) => acc + Number(curr.amount || 0),
    0
  );

  const thisMonthInstallations = installations.filter((i) => {
    const d = new Date(i.installation_date);
    return d >= monthStart && d <= monthEnd;
  });

  const thisMonthTotalInstallation = thisMonthInstallations.reduce(
    (acc, curr) => acc + Number(curr.amount || 0),
    0
  );

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category || !selectedLocation || !expenseDate) {
      toast.error("Please fill in all expense fields");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid expense amount");
      return;
    }

    setIsSubmittingExpense(true);
    try {
      const { error } = await supabase.from("expenses").insert({
        description,
        amount: numericAmount,
        category,
        location: selectedLocation,
        expense_date: expenseDate.toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error) throw error;
      toast.success("Expense recorded successfully");
      setDescription("");
      setAmount("");
      setCategory("");
      setSelectedLocation("");
      setExpenseDate(new Date());
      queryClient.invalidateQueries({ queryKey: ["expenses-records"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-expenses"] });
    } catch (err) {
      console.error("Error recording expense:", err);
      toast.error("Failed to record expense");
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleInstallationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installationDescription || !installationAmount || !installationDate) {
      toast.error("Please fill in all installation fields");
      return;
    }

    const numericAmount = parseFloat(installationAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid installation fee");
      return;
    }

    setIsSubmittingInstallation(true);
    try {
      const { error } = await supabase.from("installations").insert({
        description: installationDescription,
        amount: numericAmount,
        installation_date: installationDate.toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error) throw error;
      toast.success("Installation recorded successfully");
      setInstallationDescription("");
      setInstallationAmount("");
      setInstallationDate(new Date());
      queryClient.invalidateQueries({ queryKey: ["installations-records"] });
    } catch (err) {
      console.error("Error recording installation:", err);
      toast.error("Failed to record installation");
    } finally {
      setIsSubmittingInstallation(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Expense removed");
      queryClient.invalidateQueries({ queryKey: ["expenses-records"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-expenses"] });
    } catch (err) {
      console.error("Error deleting expense:", err);
      toast.error("Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteInstallation = async (id: number) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("installations").delete().eq("id", id);
      if (error) throw error;
      toast.success("Installation record removed");
      queryClient.invalidateQueries({ queryKey: ["installations-records"] });
    } catch (err) {
      console.error("Error deleting installation:", err);
      toast.error("Failed to delete installation");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered expenses list
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      e.category.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesLocation =
      locationFilter === "all" ||
      e.location?.toLowerCase() === locationFilter.toLowerCase();
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Ribbon */}
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Expenses & Installations
            </h1>
            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
              Finance
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Log company operating costs, rent, utilities, and customer installation job charges
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                This Month's Overhead
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-1 block">
                {formatCurrency(thisMonthTotalExpense)}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                {thisMonthExpenses.length} overhead entries recorded
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <TrendingDown className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                This Month's Installations
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-foreground mt-1 block">
                {formatCurrency(thisMonthTotalInstallation)}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                {thisMonthInstallations.length} job charges recorded
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Wrench className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card shadow-2xs">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Active Branches
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                {LOCATIONS.map((loc) => (
                  <Badge key={loc} variant="secondary" className="text-xs font-semibold">
                    <MapPin className="h-3 w-3 mr-1" />
                    {loc}
                  </Badge>
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Cost centers tracked
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs: Entry Forms vs History */}
      <Tabs defaultValue="record" className="space-y-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 h-10 p-1 bg-muted/60 border border-border/80 rounded-xl">
          <TabsTrigger
            value="record"
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Record Entry</span>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:shadow-xs"
          >
            <Clock className="h-4 w-4" />
            <span>Recent Activity ({expenses.length + installations.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Record Forms */}
        <TabsContent value="record" className="space-y-6 focus-visible:outline-none">
          <div className="grid gap-6 md:grid-cols-2">
            {/* New Expense Form */}
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-foreground">
                  <DollarSign className="h-4.5 w-4.5 text-primary" />
                  <span>Log Operating Expense</span>
                </CardTitle>
                <CardDescription>
                  Record business overheads, utilities, salaries, or local supplies
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-2">
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                    >
                      Expense Description
                    </label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., Office Internet, Generator Diesel, Warehouse Rent"
                      className="h-10 text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label
                        htmlFor="amount"
                        className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                      >
                        Amount (₦)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-sm font-bold text-muted-foreground">
                          ₦
                        </span>
                        <Input
                          id="amount"
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="pl-8 h-10 text-sm font-mono tabular-nums font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="category"
                        className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                      >
                        Category
                      </label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category" className="h-10 text-sm">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label
                        htmlFor="location"
                        className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                      >
                        Branch / Location
                      </label>
                      <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger id="location" className="h-10 text-sm">
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATIONS.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {loc} Branch
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Expense Date
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-10 text-sm",
                              !expenseDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expenseDate ? format(expenseDate, "dd MMM yyyy") : <span>Pick date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={expenseDate}
                            onSelect={(date) => date && setExpenseDate(date)}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmittingExpense}
                    className="w-full h-11 text-sm font-semibold shadow-xs"
                  >
                    {isSubmittingExpense ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Recording Expense...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>Save Operating Expense</span>
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* New Installation Form */}
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-foreground">
                  <Wrench className="h-4.5 w-4.5 text-primary" />
                  <span>Log Installation Charge</span>
                </CardTitle>
                <CardDescription>
                  Record site technician labor and setup fees for delivered client systems
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-2">
                <form onSubmit={handleInstallationSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="installationDescription"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                    >
                      Installation Details
                    </label>
                    <Input
                      id="installationDescription"
                      value={installationDescription}
                      onChange={(e) => setInstallationDescription(e.target.value)}
                      placeholder="e.g., 5kVA Solar Inverter Setup at Victoria Island"
                      className="h-10 text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label
                        htmlFor="installationAmount"
                        className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                      >
                        Charge Amount (₦)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-sm font-bold text-muted-foreground">
                          ₦
                        </span>
                        <Input
                          id="installationAmount"
                          type="number"
                          value={installationAmount}
                          onChange={(e) => setInstallationAmount(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="pl-8 h-10 text-sm font-mono tabular-nums font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Installation Date
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-10 text-sm",
                              !installationDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {installationDate ? (
                              format(installationDate, "dd MMM yyyy")
                            ) : (
                              <span>Pick date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={installationDate}
                            onSelect={(date) => date && setInstallationDate(date)}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-border/70 bg-muted/30 text-xs text-muted-foreground space-y-1">
                    <span className="font-semibold text-foreground block">Installation Notes:</span>
                    <p>Installation charges are logged as dedicated service job records in the analytics ledger.</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmittingInstallation}
                    className="w-full h-11 text-sm font-semibold shadow-xs"
                  >
                    {isSubmittingInstallation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Recording Installation...</span>
                      </>
                    ) : (
                      <>
                        <Wrench className="mr-2 h-4 w-4" />
                        <span>Save Installation Job</span>
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Recent Records & History */}
        <TabsContent value="history" className="space-y-4 focus-visible:outline-none">
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">Recent Expenses & Activity</CardTitle>
                  <CardDescription>
                    Review, filter, or remove logged overhead costs and installation entries
                  </CardDescription>
                </div>
                {/* Search & Location Filter */}
                <div className="flex items-center gap-2">
                  <div className="relative w-48 sm:w-56">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search entries..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-8 h-9 text-xs"
                    />
                  </div>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="h-9 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc.toLowerCase()}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-5 sm:pt-0">
              {isLoadingExpenses ? (
                <div className="p-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs">Loading records...</span>
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground space-y-1">
                  <p className="text-sm font-medium">No expenses matching your criteria</p>
                  <p className="text-xs">Log a new expense above to see it reflected in this list</p>
                </div>
              ) : (
                <div className="border-t sm:border border-border/80 sm:rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-xs font-semibold uppercase">Date</TableHead>
                        <TableHead className="text-xs font-semibold uppercase">Description</TableHead>
                        <TableHead className="text-xs font-semibold uppercase">Category</TableHead>
                        <TableHead className="text-xs font-semibold uppercase">Branch</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">Amount</TableHead>
                        <TableHead className="text-center text-xs font-semibold uppercase w-[80px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((expense) => (
                        <TableRow key={expense.id} className="hover:bg-muted/20">
                          <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                            {format(new Date(expense.expense_date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-foreground">
                            {expense.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[11px] font-medium">
                              {expense.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[11px]">
                              {expense.location}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-xs sm:text-sm text-foreground">
                            {formatCurrency(Number(expense.amount || 0))}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={deletingId === expense.id}
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Delete record"
                            >
                              {deletingId === expense.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Installation Activity Table */}
          {installations.length > 0 && (
            <Card className="border border-border bg-card shadow-xs">
              <CardHeader className="p-4 sm:p-5 pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" />
                  <span>Recent Installation Charges</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-5 sm:pt-0">
                <div className="border-t sm:border border-border/80 sm:rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-xs font-semibold uppercase">Date</TableHead>
                        <TableHead className="text-xs font-semibold uppercase">Description</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase">Fee Charged</TableHead>
                        <TableHead className="text-center text-xs font-semibold uppercase w-[80px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installations.map((inst) => (
                        <TableRow key={inst.id} className="hover:bg-muted/20">
                          <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                            {format(new Date(inst.installation_date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-foreground">
                            {inst.description}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-xs sm:text-sm text-foreground">
                            {formatCurrency(Number(inst.amount || 0))}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={deletingId === inst.id}
                              onClick={() => handleDeleteInstallation(inst.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Delete installation"
                            >
                              {deletingId === inst.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
