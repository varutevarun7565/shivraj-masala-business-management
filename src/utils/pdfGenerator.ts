// ============================================================
// Reusable PDF Generation Utility
// Clear business-facing PDFs for Shivraj Masala's & Rice Mill
// ============================================================
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import brandLogo from '../assets/shivraj-logo.png';
import rhsLogo from '../assets/shivraj-rhs-logo.jpg';
import sloganLine1 from '../assets/slogan-line-1.png';
import sloganLine2 from '../assets/slogan-line-2.png';
import footerMarathi from '../assets/footer-marathi.png';

// Built-in jsPDF Helvetica does not contain the Indian rupee glyph.
// Using "Rs." prevents corrupted characters such as "¹" in exported PDFs.
const fmt = (n: number) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

async function imageToDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.width;
  const [logo, rightLogo, slogan1, slogan2] = await Promise.all([
    imageToDataUrl(brandLogo), imageToDataUrl(rhsLogo), imageToDataUrl(sloganLine1), imageToDataUrl(sloganLine2),
  ]);

  // Keep the original brand logo on the left and the client's new logo on the right.
  if (logo) doc.addImage(logo, 'PNG', 14, 9, 27, 27);
  if (rightLogo) doc.addImage(rightLogo, 'JPEG', pageWidth - 40, 8, 26, 26);

  doc.setTextColor(91, 25, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text("SHIVRAJ MASALA'S & RICE MILL", 46, 16);

  // Marathi slogans are stored as transparent images so Devanagari renders correctly in jsPDF.
  if (slogan1) doc.addImage(slogan1, 'PNG', 46, 20, 96, 5.2);
  if (slogan2) doc.addImage(slogan2, 'PNG', 57, 27, 58, 5.2);

  doc.setTextColor(91, 25, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Phone: 9420587838, 9112895565', 46, 35);

  // Dedicated top-right area prevents the generated timestamp from touching either logo or title.
  doc.setTextColor(105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - 14, 5.8, { align: 'right' });

  doc.setDrawColor(183, 121, 31);
  doc.setLineWidth(0.7);
  doc.line(14, 41, pageWidth - 14, 41);

  doc.setTextColor(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title, 14, 50);

  if (subtitle) {
    doc.setTextColor(95);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(subtitle, 14, 57);
    doc.setTextColor(0);
    return 62;
  }
  return 56;
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    const h = doc.internal.pageSize.height;
    const w = doc.internal.pageSize.width;
    doc.setDrawColor(225);
    doc.line(14, h - 13, w - 14, h - 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(125);
    doc.text("Shivraj Masala's & Rice Mill", 14, h - 8);
    doc.text(`Page ${page} of ${pageCount}`, w - 14, h - 8, { align: 'right' });
  }
}

async function addInvoiceClosing(doc: jsPDF, requestedY: number) {
  const pageHeight = doc.internal.pageSize.height;
  let y = requestedY;
  if (y > pageHeight - 48) {
    doc.addPage();
    y = 35;
  }
  doc.setTextColor(91, 25, 25);
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(18);
  doc.text('Thank You!', doc.internal.pageSize.width / 2, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(115);
  doc.text('FOR YOUR BUSINESS', doc.internal.pageSize.width / 2, y + 5, { align: 'center' });
  const marathi = await imageToDataUrl(footerMarathi);
  if (marathi) doc.addImage(marathi, 'PNG', doc.internal.pageSize.width / 2 - 32, y + 9, 64, 7.5);
}

// ── Invoice PDF ──
type InvoiceInput = {
  invoiceNo: string;
  date: string;
  customer: string;
  items: { name: string; qty: number; price: number; discount: number; discountPercent?:number; gstPercent?:number; gstAmount?:number; taxableAmount?:number }[];
  customerType?: string; customerGstin?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  pendingAmount: number;
  status: string;
};

/**
 * Internal helper — builds the complete jsPDF document but does NOT save it.
 * Both generateInvoicePDF and generateInvoicePDFBase64 call this.
 */
async function buildInvoicePDF(invoice: InvoiceInput, customerPhone = ''): Promise<jsPDF> {
  const doc = new jsPDF();
  const billDate = new Date(invoice.date).toLocaleDateString('en-IN');
  const startY = await addHeader(doc, 'Customer Invoice', `Bill No: ${invoice.invoiceNo}    |    Bill Date: ${billDate}`);

  // Customer information is deliberately separated so the PDF is easy to read.
  autoTable(doc, {
    startY: startY + 2,
    body: [
      ['Customer Name', invoice.customer || '-'],
      ['Customer Phone', customerPhone || '-'],
      ['Customer Type', invoice.customerType || 'Retail'],
      ['GSTIN', invoice.customerGstin || '-'],
      ['Payment Method', invoice.paymentMethod || '-'],
    ],
    styles: { fontSize: 9, cellPadding: 2.8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42, textColor: [91, 25, 25] } },
    theme: 'plain',
    tableWidth: 110,
  });

  const tableY = (doc as any).lastAutoTable.finalY + 5;
  autoTable(doc, {
    startY: tableY,
    head: [['No.', 'Item / Service', 'Qty', 'Base Rate', 'Discount', 'GST', 'Amount']],
    body: invoice.items.map((item, idx) => [
      idx + 1,
      item.name,
      item.qty,
      fmt(item.price),
      (item as any).discountPercent > 0 ? `${(item as any).discountPercent}% (${fmt(item.discount * item.qty)})` : (item.discount > 0 ? fmt(item.discount * item.qty) : '-'),
      (item.gstPercent||0)>0 ? `${item.gstPercent}% (${fmt(item.gstAmount||0)})` : '-',
      fmt((item.taxableAmount ?? ((item.price*item.qty)-(item.discount*item.qty))) + (item.gstAmount||0)),
    ]),
    styles: { fontSize: 9, cellPadding: 3.2, valign: 'middle' },
    headStyles: { fillColor: [91, 25, 25], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [252, 248, 242] },
    columnStyles: { 0: { halign: 'center', cellWidth: 13 }, 2: { halign: 'center', cellWidth: 18 }, 3: { halign: 'right', cellWidth: 28 }, 4: { halign: 'right', cellWidth: 24 }, 5: { halign: 'right', cellWidth: 24 }, 6: { halign: 'right', cellWidth: 27 } },
    theme: 'grid',
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const summaryData = [
    ['Subtotal', fmt(invoice.subtotal)],
    ...(invoice.discount > 0 ? [['Bill Discount', `- ${fmt(invoice.discount)}`]] : []),
    ...(invoice.tax > 0 ? [['GST', fmt(invoice.tax)]] : []),
    ['Total Bill Amount', fmt(invoice.total)],
    ['Amount Paid', fmt(invoice.paidAmount)],
    ['Balance Due', fmt(invoice.pendingAmount)],
    ['Payment Status', invoice.status || '-'],
  ];

  autoTable(doc, {
    startY: finalY,
    body: summaryData,
    styles: { fontSize: 9.5, cellPadding: 3.2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 52 }, 1: { halign: 'right', fontStyle: 'bold' } },
    didParseCell(data) {
      if (data.row.index === summaryData.length - 4) {
        data.cell.styles.fillColor = [255, 247, 230];
        data.cell.styles.textColor = [91, 25, 25];
      }
    },
    theme: 'plain',
    margin: { left: doc.internal.pageSize.width - 112 },
    tableWidth: 98,
  });

  const closingY = (doc as any).lastAutoTable.finalY + 15;
  await addInvoiceClosing(doc, closingY);
  addFooter(doc);
  return doc;
}

/** Generates the invoice PDF and triggers a browser-style download. (Existing behaviour — unchanged.) */
export async function generateInvoicePDF(invoice: InvoiceInput, customerPhone = '') {
  const doc = await buildInvoicePDF(invoice, customerPhone);
  doc.save(`Invoice_${invoice.invoiceNo}.pdf`);
}

/** Generates the invoice PDF and returns it as a base64-encoded string for saving via Electron IPC. */
export async function generateInvoicePDFBase64(invoice: InvoiceInput, customerPhone = ''): Promise<string> {
  const doc = await buildInvoicePDF(invoice, customerPhone);
  return doc.output('datauristring').split(',')[1]; // pure base64 without the data-uri prefix
}

// ── Expense Report PDF ──
export async function generateExpenseReportPDF(
  expenses: { id: string; category: string; amount: number; description: string; date: string }[],
  periodLabel: string,
  dateRangeLabel: string,
) {
  const doc = new jsPDF();
  const startY = await addHeader(doc, 'Expenses Report', `Report Period: ${periodLabel}    |    ${dateRangeLabel}`);

  if (expenses.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(120);
    doc.text('No expense records were found for this period.', 14, startY + 10);
    addFooter(doc);
    doc.save(`Expenses_Report_${periodLabel.replace(/\s+/g, '_')}.pdf`);
    return;
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  autoTable(doc, {
    startY: startY + 3,
    head: [['No.', 'Date', 'Expense Category', 'Details', 'Amount']],
    body: expenses.map((e, idx) => [idx + 1, new Date(e.date).toLocaleDateString('en-IN'), e.category, e.description || '-', fmt(e.amount)]),
    styles: { fontSize: 8.8, cellPadding: 3, valign: 'middle' },
    headStyles: { fillColor: [91, 25, 25], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [252, 248, 242] },
    columnStyles: { 0: { halign: 'center', cellWidth: 13 }, 1: { cellWidth: 25 }, 2: { cellWidth: 40 }, 4: { halign: 'right', cellWidth: 31 } },
    theme: 'grid',
  });

  const totalY = (doc as any).lastAutoTable.finalY + 7;
  autoTable(doc, {
    startY: totalY,
    body: [['Total Expenses', fmt(total)]],
    styles: { fontSize: 11, cellPadding: 4, fontStyle: 'bold' },
    columnStyles: { 0: { textColor: [91, 25, 25] }, 1: { halign: 'right', textColor: [91, 25, 25] } },
    theme: 'plain',
    margin: { left: doc.internal.pageSize.width - 112 },
    tableWidth: 98,
  });

  const catTotals: Record<string, number> = {};
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const catData = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const catY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(91, 25, 25);
  doc.text('Expense Summary by Category', 14, catY);

  autoTable(doc, {
    startY: catY + 4,
    head: [['Category', 'Amount']],
    body: catData.map(([category, amount]) => [category, fmt(amount)]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [183, 121, 31], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' } },
    theme: 'grid',
    tableWidth: 120,
  });

  addFooter(doc);
  doc.save(`Expenses_Report_${periodLabel.replace(/\s+/g, '_')}.pdf`);
}

// ── Business Report PDF ──
export async function generateBusinessReportPDF(config: {
  reportType: string;
  periodLabel: string;
  dateRangeLabel: string;
  headers: string[];
  rows: (string | number)[][];
  totals?: { label: string; value: string }[];
  summaryCards?: { label: string; value: string }[];
}) {
  const doc = new jsPDF();
  const startY = await addHeader(doc, `${config.reportType} Report`, `Report Period: ${config.periodLabel}    |    ${config.dateRangeLabel}`);
  let currentY = startY + 4;

  if (config.summaryCards?.length) {
    autoTable(doc, {
      startY: currentY,
      head: [config.summaryCards.map(c => c.label)],
      body: [config.summaryCards.map(c => c.value.replace(/₹/g, 'Rs. '))],
      styles: { fontSize: 9, cellPadding: 4, halign: 'center' },
      headStyles: { fillColor: [252, 248, 242], textColor: [91, 25, 25], fontStyle: 'bold' },
      bodyStyles: { fontStyle: 'bold', fontSize: 11 },
      theme: 'grid',
    });
    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  if (config.rows.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(120);
    doc.text('No records were found for this report period.', 14, currentY + 6);
    addFooter(doc);
    doc.save(`${config.reportType.replace(/\s+/g, '_')}_Report.pdf`);
    return;
  }

  autoTable(doc, {
    startY: currentY,
    head: [config.headers],
    body: config.rows.map(row => row.map(value => typeof value === 'number' ? fmt(value) : String(value).replace(/₹/g, 'Rs. '))),
    styles: { fontSize: 8.8, cellPadding: 3 },
    headStyles: { fillColor: [91, 25, 25], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [252, 248, 242] },
    theme: 'grid',
  });

  if (config.totals?.length) {
    const totY = (doc as any).lastAutoTable.finalY + 8;
    autoTable(doc, {
      startY: totY,
      body: config.totals.map(t => [t.label, t.value.replace(/₹/g, 'Rs. ')]),
      styles: { fontSize: 10, cellPadding: 3.5 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { halign: 'right', fontStyle: 'bold', textColor: [91, 25, 25] } },
      theme: 'plain',
      tableWidth: 120,
    });
  }

  addFooter(doc);
  doc.save(`${config.reportType.replace(/\s+/g, '_')}_Report.pdf`);
}

// ── Date helpers ──
export function getDateRange(period: string, refDate?: string): { start: Date; end: Date; label: string } {
  const now = refDate ? new Date(refDate) : new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today': {
      return { start: today, end: today, label: today.toLocaleDateString('en-IN') };
    }
    case 'week': {
      const dayOfWeek = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end, label: `${start.toLocaleDateString('en-IN')} – ${end.toLocaleDateString('en-IN')}` };
    }
    case 'month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start, end, label: `${start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}` };
    }
    case 'quarter': {
      const q = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), q * 3, 1);
      const end = new Date(today.getFullYear(), q * 3 + 3, 0);
      return { start, end, label: `Q${q + 1} ${today.getFullYear()}` };
    }
    case 'year': {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31);
      return { start, end, label: `${today.getFullYear()}` };
    }
    default:
      return { start: today, end: today, label: today.toLocaleDateString('en-IN') };
  }
}

export function isDateInRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(dateStr);
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const sDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const eDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return dDate >= sDate && dDate <= eDate;
}
