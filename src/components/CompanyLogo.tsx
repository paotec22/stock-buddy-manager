import React from "react";
import { useTheme } from "./ThemeProvider";

export interface CompanyLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Theme variant:
   * - "auto" (default): automatically uses white logo in dark mode, black logo in light mode.
   * - "light": forces original black logo (ideal for white backgrounds and paper printing).
   * - "dark": forces white logo (ideal for dark mode cards or banners).
   */
  variant?: "auto" | "light" | "dark";
}

/**
 * CompanyLogo displays the official Puido Smart Solutions Ltd. company logo.
 * When the app is in dark mode, the black portions dynamically become white while
 * the distinctive blue brand accents are preserved intact.
 */
export function CompanyLogo({
  variant = "auto",
  className = "h-8 w-auto object-contain",
  alt = "Puido Smart Solutions",
  ...props
}: CompanyLogoProps) {
  let isDark = false;

  try {
    const themeContext = useTheme();
    isDark = themeContext.theme === "dark";
  } catch {
    // Gracefully fallback if rendered outside ThemeProvider
    if (typeof document !== "undefined") {
      isDark = document.documentElement.classList.contains("dark");
    }
  }

  const effectiveTheme =
    variant === "dark" ? "dark" : variant === "light" ? "light" : isDark ? "dark" : "light";

  const src =
    effectiveTheme === "dark"
      ? "/Puido_Smart_Solutions_dark.svg"
      : "/Puido_Smart_Solutions.svg";

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      {...props}
    />
  );
}

export default CompanyLogo;
