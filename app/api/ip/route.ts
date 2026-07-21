import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (company) where.Company = { CompanyName: company };
    if (status) where.Status = status;
    if (category) where.Category = category;
    if (search) {
      where.OR = [
        { IPTitle: { contains: search } },
        { Category: { contains: search } },
      ];
    }

    const records = await prisma.iPRecord.findMany({
      where,
      include: {
        Company: { select: { CompanyName: true } },
        ExternalCounsel: { select: { LawyerName: true, FirmName: true } },
        InternalAssociate: { select: { LawyerName: true } },
      },
      orderBy: { CreatedAt: 'desc' },
    });

    const mapped = records.map((r) => ({
      IPID: r.IPID,
      IPTitle: r.IPTitle,
      Category: r.Category,
      Status: r.Status,
      CompanyName: r.Company?.CompanyName ?? null,
      ExternalCounselName: r.ExternalCounsel?.LawyerName ?? null,
      ExternalCounselFirm: r.ExternalCounsel?.FirmName ?? null,
      InternalAssociateName: r.InternalAssociate?.LawyerName ?? null,
      EffectiveDate: r.EffectiveDate?.toISOString().split('T')[0] ?? null,
      DateOfIssuance: r.DateOfIssuance?.toISOString().split('T')[0] ?? null,
      DateOfExpiry: r.DateOfExpiry?.toISOString().split('T')[0] ?? null,
      ProfessionalFees: r.ProfessionalFees ? Number(r.ProfessionalFees) : null,
      Remarks: r.Remarks,
      CreatedAt: r.CreatedAt.toISOString(),
    }));

    return NextResponse.json({ records: mapped });
  } catch (err) {
    console.error('IP GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch IP records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ipTitle, companyId, category, externalCounselId, internalAssociateId,
      effectiveDate, dateOfIssuance, dateOfExpiry, status, professionalFees, remarks,
    } = body;

    const created = await prisma.iPRecord.create({
      data: {
        IPTitle: ipTitle,
        CompanyID: companyId ? Number(companyId) : null,
        Category: category,
        ExternalCounselID: externalCounselId ? Number(externalCounselId) : null,
        InternalAssociateID: internalAssociateId ? Number(internalAssociateId) : null,
        EffectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        DateOfIssuance: dateOfIssuance ? new Date(dateOfIssuance) : null,
        DateOfExpiry: dateOfExpiry ? new Date(dateOfExpiry) : null,
        Status: status ?? 'Active',
        ProfessionalFees: professionalFees ? Number(professionalFees) : null,
        Remarks: remarks ?? null,
      },
    });

    return NextResponse.json({ ipId: created.IPID }, { status: 201 });
  } catch (err) {
    console.error('IP POST error:', err);
    return NextResponse.json({ error: 'Failed to create IP record' }, { status: 500 });
  }
}
