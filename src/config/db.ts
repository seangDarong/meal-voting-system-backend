import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

let port: number = +process.env.DB_PORT!

const sequelize = new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USER!,
    process.env.DB_PASSWORD,
    {
        // port: process.env.DB_PORT || 5432,
        port: port || 30002,
        host: process.env.DB_HOST|| "172.29.0.2",
        dialect: process.env.DB_DIALECT!! as 'postgres' | 'mysql' | 'sqlite' | 'mssql',
        logging: true, // optional
    }
);

export default sequelize;