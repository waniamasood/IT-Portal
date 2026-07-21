import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {};

    if (company) where.Company = { CompanyName: company };
    if (status) where.Status = status;
    if (category) where.Category = { CategoryName: category };
    if (search) {
      where.OR = [
        { ContractTitle: { contains: search } },
        { FirstParty: { contains: search } },
        { SecondParty: { contains: search } },
      ];
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        Company: { select: { CompanyName: true } },
        Department: { select: { DepartmentName: true } },
        Category: { select: { CategoryName: true } },
        ExternalParty: { select: { LawyerName: true, FirmName: true } },
        InternalAssociate: { select: { LawyerName: true } },
      },
      orderBy: { CreatedAt: 'desc' },
    });

    const mapped = contracts.map((c) => ({
      ContractID: c.ContractID,
      ContractTitle: c.ContractTitle,
      FirstParty: c.FirstParty,
      SecondParty: c.SecondParty,
      Status: c.Status,
      CompanyName: c.Company?.CompanyName ?? null,
      DepartmentName: c.Department?.DepartmentName ?? null,
      CategoryName: c.Category?.CategoryName ?? null,
      ExternalPartyName: c.ExternalParty?.LawyerName ?? null,
      ExternalPartyFirm: c.ExternalParty?.FirmName ?? null,
      InternalAssociateName: c.InternalAssociate?.LawyerName ?? null,
      DateOfSigning: c.DateOfSigning?.toISOString().split('T')[0] ?? null,
      DateOfExpiry: c.DateOfExpiry?.toISOString().split('T')[0] ?? null,
      EffectiveDate: c.EffectiveDate?.toISOString().split('T')[0] ?? null,
      Remarks: c.Remarks,
      CreatedAt: c.CreatedAt.toISOString(),
    }));

    return NextResponse.json({ contracts: mapped });
  } catch (err) {
    console.error('Contracts GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contractTitle, firstParty, secondParty, summary,
      departmentId, companyId, externalPartyId, internalAssociateId,
      effectiveDate, categoryId, dateOfSigning, dateOfExpiry,
      status, remarks,
    } = body;

    const created = await prisma.contract.create({
      data: {
        ContractTitle: contractTitle,
        FirstParty: firstParty,
        SecondParty: secondParty,
        Summary: summary ?? null,
        DepartmentID: departmentId ? Number(departmentId) : null,
        CompanyID: companyId ? Number(companyId) : null,
        ExternalPartyID: externalPartyId ? Number(externalPartyId) : null,
        InternalAssociateID: internalAssociateId ? Number(internalAssociateId) : null,
        EffectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        CategoryID: categoryId ? Number(categoryId) : null,
        DateOfSigning: dateOfSigning ? new Date(dateOfSigning) : null,
        DateOfExpiry: dateOfExpiry ? new Date(dateOfExpiry) : null,
        Status: status ?? 'Ongoing',
        Remarks: remarks ?? null,
      },
    });

    return NextResponse.json({ contractId: created.ContractID }, { status: 201 });
  } catch (err) {
    console.error('Contracts POST error:', err);
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}
