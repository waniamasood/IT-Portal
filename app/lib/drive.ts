import { google } from 'googleapis';
import { Readable } from 'stream';

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
}

export async function uploadToDrive(
  filename: string,
  mimeType: string,
  buffer: Buffer,
): Promise<DriveUploadResult> {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error('Google Drive not configured. Add GOOGLE_SERVICE_ACCOUNT_JSON to .env.local');

  const credentials = JSON.parse(json);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const drive = google.drive({ version: 'v3', auth });
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || undefined;

  const res = await drive.files.create({
    requestBody: { name: filename, parents: folderId ? [folderId] : undefined },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id,webViewLink',
  });

  await drive.permissions.create({
    fileId: res.data.id!,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return { fileId: res.data.id!, webViewLink: res.data.webViewLink! };
}
