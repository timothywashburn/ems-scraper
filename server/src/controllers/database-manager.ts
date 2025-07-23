import mysql from 'mysql2/promise';

export default class DatabaseManager {
    private static instance: DatabaseManager;
    private connection: mysql.Connection | null = null;

    private constructor() {}

    async connect(): Promise<void> {
        try {
            if (!process.env.MYSQL_HOST) throw new Error('MYSQL_HOST environment variable is required');
            if (!process.env.MYSQL_PORT) throw new Error('MYSQL_PORT environment variable is required');
            if (!process.env.MYSQL_USER) throw new Error('MYSQL_USER environment variable is required');
            if (!process.env.MYSQL_PASSWORD) throw new Error('MYSQL_PASSWORD environment variable is required');
            if (!process.env.MYSQL_DATABASE) throw new Error('MYSQL_DATABASE environment variable is required');

            const config = {
                host: process.env.MYSQL_HOST,
                port: parseInt(process.env.MYSQL_PORT),
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DATABASE,
            };

            this.connection = await mysql.createConnection(config);
            console.log('MySQL connected successfully');

            await this.testConnection();
        } catch (error) {
            console.error('MySQL connection error:', error);
            process.exit(1);
        }
    }

    private async testConnection(): Promise<void> {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            const [rows] = await this.connection.execute('SELECT 1 as test');
            console.log('MySQL connection test successful');
        } catch (error) {
            throw new Error('MySQL connection test failed');
        }
    }

    async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            const [rows] = await this.connection.execute(sql, params);
            return rows as T[];
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async close(): Promise<void> {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
            console.log('MySQL connection closed');
        }
    }

    static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
}