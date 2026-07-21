import sql from 'mssql';

// If DB_PORT is set, connect via fixed port (SQL Server Browser not needed).
// Otherwise, use instanceName which requires SQL Server Browser service running.
const usePort = !!process.env.DB_PORT;

const config: sql.config = {
    server: process.env.DB_HOST ?? 'localhost',
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    port: usePort ? parseInt(process.env.DB_PORT!) : undefined,
    options: {
        instanceName: usePort ? undefined : process.env.DB_INSTANCE,
        encrypt: false,
        trustServerCertificate: true,
    },
};

const globalWithSql = global as typeof globalThis & {
    _sqlPool?: sql.ConnectionPool;
};

export async function getPool(): Promise<sql.ConnectionPool> {
    if (!globalWithSql._sqlPool) {
        globalWithSql._sqlPool = await new sql.ConnectionPool(config).connect();
    }
    return globalWithSql._sqlPool;
}

export { sql };
