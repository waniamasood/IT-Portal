import { NextResponse } from 'next/server';
import { getPool } from '@/app/lib/db';

export async function GET() {
  try {
    const pool = await getPool();

    const [courts, categories, counsel] = await Promise.all([
      pool.request().query(`SELECT CourtID, CourtName FROM Courts ORDER BY CourtName`),
      pool.request().query(`SELECT CategoryID, CategoryName FROM Categories ORDER BY CategoryName`),
      pool.request().query(`SELECT CounselID, CounselName, FirmName FROM ExternalCounsel ORDER BY CounselName`),
    ]);

    return NextResponse.json({
      courts:     courts.recordset,
      categories: categories.recordset,
      counsel:    counsel.recordset,
    });
  } catch (err) {
    console.error('Lookups API error:', err);
    return NextResponse.json({ error: 'Failed to fetch lookups' }, { status: 500 });
  }
}
