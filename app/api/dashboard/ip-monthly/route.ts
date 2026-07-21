import { NextResponse } from 'next/server';
import { getPool } from '@/app/lib/db';

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        FORMAT(DateOfIssuance, 'MMM yyyy') AS month,
        YEAR(DateOfIssuance) AS yr,
        MONTH(DateOfIssuance) AS mo,
        COUNT(*) AS total,
        SUM(CASE WHEN Category = 'Trademark' THEN 1 ELSE 0 END) AS trademarks,
        SUM(CASE WHEN Category = 'Patent' THEN 1 ELSE 0 END) AS patents,
        SUM(CASE WHEN Category = 'Copyright' THEN 1 ELSE 0 END) AS copyrights
      FROM IPRecords
      WHERE DateOfIssuance IS NOT NULL
        AND DateOfIssuance >= DATEADD(YEAR, -5, GETDATE())
      GROUP BY FORMAT(DateOfIssuance, 'MMM yyyy'), YEAR(DateOfIssuance), MONTH(DateOfIssuance)
      ORDER BY yr, mo
    `);
    return NextResponse.json({ data: result.recordset });
  } catch (err) {
    console.error('ip-monthly error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
