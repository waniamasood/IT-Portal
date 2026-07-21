import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'External' | 'Internal' | null (all)

    const lawyers = await prisma.lawyer.findMany({
      where: type ? { LawyerType: type } : undefined,
      orderBy: { LawyerName: 'asc' },
    });

    return NextResponse.json({ lawyers });
  } catch (err) {
    console.error('Lawyers GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch lawyers' }, { status: 500 });
  }
}
