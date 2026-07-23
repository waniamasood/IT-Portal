import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { uploadToDrive } from '@/app/lib/drive';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const attachments = await prisma.caseAttachment.findMany({
      where: { CaseID: Number(params.id) },
      orderBy: { UploadedAt: 'desc' },
    });
    return NextResponse.json({ attachments });
  } catch (err) {
    console.error('Case attachments GET error:', err);
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

    // replace existing attachment of the same type if it exists
    await prisma.caseAttachment.deleteMany({
      where: { CaseID: Number(params.id), DocumentType: documentType },
    });

    const att = await prisma.caseAttachment.create({
      data: {
        CaseID:        Number(params.id),
        DocumentType:  documentType,
        DriveFileID:   fileId,
        DriveFileLink: webViewLink,
      },
    });

    return NextResponse.json({ attachment: att }, { status: 201 });
  } catch (err: any) {
    console.error('Case attachment POST error:', err);
    return NextResponse.json({ error: err?.message ?? 'Upload failed' }, { status: 500 });
  }
}
