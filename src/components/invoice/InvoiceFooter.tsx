import { Phone, MapPin } from "lucide-react";

export const InvoiceFooter = () => {
  return (
    <footer className="bg-[#081def] text-white py-3.5 px-4 sm:px-8 text-xs sm:text-sm rounded-lg flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs print:fixed print:bottom-0 print:left-0 print:right-0 print:bg-[#081def] print:text-white print:rounded-none">
      <div className="flex items-center gap-1.5">
        <Phone className="h-3.5 w-3.5 shrink-0 opacity-80" />
        <span>07035339641, 08131927116</span>
      </div>
      <div className="flex items-center gap-1.5 text-center sm:text-right">
        <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" />
        <span>41, Olowu Street, Ikeja, Lagos</span>
      </div>
    </footer>
  );
};
