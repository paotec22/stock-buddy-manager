
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/utils/formatters";
import { currencies } from "@/components/invoice/CurrencyChanger";
import { SearchInput } from "@/components/ui/search-input";

interface SaleWithProfit {
  id: string;
  item_name: string;
  quantity: number;
  sale_price: number;
  purchase_price: number;
  total_sale_amount: number;
  total_purchase_amount: number;
  profit_per_item: number;
  total_profit: number;
  sale_date: string;
  location: string;
}

const ProfitAnalysis = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { session, loading } = useAuth();
  const navigate = useNavigate();

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
          item_id,
          "inventory list" (
            "Item Description",
            "Price",
            location
          )
        `)
        .order('sale_date', { ascending: false });

      if (error) throw error;

      return (salesData || []).map((sale: any) => {
        const purchasePrice = sale["inventory list"]?.Price || 0;
        const totalSaleAmount = sale.total_amount;
        const totalPurchaseAmount = sale.quantity * purchasePrice;
        const profitPerItem = sale.sale_price - purchasePrice;
        const totalProfit = totalSaleAmount - totalPurchaseAmount;

        return {
          id: sale.id,
          item_name: sale["inventory list"]?.["Item Description"] || "Unknown Item",
          quantity: sale.quantity,
          sale_price: sale.sale_price,
          purchase_price: purchasePrice,
          total_sale_amount: totalSaleAmount,
          total_purchase_amount: totalPurchaseAmount,
          profit_per_item: profitPerItem,
          total_profit: totalProfit,
          sale_date: sale.sale_date,
          location: sale["inventory list"]?.location || "Unknown Location"
        } as SaleWithProfit;
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

  // Filter sales based on search term
  const filteredSales = searchTerm.trim()
    ? salesWithProfit.filter(sale => 
        sale.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : salesWithProfit;

  // Calculate totals
  const totalSalesRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_sale_amount, 0);
  const totalPurchaseCost = filteredSales.reduce((sum, sale) => sum + sale.total_purchase_amount, 0);
  const grossProfit = totalSalesRevenue - totalPurchaseCost;
  const netProfit = grossProfit - totalExpenses;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    navigate("/");
    return null;
  }

  if (salesLoading || expensesLoading) {
    return <div>Loading profit analysis...</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold">Profit Analysis</h1>
            <div className="w-full md:w-[250px]">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search sales..."
              />
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalSalesRevenue, currencies[0])}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Purchase Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalPurchaseCost, currencies[0])}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(grossProfit, currencies[0])}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit, currencies[0])}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  After expenses: {formatCurrency(totalExpenses, currencies[0])}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sales Profit Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sales with Profit Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Item</th>
                      <th className="text-left p-2">Qty</th>
                      <th className="text-left p-2">Sale Price</th>
                      <th className="text-left p-2">Purchase Price</th>
                      <th className="text-left p-2">Profit/Item</th>
                      <th className="text-left p-2">Total Sale</th>
                      <th className="text-left p-2">Total Cost</th>
                      <th className="text-left p-2">Total Profit</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{sale.item_name}</td>
                        <td className="p-2">{sale.quantity}</td>
                        <td className="p-2">{formatCurrency(sale.sale_price, currencies[0])}</td>
                        <td className="p-2">{formatCurrency(sale.purchase_price, currencies[0])}</td>
                        <td className={`p-2 ${sale.profit_per_item >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(sale.profit_per_item, currencies[0])}
                        </td>
                        <td className="p-2">{formatCurrency(sale.total_sale_amount, currencies[0])}</td>
                        <td className="p-2">{formatCurrency(sale.total_purchase_amount, currencies[0])}</td>
                        <td className={`p-2 font-semibold ${sale.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(sale.total_profit, currencies[0])}
                        </td>
                        <td className="p-2">{new Date(sale.sale_date).toLocaleDateString()}</td>
                        <td className="p-2">{sale.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ProfitAnalysis;
