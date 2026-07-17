import { NextRequest, NextResponse } from 'next/server';
import { getPool, sql } from '@/app/lib/db';

export async function GET(req: NextRequest) {
  try {
    const pool = await getPool();
    const { searchParams } = new URL(req.url);

    const court    = searchParams.get('court');
    const category = searchParams.get('category');
    const status   = searchParams.get('status');
    const search   = searchParams.get('search');

    let query = `
      SELECT 
        c.CaseID,
        c.CaseNumber,
        c.CaseTitle,
        c.Status,
        c.ByOrAgainst,
        c.DateOfInstitution,
        c.AmountInvolved,
        c.ProfessionalFees,
        c.Remarks,
        c.CreatedAt,
        co.CourtName,
        cat.CategoryName,
        ec.CounselName,
        ec.FirmName,
        c.InternalAssociateName,
        (SELECT TOP 1 HearingDate 
         FROM Hearings h 
         WHERE h.CaseID = c.CaseID 
         ORDER BY HearingDate DESC) AS LastHearingDate,
        (SELECT TOP 1 HearingDate 
         FROM Hearings h 
         WHERE h.CaseID = c.CaseID 
         AND h.HearingDate >= CAST(GETDATE() AS DATE)
         ORDER BY HearingDate ASC) AS NextHearingDate
      FROM Cases c
      LEFT JOIN Courts co      ON c.CourtID    = co.CourtID
      LEFT JOIN Categories cat ON c.CategoryID = cat.CategoryID
      LEFT JOIN ExternalCounsel ec ON c.CounselID = ec.CounselID
      WHERE 1=1
    `;

    const inputs: { name: string; type: any; value: any }[] = [];

    if (court) {
      query += ` AND co.CourtName = @court`;
      inputs.push({ name: 'court', type: sql.NVarChar, value: court });
    }
    if (category) {
      query += ` AND cat.CategoryName = @category`;
      inputs.push({ name: 'category', type: sql.NVarChar, value: category });
    }
    if (status) {
      query += ` AND c.Status = @status`;
      inputs.push({ name: 'status', type: sql.NVarChar, value: status });
    }
    if (search) {
      query += ` AND (c.CaseTitle LIKE @search OR c.CaseNumber LIKE @search OR ec.CounselName LIKE @search)`;
      inputs.push({ name: 'search', type: sql.NVarChar, value: `%${search}%` });
    }

    query += ` ORDER BY c.CreatedAt DESC`;

    const request = pool.request();
    inputs.forEach(i => request.input(i.name, i.type, i.value));

    const result = await request.query(query);
    return NextResponse.json({ cases: result.recordset });

  } catch (err) {
    console.error('Cases API error:', err);
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const pool = await getPool();
    const body = await req.json();

    const {
      caseTitle, caseNumber, courtId, categoryId, counselId,
      internalAssociateName, caseSummary, byOrAgainst,
      dateOfInstitution, amountInvolved, status,
      professionalFees, remarks
    } = body;

    const result = await pool.request()
      .input('CaseTitle',            sql.NVarChar, caseTitle)
      .input('CaseNumber',           sql.NVarChar, caseNumber)
      .input('CourtID',              sql.Int,      courtId)
      .input('CategoryID',           sql.Int,      categoryId)
      .input('CounselID',            sql.Int,      counselId || null)
      .input('InternalAssociateName',sql.NVarChar, internalAssociateName || null)
      .input('CaseSummary',          sql.NVarChar, caseSummary || null)
      .input('ByOrAgainst',          sql.NVarChar, byOrAgainst)
      .input('DateOfInstitution',    sql.Date,     dateOfInstitution || null)
      .input('AmountInvolved',       sql.Decimal,  amountInvolved || null)
      .input('Status',               sql.NVarChar, status || 'Pending')
      .input('ProfessionalFees',     sql.Decimal,  professionalFees || null)
      .input('Remarks',              sql.NVarChar, remarks || null)
      .query(`
        INSERT INTO Cases (
          CaseTitle, CaseNumber, CourtID, CategoryID, CounselID,
          InternalAssociateName, CaseSummary, ByOrAgainst,
          DateOfInstitution, AmountInvolved, Status,
          ProfessionalFees, Remarks
        )
        OUTPUT INSERTED.CaseID
        VALUES (
          @CaseTitle, @CaseNumber, @CourtID, @CategoryID, @CounselID,
          @InternalAssociateName, @CaseSummary, @ByOrAgainst,
          @DateOfInstitution, @AmountInvolved, @Status,
          @ProfessionalFees, @Remarks
        )
      `);

    return NextResponse.json({ caseId: result.recordset[0].CaseID }, { status: 201 });

  } catch (err) {
    console.error('Cases POST error:', err);
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}