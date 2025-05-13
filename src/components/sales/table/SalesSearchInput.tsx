
import { SearchInput } from "@/components/ui/search-input";

interface SalesSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SalesSearchInput({ value, onChange }: SalesSearchInputProps) {
  return (
    <SearchInput
      value={value}
      onChange={onChange}
      placeholder="Search by item name..."
      className="max-w-xs"
    />
  );
}
