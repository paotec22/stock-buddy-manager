import React from "react";
import { useTheme } from "./ThemeProvider";
import { 
  COMPANY_LOGO_PATH, 
  INVOICE_LOGO_PATH, 
  INVOICE_LOGO_DARK_PATH 
} from "@/utils/companyLogo";

export interface CompanyLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Theme variant:
   * - "auto" (default): automatically matches system/app theme.
   * - "light": forces light variant (ideal for white paper print).
   * - "dark": forces dark variant.
   * - "invoice": explicitly forces the official primary invoice logo.
   */
  variant?: "auto" | "light" | "dark" | "invoice";
  /**
   * Set to true to use the official Puido Smart Solutions Primary Logo on invoice pages.
   */
  isInvoice?: boolean;
}

/**
 * CompanyLogo displays the authentic brand marks for Puido Smart Solutions Ltd.
 * When rendered on the invoice page (or with isInvoice / variant="invoice"), it renders
 * the official Puido Smart Solutions_Primary Logo.svg.
 */
export function CompanyLogo({
  variant = "auto",
  isInvoice = false,
  className = "h-8 w-auto object-contain",
  alt = "Puido Smart Solutions",
  src,
  ...props
}: CompanyLogoProps) {
  let isDark = false;

  try {
    const themeContext = useTheme();
    isDark = themeContext.theme === "dark";
  } catch {
    if (typeof document !== "undefined") {
      isDark = document.documentElement.classList.contains("dark");
    }
  }

  const effectiveTheme =
    variant === "dark" ? "dark" : variant === "light" ? "light" : isDark ? "dark" : "light";

  let finalSrc = src;
  if (!finalSrc) {
    if (isInvoice || variant === "invoice") {
      finalSrc = effectiveTheme === "dark" ? INVOICE_LOGO_DARK_PATH : INVOICE_LOGO_PATH;
    } else {
      finalSrc = COMPANY_LOGO_PATH;
    }
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
}

export default CompanyLogo;

