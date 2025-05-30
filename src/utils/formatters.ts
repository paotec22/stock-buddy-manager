
import type { Currency } from "@/components/invoice/CurrencyChanger";

export const formatCurrency = (amount: number, currency?: Currency): string => {
  if (currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  // Default to NGN for backward compatibility
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};
