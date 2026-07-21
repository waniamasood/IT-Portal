import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const court = searchParams.get('court');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (court) where.Court = { CourtName: court };
    if (category) where.Category = { CategoryName: category };
    if (status) where.Status = status;
    if (search) {
      where.OR = [
        { CaseTitle: { contains: search } },
        { CaseNumber: { contains: search } },
        { ExternalCounsel: { LawyerName: { contains: search } } },
      ];
    }

    const cases = await prisma.case.findMany({
      where,
      include: {
        Court: { select: { CourtName: true } },
        Category: { select: { CategoryName: true } },
        ExternalCounsel: { select: { LawyerName: true, FirmName: true } },
        InternalAssociate: { select: { LawyerName: true } },
      },
      orderBy: { CreatedAt: 'desc' },
    });

    const mapped = cases.map((c) => ({
      CaseID: c.CaseID,
      CaseNumber: c.CaseNumber,
      CaseTitle: c.CaseTitle,
      Status: c.Status,
      ByAgainst: c.ByAgainst,
      CourtName: c.Court?.CourtName ?? null,
      CategoryName: c.Category?.CategoryName ?? null,
      ExternalCounselName: c.ExternalCounsel?.LawyerName ?? null,
      ExternalCounselFirm: c.ExternalCounsel?.FirmName ?? null,
      InternalAssociateName: c.InternalAssociate?.LawyerName ?? null,
      DateOfInstitution: c.DateOfInstitution?.toISOString().split('T')[0] ?? null,
      LastHearingDate: c.LastHearingDate?.toISOString().split('T')[0] ?? null,
      NextHearingDate: c.NextHearingDate?.toISOString().split('T')[0] ?? null,
      HearingStatus: c.HearingStatus,
      AmountInvolved: c.AmountInvolved ? Number(c.AmountInvolved) : null,
      ProfessionalCost: c.ProfessionalCost ? Number(c.ProfessionalCost) : null,
      InterimStayOrder: c.InterimStayOrder,
      Remarks: c.Remarks,
      CreatedAt: c.CreatedAt.toISOString(),
    }));

    return NextResponse.json({ cases: mapped });
  } catch (err) {
    console.error('Cases GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      caseTitle, caseNumber, courtId, categoryId, externalCounselId, internalAssociateId,
      summary, byAgainst, dateOfInstitution, amountInvolved, lastHearingDate,
      nextHearingDate, hearingStatus, interimStayOrder, professionalCost, remarks, status,
    } = body;

    const created = await prisma.case.create({
      data: {
        CaseTitle: caseTitle,
        CaseNumber: caseNumber,
        CourtID: courtId ? Number(courtId) : null,
        CategoryID: categoryId ? Number(categoryId) : null,
        ExternalCounselID: externalCounselId ? Number(externalCounselId) : null,
        InternalAssociateID: internalAssociateId ? Number(internalAssociateId) : null,
        Summary: summary ?? null,
        ByAgainst: byAgainst ?? null,
        DateOfInstitution: dateOfInstitution ? new Date(dateOfInstitution) : null,
        AmountInvolved: amountInvolved ? Number(amountInvolved) : null,
        LastHearingDate: lastHearingDate ? new Date(lastHearingDate) : null,
        NextHearingDate: nextHearingDate ? new Date(nextHearingDate) : null,
        HearingStatus: hearingStatus ?? null,
        InterimStayOrder: interimStayOrder ?? false,
        ProfessionalCost: professionalCost ? Number(professionalCost) : null,
        Remarks: remarks ?? null,
        Status: status ?? 'Pending',
      },
    });

    return NextResponse.json({ caseId: created.CaseID }, { status: 201 });
  } catch (err) {
    console.error('Cases POST error:', err);
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}
