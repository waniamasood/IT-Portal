import { NextResponse } from 'next/server';
import { getPool } from '@/app/lib/db';

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        FORMAT(DateOfSigning, 'MMM yyyy') AS month,
        YEAR(DateOfSigning) AS yr,
        MONTH(DateOfSigning) AS mo,
        COUNT(*) AS total,
        SUM(CASE WHEN Status = 'Ongoing' THEN 1 ELSE 0 END) AS ongoing,
        SUM(CASE WHEN Status = 'Expired' THEN 1 ELSE 0 END) AS expired
      FROM Contracts
      WHERE DateOfSigning IS NOT NULL
        AND DateOfSigning >= DATEADD(YEAR, -2, GETDATE())
      GROUP BY FORMAT(DateOfSigning, 'MMM yyyy'), YEAR(DateOfSigning), MONTH(DateOfSigning)
      ORDER BY yr, mo
    `);
    return NextResponse.json({ data: result.recordset });
  } catch (err) {
    console.error('contracts-monthly error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
