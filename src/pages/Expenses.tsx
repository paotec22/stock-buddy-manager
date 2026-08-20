import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CalendarIcon, Wrench } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  "Utilities",
  "Rent",
  "Salaries",
  "Supplies",
  "Maintenance",
  "Other"
];

const LOCATIONS = [
  "Ikeja",
  "Cement"
];

export default function Expenses() {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());

  const [installationDescription, setInstallationDescription] = useState("");
  const [installationAmount, setInstallationAmount] = useState("");
  const [installationDate, setInstallationDate] = useState<Date>(new Date());

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category || !selectedLocation || !expenseDate) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const { error } = await supabase.from("expenses").insert({
        description,
        amount: parseFloat(amount),
        category,
        location: selectedLocation,
        expense_date: expenseDate.toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id
      });
      if (error) throw error;
      toast.success("Expense recorded successfully");
      setDescription("");
      setAmount("");
      setCategory("");
      setSelectedLocation("");
      setExpenseDate(new Date());
    } catch (error) {
      console.error("Error recording expense:", error);
      toast.error("Failed to record expense");
    }
  };

  const handleInstallationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installationDescription || !installationAmount || !installationDate) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const { error } = await supabase.from("installations").insert({
        description: installationDescription,
        amount: parseFloat(installationAmount),
        installation_date: installationDate.toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id
      });
      if (error) throw error;
      toast.success("Installation recorded successfully");
      setInstallationDescription("");
      setInstallationAmount("");
      setInstallationDate(new Date());
    } catch (error) {
      console.error("Error recording installation:", error);
      toast.error("Failed to record installation");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Expenses & Installations</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Record overhead expenses and installation job charges</p>
      </div>
      
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-base sm:text-lg">New Expense</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2">
            <form onSubmit={handleExpenseSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Description</label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter expense description" className="h-10 text-sm" />
              </div>
              <div>
                <label htmlFor="amount" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Amount (₦)</label>
                <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" className="h-10 text-sm font-mono tabular-nums" />
              </div>
              <div>
                <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="location" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Location</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select a location" /></SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Expense Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10 text-sm", !expenseDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expenseDate ? format(expenseDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={expenseDate} onSelect={(date) => date && setExpenseDate(date)} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <Button type="submit" className="w-full min-h-[44px] text-sm font-semibold">Record Expense</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              <span>New Installation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-2">
            <form onSubmit={handleInstallationSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="installationDescription" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Description</label>
                <Input id="installationDescription" value={installationDescription} onChange={(e) => setInstallationDescription(e.target.value)} placeholder="Enter installation description" className="h-10 text-sm" />
              </div>
              <div>
                <label htmlFor="installationAmount" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Amount (₦)</label>
                <Input id="installationAmount" type="number" value={installationAmount} onChange={(e) => setInstallationAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" className="h-10 text-sm font-mono tabular-nums" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Installation Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10 text-sm", !installationDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {installationDate ? format(installationDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={installationDate} onSelect={(date) => date && setInstallationDate(date)} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <Button type="submit" className="w-full min-h-[44px] text-sm font-semibold">Record Installation</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
