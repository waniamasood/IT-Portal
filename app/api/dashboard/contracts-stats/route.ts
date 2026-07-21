import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const today = new Date();
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    const [total, ongoing, expired, expiringSoon, expiringCritical] = await Promise.all([
      prisma.contract.count(),
      prisma.contract.count({ where: { Status: 'Ongoing' } }),
      prisma.contract.count({ where: { Status: 'Expired' } }),
      prisma.contract.count({
        where: { DateOfExpiry: { gte: today, lte: in30Days } },
      }),
      prisma.contract.count({
        where: { DateOfExpiry: { gte: today, lte: in7Days } },
      }),
    ]);

    return NextResponse.json({ total, ongoing, expired, expiringSoon, expiringCritical });
  } catch (err) {
    console.error('contracts-stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
