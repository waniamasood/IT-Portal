import twilio from 'twilio';
import { ReminderPayload } from './mailer';

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set in environment');
  return twilio(sid, token);
}

function asWhatsApp(number: string): string {
  const trimmed = number.trim();
  return trimmed.startsWith('whatsapp:') ? trimmed : `whatsapp:${trimmed}`;
}

function buildMessage(payload: ReminderPayload, today: string, total: number): string {
  if (total === 0) {
    return `*Gatronova Legal Portal*\nDaily Reminder — ${today}\n\nNo urgent items today. All clear.`;
  }

  const lines: string[] = [
    '*Gatronova Legal Portal*',
    `Daily Reminder — ${today}`,
    `${total} item${total !== 1 ? 's' : ''} require attention.`,
    '',
  ];

  if (payload.criticalHearings.length) {
    lines.push('🔴 *Critical Hearings (next 3 days)*');
    payload.criticalHearings.forEach(h => {
      lines.push(`• ${h.CaseNumber} — ${h.CaseTitle}`);
      lines.push(`   ${h.CourtName ?? 'N/A'} | ${h.NextHearingDate ?? 'N/A'}`);
    });
    lines.push('');
  }

  if (payload.upcomingHearings.length) {
    lines.push('🟡 *Upcoming Hearings (4–7 days)*');
    payload.upcomingHearings.forEach(h => {
      lines.push(`• ${h.CaseNumber} — ${h.CaseTitle}`);
      lines.push(`   ${h.CourtName ?? 'N/A'} | ${h.NextHearingDate ?? 'N/A'}`);
    });
    lines.push('');
  }

  if (payload.expiringContracts.length) {
    lines.push('🟠 *Contracts Expiring (next 30 days)*');
    payload.expiringContracts.forEach(c => {
      lines.push(`• ${c.ContractTitle} — ${c.DaysLeft}d left`);
    });
    lines.push('');
  }

  if (payload.expiringIP.length) {
    lines.push('💡 *IP Renewals Due (next 90 days)*');
    payload.expiringIP.forEach(ip => {
      lines.push(`• ${ip.IPTitle} [${ip.Category}] — ${ip.DaysLeft}d left`);
    });
  }

  return lines.join('\n');
}

/**
 * Sends the reminder digest as an outbound WhatsApp message via Twilio.
 * This only ever calls messages.create() (send) — it never reads or lists
 * messages, so the integration has no ability to access WhatsApp inbox content.
 */
export async function sendReminderWhatsApp(payload: ReminderPayload): Promise<string[]> {
  const toRaw = process.env.REMINDER_WHATSAPP_TO;
  if (!toRaw) throw new Error('REMINDER_WHATSAPP_TO not set in environment');

  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) throw new Error('TWILIO_WHATSAPP_FROM not set in environment');

  const recipients = toRaw.split(',').map(n => n.trim()).filter(Boolean);
  if (!recipients.length) throw new Error('REMINDER_WHATSAPP_TO has no valid numbers');

  const total = payload.criticalHearings.length + payload.upcomingHearings.length +
                payload.expiringContracts.length + payload.expiringIP.length;
  const today = new Date().toLocaleDateString('en-GB');
  const body = buildMessage(payload, today, total);

  const client = getClient();
  const fromAddr = asWhatsApp(from);

  await Promise.all(
    recipients.map(to => client.messages.create({ from: fromAddr, to: asWhatsApp(to), body }))
  );

  return recipients;
}
