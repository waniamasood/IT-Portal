import { NextRequest, NextResponse } from 'next/server';
import { getPool, sql } from '@/app/lib/db';

export async function GET(req: NextRequest) {
  try {
    const pool = await getPool();
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');

    let query = `
      SELECT 
        h.HearingID, h.CaseID, h.HearingDate,
        h.PreviousHearingDate, h.Proceedings, h.CreatedAt,
        c.CaseTitle, c.CaseNumber
      FROM Hearings h
      JOIN Cases c ON h.CaseID = c.CaseID
      WHERE 1=1
    `;

    const request = pool.request();
    if (caseId) {
      query += ` AND h.CaseID = @caseId`;
      request.input('caseId', sql.Int, parseInt(caseId));
    }

    query += ` ORDER BY h.HearingDate ASC`;
    const result = await request.query(query);
    return NextResponse.json({ hearings: result.recordset });

  } catch (err) {
    console.error('Hearings API error:', err);
    return NextResponse.json({ error: 'Failed to fetch hearings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const pool = await getPool();
    const { caseId, hearingDate, previousHearingDate, proceedings } = await req.json();

    await pool.request()
      .input('CaseID',              sql.Int,      caseId)
      .input('HearingDate',         sql.Date,     hearingDate)
      .input('PreviousHearingDate', sql.Date,     previousHearingDate || null)
      .input('Proceedings',         sql.NVarChar, proceedings || null)
      .query(`
        INSERT INTO Hearings (CaseID, HearingDate, PreviousHearingDate, Proceedings)
        VALUES (@CaseID, @HearingDate, @PreviousHearingDate, @Proceedings)
      `);

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (err) {
    console.error('Hearings POST error:', err);
    return NextResponse.json({ error: 'Failed to create hearing' }, { status: 500 });
  }
}