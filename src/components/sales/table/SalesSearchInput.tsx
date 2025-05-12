
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SalesSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SalesSearchInput({ value, onChange }: SalesSearchInputProps) {
  return (
    <div className="flex gap-2 items-center relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground hidden md:block" />
      <Input
        placeholder="Search by item name..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-xs md:pl-9"
      />
    </div>
  );
}
