import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { sendReminderEmail, ReminderPayload } from '@/app/lib/mailer';

const fmt = (d: Date | null | undefined) =>
  d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

const daysTo = (d: Date | null | undefined) =>
  d ? Math.ceil((d.getTime() - Date.now()) / 86400000) : 9999;

// GET — returns counts for the dashboard notification bell
export async function GET() {
  try {
    const today = new Date();
    const in3  = new Date(today); in3.setDate(today.getDate() + 3);
    const in7  = new Date(today); in7.setDate(today.getDate() + 7);
    const in30 = new Date(today); in30.setDate(today.getDate() + 30);
    const in90 = new Date(today); in90.setDate(today.getDate() + 90);

    const [criticalHearings, upcomingHearings, expiringContracts, expiringIP] = await Promise.all([
      prisma.case.count({ where: { Status: 'Pending', NextHearingDate: { gte: today, lte: in3 } } }),
      prisma.case.count({ where: { Status: 'Pending', NextHearingDate: { gt: in3,  lte: in7 } } }),
      prisma.contract.count({ where: { Status: 'Ongoing', DateOfExpiry: { gte: today, lte: in30 } } }),
      prisma.iPRecord.count({ where: { Status: 'Active',  DateOfExpiry: { gte: today, lte: in90 } } }),
    ]);

    return NextResponse.json({ criticalHearings, upcomingHearings, expiringContracts, expiringIP });
  } catch (err) {
    console.error('Reminders GET error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST — fetches all alert data and sends the reminder email
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const overrideTo: string | undefined = body?.to?.trim() || undefined;
    const today = new Date();
    const in3  = new Date(today); in3.setDate(today.getDate() + 3);
    const in7  = new Date(today); in7.setDate(today.getDate() + 7);
    const in30 = new Date(today); in30.setDate(today.getDate() + 30);
    const in90 = new Date(today); in90.setDate(today.getDate() + 90);

    const [critRaw, upRaw, contractRaw, ipRaw] = await Promise.all([
      // Critical hearings: next 3 days
      prisma.case.findMany({
        where: { Status: 'Pending', NextHearingDate: { gte: today, lte: in3 } },
        include: {
          Court: { select: { CourtName: true } },
          ExternalCounsel: { select: { LawyerName: true } },
        },
        orderBy: { NextHearingDate: 'asc' },
      }),
      // Upcoming hearings: 4–7 days
      prisma.case.findMany({
        where: { Status: 'Pending', NextHearingDate: { gt: in3, lte: in7 } },
        include: {
          Court: { select: { CourtName: true } },
          ExternalCounsel: { select: { LawyerName: true } },
        },
        orderBy: { NextHearingDate: 'asc' },
      }),
      // Expiring contracts: next 30 days
      prisma.contract.findMany({
        where: { Status: 'Ongoing', DateOfExpiry: { gte: today, lte: in30 } },
        orderBy: { DateOfExpiry: 'asc' },
      }),
      // Expiring IP: next 90 days
      prisma.iPRecord.findMany({
        where: { Status: 'Active', DateOfExpiry: { gte: today, lte: in90 } },
        orderBy: { DateOfExpiry: 'asc' },
      }),
    ]);

    const payload: ReminderPayload = {
      criticalHearings: critRaw.map(c => ({
        CaseNumber: c.CaseNumber,
        CaseTitle: c.CaseTitle,
        CourtName: c.Court?.CourtName ?? null,
        NextHearingDate: fmt(c.NextHearingDate ?? undefined),
        ExternalCounselName: c.ExternalCounsel?.LawyerName ?? null,
      })),
      upcomingHearings: upRaw.map(c => ({
        CaseNumber: c.CaseNumber,
        CaseTitle: c.CaseTitle,
        CourtName: c.Court?.CourtName ?? null,
        NextHearingDate: fmt(c.NextHearingDate ?? undefined),
        ExternalCounselName: c.ExternalCounsel?.LawyerName ?? null,
      })),
      expiringContracts: contractRaw.map(c => ({
        ContractTitle: c.ContractTitle,
        FirstParty: c.FirstParty,
        SecondParty: c.SecondParty,
        DateOfExpiry: fmt(c.DateOfExpiry ?? undefined),
        DaysLeft: daysTo(c.DateOfExpiry ?? undefined),
      })),
      expiringIP: ipRaw.map(ip => ({
        IPTitle: ip.IPTitle,
        Category: ip.Category,
        DateOfExpiry: fmt(ip.DateOfExpiry ?? undefined),
        DaysLeft: daysTo(ip.DateOfExpiry ?? undefined),
      })),
    };

    const sentTo = await sendReminderEmail(payload, overrideTo);
    const total  = payload.criticalHearings.length + payload.upcomingHearings.length +
                   payload.expiringContracts.length + payload.expiringIP.length;

    return NextResponse.json({ sent: true, to: sentTo, itemCount: total });
  } catch (err: any) {
    console.error('Reminders POST error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Failed to send reminder email' },
      { status: 500 }
    );
  }
}
