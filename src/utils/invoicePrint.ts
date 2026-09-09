import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { formatCurrency } from "./formatters";
import type { Currency } from "@/components/invoice/CurrencyChanger";
import { toast } from "sonner";

export interface InvoicePrintItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface InvoicePrintData {
  invoiceNumber: string;
  invoiceDate: Date | string;
  dueDate?: Date | string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerEmail?: string;
  items: InvoicePrintItem[];
  currency?: Currency;
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  vatRate?: number;
  vatAmount?: number;
  grandTotal: number;
  amountPaid: number;
  balance: number;
  isPaidInFull: boolean;
  notes?: string;
}

/**
 * Generate a standalone, styled HTML document for high-fidelity printing
 */
export const generateInvoicePrintHtml = (data: InvoicePrintData): string => {
  const {
    invoiceNumber,
    invoiceDate,
    dueDate,
    customerName,
    customerPhone,
    customerAddress,
    customerEmail,
    items,
    currency,
    subtotal,
    discountPercent = 0,
    discountAmount = 0,
    vatRate = 0,
    vatAmount = 0,
    grandTotal,
    amountPaid,
    balance,
    isPaidInFull,
    notes,
  } = data;

  const docTitle = isPaidInFull ? "RECEIPT" : "INVOICE";
  const formattedDate = typeof invoiceDate === "string" 
    ? invoiceDate 
    : format(invoiceDate, "dd/MM/yyyy");
  const formattedDueDate = dueDate 
    ? (typeof dueDate === "string" ? dueDate : format(dueDate, "dd/MM/yyyy")) 
    : null;

  const trimmedCustomerName = customerName?.trim() || "";
  const trimmedCustomerPhone = customerPhone?.trim() || "";
  const trimmedCustomerEmail = customerEmail?.trim() || "";
  const trimmedCustomerAddress = customerAddress?.trim() || "";
  const hasCustomerInfo = Boolean(
    trimmedCustomerName ||
    trimmedCustomerPhone ||
    trimmedCustomerEmail ||
    trimmedCustomerAddress
  );

  const itemsRows = items.map((item) => `
    <tr>
      <td style="padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; text-align: left;">
        ${item.description}
      </td>
      <td style="padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">
        ${formatCurrency(item.unit_price, currency)}
      </td>
      <td style="padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; font-family: monospace;">
        ${formatCurrency(item.amount, currency)}
      </td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${docTitle} - ${invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page-container {
      max-width: 820px;
      margin: 0 auto;
      min-height: calc(100vh - 48px);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .main-section {
      flex: 1;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid ${isPaidInFull ? "#059669" : "#081def"};
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: ${isPaidInFull ? "#059669" : "#081def"};
      letter-spacing: -0.5px;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      margin: 4px 0 0 0;
      font-weight: 500;
    }
    .doc-type-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: ${isPaidInFull ? "#dcfce7" : "#eff6ff"};
      color: ${isPaidInFull ? "#15803d" : "#1d4ed8"};
      border: 1px solid ${isPaidInFull ? "#86efac" : "#bfdbfe"};
      margin-top: 4px;
    }
    .meta-box {
      text-align: right;
    }
    .meta-number {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      font-family: monospace;
      margin: 0;
    }
    .meta-date {
      font-size: 12px;
      color: #64748b;
      margin: 4px 0 0 0;
    }
    .grid-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 20px;
      padding: 14px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .info-value-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 2px 0;
    }
    .info-text {
      font-size: 12px;
      color: #475569;
      margin: 1px 0;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    table.items-table th {
      background: #f1f5f9;
      padding: 10px 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      border-bottom: 2px solid #cbd5e1;
    }
    .summary-wrap {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    .summary-table {
      width: 320px;
      font-size: 13px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #f1f5f9;
      color: #475569;
    }
    .summary-row.bold {
      font-weight: 700;
      color: #0f172a;
      border-bottom: 2px solid #cbd5e1;
      font-size: 14px;
    }
    .summary-row.grand {
      font-size: 16px;
      font-weight: 800;
      color: ${isPaidInFull ? "#059669" : "#081def"};
      border-top: 2px solid ${isPaidInFull ? "#059669" : "#081def"};
      border-bottom: 2px solid ${isPaidInFull ? "#059669" : "#081def"};
      padding: 8px 0;
      margin-top: 4px;
    }
    .summary-row.balance {
      font-size: 14px;
      font-weight: 700;
      color: ${balance <= 0 ? "#059669" : "#dc2626"};
      padding-top: 6px;
    }
    .bottom-section {
      margin-top: auto;
      padding-top: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .bank-card {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #1e40af;
      margin-bottom: 12px;
    }
    .bank-card p {
      margin: 2px 0;
    }
    .footer-bar {
      background: ${isPaidInFull ? "#059669" : "#081def"};
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 500;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 12mm 10mm; size: auto; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="main-section">
      <!-- Header -->
      <div class="header-bar">
        <div>
          <h1 class="brand-title">
            PUIDO SMART SOLUTIONS LTD
          </h1>
          <p class="brand-sub">Enterprise Telecommunications & Smart Device Inventory</p>
          <div class="doc-type-badge">
            ${isPaidInFull ? "Official Payment Receipt" : "Commercial Invoice"}
          </div>
        </div>
        <div class="meta-box">
          <p class="meta-number">${docTitle} #${invoiceNumber}</p>
          <p class="meta-date">Date: <strong>${formattedDate}</strong></p>
          ${formattedDueDate ? `<p class="meta-date">Due: <strong>${formattedDueDate}</strong></p>` : ""}
        </div>
      </div>

      <!-- Info Grid -->
      <div class="grid-info" style="${!hasCustomerInfo ? 'display: flex; justify-content: flex-end;' : ''}">
        ${hasCustomerInfo ? `
        <div>
          <div class="info-label">${isPaidInFull ? "Receipt Issued To" : "Invoice To"}</div>
          ${trimmedCustomerName ? `<p class="info-value-name">${trimmedCustomerName}</p>` : ""}
          ${trimmedCustomerPhone ? `<p class="info-text">Phone: ${trimmedCustomerPhone}</p>` : ""}
          ${trimmedCustomerEmail ? `<p class="info-text">Email: ${trimmedCustomerEmail}</p>` : ""}
          ${trimmedCustomerAddress ? `<p class="info-text">Address: ${trimmedCustomerAddress}</p>` : ""}
        </div>
        ` : ""}
        <div style="text-align: right;">
          <div class="info-label">Payment Status</div>
          <p style="font-size: 14px; font-weight: 800; color: ${isPaidInFull ? "#059669" : "#d97706"}; margin: 0 0 4px 0;">
            ${isPaidInFull ? "PAID IN FULL" : (amountPaid > 0 ? "PARTIALLY PAID" : "PAYMENT PENDING")}
          </p>
          <p class="info-text">Currency: <strong>${currency?.code || "NGN"} (${currency?.symbol || "₦"})</strong></p>
          ${notes ? `<p class="info-text" style="margin-top: 4px; font-style: italic;">Notes: ${notes}</p>` : ""}
        </div>
      </div>

      <!-- Line Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align: left;">Item Description</th>
            <th style="text-align: center; width: 60px;">Qty</th>
            <th style="text-align: right; width: 140px;">Unit Price</th>
            <th style="text-align: right; width: 140px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Financial Totals -->
      <div class="summary-wrap">
        <div class="summary-table">
          <div class="summary-row">
            <span>Subtotal</span>
            <span style="font-family: monospace; font-weight: 600;">${formatCurrency(subtotal, currency)}</span>
          </div>
          ${discountPercent > 0 ? `
            <div class="summary-row" style="color: #059669;">
              <span>Discount (${discountPercent}%)</span>
              <span style="font-family: monospace;">-${formatCurrency(discountAmount, currency)}</span>
            </div>
          ` : ""}
          ${vatRate > 0 ? `
            <div class="summary-row">
              <span>VAT (${vatRate}%)</span>
              <span style="font-family: monospace;">${formatCurrency(vatAmount, currency)}</span>
            </div>
          ` : ""}
          <div class="summary-row grand">
            <span>Grand Total</span>
            <span style="font-family: monospace;">${formatCurrency(grandTotal, currency)}</span>
          </div>
          <div class="summary-row" style="font-weight: 600; color: #0f172a; padding-top: 6px;">
            <span>Amount Paid</span>
            <span style="font-family: monospace;">${formatCurrency(amountPaid, currency)}</span>
          </div>
          <div class="summary-row balance">
            <span>${isPaidInFull ? "Balance Settled" : "Outstanding Balance"}</span>
            <span style="font-family: monospace;">${formatCurrency(balance, currency)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Official Payment Instructions & Footer at Bottom -->
    <div class="bottom-section">
      <div class="bank-card">
        <p style="font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">
          Official Payment Instructions (Bank Transfer):
        </p>
        <p>Bank Name: <strong>Globus Bank</strong></p>
        <p>Account Number: <strong>1000145362</strong></p>
        <p>Account Name: <strong>Puido Smart Solution Ltd.</strong></p>
      </div>

      <div class="footer-bar">
        <span>Phone: 07035339641, 08131927116</span>
        <span>41, Olowu Street, Ikeja, Lagos</span>
      </div>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Universal print handler that works whether running inside sandboxed iframes
 * or standalone browser tabs.
 */
export const printInvoiceDocument = (data: InvoicePrintData): void => {
  const docType = data.isPaidInFull ? "Receipt" : "Invoice";
  toast.info(`Preparing ${docType} for printing...`);

  const html = generateInvoicePrintHtml(data);

  // Strategy 1: If top-level window (not embedded in an iframe), native print is fastest
  const isTopLevel = window.self === window.top;
  if (isTopLevel) {
    try {
      window.print();
      return;
    } catch (e) {
      console.warn("Direct window.print() failed, falling back to popup/iframe print:", e);
    }
  }

  // Strategy 2: Open dedicated printable window (works across sandbox constraints when allow-popups is granted)
  try {
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (err) {
          console.warn("Popup print invocation failed, falling back:", err);
        }
      }, 350);
      return;
    }
  } catch (err) {
    console.warn("window.open print failed:", err);
  }

  // Strategy 3: Hidden iframe print
  try {
    const printIframe = document.createElement("iframe");
    printIframe.style.position = "fixed";
    printIframe.style.right = "0";
    printIframe.style.bottom = "0";
    printIframe.style.width = "0";
    printIframe.style.height = "0";
    printIframe.style.border = "0";
    document.body.appendChild(printIframe);

    const frameDoc = printIframe.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();

      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch (iframeErr) {
          console.warn("Iframe print error:", iframeErr);
          // If browser completely blocks modal dialogs, export to PDF automatically
          toast.warning("Print modal was blocked by browser preview. Generating PDF download instead...");
          exportInvoiceToPdf(data);
        } finally {
          setTimeout(() => {
            if (document.body.contains(printIframe)) {
              document.body.removeChild(printIframe);
            }
          }, 3000);
        }
      }, 350);
      return;
    }
  } catch (err) {
    console.error("Iframe print failed:", err);
  }

  // Strategy 4: Direct fallback to PDF generation
  toast.info("Generating PDF download...");
  exportInvoiceToPdf(data);
};

/**
 * Generate and download a PDF document using jsPDF & autoTable
 */
export const exportInvoiceToPdf = (data: InvoicePrintData): void => {
  try {
    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      customerName,
      customerPhone,
      customerAddress,
      items,
      currency,
      subtotal,
      discountPercent = 0,
      discountAmount = 0,
      vatRate = 0,
      vatAmount = 0,
      grandTotal,
      amountPaid,
      balance,
      isPaidInFull,
      notes,
    } = data;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const docTitle = isPaidInFull ? "RECEIPT" : "INVOICE";
    const primaryColor: [number, number, number] = isPaidInFull ? [5, 150, 105] : [8, 29, 239];

    // Header Background Accent Bar
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 5, "F");

    // Company Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text("PUIDO SMART SOLUTIONS LTD", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Enterprise Telecommunications & Smart Devices", 14, 23);

    // Document Title & Meta Box
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(`${docTitle} #${invoiceNumber}`, 196, 18, { align: "right" });

    const formattedDate = typeof invoiceDate === "string" 
      ? invoiceDate 
      : format(invoiceDate, "dd/MM/yyyy");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Date: ${formattedDate}`, 196, 23, { align: "right" });
    if (dueDate) {
      const formattedDueDate = typeof dueDate === "string" ? dueDate : format(dueDate, "dd/MM/yyyy");
      doc.text(`Due: ${formattedDueDate}`, 196, 28, { align: "right" });
    }

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32);

    // Customer & Payment Status Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 35, 182, 28, 2, 2, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 35, 182, 28, 2, 2, "S");

    const pdfCustomerName = customerName?.trim() || "";
    const pdfCustomerPhone = customerPhone?.trim() || "";
    const pdfCustomerEmail = customerEmail?.trim() || "";
    const pdfCustomerAddress = customerAddress?.trim() || "";
    const hasPdfCustomerInfo = Boolean(
      pdfCustomerName ||
      pdfCustomerPhone ||
      pdfCustomerEmail ||
      pdfCustomerAddress
    );

    // Bill To
    if (hasPdfCustomerInfo) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(isPaidInFull ? "RECEIPT ISSUED TO" : "INVOICE TO", 18, 41);

      let currentCustomerY = 47;
      if (pdfCustomerName) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(pdfCustomerName, 18, currentCustomerY);
        currentCustomerY += 5;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);

      const contactParts = [
        pdfCustomerPhone ? `Phone: ${pdfCustomerPhone}` : null,
        pdfCustomerEmail ? `Email: ${pdfCustomerEmail}` : null,
      ].filter(Boolean);

      if (contactParts.length > 0) {
        doc.text(contactParts.join("   |   "), 18, currentCustomerY);
        currentCustomerY += 4.5;
      }

      if (pdfCustomerAddress) {
        doc.text(`Address: ${pdfCustomerAddress}`, 18, currentCustomerY);
      }
    }

    // Status on right side of card
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("PAYMENT STATUS", 192, 41, { align: "right" });

    doc.setFontSize(11);
    if (isPaidInFull) {
      doc.setTextColor(5, 150, 105);
      doc.text("PAID IN FULL", 192, 47, { align: "right" });
    } else if (amountPaid > 0) {
      doc.setTextColor(217, 119, 6);
      doc.text("PARTIALLY PAID", 192, 47, { align: "right" });
    } else {
      doc.setTextColor(220, 38, 38);
      doc.text("UNPAID", 192, 47, { align: "right" });
    }

    // Line Items Table
    const tableBody = items.map((item) => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unit_price, currency),
      formatCurrency(item.amount, currency),
    ]);

    autoTable(doc, {
      startY: 68,
      head: [["Item Description", "Qty", "Unit Price", "Amount"]],
      body: tableBody,
      theme: "plain",
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [71, 85, 105],
        fontStyle: "bold",
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        textColor: [15, 23, 42],
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 35, halign: "right" },
        3: { cellWidth: 35, halign: "right", fontStyle: "bold" },
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 130;

    // Financial Totals block on right
    let totalsY = finalY + 8;
    const totalsXLabel = 140;
    const totalsXVal = 196;

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("Subtotal:", totalsXLabel, totalsY);
    doc.text(formatCurrency(subtotal, currency), totalsXVal, totalsY, { align: "right" });

    if (discountPercent > 0) {
      totalsY += 5;
      doc.setTextColor(5, 150, 105);
      doc.text(`Discount (${discountPercent}%):`, totalsXLabel, totalsY);
      doc.text(`-${formatCurrency(discountAmount, currency)}`, totalsXVal, totalsY, { align: "right" });
    }

    if (vatRate > 0) {
      totalsY += 5;
      doc.setTextColor(71, 85, 105);
      doc.text(`VAT (${vatRate}%):`, totalsXLabel, totalsY);
      doc.text(formatCurrency(vatAmount, currency), totalsXVal, totalsY, { align: "right" });
    }

    totalsY += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text("Grand Total:", totalsXLabel, totalsY);
    doc.text(formatCurrency(grandTotal, currency), totalsXVal, totalsY, { align: "right" });

    totalsY += 5;
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("Amount Paid:", totalsXLabel, totalsY);
    doc.text(formatCurrency(amountPaid, currency), totalsXVal, totalsY, { align: "right" });

    totalsY += 5;
    doc.setFontSize(9.5);
    if (isPaidInFull) {
      doc.setTextColor(5, 150, 105);
      doc.text("Balance Settled:", totalsXLabel, totalsY);
      doc.text(formatCurrency(0, currency), totalsXVal, totalsY, { align: "right" });
    } else {
      doc.setTextColor(220, 38, 38);
      doc.text("Outstanding Balance:", totalsXLabel, totalsY);
      doc.text(formatCurrency(balance, currency), totalsXVal, totalsY, { align: "right" });
    }

    // Official Payment Instructions & Footer at bottom of page
    const bottomY = 250;

    // Globus Bank Box
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, bottomY, 182, 22, 2, 2, "F");
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(14, bottomY, 182, 22, 2, 2, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 64, 175);
    doc.text("OFFICIAL PAYMENT INSTRUCTIONS (BANK TRANSFER):", 18, bottomY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Bank Name: Globus Bank   |   Account Number: 1000145362   |   Account Name: Puido Smart Solution Ltd.", 18, bottomY + 12);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Please use invoice number as transfer narration.", 18, bottomY + 17);

    // Footer contact bar
    doc.setFillColor(...primaryColor);
    doc.rect(14, bottomY + 25, 182, 9, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("Phone: 07035339641, 08131927116", 18, bottomY + 31);
    doc.text("41, Olowu Street, Ikeja, Lagos", 192, bottomY + 31, { align: "right" });

    // Save File
    const filename = `${docTitle}-${invoiceNumber || "document"}.pdf`;
    doc.save(filename);
    toast.success(`${docTitle} PDF downloaded successfully!`);
  } catch (err: any) {
    console.error("PDF export error:", err);
    toast.error("Failed to generate PDF document");
  }
};
