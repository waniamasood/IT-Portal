import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const companies = await prisma.company.findMany({ orderBy: { CompanyName: 'asc' } });
    return NextResponse.json({ companies });
  } catch (err) {
    console.error('Companies GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}
