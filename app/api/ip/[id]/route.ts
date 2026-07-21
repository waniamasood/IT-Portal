import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const record = await prisma.iPRecord.findUnique({
      where: { IPID: Number(params.id) },
      include: {
        Company: true,
        ExternalCounsel: true,
        InternalAssociate: true,
        Attachments: true,
      },
    });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ record });
  } catch (err) {
    console.error('IP GET[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch IP record' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status, remarks } = await req.json();
    const updated = await prisma.iPRecord.update({
      where: { IPID: Number(params.id) },
      data: { Status: status, Remarks: remarks, UpdatedAt: new Date() },
    });
    return NextResponse.json({ ipId: updated.IPID });
  } catch (err) {
    console.error('IP PUT error:', err);
    return NextResponse.json({ error: 'Failed to update IP record' }, { status: 500 });
  }
}
