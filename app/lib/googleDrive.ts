import { google } from 'googleapis';

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID ?? '';

function getAuth() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentials) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set in environment');

  const parsed = JSON.parse(credentials);
  return new google.auth.GoogleAuth({
    credentials: parsed,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

export async function uploadFileToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  subfolder?: string
): Promise<{ fileId: string; webViewLink: string }> {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  let parentId = FOLDER_ID;

  if (subfolder) {
    const folderSearch = await drive.files.list({
      q: `name='${subfolder}' and mimeType='application/vnd.google-apps.folder' and '${FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id)',
    });

    if (folderSearch.data.files?.length) {
      parentId = folderSearch.data.files[0].id!;
    } else {
      const created = await drive.files.create({
        requestBody: {
          name: subfolder,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [FOLDER_ID],
        },
        fields: 'id',
      });
      parentId = created.data.id!;
    }
  }

  const { Readable } = await import('stream');
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const uploaded = await drive.files.create({
    requestBody: { name: filename, parents: [parentId] },
    media: { mimeType, body: stream },
    fields: 'id, webViewLink',
  });

  await drive.permissions.create({
    fileId: uploaded.data.id!,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return {
    fileId: uploaded.data.id!,
    webViewLink: uploaded.data.webViewLink!,
  };
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });
  await drive.files.delete({ fileId });
}
