import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !category || !selectedLocation) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { error } = await supabase.from("expenses").insert({
        description,
        amount: parseFloat(amount),
        category,
        location: selectedLocation,
        user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      toast.success("Expense recorded successfully");
      setDescription("");
      setAmount("");
      setCategory("");
      setSelectedLocation("");
    } catch (error) {
      console.error("Error recording expense:", error);
      toast.error("Failed to record expense");
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6">Record Expense</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>New Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter expense description"
                  />
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium mb-1">
                    Amount (₦)
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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

                <div>
                  <label htmlFor="location" className="block text-sm font-medium mb-1">
                    Location
                  </label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">
                  Record Expense
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}