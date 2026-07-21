import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const today = new Date();
    const in90Days = new Date(today);
    in90Days.setDate(in90Days.getDate() + 90);
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    const [total, active, expired, expiringSoon, expiringCritical] = await Promise.all([
      prisma.iPRecord.count(),
      prisma.iPRecord.count({ where: { Status: 'Active' } }),
      prisma.iPRecord.count({ where: { Status: 'Expired' } }),
      prisma.iPRecord.count({
        where: { DateOfExpiry: { gte: today, lte: in90Days } },
      }),
      prisma.iPRecord.count({
        where: { DateOfExpiry: { gte: today, lte: in30Days } },
      }),
    ]);

    const [trademarks, patents, copyrights] = await Promise.all([
      prisma.iPRecord.count({ where: { Category: 'Trademark' } }),
      prisma.iPRecord.count({ where: { Category: 'Patent' } }),
      prisma.iPRecord.count({ where: { Category: 'Copyright' } }),
    ]);

    return NextResponse.json({
      total, active, expired, expiringSoon, expiringCritical,
      trademarks, patents, copyrights,
    });
  } catch (err) {
    console.error('ip-stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
