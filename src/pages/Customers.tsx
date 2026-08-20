import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Users, Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

interface CustomerStats {
  total_orders: number;
  total_spent: number;
  total_paid: number;
  outstanding: number;
}

const emptyForm = {
  id: "" as string | null,
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export default function Customers() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [selected, setSelected] = useState<Customer | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", "page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
    enabled: !!session,
  });

  const { data: salesByCustomer = {} } = useQuery({
    queryKey: ["customers", "sales-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("customer_id, total_amount, amount_paid")
        .not("customer_id", "is", null);
      if (error) throw error;
      const map: Record<string, CustomerStats> = {};
      (data ?? []).forEach((s: any) => {
        const id = s.customer_id as string;
        if (!map[id]) map[id] = { total_orders: 0, total_spent: 0, total_paid: 0, outstanding: 0 };
        map[id].total_orders += 1;
        map[id].total_spent += Number(s.total_amount) || 0;
        map[id].total_paid += Number(s.amount_paid) || 0;
        map[id].outstanding = map[id].total_spent - map[id].total_paid;
      });
      return map;
    },
    enabled: !!session,
  });

  const { data: selectedHistory = [] } = useQuery({
    queryKey: ["customers", "history", selected?.id],
    queryFn: async () => {
      if (!selected) return [];
      const { data, error } = await supabase
        .from("sales")
        .select(`id, sale_date, quantity, sale_price, total_amount, amount_paid, payment_status,
                 "inventory list" ( "Item Description" )`)
        .eq("customer_id", selected.id)
        .order("sale_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!selected,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  const openAdd = () => {
    setForm({ ...emptyForm, id: null });
    setFormOpen(true);
  };

  const openEdit = (c: Customer) => {
    setForm({
      id: c.id,
      name: c.name,
      phone: c.phone ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      notes: c.notes ?? "",
    });
    setFormOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    if (name.length > 100) {
      toast.error("Name is too long");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (form.id) {
        const { error } = await supabase.from("customers").update(payload).eq("id", form.id);
        if (error) throw error;
        toast.success("Customer updated");
      } else {
        const { error } = await supabase
          .from("customers")
          .insert({ ...payload, created_by: session?.user?.id ?? null });
        if (error) throw error;
        toast.success("Customer added");
      }
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setFormOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from("customers").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("Customer deleted");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (selected?.id === deleteTarget.id) setSelected(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete customer");
    } finally {
      setDeleteTarget(null);
    }
  };

  const totalOutstanding = useMemo(
    () => Object.values(salesByCustomer).reduce((s, v) => s + (v.outstanding || 0), 0),
    [salesByCustomer]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Customers
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your customer directory and view purchase history
          </p>
        </div>
        <Button onClick={openAdd} className="w-full sm:w-auto min-h-[40px] font-semibold rounded-xl active:scale-[0.98]">
          <Plus className="h-4 w-4 mr-2" /> Add customer
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Customers with sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(salesByCustomer).length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Outstanding balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ₦{totalOutstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 sm:h-10 text-sm rounded-xl bg-card/65 border-border/60"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading customers...</div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border-border/60">
          <CardContent className="py-12 text-center text-muted-foreground">
            {customers.length === 0
              ? "No customers yet. Add your first customer to get started."
              : "No customers match your search."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const stats = salesByCustomer[c.id];
            return (
              <Card
                key={c.id}
                className="hover:shadow-md transition-all cursor-pointer rounded-2xl border-border/60 group"
                onClick={() => setSelected(c)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base group-hover:text-primary transition-colors">{c.name}</CardTitle>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 min-h-[36px] min-w-[36px] rounded-lg hover:bg-muted"
                        onClick={() => openEdit(c)}
                        aria-label="Edit customer"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 min-h-[36px] min-w-[36px] rounded-lg text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(c)}
                        aria-label="Delete customer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {c.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {c.phone}
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" /> {c.email}
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {c.address}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="secondary" className="rounded-md">
                      {stats?.total_orders ?? 0} order{(stats?.total_orders ?? 0) === 1 ? "" : "s"}
                    </Badge>
                    <Badge variant="outline" className="rounded-md">
                      ₦{(stats?.total_spent ?? 0).toLocaleString()}
                    </Badge>
                    {(stats?.outstanding ?? 0) > 0 && (
                      <Badge variant="destructive" className="rounded-md">
                        ₦{stats!.outstanding.toLocaleString()} owed
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit customer" : "Add customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="f-name">Name *</Label>
              <Input
                id="f-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
                className="min-h-[40px] rounded-xl mt-1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="f-phone">Phone</Label>
                <Input
                  id="f-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  maxLength={30}
                  className="min-h-[40px] rounded-xl mt-1"
                />
              </div>
              <div>
                <Label htmlFor="f-email">Email</Label>
                <Input
                  id="f-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  maxLength={255}
                  className="min-h-[40px] rounded-xl mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="f-address">Address</Label>
              <Input
                id="f-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                maxLength={300}
                className="min-h-[40px] rounded-xl mt-1"
              />
            </div>
            <div>
              <Label htmlFor="f-notes">Notes</Label>
              <Textarea
                id="f-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                maxLength={1000}
                rows={3}
                className="rounded-xl mt-1"
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving} className="min-h-[42px] rounded-xl active:scale-[0.98]">
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="min-h-[42px] rounded-xl font-semibold active:scale-[0.98]">
              {saving ? "Saving..." : form.id ? "Save changes" : "Add customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase history dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.name} — Purchase history</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto overflow-x-auto">
            {selectedHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No sales recorded for this customer yet.
              </p>
            ) : (
              <table className="w-full text-sm min-w-[400px]">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Item</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedHistory.map((s: any) => (
                    <tr key={s.id} className="border-b">
                      <td className="py-2">
                        {new Date(s.sale_date).toLocaleDateString()}
                      </td>
                      <td className="py-2">
                        {s["inventory list"]?.["Item Description"] ?? "—"}
                      </td>
                      <td className="py-2 text-right">{s.quantity}</td>
                      <td className="py-2 text-right">
                        ₦{Number(s.total_amount).toLocaleString()}
                      </td>
                      <td className="py-2 capitalize">
                        {s.payment_status?.replace("_", " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {deleteTarget?.name} from your directory. Existing sales and
              invoices remain but will no longer be linked to a customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="min-h-[42px] rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="min-h-[42px] rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
