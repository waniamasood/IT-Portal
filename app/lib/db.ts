import sql from 'mssql';

const config: sql.config = {
    server: process.env.DB_SERVER!,
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
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
