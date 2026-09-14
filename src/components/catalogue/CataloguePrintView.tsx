import React from "react";
import { InventoryItem } from "@/utils/inventoryUtils";
import { formatCurrency } from "@/utils/formatters";
import { CompanyLogo } from "@/components/CompanyLogo";
import { ImageOff } from "lucide-react";

interface CataloguePrintViewProps {
  items: InventoryItem[];
  signedUrls: Record<string, string>;
  location: string;
}

export function CataloguePrintView({
  items,
  signedUrls,
  location,
}: CataloguePrintViewProps) {
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="hidden print:block print:space-y-4">
      {/* ── Official Print Header ── */}
      <div className="pb-4 border-b-2 border-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CompanyLogo
            variant="light"
            alt="Puido Smart Solutions"
            className="h-11 w-auto object-contain"
          />
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
              Official Product Catalogue
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Puido Smart Solutions Ltd. • Smart Technology & Accessories
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded">
            {location.toUpperCase()} BRANCH
          </span>
          <p className="text-[11px] text-slate-600 font-mono mt-1">
            Issued: {currentDate}
          </p>
        </div>
      </div>

      {/* ── Summary Ribbon ── */}
      <div className="flex items-center justify-between py-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3.5 rounded border border-slate-200">
        <span>
          Listed Items: <strong>{items.length}</strong>
        </span>
        <span>
          Currency: <strong>NGN (₦)</strong>
        </span>
        <span>Prices subject to standard commercial terms</span>
      </div>

      {/* ── 4-Column High-Density Product Grid ── */}
      <div className="grid grid-cols-4 gap-3 pt-2">
        {items.map((item) => {
          const url = item.image_url ? signedUrls[item.image_url] : null;
          return (
            <div
              key={`print-${item.location}-${item.id}`}
              className="print-card-item rounded-lg border border-slate-300 bg-white overflow-hidden p-0 flex flex-col justify-between text-slate-900 shadow-none"
            >
              <div>
                {/* Photo */}
                <div className="aspect-square bg-slate-100 relative overflow-hidden border-b border-slate-200 flex items-center justify-center">
                  {url ? (
                    <img
                      src={url}
                      alt={item["Item Description"]}
                      className="h-full w-full object-cover"
                      decoding="sync"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <ImageOff className="h-6 w-6 opacity-40" />
                      <span className="text-[9px]">No photo</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2 space-y-1">
                  <h4 className="font-bold text-[11px] leading-snug line-clamp-2 text-slate-900">
                    {item["Item Description"]}
                  </h4>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <span>SKU #{item.id}</span>
                    <span>Qty: {item.Quantity ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Price footer */}
              <div className="px-2 pb-2 pt-1 border-t border-slate-100 flex items-center justify-between mt-auto">
                <span className="text-[9px] uppercase font-bold text-slate-400">
                  Unit Price
                </span>
                <span className="text-xs font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                  {formatCurrency(item.Price || 0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Print Document Footer ── */}
      <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
        <span>Puido Smart Solutions Ltd. • Lagos, Nigeria</span>
        <span>Generated from Inventory Management System</span>
      </div>
    </div>
  );
}
