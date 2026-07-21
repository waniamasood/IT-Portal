import { NextResponse } from 'next/server';
import { getPool } from '@/app/lib/db';

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        FORMAT(DateOfInstitution, 'MMM yyyy') AS month,
        YEAR(DateOfInstitution) AS yr,
        MONTH(DateOfInstitution) AS mo,
        COUNT(*) AS total,
        SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN Status = 'Disposed' THEN 1 ELSE 0 END) AS disposed
      FROM Cases
      WHERE DateOfInstitution IS NOT NULL
        AND DateOfInstitution >= DATEADD(YEAR, -2, GETDATE())
      GROUP BY FORMAT(DateOfInstitution, 'MMM yyyy'), YEAR(DateOfInstitution), MONTH(DateOfInstitution)
      ORDER BY yr, mo
    `);
    return NextResponse.json({ data: result.recordset });
  } catch (err) {
    console.error('litigation-monthly error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
