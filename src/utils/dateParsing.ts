import { isValid, parseISO } from "date-fns";

/**
 * Robust date parser supporting ISO strings, SQL datetime strings (YYYY-MM-DD HH:mm:ss),
 * European dates (DD/MM/YYYY), YYYY/MM/DD, and numeric/epoch timestamps.
 */
export function safeParseDate(dateInput: string | number | Date | null | undefined): Date | null {
  if (!dateInput && dateInput !== 0) return null;
  
  if (dateInput instanceof Date) {
    return isValid(dateInput) && !isNaN(dateInput.getTime()) ? dateInput : null;
  }
  
  if (typeof dateInput === "number") {
    const d = new Date(dateInput);
    return isValid(d) && !isNaN(d.getTime()) ? d : null;
  }

  const str = String(dateInput).trim();
  if (!str) return null;

  // 1. If numeric string (epoch timestamp)
  if (/^\d{10,13}$/.test(str)) {
    const num = Number(str);
    const d = new Date(num > 1e11 ? num : num * 1000);
    if (isValid(d) && !isNaN(d.getTime())) return d;
  }

  // 2. Normalize SQL datetimes like "2024-05-12 10:30:00" to ISO "2024-05-12T10:30:00"
  const normalized = str.includes(" ") && !str.includes("T") ? str.replace(" ", "T") : str;

  // 3. Try parseISO from date-fns
  const isoParsed = parseISO(normalized);
  if (isValid(isoParsed) && !isNaN(isoParsed.getTime())) {
    return isoParsed;
  }

  // 4. Try native Date constructor
  const nativeDate = new Date(str);
  if (isValid(nativeDate) && !isNaN(nativeDate.getTime())) {
    return nativeDate;
  }

  // 5. Try DD/MM/YYYY or DD-MM-YYYY format
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
    const minute = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const second = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
    const d = new Date(year, month, day, hour, minute, second);
    if (isValid(d) && !isNaN(d.getTime())) return d;
  }

  // 6. Try YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const hour = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0;
    const minute = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0;
    const second = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0;
    const d = new Date(year, month, day, hour, minute, second);
    if (isValid(d) && !isNaN(d.getTime())) return d;
  }

  return null;
}
