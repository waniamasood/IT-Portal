import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const today = new Date();
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);

    const [total, pending, disposed, hearingsUpcoming, hearingsCritical] = await Promise.all([
      prisma.case.count(),
      prisma.case.count({ where: { Status: 'Pending' } }),
      prisma.case.count({ where: { Status: 'Disposed' } }),
      prisma.case.count({
        where: { NextHearingDate: { gte: today, lte: in7Days } },
      }),
      prisma.case.count({
        where: { NextHearingDate: { gte: today, lte: in3Days } },
      }),
    ]);

    const totalAmount = await prisma.case.aggregate({ _sum: { AmountInvolved: true } });
    const totalCost = await prisma.case.aggregate({ _sum: { ProfessionalCost: true } });

    return NextResponse.json({
      total,
      pending,
      disposed,
      hearingsUpcoming,
      hearingsCritical,
      totalAmountInvolved: Number(totalAmount._sum.AmountInvolved ?? 0),
      totalProfessionalCost: Number(totalCost._sum.ProfessionalCost ?? 0),
    });
  } catch (err) {
    console.error('litigation-stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
