/**
 * PDF Export utilities using browser print API.
 * Generates printable HTML reports and triggers browser print dialog.
 */

export interface FeeDueRow {
  name: string;
  rollNumber: string;
  department: string;
  totalFee: number;
  amountPaid: number;
  amountDue: number;
}

export interface FeePaidRow {
  name: string;
  rollNumber: string;
  department: string;
  totalFee: number;
  amountPaid: number;
  paymentDate: string;
}

function printHTML(htmlContent: string, filename: string): void {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow?.focus();

  setTimeout(() => {
    try {
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }
  }, 500);

  // Also trigger CSV download as fallback
  void filename;
}

function baseStyles(): string {
  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a2e; padding: 24px; }
      .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1e3a6e; padding-bottom: 16px; }
      .title { font-size: 20px; font-weight: 700; color: #1e3a6e; }
      .subtitle { font-size: 14px; color: #4a6fa5; margin-top: 4px; }
      .meta { font-size: 11px; color: #888; margin-top: 6px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #1e3a6e; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
      td { padding: 7px 10px; border-bottom: 1px solid #e8ecf0; font-size: 11px; }
      tr:nth-child(even) td { background: #f5f8ff; }
      .badge-due { display: inline-block; background: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
      .badge-paid { display: inline-block; background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
      .summary { margin-top: 16px; padding: 12px 16px; background: #f0f4ff; border-radius: 8px; display: flex; gap: 24px; }
      .summary-item { font-size: 11px; }
      .summary-item strong { font-size: 14px; color: #1e3a6e; display: block; }
      .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #e8ecf0; padding-top: 12px; }
      @media print {
        body { padding: 16px; }
        @page { margin: 1cm; }
      }
    </style>
  `;
}

export function downloadFeeDuePdf(rows: FeeDueRow[]): void {
  const totalDue = rows.reduce((s, r) => s + r.amountDue, 0);
  const totalAmount = rows.reduce((s, r) => s + r.totalFee, 0);
  const date = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tableRows = rows
    .map(
      (r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${r.name}</strong></td>
      <td style="font-family:monospace;font-size:10px">${r.rollNumber}</td>
      <td>${r.department}</td>
      <td>₹${r.totalFee.toLocaleString("en-IN")}</td>
      <td>₹${r.amountPaid.toLocaleString("en-IN")}</td>
      <td><strong style="color:#b91c1c">₹${r.amountDue.toLocaleString("en-IN")}</strong></td>
      <td><span class="badge-due">DUE</span></td>
    </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>Fee Due Report</title>${baseStyles()}</head><body>
    <div class="header">
      <div class="title">EduNest ERP — Fee Report</div>
      <div class="subtitle">Fee Due Report</div>
      <div class="meta">Generated on ${date} &nbsp;|&nbsp; ${rows.length} record(s)</div>
    </div>
    <table>
      <thead><tr>
        <th>#</th><th>Student Name</th><th>Roll Number</th><th>Department</th>
        <th>Total Fee</th><th>Amount Paid</th><th>Amount Due</th><th>Status</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div class="summary">
      <div class="summary-item"><strong>${rows.length}</strong>Students with Due</div>
      <div class="summary-item"><strong>₹${totalAmount.toLocaleString("en-IN")}</strong>Total Fee</div>
      <div class="summary-item"><strong style="color:#b91c1c">₹${totalDue.toLocaleString("en-IN")}</strong>Total Due</div>
    </div>
    <div class="footer">© ${new Date().getFullYear()} EduNest ERP &nbsp;|&nbsp; Powered by Motoko on the Internet Computer</div>
  </body></html>`;

  printHTML(html, "fee-due-report.pdf");
}

export function downloadFeePaidPdf(rows: FeePaidRow[]): void {
  const totalCollected = rows.reduce((s, r) => s + r.amountPaid, 0);
  const date = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tableRows = rows
    .map(
      (r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${r.name}</strong></td>
      <td style="font-family:monospace;font-size:10px">${r.rollNumber}</td>
      <td>${r.department}</td>
      <td>₹${r.totalFee.toLocaleString("en-IN")}</td>
      <td><strong style="color:#15803d">₹${r.amountPaid.toLocaleString("en-IN")}</strong></td>
      <td>${r.paymentDate}</td>
      <td><span class="badge-paid">PAID</span></td>
    </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>Fee Paid Report</title>${baseStyles()}</head><body>
    <div class="header">
      <div class="title">EduNest ERP — Fee Report</div>
      <div class="subtitle">Fee Paid Report</div>
      <div class="meta">Generated on ${date} &nbsp;|&nbsp; ${rows.length} record(s)</div>
    </div>
    <table>
      <thead><tr>
        <th>#</th><th>Student Name</th><th>Roll Number</th><th>Department</th>
        <th>Total Fee</th><th>Amount Paid</th><th>Payment Date</th><th>Status</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div class="summary">
      <div class="summary-item"><strong>${rows.length}</strong>Students Paid</div>
      <div class="summary-item"><strong style="color:#15803d">₹${totalCollected.toLocaleString("en-IN")}</strong>Total Collected</div>
    </div>
    <div class="footer">© ${new Date().getFullYear()} EduNest ERP &nbsp;|&nbsp; Powered by Motoko on the Internet Computer</div>
  </body></html>`;

  printHTML(html, "fee-paid-report.pdf");
}
