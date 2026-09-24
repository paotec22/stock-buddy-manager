import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ClipboardList, CheckCircle2, Clock, Loader2, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InstallationRequest {
  id: number;
  product_name: string;
  price: number;
  installation_cost: number;
  expenses: number;
  location: string;
  status: "Not installed" | "Installed";
  notes: string | null;
  user_id: string;
  created_at: string;
  installed_at: string | null;
  sale_id: number | null;
}

interface InventoryItem {
  id: number;
  "Item Description": string;
  Price: number | null;
  location: string;
}

interface FormData {
  product_name: string;
  price: string;
  installation_cost: string;
  quantity: string;
  location: string;
  notes: string;
  selected_item_id: number | null;
}

const initialFormData: FormData = {
  product_name: "",
  price: "",
  installation_cost: "",
  quantity: "1",
  location: "",
  notes: "",
  selected_item_id: null,
};

function RequestContent() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmInstall, setConfirmInstall] = useState<InstallationRequest | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<InstallationRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<"Not installed" | "Installed">("Not installed");

  // Fetch inventory items for product selection
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["inventory-items-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory list")
        .select('id, "Item Description", Price, location')
        .order("Item Description");

      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!session?.user?.id,
  });

  // Fetch installation requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["installation-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("installation_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as InstallationRequest[];
    },
    enabled: !!session?.user?.id,
  });

  // Add new request mutation
  const addRequest = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase.from("installation_requests").insert({
        product_name: data.product_name,
        price: parseFloat(data.price) || 0,
        installation_cost: parseFloat(data.installation_cost) || 0,
        expenses: parseInt(data.quantity) || 1, // Using expenses column for quantity
        location: data.location,
        notes: data.notes || null,
        user_id: session!.user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installation-requests"] });
      toast.success("Installation request added");
      setFormData(initialFormData);
      setIsAddOpen(false);
    },
    onError: (error) => {
      console.error("Error adding request:", error);
      toast.error("Failed to add request");
    },
  });

  // Mark as installed mutation
  const markInstalled = useMutation({
    mutationFn: async (request: InstallationRequest) => {
      const totalAmount = request.price + request.installation_cost;

      // Create a sale record for the total cost
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          item_id: null,
          quantity: 1,
          sale_price: totalAmount,
          total_amount: totalAmount,
          user_id: session!.user.id,
          notes: `Installation: ${request.product_name}`,
        })
        .select("id")
        .single();

      if (saleError) throw saleError;

      // Record installation in installations table for reports
      const { error: installError } = await supabase
        .from("installations")
        .insert({
          description: `${request.product_name} - ${request.location}`,
          amount: request.installation_cost,
          user_id: session!.user.id,
        });

      if (installError) throw installError;

      // Update installation request status
      const { error: updateError } = await supabase
        .from("installation_requests")
        .update({
          status: "Installed",
          installed_at: new Date().toISOString(),
          sale_id: sale.id,
        })
        .eq("id", request.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installation-requests"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["installations"] });
      toast.success("Marked as installed and recorded in sales");
      setConfirmInstall(null);
    },
    onError: (error) => {
      console.error("Error marking as installed:", error);
      toast.error("Failed to mark as installed");
    },
  });

  // Delete request mutation
  const deleteRequest = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("installation_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installation-requests"] });
      toast.success("Request deleted");
      setConfirmDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting request:", error);
      toast.error("Failed to delete request");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!formData.location) {
      toast.error("Location is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await addRequest.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredRequests = requests.filter(
    (request) => request.status === statusFilter
  );

  const pendingCount = requests.filter((r) => r.status === "Not installed").length;
  const installedCount = requests.filter((r) => r.status === "Installed").length;

  return (
    <PageTransition className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Stock Requests
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage product installation requests and track deployment status
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 min-h-[44px] rounded-xl font-semibold active:scale-[0.98]">
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Installation Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="product_name">Product Name *</Label>
                <Select
                  value={formData.selected_item_id?.toString() || ""}
                  onValueChange={(value) => {
                    const item = inventoryItems.find(
                      (i) => i.id.toString() === value
                    );
                    if (item) {
                      setFormData({
                        ...formData,
                        product_name: item["Item Description"],
                        price: item.Price ? item.Price.toString() : "",
                        location: item.location || "",
                        selected_item_id: item.id,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select from inventory (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item["Item Description"]} ({item.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="product_name"
                  placeholder="Or enter product name manually"
                  value={formData.product_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      product_name: e.target.value,
                      selected_item_id: null,
                    })
                  }
                  required
                  className="rounded-xl mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (NGN)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="installation_cost">Install Cost (NGN)</Label>
                  <Input
                    id="installation_cost"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={formData.installation_cost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        installation_cost: e.target.value,
                      })
                    }
                    className="rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) =>
                      setFormData({ ...formData, location: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lagos">Lagos</SelectItem>
                      <SelectItem value="Abuja">Abuja</SelectItem>
                      <SelectItem value="Port Harcourt">Port Harcourt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or specifications..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || addRequest.isPending}
                  className="rounded-xl font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Request"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/80 bg-card/60 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Total Requests
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{requests.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border border-border/80 bg-card/60 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Pending Installations
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {pendingCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border border-border/80 bg-card/60 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">
              Completed
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {installedCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Requests List</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                View and manage installation queue by status
              </CardDescription>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex rounded-xl border border-border overflow-hidden bg-card/65 p-0.5 self-start sm:self-auto">
              <Button
                variant={statusFilter === "Not installed" ? "default" : "ghost"}
                size="sm"
                className="rounded-lg min-h-[36px] px-3.5 text-xs font-semibold active:scale-[0.98]"
                onClick={() => setStatusFilter("Not installed")}
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Pending ({pendingCount})
              </Button>
              <Button
                variant={statusFilter === "Installed" ? "default" : "ghost"}
                size="sm"
                className="rounded-lg min-h-[36px] px-3.5 text-xs font-semibold active:scale-[0.98]"
                onClick={() => setStatusFilter("Installed")}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Installed ({installedCount})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-5 sm:pt-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 px-4">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-base font-semibold text-foreground">
                No {statusFilter.toLowerCase()} requests
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                {statusFilter === "Not installed"
                  ? "Click 'New Request' to log a product that needs installation."
                  : "Completed requests will appear here once marked as installed."}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View (< sm) */}
              <div className="block sm:hidden divide-y divide-border/60 p-3 space-y-3">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="pt-3 first:pt-0 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground leading-tight">
                          {request.product_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{request.location}</span>
                          <span>•</span>
                          <span>Qty: {request.expenses}</span>
                        </div>
                      </div>
                      <Badge
                        variant={request.status === "Installed" ? "default" : "secondary"}
                        className={
                          request.status === "Installed"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shrink-0"
                            : "bg-muted text-muted-foreground font-medium shrink-0"
                        }
                      >
                        {request.status === "Installed" ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {request.status}
                      </Badge>
                    </div>

                    {request.notes && (
                      <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                        {request.notes}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2.5 rounded-xl text-xs font-mono">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          Product Price
                        </span>
                        <span className="font-bold text-foreground">
                          {formatCurrency(request.price)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          Install Cost
                        </span>
                        <span className="font-bold text-primary">
                          {formatCurrency(request.installation_cost)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {request.status === "Not installed" && (
                        <Button
                          size="sm"
                          onClick={() => setConfirmInstall(request)}
                          className="flex-1 min-h-[38px] px-3 font-semibold rounded-xl active:scale-[0.98] text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          Mark Installed
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className={`min-h-[38px] px-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${
                          request.status !== "Not installed" ? "w-full justify-center" : "shrink-0"
                        }`}
                        onClick={() => setConfirmDelete(request)}
                        aria-label="Delete request"
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= sm) */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs uppercase font-semibold">Product Name</TableHead>
                      <TableHead className="text-xs uppercase font-semibold text-right">Price</TableHead>
                      <TableHead className="text-xs uppercase font-semibold text-right">Install Cost</TableHead>
                      <TableHead className="text-xs uppercase font-semibold text-center">Qty</TableHead>
                      <TableHead className="text-xs uppercase font-semibold">Location</TableHead>
                      <TableHead className="text-xs uppercase font-semibold">Status</TableHead>
                      <TableHead className="text-xs uppercase font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium text-xs sm:text-sm">
                          <div>
                            <span>{request.product_name}</span>
                            {request.notes && (
                              <p className="text-xs text-muted-foreground truncate max-w-[260px] mt-0.5">
                                {request.notes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs sm:text-sm">
                          {formatCurrency(request.price)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-xs sm:text-sm text-foreground">
                          {formatCurrency(request.installation_cost)}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs sm:text-sm">
                          {request.expenses}
                        </TableCell>
                        <TableCell className="text-xs">{request.location}</TableCell>
                        <TableCell>
                          <Badge
                            variant={request.status === "Installed" ? "default" : "secondary"}
                            className={
                              request.status === "Installed"
                                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 font-semibold"
                                : "bg-muted text-muted-foreground hover:bg-muted/80 font-medium"
                            }
                          >
                            {request.status === "Installed" ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {request.status === "Not installed" && (
                              <Button
                                size="sm"
                                onClick={() => setConfirmInstall(request)}
                                className="min-h-[34px] px-3 font-semibold rounded-lg active:scale-[0.98] text-xs"
                              >
                                Mark Installed
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="min-h-[34px] min-w-[34px] h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setConfirmDelete(request)}
                              aria-label="Delete request"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <AlertDialog
        open={!!confirmInstall}
        onOpenChange={() => setConfirmInstall(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Installed?</AlertDialogTitle>
            <AlertDialogDescription>
              This will record &quot;{confirmInstall?.product_name}&quot; as a sale with a total
              of{" "}
              {confirmInstall &&
                formatCurrency(
                  confirmInstall.price + confirmInstall.installation_cost
                )}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="min-h-[40px] rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmInstall && markInstalled.mutate(confirmInstall)}
              disabled={markInstalled.isPending}
              className="min-h-[40px] rounded-xl font-semibold active:scale-[0.98]"
            >
              {markInstalled.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Installation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the request for &quot;{confirmDelete?.product_name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="min-h-[40px] rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deleteRequest.mutate(confirmDelete.id)}
              disabled={deleteRequest.isPending}
              className="min-h-[40px] rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold active:scale-[0.98]"
            >
              {deleteRequest.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}

export default function Request() {
  return (
    <RoleProtectedRoute allowedRoles={["admin", "uploader"]}>
      <RequestContent />
    </RoleProtectedRoute>
  );
}
