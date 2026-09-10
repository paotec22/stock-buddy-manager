import { Phone, MapPin } from "lucide-react";

export const InvoiceFooter = () => {
  return (
    <footer className="bg-[#081def] text-white py-3.5 px-4 sm:px-8 text-xs sm:text-sm rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs print:static print:w-full print:bg-[#081def] print:text-white print:rounded-lg print:py-2.5 print:px-4 print:mt-1">
      <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
        <Phone className="h-3.5 w-3.5 shrink-0 opacity-85" />
        <a href="tel:07035339641" className="hover:underline active:opacity-80">07035339641</a>
        <span>,</span>
        <a href="tel:08131927116" className="hover:underline active:opacity-80">08131927116</a>
      </div>
      <div className="flex items-center gap-1.5 text-center sm:text-right">
        <MapPin className="h-3.5 w-3.5 shrink-0 opacity-85" />
        <span>41, Olowu Street, Ikeja, Lagos</span>
      </div>
    </footer>
  );
};
