import { Input } from "@/components/ui/input";

interface SalesSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SalesSearchInput({ value, onChange }: SalesSearchInputProps) {
  return (
    <div className="flex gap-2 items-center">
      <Input
        placeholder="Search by item name..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-xs"
      />
    </div>
  );
}