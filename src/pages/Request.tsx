import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { AppSidebar } from "@/components/AppSidebar";
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
import { format } from "date-fns";
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

  // Fetch inventory items for product selection
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["inventory-items-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory list")
        .select("id, \"Item Description\", Price, location")
        .order("Item Description");

      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!session?.user?.id,
  });

  // Fetch installation requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["installation-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("installation_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as InstallationRequest[];
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
      // Calculate total amount for sale (price + installation cost)
      const totalAmount = request.price + request.installation_cost;

      // Create a sale record for the total cost
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          item_id: null, // Not linked to inventory item
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

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <PageTransition className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Installation Requests
              </h1>
              <p className="text-muted-foreground mt-1">
                Track product installations and log completed work
              </p>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Installation Request</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product_name">Product Name *</Label>
                    <Select
                      value={formData.selected_item_id?.toString() || ""}
                      onValueChange={(value) => {
                        const item = inventoryItems.find((i) => i.id.toString() === value);
                        if (item) {
                          setFormData({
                            ...formData,
                            product_name: item["Item Description"],
                            price: item.Price?.toString() || "",
                            selected_item_id: item.id,
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product from inventory" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map((item) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item["Item Description"]} - ₦{(item.Price || 0).toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₦)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="installation_cost">Installation Cost (₦)</Label>
                      <Input
                        id="installation_cost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.installation_cost}
                        onChange={(e) =>
                          setFormData({ ...formData, installation_cost: e.target.value })
                        }
                        placeholder="0"
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
                        step="1"
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, quantity: e.target.value })
                        }
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        placeholder="Enter location"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Additional details..."
                      rows={3}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add Request
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{requests?.length ?? 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-full bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">
                    {requests?.filter((r) => r.status === "Not installed").length ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Installed</p>
                  <p className="text-2xl font-bold">
                    {requests?.filter((r) => r.status === "Installed").length ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Installation Log</CardTitle>
              <CardDescription>
                Track all product installation requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !requests?.length ? (
                <div className="text-center py-12">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No installation requests yet</p>
                  <p className="text-sm text-muted-foreground/70">
                    Click "New Request" to add one
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Installation Cost</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.product_name}
                            {request.notes && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {request.notes}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(request.price)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(request.installation_cost)}
                          </TableCell>
                          <TableCell className="text-right">
                            {request.expenses}
                          </TableCell>
                          <TableCell>{request.location}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                request.status === "Installed"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                request.status === "Installed"
                                  ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                  : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
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
                            <div className="flex items-center justify-end gap-2">
                              {request.status === "Not installed" && (
                                <Button
                                  size="sm"
                                  onClick={() => setConfirmInstall(request)}
                                >
                                  Mark Installed
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setConfirmDelete(request)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Confirm Install Dialog */}
        <AlertDialog
          open={!!confirmInstall}
          onOpenChange={() => setConfirmInstall(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark as Installed?</AlertDialogTitle>
              <AlertDialogDescription>
                This will record "{confirmInstall?.product_name}" as a sale with a total
                of{" "}
                {confirmInstall &&
                  formatCurrency(
                    confirmInstall.price + confirmInstall.installation_cost
                  )}
                . This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => confirmInstall && markInstalled.mutate(confirmInstall)}
                disabled={markInstalled.isPending}
              >
                {markInstalled.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirm Delete Dialog */}
        <AlertDialog
          open={!!confirmDelete}
          onOpenChange={() => setConfirmDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Request?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{confirmDelete?.product_name}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => confirmDelete && deleteRequest.mutate(confirmDelete.id)}
                disabled={deleteRequest.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
    </div>
  );
}

export default function Request() {
  return (
    <RoleProtectedRoute allowedRoles={["admin", "uploader"]}>
      <RequestContent />
    </RoleProtectedRoute>
  );
}
