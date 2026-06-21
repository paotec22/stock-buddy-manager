import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export interface CustomerLite {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface CustomerSelectorProps {
  value: string | null;
  onChange: (customer: CustomerLite | null) => void;
  className?: string;
}

export function CustomerSelector({ value, onChange, className }: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, email, address")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomerLite[];
    },
  });

  const selected = customers.find((c) => c.id === value) ?? null;

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Customer name is required");
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("customers")
        .insert({
          name: trimmed,
          phone: newPhone.trim() || null,
          email: newEmail.trim() || null,
          address: newAddress.trim() || null,
          created_by: userData.user?.id ?? null,
        })
        .select("id, name, phone, email, address")
        .single();
      if (error) throw error;
      toast.success("Customer added");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onChange(data as CustomerLite);
      setAddOpen(false);
      setOpen(false);
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setNewAddress("");
    } catch (e: any) {
      toast.error(e.message || "Failed to add customer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal", className)}
          >
            <span className="truncate">
              {selected ? selected.name : "Select a customer (optional)"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search customers..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading..." : "No customers found."}
              </CommandEmpty>
              {selected && (
                <CommandGroup heading="Selected">
                  <CommandItem
                    value={`clear-${selected.id}`}
                    onSelect={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                  >
                    Clear selection
                  </CommandItem>
                </CommandGroup>
              )}
              <CommandGroup heading="Customers">
                {customers.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.name} ${c.phone ?? ""} ${c.email ?? ""}`}
                    onSelect={() => {
                      onChange(c);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === c.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{c.name}</span>
                      {c.phone && (
                        <span className="text-xs text-muted-foreground">{c.phone}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  value="__add_new_customer__"
                  onSelect={() => {
                    setAddOpen(true);
                    setOpen(false);
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add new customer
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="cust-name">Name *</Label>
              <Input
                id="cust-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="cust-phone">Phone</Label>
              <Input
                id="cust-phone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                maxLength={30}
              />
            </div>
            <div>
              <Label htmlFor="cust-email">Email</Label>
              <Input
                id="cust-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                maxLength={255}
              />
            </div>
            <div>
              <Label htmlFor="cust-address">Address</Label>
              <Input
                id="cust-address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                maxLength={300}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              <Plus className="h-4 w-4 mr-1" />
              {saving ? "Saving..." : "Add customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
