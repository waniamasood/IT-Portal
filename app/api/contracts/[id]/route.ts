import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { ContractID: Number(params.id) },
      include: {
        Company: true,
        Department: true,
        Category: true,
        ExternalParty: true,
        InternalAssociate: true,
        Attachments: true,
      },
    });

    if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ contract });
  } catch (err) {
    console.error('Contract GET[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { status, remarks, dateOfExpiry } = body;

    const updated = await prisma.contract.update({
      where: { ContractID: Number(params.id) },
      data: {
        Status: status,
        Remarks: remarks,
        DateOfExpiry: dateOfExpiry ? new Date(dateOfExpiry) : undefined,
        UpdatedAt: new Date(),
      },
    });

    return NextResponse.json({ contractId: updated.ContractID });
  } catch (err) {
    console.error('Contract PUT error:', err);
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}
