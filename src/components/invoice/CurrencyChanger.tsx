
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
      <Select
        value={selectedCurrency.code}
        onValueChange={(value) => {
          const currency = currencies.find(c => c.code === value);
          if (currency) onCurrencyChange(currency);
        }}
      >
        <SelectTrigger className="!min-h-0 h-8 w-28 sm:w-36 text-xs bg-background">
          <SelectValue>
            <div className="flex items-center gap-1.5 font-medium">
              <selectedCurrency.icon className="h-3.5 w-3.5 text-primary" />
              <span>{selectedCurrency.code} ({selectedCurrency.symbol})</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          {currencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code} className="text-xs">
              <div className="flex items-center gap-2">
                <currency.icon className="h-3.5 w-3.5 text-primary" />
                <span>{currency.code} ({currency.symbol}) - {currency.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
