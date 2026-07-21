import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const [courts, categories, contractCategories, companies, departments, externalLawyers, internalLawyers] =
      await Promise.all([
        prisma.court.findMany({ orderBy: { CourtName: 'asc' } }),
        prisma.litigationCategory.findMany({ orderBy: { CategoryName: 'asc' } }),
        prisma.contractCategory.findMany({ orderBy: { CategoryName: 'asc' } }),
        prisma.company.findMany({ orderBy: { CompanyName: 'asc' } }),
        prisma.department.findMany({ orderBy: { DepartmentName: 'asc' } }),
        prisma.lawyer.findMany({ where: { LawyerType: 'External' }, orderBy: { LawyerName: 'asc' } }),
        prisma.lawyer.findMany({ where: { LawyerType: 'Internal' }, orderBy: { LawyerName: 'asc' } }),
      ]);

    return NextResponse.json({
      courts,
      categories,
      contractCategories,
      companies,
      departments,
      externalLawyers,
      internalLawyers,
    });
  } catch (err) {
    console.error('Lookups error:', err);
    return NextResponse.json({ error: 'Failed to fetch lookups' }, { status: 500 });
  }
}
