import nodemailer from 'nodemailer';

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
}

export interface HearingItem {
  CaseNumber: string;
  CaseTitle: string;
  CourtName: string | null;
  NextHearingDate: string | null;
  ExternalCounselName: string | null;
}

export interface ContractItem {
  ContractTitle: string;
  FirstParty: string;
  SecondParty: string;
  DateOfExpiry: string | null;
  DaysLeft: number;
}

export interface IPItem {
  IPTitle: string;
  Category: string;
  DateOfExpiry: string | null;
  DaysLeft: number;
}

export interface ReminderPayload {
  criticalHearings: HearingItem[];
  upcomingHearings: HearingItem[];
  expiringContracts: ContractItem[];
  expiringIP: IPItem[];
}

function th(label: string) {
  return `<th style="padding:8px 12px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.5px">${label}</th>`;
}
function td(val: string | null, bold = false, color?: string) {
  return `<td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:${color ?? (bold ? '#111827' : '#374151')};font-weight:${bold ? 700 : 400}">${val ?? '—'}</td>`;
}

function hearingRows(items: HearingItem[]) {
  return items.map(h => `<tr>
    ${td(h.CaseNumber, true)}
    ${td(h.CaseTitle)}
    ${td(h.CourtName)}
    ${td(h.NextHearingDate)}
    ${td(h.ExternalCounselName)}
  </tr>`).join('');
}

function contractRows(items: ContractItem[]) {
  return items.map(c => `<tr>
    ${td(c.ContractTitle, true)}
    ${td(c.FirstParty)}
    ${td(c.SecondParty)}
    ${td(c.DateOfExpiry)}
    ${td(`${c.DaysLeft}d left`, true, c.DaysLeft <= 7 ? '#dc2626' : '#d97706')}
  </tr>`).join('');
}

function ipRows(items: IPItem[]) {
  return items.map(ip => `<tr>
    ${td(ip.IPTitle, true)}
    ${td(ip.Category)}
    ${td(ip.DateOfExpiry)}
    ${td(`${ip.DaysLeft}d left`, true, ip.DaysLeft <= 30 ? '#dc2626' : '#d97706')}
  </tr>`).join('');
}

function section(title: string, color: string, heads: string[], rows: string) {
  if (!rows) return '';
  return `
  <div style="margin-bottom:24px">
    <div style="background:${color};color:#fff;padding:10px 16px;border-radius:6px 6px 0 0;font-size:13px;font-weight:700">${title}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 6px 6px;border-collapse:collapse">
      <thead><tr style="background:#f9fafb">${heads.map(th).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function buildPlainText(data: ReminderPayload, today: string, total: number): string {
  const lines: string[] = [
    'GATRONOVA GROUP — LEGAL MANAGEMENT PORTAL',
    `Daily Reminder — ${today}`,
    '',
    total > 0 ? `${total} item${total !== 1 ? 's' : ''} require your attention.` : 'No urgent items today. All clear.',
    '',
  ];

  if (data.criticalHearings.length) {
    lines.push('CRITICAL HEARINGS (next 3 days)');
    lines.push('----------------------------------');
    data.criticalHearings.forEach(h => {
      lines.push(`Case: ${h.CaseNumber} — ${h.CaseTitle}`);
      lines.push(`  Court: ${h.CourtName ?? 'N/A'} | Date: ${h.NextHearingDate ?? 'N/A'} | Counsel: ${h.ExternalCounselName ?? 'N/A'}`);
    });
    lines.push('');
  }

  if (data.upcomingHearings.length) {
    lines.push('UPCOMING HEARINGS (4–7 days)');
    lines.push('----------------------------------');
    data.upcomingHearings.forEach(h => {
      lines.push(`Case: ${h.CaseNumber} — ${h.CaseTitle}`);
      lines.push(`  Court: ${h.CourtName ?? 'N/A'} | Date: ${h.NextHearingDate ?? 'N/A'} | Counsel: ${h.ExternalCounselName ?? 'N/A'}`);
    });
    lines.push('');
  }

  if (data.expiringContracts.length) {
    lines.push('EXPIRING CONTRACTS (next 30 days)');
    lines.push('----------------------------------');
    data.expiringContracts.forEach(c => {
      lines.push(`${c.ContractTitle} — ${c.FirstParty} / ${c.SecondParty}`);
      lines.push(`  Expiry: ${c.DateOfExpiry ?? 'N/A'} (${c.DaysLeft} days left)`);
    });
    lines.push('');
  }

  if (data.expiringIP.length) {
    lines.push('IP RENEWALS DUE (next 90 days)');
    lines.push('----------------------------------');
    data.expiringIP.forEach(ip => {
      lines.push(`${ip.IPTitle} [${ip.Category}]`);
      lines.push(`  Expiry: ${ip.DateOfExpiry ?? 'N/A'} (${ip.DaysLeft} days left)`);
    });
    lines.push('');
  }

  lines.push('--');
  lines.push('Gatronova Legal Management Portal — Confidential');
  return lines.join('\n');
}

function buildHTML(data: ReminderPayload): string {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const total = data.criticalHearings.length + data.upcomingHearings.length +
                data.expiringContracts.length + data.expiringIP.length;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0">
<tr><td align="center">
<table width="700" cellpadding="0" cellspacing="0" style="max-width:700px;width:100%">

  <tr><td style="background:linear-gradient(135deg,#1D1C55 0%,#0c0c20 100%);border-radius:10px 10px 0 0;padding:28px 32px">
    <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px">GATRONOVA GROUP · LEGAL DEPARTMENT</div>
    <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:4px">Legal Portal — Daily Reminder</div>
    <div style="font-size:12px;color:#64748b;margin-bottom:14px">${today}</div>
    ${total > 0
      ? `<span style="background:rgba(239,68,68,.2);border:1px solid rgba(239,68,68,.4);border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700;color:#fca5a5">${total} item${total !== 1 ? 's' : ''} require attention</span>`
      : `<span style="background:rgba(74,222,128,.15);border:1px solid rgba(74,222,128,.3);border-radius:20px;padding:4px 14px;font-size:12px;font-weight:700;color:#4ade80">All clear — no urgent items today</span>`
    }
  </td></tr>

  <tr><td style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px">

    ${total === 0
      ? `<div style="text-align:center;padding:40px 0;color:#9ca3af;font-size:14px">No critical hearings, expiring contracts, or IP renewals due.</div>`
      : ''}

    ${section('🔴 Critical Hearings — Next 3 Days', '#dc2626',
      ['Case No.', 'Case Title', 'Court', 'Hearing Date', 'Counsel'],
      hearingRows(data.criticalHearings))}

    ${section('🟡 Upcoming Hearings — 4 to 7 Days', '#d97706',
      ['Case No.', 'Case Title', 'Court', 'Hearing Date', 'Counsel'],
      hearingRows(data.upcomingHearings))}

    ${section('🟠 Contracts Expiring — Next 30 Days', '#ea580c',
      ['Contract', 'First Party', 'Second Party', 'Expiry Date', 'Urgency'],
      contractRows(data.expiringContracts))}

    ${section('💡 IP Renewals Due — Next 90 Days', '#7c3aed',
      ['IP Title', 'Type', 'Expiry Date', 'Urgency'],
      ipRows(data.expiringIP))}

    <div style="margin-top:24px;padding-top:18px;border-top:1px solid #f0f0f0;font-size:11px;color:#9ca3af;text-align:center">
      Gatronova Legal Management Portal &middot; Automated Reminder &middot; Confidential<br>Generated on ${today}
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

export async function sendReminderEmail(payload: ReminderPayload, overrideTo?: string): Promise<string> {
  const to = overrideTo || process.env.REMINDER_TO || process.env.EMAIL_USER!;
  const total = payload.criticalHearings.length + payload.upcomingHearings.length +
                payload.expiringContracts.length + payload.expiringIP.length;
  const today = new Date().toLocaleDateString('en-GB');

  const transporter = createTransporter();

  // verify SMTP credentials before attempting to send
  await transporter.verify();

  const textBody = buildPlainText(payload, today, total);

  await transporter.sendMail({
    from: `"Gatronova Legal Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject: total > 0
      ? `Legal Reminder: ${total} item${total !== 1 ? 's' : ''} require attention - ${today}`
      : `Legal Portal Daily Update - ${today}`,
    text: textBody,
    html: buildHTML(payload),
  });

  return to;
}
