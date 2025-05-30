
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Euro, IndianRupee, JapaneseYen, PoundSterling } from "lucide-react";

export type Currency = {
  code: string;
  symbol: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const currencies: Currency[] = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', icon: IndianRupee },
  { code: 'USD', symbol: '$', name: 'US Dollar', icon: DollarSign },
  { code: 'EUR', symbol: '€', name: 'Euro', icon: Euro },
  { code: 'GBP', symbol: '£', name: 'British Pound', icon: PoundSterling },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', icon: JapaneseYen },
];

interface CurrencyChangerProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

export const CurrencyChanger = ({ selectedCurrency, onCurrencyChange }: CurrencyChangerProps) => {
  return (
    <div className="flex items-center gap-2 print:hidden">
      <label className="text-sm font-medium">Currency:</label>
      <Select
        value={selectedCurrency.code}
        onValueChange={(value) => {
          const currency = currencies.find(c => c.code === value);
          if (currency) onCurrencyChange(currency);
        }}
      >
        <SelectTrigger className="w-40">
          <SelectValue>
            <div className="flex items-center gap-2">
              <selectedCurrency.icon className="h-4 w-4" />
              {selectedCurrency.code}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-2">
                <currency.icon className="h-4 w-4" />
                <span>{currency.code} - {currency.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
