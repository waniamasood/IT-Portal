import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const departments = await prisma.department.findMany({ orderBy: { DepartmentName: 'asc' } });
    return NextResponse.json({ departments });
  } catch (err) {
    console.error('Departments GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}
