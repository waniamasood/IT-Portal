import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { uploadToDrive } from '@/app/lib/drive';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const attachments = await prisma.iPAttachment.findMany({
      where: { IPID: Number(params.id) },
      orderBy: { UploadedAt: 'desc' },
    });
    return NextResponse.json({ attachments });
  } catch (err) {
    console.error('IP attachments GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as string | null;

    if (!file || !documentType) {
      return NextResponse.json({ error: 'file and documentType are required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { fileId, webViewLink } = await uploadToDrive(file.name, file.type || 'application/octet-stream', buffer);

    await prisma.iPAttachment.deleteMany({
      where: { IPID: Number(params.id), DocumentType: documentType },
    });

    const att = await prisma.iPAttachment.create({
      data: {
        IPID:          Number(params.id),
        DocumentType:  documentType,
        DriveFileID:   fileId,
        DriveFileLink: webViewLink,
      },
    });

    return NextResponse.json({ attachment: att }, { status: 201 });
  } catch (err: any) {
    console.error('IP attachment POST error:', err);
    return NextResponse.json({ error: err?.message ?? 'Upload failed' }, { status: 500 });
  }
}
