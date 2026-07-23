import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const c = await prisma.case.findUnique({
      where: { CaseID: Number(params.id) },
      include: {
        Court: true,
        Category: true,
        ExternalCounsel: true,
        InternalAssociate: true,
        Attachments: { orderBy: { UploadedAt: 'desc' } },
      },
    });
    if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ case: c });
  } catch (err) {
    console.error('Case GET[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const {
      caseTitle, caseNumber, courtId, categoryId, externalCounselId, internalAssociateId,
      summary, byAgainst, dateOfInstitution, amountInvolved, lastHearingDate,
      nextHearingDate, hearingStatus, interimStayOrder, dateOfStayOrder,
      professionalCost, dateOfDisposal, remarks, status,
    } = body;

    const updated = await prisma.case.update({
      where: { CaseID: Number(params.id) },
      data: {
        CaseTitle:           caseTitle,
        CaseNumber:          caseNumber,
        CourtID:             courtId             ? Number(courtId)             : null,
        CategoryID:          categoryId          ? Number(categoryId)          : null,
        ExternalCounselID:   externalCounselId   ? Number(externalCounselId)   : null,
        InternalAssociateID: internalAssociateId ? Number(internalAssociateId) : null,
        Summary:             summary             ?? null,
        ByAgainst:           byAgainst           ?? null,
        DateOfInstitution:   dateOfInstitution   ? new Date(dateOfInstitution) : null,
        AmountInvolved:      amountInvolved      ? Number(amountInvolved)      : null,
        LastHearingDate:     lastHearingDate     ? new Date(lastHearingDate)   : null,
        NextHearingDate:     nextHearingDate     ? new Date(nextHearingDate)   : null,
        HearingStatus:       hearingStatus       ?? null,
        InterimStayOrder:    interimStayOrder    ?? false,
        DateOfStayOrder:     dateOfStayOrder     ? new Date(dateOfStayOrder)   : null,
        ProfessionalCost:    professionalCost    ? Number(professionalCost)    : null,
        DateOfDisposal:      dateOfDisposal      ? new Date(dateOfDisposal)    : null,
        Remarks:             remarks             ?? null,
        Status:              status,
        UpdatedAt:           new Date(),
      },
    });

    return NextResponse.json({ caseId: updated.CaseID });
  } catch (err) {
    console.error('Case PUT error:', err);
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
  }
}
