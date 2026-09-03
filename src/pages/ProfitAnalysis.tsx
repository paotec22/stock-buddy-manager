import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/utils/formatters";
import { currencies } from "@/components/invoice/CurrencyChanger";
import { SearchInput } from "@/components/ui/search-input";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ProfitLoadingState } from "@/components/profit/ProfitLoadingState";

interface SaleWithProfit {
  item_name: string;
  total_quantity: number;
  avg_sale_price: number;
  avg_purchase_price: number;
  total_sale_amount: number;
  total_purchase_amount: number;
  profit_per_item: number;
  total_profit: number;
  location: string;
  sale_ids: string[];
}

const ProfitAnalysis = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: salesWithProfit = [], isLoading: salesLoading } = useQuery({
    queryKey: ['salesWithProfit'],
    queryFn: async () => {
      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`
          id,
          quantity,
          sale_price,
          total_amount,
          sale_date,
          actual_purchase_price,
          item_id,
          "inventory list" (
            "Item Description",
            "Price",
            location
          )
        `)
        .order('sale_date', { ascending: false });

      if (error) throw error;

      const groupedSales: Record<string, SaleWithProfit> = {};

      (salesData || []).forEach((sale: any) => {
        const itemName = sale["inventory list"]?.["Item Description"] || "Unknown Item";
        const location = sale["inventory list"]?.location || "Unknown Location";
        const key = `${itemName}-${location}`;
        const purchasePrice = sale.actual_purchase_price || sale["inventory list"]?.Price || 0;
        
        if (!groupedSales[key]) {
          groupedSales[key] = {
            item_name: itemName, total_quantity: 0, avg_sale_price: 0,
            avg_purchase_price: 0, total_sale_amount: 0, total_purchase_amount: 0,
            profit_per_item: 0, total_profit: 0, location, sale_ids: []
          };
        }

        const group = groupedSales[key];
        group.total_quantity += sale.quantity;
        group.total_sale_amount += sale.total_amount;
        group.total_purchase_amount += sale.quantity * purchasePrice;
        group.sale_ids.push(sale.id);
      });

      return Object.values(groupedSales).map(group => {
        group.avg_sale_price = group.total_sale_amount / group.total_quantity;
        group.avg_purchase_price = group.total_purchase_amount / group.total_quantity;
        group.profit_per_item = group.avg_sale_price - group.avg_purchase_price;
        group.total_profit = group.total_sale_amount - group.total_purchase_amount;
        return group;
      });
    },
    enabled: !!session
  });

  const { data: totalExpenses = 0, isLoading: expensesLoading } = useQuery({
    queryKey: ['totalExpenses'],
    queryFn: async () => {
      const { data: expensesData, error } = await supabase
        .from('expenses')
        .select('amount');
      if (error) throw error;
      return (expensesData || []).reduce((sum, expense) => sum + Number(expense.amount), 0);
    },
    enabled: !!session
  });

  const updatePurchasePriceMutation = useMutation({
    mutationFn: async ({ saleIds, newPrice }: { saleIds: string[], newPrice: number }) => {
      const { error } = await supabase
        .from('sales')
        .update({ actual_purchase_price: newPrice })
        .in('id', saleIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesWithProfit'] });
      toast.success("Purchase price updated successfully");
    },
    onError: () => toast.error("Failed to update purchase price")
  });

  const handlePurchasePriceUpdate = (key: string, saleIds: string[], newPrice: number) => {
    updatePurchasePriceMutation.mutate({ saleIds, newPrice });
    setEditingPrices(prev => { const u = { ...prev }; delete u[key]; return u; });
  };

  const handlePurchasePriceEdit = (key: string, currentPrice: number) => {
    setEditingPrices(prev => ({ ...prev, [key]: currentPrice }));
  };

  const filteredSales = searchTerm.trim()
    ? salesWithProfit.filter(sale => sale.item_name.toLowerCase().includes(searchTerm.toLowerCase()))
    : salesWithProfit;

  const totalSalesRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_sale_amount, 0);
  const totalPurchaseCost = filteredSales.reduce((sum, sale) => sum + sale.total_purchase_amount, 0);
  const grossProfit = totalSalesRevenue - totalPurchaseCost;
  const netProfit = grossProfit - totalExpenses;

  if (loading) return <div>Loading...</div>;
  if (!session) { navigate("/"); return null; }
  if (salesLoading || expensesLoading) return <ProfitLoadingState />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profit Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">Review your product margins, revenue, and operating profits</p>
        </div>
        <div className="w-full sm:w-[280px]">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search sales by product..." />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover rounded-2xl border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">{formatCurrency(totalSalesRevenue, currencies[0])}</div></CardContent>
        </Card>
        <Card className="card-hover rounded-2xl border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Purchase Cost</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-info">{formatCurrency(totalPurchaseCost, currencies[0])}</div></CardContent>
        </Card>
        <Card className="card-hover rounded-2xl border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Gross Profit</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-warning">{formatCurrency(grossProfit, currencies[0])}</div></CardContent>
        </Card>
        <Card className="card-hover rounded-2xl border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Net Profit</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(netProfit, currencies[0])}</div>
            <p className="text-xs text-muted-foreground mt-1">After expenses: {formatCurrency(totalExpenses, currencies[0])}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-hover rounded-2xl border-border/60">
        <CardHeader><CardTitle className="text-base sm:text-lg">Grouped Sales with Profit Analysis</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-2">Item</th>
                  <th className="text-left py-3 px-2">Total Qty</th>
                  <th className="text-left py-3 px-2">Avg Sale Price</th>
                  <th className="text-left py-3 px-2">Avg Purchase Price</th>
                  <th className="text-left py-3 px-2">Profit/Item</th>
                  <th className="text-left py-3 px-2">Total Sale</th>
                  <th className="text-left py-3 px-2">Total Cost</th>
                  <th className="text-left py-3 px-2">Total Profit</th>
                  <th className="text-left py-3 px-2">Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => {
                  const key = `${sale.item_name}-${sale.location}`;
                  const isEditing = editingPrices.hasOwnProperty(key);
                  return (
                    <tr key={key} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 font-medium">{sale.item_name}</td>
                      <td className="py-3 px-2">{sale.total_quantity}</td>
                      <td className="py-3 px-2">{formatCurrency(sale.avg_sale_price, currencies[0])}</td>
                      <td className="py-3 px-2">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editingPrices[key]}
                            onChange={(e) => setEditingPrices(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                            onBlur={() => handlePurchasePriceUpdate(key, sale.sale_ids, editingPrices[key])}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handlePurchasePriceUpdate(key, sale.sale_ids, editingPrices[key]);
                              if (e.key === 'Escape') setEditingPrices(prev => { const u = { ...prev }; delete u[key]; return u; });
                            }}
                            className="w-28 h-9 text-sm rounded-lg"
                            autoFocus
                          />
                        ) : (
                          <button onClick={() => handlePurchasePriceEdit(key, sale.avg_purchase_price)} className="text-primary hover:underline font-medium min-h-[32px] inline-flex items-center">
                            {formatCurrency(sale.avg_purchase_price, currencies[0])}
                          </button>
                        )}
                      </td>
                      <td className={`py-3 px-2 ${sale.profit_per_item >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(sale.profit_per_item, currencies[0])}</td>
                      <td className="py-3 px-2">{formatCurrency(sale.total_sale_amount, currencies[0])}</td>
                      <td className="py-3 px-2">{formatCurrency(sale.total_purchase_amount, currencies[0])}</td>
                      <td className={`py-3 px-2 font-semibold ${sale.total_profit >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(sale.total_profit, currencies[0])}</td>
                      <td className="py-3 px-2">{sale.location}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitAnalysis;
