import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.js?url";
import { currencies, type Currency } from "@/components/invoice/CurrencyChanger";

// Configure worker locally using Vite's ?url asset bundler (prevents external CORS/CSP failures)
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export interface ExtractedPdfItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  matchedInventoryId?: number | null;
  matchedInventoryName?: string | null;
  confidence?: "high" | "medium" | "low";
}

export interface ExtractedPdfInvoice {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  notes: string;
  currency: Currency;
  items: ExtractedPdfItem[];
  subtotal: number;
  includeVat: boolean;
  vatRate: number;
  taxAmount: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  isPaid: boolean;
  rawText: string;
  pageCount: number;
}

interface TextItemWithPosition {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Parses raw text from a PDF file using pdfjs-dist with positional reconstruction
 */
export async function extractTextFromPdf(
  file: File | ArrayBuffer
): Promise<{ text: string; pagesText: string[]; rawItems: TextItemWithPosition[] }> {
  try {
    const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;

    // Load document using pdfjs-dist
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      isEvalSupported: false,
    });

    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;
    const pagesText: string[] = [];
    const allRawItems: TextItemWithPosition[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();

      const items: TextItemWithPosition[] = (textContent.items as any[]).map((item) => ({
        str: item.str || "",
        x: item.transform ? item.transform[4] : 0,
        y: item.transform ? item.transform[5] : 0,
        width: item.width || 0,
        height: item.height || 0,
      }));

      allRawItems.push(...items);

      // Group items into rows by Y-coordinate proximity
      const Y_TOLERANCE = 5;
      const lines: { y: number; items: TextItemWithPosition[] }[] = [];

      for (const item of items) {
        if (!item.str || item.str.trim() === "") continue;
        const existingLine = lines.find((l) => Math.abs(l.y - item.y) <= Y_TOLERANCE);
        if (existingLine) {
          existingLine.items.push(item);
        } else {
          lines.push({ y: item.y, items: [item] });
        }
      }

      // Sort lines top-to-bottom (PDF Y-origin is bottom-left, so descending Y = top-to-bottom)
      lines.sort((a, b) => b.y - a.y);

      // Sort items within each line left-to-right (X ascending)
      const reconstructedLines = lines.map((l) => {
        l.items.sort((a, b) => a.x - b.x);
        return l.items
          .map((it) => it.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
      }).filter((lineStr) => lineStr.length > 0);

      const pageString = reconstructedLines.join("\n");
      pagesText.push(pageString);
    }

    const fullText = pagesText.join("\n\n--- PAGE BREAK ---\n\n");
    return { text: fullText, pagesText, rawItems: allRawItems };
  } catch (error: any) {
    console.error("Failed to extract PDF text:", error);
    throw new Error(`Unable to read PDF file: ${error?.message || "Unknown PDF parsing error"}`);
  }
}

/**
 * Clean currency/number string into a valid float
 */
function cleanNumber(val: string | number | undefined): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  // Remove currency symbols, commas, spaces, trailing dots
  const cleaned = val
    .toString()
    .replace(/₦|\$|€|£|¥|NGN|USD|EUR|GBP/gi, "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "")
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse standard and written date patterns
 */
function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  const str = dateStr.trim();

  // Try standard DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10) - 1;
    let y = parseInt(dmyMatch[3], 10);
    if (y < 100) y += 2000;
    const date = new Date(y, m, d);
    if (!isNaN(date.getTime())) return date;
  }

  // Try YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10) - 1;
    const d = parseInt(ymdMatch[3], 10);
    const date = new Date(y, m, d);
    if (!isNaN(date.getTime())) return date;
  }

  // Try written formats like "12 Sep 2026", "September 12, 2026"
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000 && parsed.getFullYear() < 2100) {
    return parsed;
  }

  return null;
}

/**
 * Detect currency from text symbols or codes
 */
function detectCurrency(text: string): Currency {
  const upper = text.toUpperCase();
  if (text.includes("₦") || upper.includes("NGN") || upper.includes("NAIRA")) {
    return currencies.find((c) => c.code === "NGN") || currencies[0];
  }
  if (text.includes("$") || upper.includes("USD") || upper.includes("DOLLAR")) {
    return currencies.find((c) => c.code === "USD") || currencies[0];
  }
  if (text.includes("€") || upper.includes("EUR") || upper.includes("EURO")) {
    return currencies.find((c) => c.code === "EUR") || currencies[0];
  }
  if (text.includes("£") || upper.includes("GBP") || upper.includes("POUND")) {
    return currencies.find((c) => c.code === "GBP") || currencies[0];
  }
  if (text.includes("¥") || upper.includes("CNY") || upper.includes("RMB")) {
    return currencies.find((c) => c.code === "CNY") || currencies[0];
  }
  if (upper.includes("CAD")) {
    return currencies.find((c) => c.code === "CAD") || currencies[0];
  }
  return currencies[0]; // Default NGN
}

/**
 * Intelligent parser that converts raw PDF text lines into structured invoice payload
 */
export function parseInvoiceFromText(fullText: string): ExtractedPdfInvoice {
  const rawLines = fullText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("--- PAGE BREAK"));

  let invoiceNumber = "";
  let invoiceDate: Date = new Date();
  let dueDate: Date = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  let customerName = "";
  let customerPhone = "";
  let customerEmail = "";
  let customerAddress = "";
  let notes = "";
  const detectedCurrency = detectCurrency(fullText);

  let subtotal = 0;
  let taxAmount = 0;
  let includeVat = false;
  let discountAmount = 0;
  let discountPercent = 0;
  let totalAmount = 0;
  let amountPaid = 0;

  // 1. INVOICE / RECEIPT NUMBER EXTRACTION
  const invNoRegexes = [
    /(?:invoice\s*no\.?|invoice\s*#|invoice\s*number|inv\s*#|inv\s*no\.?|receipt\s*#|receipt\s*no\.?|bill\s*#|bill\s*no\.?|order\s*#|ref\s*#)[\s:=-]+([a-zA-Z0-9\-_/]{3,35})/i,
    /\b(INV[-_][A-Za-z0-9_-]{4,25})\b/i,
    /\b(REC[-_][A-Za-z0-9_-]{4,25})\b/i,
    /\b(SI[-_][A-Za-z0-9_-]{4,25})\b/i,
    /#\s*([a-zA-Z0-9\-_]{4,25})/,
  ];

  for (const regex of invNoRegexes) {
    const match = fullText.match(regex);
    if (match && match[1]) {
      const cand = match[1].trim();
      if (!/^(date|due|to|from|for|total|number|no|details|status|paid)$/i.test(cand)) {
        invoiceNumber = cand;
        break;
      }
    }
  }

  // Fallback pattern if none found
  if (!invoiceNumber) {
    const fallbackMatch = fullText.match(/\b([A-Z]{2,4}-\d{4,12})\b/);
    if (fallbackMatch) {
      invoiceNumber = fallbackMatch[1];
    }
  }

  // 2. DATES EXTRACTION
  const dateRegexes = [
    /(?:invoice\s*date|issue\s*date|billing\s*date|dated|date)[\s:=-]+([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|\d{4}[./-][0-9]{1,2}[./-][0-9]{1,2})/i,
    /\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/,
  ];

  for (const regex of dateRegexes) {
    const match = fullText.match(regex);
    if (match && match[1]) {
      const parsed = parseDateString(match[1]);
      if (parsed) {
        invoiceDate = parsed;
        break;
      }
    }
  }

  const dueDateRegex = /(?:due\s*date|payment\s*due|due\s*by|valid\s*until|expiry\s*date)[\s:=-]+([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|\d{4}[./-][0-9]{1,2}[./-][0-9]{1,2})/i;
  const dueMatch = fullText.match(dueDateRegex);
  if (dueMatch && dueMatch[1]) {
    const parsedDue = parseDateString(dueMatch[1]);
    if (parsedDue) {
      dueDate = parsedDue;
    }
  }

  // 3. EMAIL & PHONE
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const emailMatch = fullText.match(emailRegex);
  if (emailMatch) {
    customerEmail = emailMatch[1];
  }

  const phoneRegexes = [
    /(?:phone|tel|mobile|whatsapp|contact)?[\s:]*(\+?234[\s-]?\d{2,3}[\s-]?\d{3,4}[\s-]?\d{3,4})/i,
    /(?:phone|tel|mobile|whatsapp|contact)?[\s:]*(0[789][01]\d{1}[\s-]?\d{3}[\s-]?\d{4})/i,
    /(?:phone|tel|mobile|whatsapp)[\s:]*(\+?\d{1,4}?[-.\s]?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4})/i,
  ];

  for (const regex of phoneRegexes) {
    const pMatch = fullText.match(regex);
    if (pMatch && pMatch[1]) {
      customerPhone = pMatch[1].trim();
      break;
    }
  }

  // 4. CUSTOMER NAME & ADDRESS ("Bill To:", "Customer:", "Sold To:", "Client:", "Recipient:")
  let capturingCustomer = false;
  const customerLines: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Explicit Bill To: header on separate line
    if (/^(?:bill\s*to|billed\s*to|customer|client|sold\s*to|deliver\s*to|attn|recipient|customer\s*name|client\s*name)[\s:]*$/i.test(line)) {
      capturingCustomer = true;
      continue;
    }

    // Inline Bill To: John Doe
    const inlineMatch = line.match(/^(?:bill\s*to|billed\s*to|customer|client|sold\s*to|deliver\s*to|attn|customer\s*name|client\s*name)[\s:=-]+(.+)$/i);
    if (inlineMatch && inlineMatch[1]) {
      customerName = inlineMatch[1].trim();
      capturingCustomer = true;
      continue;
    }

    if (capturingCustomer) {
      if (/^(?:invoice|items|description|qty|quantity|amount|total|subtotal|payment|bank|date|due|notes|item\s*description|unit\s*price)/i.test(line)) {
        capturingCustomer = false;
      } else {
        customerLines.push(line);
        if (customerLines.length >= 4) capturingCustomer = false;
      }
    }
  }

  if (!customerName && customerLines.length > 0) {
    customerName = customerLines[0];
    if (customerLines.length > 1) {
      const remaining = customerLines.slice(1);
      const addrParts: string[] = [];
      for (const part of remaining) {
        if (part.includes("@") && !customerEmail) {
          customerEmail = part;
        } else if (/\d{7,}/.test(part) && !customerPhone) {
          customerPhone = part;
        } else {
          addrParts.push(part);
        }
      }
      customerAddress = addrParts.join(", ");
    }
  } else if (customerLines.length > 0 && !customerAddress) {
    customerAddress = customerLines.join(", ");
  }

  // 5. LINE ITEMS EXTRACTION
  const items: ExtractedPdfItem[] = [];

  let inItemsTable = false;
  const tableCandidateLines: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Detect Table Header row
    if (
      /(?:description|item|product|service|particulars)\s+(?:qty|quantity)?/i.test(line) ||
      /(?:description|item).*(?:qty|quantity).*(?:price|rate).*(?:amount|total)/i.test(line) ||
      /(?:s\/n|item\s*no).*(?:description).*(?:qty).*(?:price|total)/i.test(line)
    ) {
      inItemsTable = true;
      continue;
    }

    if (inItemsTable) {
      // Stop condition when reaching summary totals or notes
      if (
        /^(?:subtotal|sub-total|total|vat|tax|discount|amount\s*paid|balance|notes|terms|bank\s*details|authorized|thank\s*you)/i.test(line)
      ) {
        inItemsTable = false;
        continue;
      }
      tableCandidateLines.push(line);
    }
  }

  // If table boundaries weren't strictly marked, consider all plausible lines
  const candidatePool = tableCandidateLines.length > 0 ? tableCandidateLines : rawLines;

  for (const line of candidatePool) {
    // Skip obvious non-item lines
    if (
      /^(?:invoice|receipt|bill\s*to|date|due|subtotal|total|tax|vat|discount|notes|bank|phone|email|thank\s*you|page|terms|signature|puido|si\s*manager)/i.test(
        line
      )
    ) {
      continue;
    }

    // Pattern 1: Description with 3 numeric groups at end: Qty, Unit Price, Total Amount
    // e.g., "Smart Touch Switch 3 Gang White 4 18,500.00 74,000.00"
    // e.g., "1. Motorized Track 4.2m 2 65000 130000"
    const match1 = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)\s+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)$/);
    if (match1) {
      const desc = match1[1].trim().replace(/^\d+[\s.)|/-]+/, "").trim();
      const qty = cleanNumber(match1[2]);
      const unitPrice = cleanNumber(match1[3]);
      const amt = cleanNumber(match1[4]) || qty * unitPrice;

      if (desc.length > 1 && qty > 0 && unitPrice > 0) {
        items.push({
          id: Math.random().toString(36).substring(2, 9),
          description: desc,
          quantity: qty,
          unit_price: unitPrice,
          amount: amt,
        });
        continue;
      }
    }

    // Pattern 2: Description with 2 numeric groups at end: Qty, Unit Price
    // e.g., "Tuya Zigbee Gateway Hub 2 35000"
    const match2 = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)$/);
    if (match2) {
      const desc = match2[1].trim().replace(/^\d+[\s.)|/-]+/, "").trim();
      const qty = cleanNumber(match2[2]);
      const unitPrice = cleanNumber(match2[3]);

      if (
        desc.length > 1 &&
        qty > 0 &&
        unitPrice > 0 &&
        !/^(subtotal|total|vat|tax|discount|paid|balance|amount)/i.test(desc)
      ) {
        items.push({
          id: Math.random().toString(36).substring(2, 9),
          description: desc,
          quantity: qty,
          unit_price: unitPrice,
          amount: qty * unitPrice,
        });
        continue;
      }
    }

    // Pattern 3: Separated by | or @ or x
    // e.g., "Smart Roller Blind Motor @ 45,000 x 3 = 135,000"
    const match3 = line.match(/^(.+?)(?:\s*[@xX]\s*|\s*\|\s*)(\d+(?:\.\d+)?)(?:\s*[@xX]\s*|\s*\|\s*)([₦$€£]?\s*[\d,]+(?:\.\d{2})?)/);
    if (match3) {
      const desc = match3[1].trim().replace(/^\d+[\s.)|/-]+/, "").trim();
      const qty = cleanNumber(match3[2]);
      const unitPrice = cleanNumber(match3[3]);
      if (desc.length > 1 && qty > 0 && unitPrice > 0) {
        items.push({
          id: Math.random().toString(36).substring(2, 9),
          description: desc,
          quantity: qty,
          unit_price: unitPrice,
          amount: qty * unitPrice,
        });
        continue;
      }
    }

    // Pattern 4: "Item Description - ₦50,000" or "Item Description: ₦50,000"
    const match4 = line.match(/^(.+?)(?:\s*[-:=]\s*|\s{3,})([₦$€£]?\s*[\d,]+(?:\.\d{2})?)$/);
    if (match4) {
      const desc = match4[1].trim().replace(/^\d+[\s.)|/-]+/, "").trim();
      const price = cleanNumber(match4[2]);
      if (
        desc.length > 2 &&
        price > 0 &&
        !/^(subtotal|total|vat|tax|discount|amount\s*paid|balance|net|due)/i.test(desc)
      ) {
        items.push({
          id: Math.random().toString(36).substring(2, 9),
          description: desc,
          quantity: 1,
          unit_price: price,
          amount: price,
        });
        continue;
      }
    }
  }

  // 6. TOTALS, TAX, DISCOUNT, AMOUNT PAID
  for (const line of rawLines) {
    // Subtotal
    const subMatch = line.match(/(?:subtotal|sub-total|sub\s*total)[\s:=-]+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)/i);
    if (subMatch) {
      const val = cleanNumber(subMatch[1]);
      if (val > 0) subtotal = val;
    }

    // VAT / Tax
    const vatMatch = line.match(/(?:vat|tax|gst)[\s(]*(\d+(?:\.\d+)?%?)?[\s)]*[\s:=-]+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)/i);
    if (vatMatch) {
      const val = cleanNumber(vatMatch[2]);
      if (val > 0) {
        taxAmount = val;
        includeVat = true;
      }
    }

    // Discount
    const discMatch = line.match(/(?:discount|rebate|less)[\s(]*(\d+(?:\.\d+)?%?)?[\s)]*[\s:=-]+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)/i);
    if (discMatch) {
      const val = cleanNumber(discMatch[2]);
      if (val > 0) {
        discountAmount = val;
      }
      if (discMatch[1]) {
        discountPercent = cleanNumber(discMatch[1]);
      }
    }

    // Total Amount / Grand Total
    const totMatch = line.match(/(?:total\s*amount|grand\s*total|invoice\s*total|total\s*due|net\s*total|total)[\s:=-]+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)/i);
    if (totMatch) {
      const val = cleanNumber(totMatch[1]);
      if (val > 0 && val !== subtotal) {
        totalAmount = val;
      } else if (val > 0 && !totalAmount) {
        totalAmount = val;
      }
    }

    // Amount Paid / Deposit / Received
    const paidMatch = line.match(/(?:amount\s*paid|paid\s*amount|deposit|payment\s*received|paid)[\s:=-]+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)/i);
    if (paidMatch) {
      const val = cleanNumber(paidMatch[1]);
      if (val > 0) amountPaid = val;
    }

    // Notes & Payment Instructions
    if (/^(?:notes|remarks|terms|instructions|payment\s*terms|bank\s*details)[\s:=-]+(.+)$/i.test(line)) {
      const noteMatch = line.match(/^(?:notes|remarks|terms|instructions|payment\s*terms|bank\s*details)[\s:=-]+(.+)$/i);
      if (noteMatch && noteMatch[1]) {
        notes = noteMatch[1].trim();
      }
    }
  }

  // Fallbacks if calculated totals are missing
  const calculatedItemsTotal = items.reduce((sum, it) => sum + it.amount, 0);
  if (!subtotal && calculatedItemsTotal > 0) {
    subtotal = calculatedItemsTotal;
  }
  if (!totalAmount && subtotal > 0) {
    const disc = discountPercent > 0 ? (subtotal * discountPercent) / 100 : discountAmount;
    const tax = includeVat ? (subtotal - disc) * 0.075 : taxAmount;
    totalAmount = Math.max(0, subtotal - disc + tax);
  } else if (!totalAmount && calculatedItemsTotal > 0) {
    totalAmount = calculatedItemsTotal;
  }

  const isPaid =
    (totalAmount > 0 && amountPaid >= totalAmount) ||
    /official\s*payment\s*receipt|paid\s*in\s*full|\bpaid\b/i.test(fullText);

  if (isPaid && !amountPaid && totalAmount > 0) {
    amountPaid = totalAmount;
  }

  return {
    customerName: customerName || "Valued Customer",
    customerPhone,
    customerEmail,
    customerAddress,
    invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-8)}`,
    invoiceDate,
    dueDate,
    notes,
    currency: detectedCurrency,
    items,
    subtotal,
    includeVat,
    vatRate: 7.5,
    taxAmount,
    discountPercent,
    discountAmount,
    totalAmount,
    amountPaid,
    isPaid,
    rawText: fullText,
    pageCount: 1,
  };
}
