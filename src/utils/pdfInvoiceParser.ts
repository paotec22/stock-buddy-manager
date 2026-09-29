import * as pdfjsLib from "pdfjs-dist";
import { currencies, type Currency } from "@/components/invoice/CurrencyChanger";

// Configure worker using cdnjs matching version 3.11.174
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
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
  hasEOL?: boolean;
}

/**
 * Parses raw text from a PDF file using pdfjs-dist
 */
export async function extractTextFromPdf(file: File | ArrayBuffer): Promise<{ text: string; pagesText: string[]; rawItems: TextItemWithPosition[] }> {
  try {
    const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
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
      
      // Sort items roughly top-to-bottom, left-to-right
      const items = (textContent.items as any[]).map((item) => ({
        str: item.str || "",
        x: item.transform ? item.transform[4] : 0,
        y: item.transform ? item.transform[5] : 0,
        width: item.width || 0,
        height: item.height || 0,
        hasEOL: item.hasEOL,
      }));

      allRawItems.push(...items);

      // Group into lines by Y-coordinate proximity
      const lines: { y: number; text: string[] }[] = [];
      const Y_TOLERANCE = 4;

      for (const item of items) {
        if (!item.str.trim()) continue;
        const existingLine = lines.find((l) => Math.abs(l.y - item.y) <= Y_TOLERANCE);
        if (existingLine) {
          existingLine.text.push(item.str);
        } else {
          lines.push({ y: item.y, text: [item.str] });
        }
      }

      // Sort lines by Y descending (PDF coordinates origin is bottom-left)
      lines.sort((a, b) => b.y - a.y);
      const pageString = lines.map((l) => l.text.join(" ").trim()).filter(Boolean).join("\n");
      pagesText.push(pageString);
    }

    const fullText = pagesText.join("\n\n--- PAGE BREAK ---\n\n");
    return { text: fullText, pagesText, rawItems: allRawItems };
  } catch (error) {
    console.error("Failed to extract PDF text:", error);
    throw new Error(`Unable to read PDF file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Clean currency string to float
 */
function cleanNumber(val: string | number | undefined): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  // Remove currency signs, commas, spaces
  const cleaned = val.toString().replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse standard date patterns
 */
function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  const str = dateStr.trim();

  // Try standard DD/MM/YYYY or DD-MM-YYYY
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

  // Try Native Date parse (handles "Sep 28, 2026", "28 September 2026", etc.)
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;

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
  const lines = fullText
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

  // 1. INVOICE / RECEIPT NUMBER
  const invNoRegex = /(?:invoice|receipt|inv|bill|doc|rec)[\s#.:\-_]+([a-zA-Z0-9\-_/]{3,30})/i;
  for (const line of lines) {
    const match = line.match(invNoRegex);
    if (match && match[1] && !invoiceNumber) {
      // Check that match is not just a label word like "Date"
      const candidate = match[1].trim();
      if (!/^(date|due|to|from|for|total|number|no|details)$/i.test(candidate)) {
        invoiceNumber = candidate;
        break;
      }
    }
  }

  // Fallback pattern for standard INV-YYYYMMDD format
  if (!invoiceNumber) {
    const codeMatch = fullText.match(/\b(INV-[A-Za-z0-9_-]+|REC-[A-Za-z0-9_-]+|[A-Z]{2,4}-\d{4,10})\b/);
    if (codeMatch) {
      invoiceNumber = codeMatch[1];
    }
  }

  // 2. DATES
  const dateRegex = /(?:invoice\s*date|issue\s*date|dated|date)[\s:]+([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|\d{4}[./-][0-9]{1,2}[./-][0-9]{1,2})/i;
  for (const line of lines) {
    const match = line.match(dateRegex);
    if (match && match[1]) {
      const d = parseDateString(match[1]);
      if (d) {
        invoiceDate = d;
        break;
      }
    }
  }

  const dueDateRegex = /(?:due\s*date|payment\s*due|due\s*by|valid\s*until)[\s:]+([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|\d{4}[./-][0-9]{1,2}[./-][0-9]{1,2})/i;
  for (const line of lines) {
    const match = line.match(dueDateRegex);
    if (match && match[1]) {
      const d = parseDateString(match[1]);
      if (d) {
        dueDate = d;
        break;
      }
    }
  }

  // 3. EMAIL & PHONE
  const emailMatch = fullText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    // Exclude generic company email if possible
    customerEmail = emailMatch[1];
  }

  const phoneMatch = fullText.match(/(?:phone|tel|mobile|whatsapp|call)?[\s:]*(\+?\d{1,4}?[-.\s]?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4})/i);
  if (phoneMatch) {
    customerPhone = phoneMatch[1].trim();
  }

  // 4. CUSTOMER NAME & ADDRESS ("Bill To:", "Customer:", "Sold To:", "Client:")
  let capturingCustomer = false;
  const customerLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^(?:bill\s*to|billed\s*to|customer|client|sold\s*to|deliver\s*to|attn|recipient)[\s:]*$/i.test(line)) {
      capturingCustomer = true;
      continue;
    }

    const inlineMatch = line.match(/^(?:bill\s*to|billed\s*to|customer|client|sold\s*to|deliver\s*to|attn)[\s:]+(.+)$/i);
    if (inlineMatch && inlineMatch[1]) {
      customerName = inlineMatch[1].trim();
      capturingCustomer = true;
      continue;
    }

    if (capturingCustomer) {
      if (/^(?:invoice|items|description|qty|quantity|amount|total|subtotal|payment|bank|date|notes)/i.test(line)) {
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
      // Subsequent lines might be address / phone / email
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
  // Scan for table rows or item descriptions followed by Qty, Unit Price, Amount
  const items: ExtractedPdfItem[] = [];

  // Patterns for table rows:
  // e.g. "iPhone 15 Pro Max 256GB 2 850000 1700000" or "Service Fee 1 50000 50000"
  // e.g. "1. Solar Inverter 5kVA | Qty: 2 | Price: 450,000 | Total: 900,000"
  // e.g. "MacBook Air M2  -  2 @ ₦1,200,000 = ₦2,400,000"

  let inItemsTable = false;
  const itemCandidateLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^(?:description|item|product|service|particulars)\s+(?:qty|quantity)?/i.test(line) ||
        /(?:description|item).*(?:qty|quantity).*(?:price|rate).*(?:amount|total)/i.test(line)) {
      inItemsTable = true;
      continue;
    }

    if (inItemsTable) {
      // Stop condition when reaching summary totals
      if (/^(?:subtotal|total|vat|tax|discount|amount\s*paid|balance|notes|terms|bank\s*details|authorized\s*signature)/i.test(line)) {
        inItemsTable = false;
        continue;
      }
      itemCandidateLines.push(line);
    }
  }

  // If header wasn't explicitly found, scan entire text for item-like line patterns
  const candidatePool = itemCandidateLines.length > 0 ? itemCandidateLines : lines;

  for (const line of candidatePool) {
    // Avoid header/footer keywords
    if (/^(?:invoice|receipt|bill\s*to|date|due|subtotal|total|tax|vat|discount|notes|bank|phone|email|thank\s*you)/i.test(line)) {
      continue;
    }

    // Pattern A: Text followed by 3 numbers: Qty, Unit Price, Total Amount
    // e.g. "HP Pavilion Gaming Laptop 15  2  450,000.00  900,000.00"
    const matchA = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)\s+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)$/);
    if (matchA) {
      const desc = matchA[1].trim().replace(/^\d+[\s.)-]+/, ""); // remove leading item index like "1."
      const qty = cleanNumber(matchA[2]);
      const unitPrice = cleanNumber(matchA[3]);
      const amt = cleanNumber(matchA[4]) || qty * unitPrice;

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

    // Pattern B: Text followed by 2 numbers: Qty, Unit Price
    // e.g. "Wireless Ergonomic Mouse  5  15000"
    const matchB = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)$/);
    if (matchB) {
      const desc = matchB[1].trim().replace(/^\d+[\s.)-]+/, "");
      const qty = cleanNumber(matchB[2]);
      const unitPrice = cleanNumber(matchB[3]);

      if (desc.length > 1 && qty > 0 && unitPrice > 0 && !/^(subtotal|total|vat|tax|discount|paid|balance)/i.test(desc)) {
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

    // Pattern C: "Item Description - Amount" or "Item Description: ₦50,000"
    const matchC = line.match(/^(.+?)(?:\s*[-:=@]\s*|\s{3,})([₦$€£]?\s*[\d,]+(?:\.\d{2})?)$/);
    if (matchC) {
      const desc = matchC[1].trim().replace(/^\d+[\s.)-]+/, "");
      const price = cleanNumber(matchC[2]);
      if (desc.length > 2 && price > 0 && !/^(subtotal|total|vat|tax|discount|amount\s*paid|balance|net)/i.test(desc)) {
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

  // 6. TOTALS, VAT, DISCOUNT, AMOUNT PAID
  for (const line of lines) {
    // Subtotal
    const subMatch = line.match(/(?:subtotal|sub-total|sub\s*total)[\s:]+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)/i);
    if (subMatch) {
      subtotal = cleanNumber(subMatch[1]);
    }

    // VAT / Tax
    const vatMatch = line.match(/(?:vat|tax|gst)[\s(]*(\d+(?:\.\d+)?%?)?[\s)]*[\s:]+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)/i);
    if (vatMatch) {
      taxAmount = cleanNumber(vatMatch[2]);
      if (taxAmount > 0) {
        includeVat = true;
      }
    }

    // Discount
    const discMatch = line.match(/(?:discount|rebate)[\s(]*(\d+(?:\.\d+)?%?)?[\s)]*[\s:]+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)/i);
    if (discMatch) {
      discountAmount = cleanNumber(discMatch[2]);
      if (discMatch[1]) {
        discountPercent = cleanNumber(discMatch[1]);
      }
    }

    // Total Amount
    const totMatch = line.match(/(?:total\s*amount|grand\s*total|invoice\s*total|total)[\s:]+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)/i);
    if (totMatch) {
      const parsedTotal = cleanNumber(totMatch[1]);
      if (parsedTotal > 0) {
        totalAmount = parsedTotal;
      }
    }

    // Amount Paid / Paid
    const paidMatch = line.match(/(?:amount\s*paid|paid\s*amount|deposit|payment\s*received|paid)[\s:]+([₦$€£]?\s*[\d,]+(?:\.\d{2})?)/i);
    if (paidMatch) {
      const paid = cleanNumber(paidMatch[1]);
      if (paid > 0) {
        amountPaid = paid;
      }
    }

    // Notes / Payment instructions
    if (/^(?:notes|remarks|terms|instructions|payment\s*terms)[\s:]+(.+)$/i.test(line)) {
      const noteMatch = line.match(/^(?:notes|remarks|terms|instructions|payment\s*terms)[\s:]+(.+)$/i);
      if (noteMatch && noteMatch[1]) {
        notes = noteMatch[1].trim();
      }
    }
  }

  // Calculate fallbacks if totals were zero
  const calculatedItemsSubtotal = items.reduce((sum, it) => sum + it.amount, 0);
  if (!subtotal && calculatedItemsSubtotal > 0) {
    subtotal = calculatedItemsSubtotal;
  }
  if (!totalAmount && subtotal > 0) {
    const disc = discountPercent > 0 ? (subtotal * discountPercent) / 100 : discountAmount;
    const tax = includeVat ? (subtotal - disc) * 0.075 : taxAmount;
    totalAmount = subtotal - disc + tax;
  }

  const isPaid = (totalAmount > 0 && amountPaid >= totalAmount) || /official\s*payment\s*receipt|paid\s*in\s*full|receipt/i.test(fullText);
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
