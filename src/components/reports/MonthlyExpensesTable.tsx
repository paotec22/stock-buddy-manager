
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, CalendarIcon, ChevronDown, Save, X, Trash2 } from "lucide-react";
import { ExpensesExportModal } from "./ExpensesExportModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ExpenseRecord {
  date: string;
  category: string;
  total_amount: number;
  description: string;
  location: string;
}

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  location: string;
}

interface MonthlyExpensesTableProps {
  searchTerm?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function MonthlyExpensesTable({ searchTerm = "", isCollapsed = false, onToggleCollapse }: MonthlyExpensesTableProps) {
  const [showExport, setShowExport] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Expense>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ['monthly-expenses', dateFrom, dateTo],
    queryFn: async () => {
      console.log('Fetching expenses...');
      let query = supabase
        .from('expenses')
        .select('*');

      // Apply date filters if set
      if (dateFrom) {
        query = query.gte('expense_date', dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte('expense_date', dateTo.toISOString());
      }

      const { data, error } = await query.order('expense_date', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }

      const expenseRecords = data.map(expense => ({
        date: format(new Date(expense.expense_date), 'PPP'),
        category: expense.category,
        total_amount: Number(expense.amount),
        description: expense.description,
        location: expense.location
      }));

      return {
        expenseRecords,
        allExpenses: data as Expense[]
      };
    }
  });

  const expenseRecords = data?.expenseRecords;
  const allExpenses = data?.allExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  // Filter expenses based on search term
  const filteredExpenses = searchTerm.trim() 
    ? expenseRecords?.filter(expense => 
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
        expense.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : expenseRecords;

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setEditValues({
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      location: expense.location
    });
  };

  const handleSave = async () => {
    if (!editingId || !editValues) return;
    
    try {
      const { error } = await supabase
        .from('expenses')
        .update(editValues)
        .eq('id', editingId);

      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['monthly-expenses'] });
      setEditingId(null);
      setEditValues({});
      toast.success('Expense updated successfully');
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', itemToDelete);

      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ['monthly-expenses'] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setEditingId(null);
      setEditValues({});
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const confirmDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <Collapsible open={!isCollapsed} onOpenChange={() => onToggleCollapse?.()}>
      <Card className="glass-effect fade-in">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ChevronDown className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
                <CardTitle>Expense Records by Date</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExport(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardHeader className="pt-0">
        
        {/* Date Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
          <div className="space-y-2">
            <label className="text-sm font-medium">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {(dateFrom || dateTo) && (
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear Dates
              </Button>
            </div>
          )}
          </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading expenses data...</p>
            ) : filteredExpenses?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses?.map((expense, index) => {
                    const originalExpense = allExpenses?.find(e => 
                      e.description === expense.description && 
                      e.category === expense.category &&
                      format(new Date(e.expense_date), 'PPP') === expense.date
                    );
                    const isEditing = editingId === originalExpense?.id;
                    
                    return (
                      <TableRow key={`${expense.date}-${expense.category}-${index}`}>
                        <TableCell>{expense.date}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editValues.category || ''}
                              onChange={(e) => setEditValues(prev => ({ ...prev, category: e.target.value }))}
                              className="h-8"
                            />
                          ) : (
                            expense.category
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editValues.description || ''}
                              onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                              className="h-8"
                            />
                          ) : (
                            expense.description
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editValues.location || ''}
                              onChange={(e) => setEditValues(prev => ({ ...prev, location: e.target.value }))}
                              className="h-8"
                            />
                          ) : (
                            expense.location
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.amount || ''}
                              onChange={(e) => setEditValues(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                              className="h-8"
                            />
                          ) : (
                            formatCurrency(expense.total_amount)
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={handleSave}>
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancel}>
                                <X className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => originalExpense && confirmDelete(originalExpense.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => originalExpense && handleEdit(originalExpense)}
                            >
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No matching expense records found</p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
      
      <ExpensesExportModal
        open={showExport}
        onOpenChange={setShowExport}
        expenses={allExpenses || []}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Collapsible>
  );
}
