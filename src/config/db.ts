import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

let port: number = +process.env.POSTGRES_PROD_PORT!

console.log('DB_NAME:', process.env.POSTGRES_DB);
console.log('DB_USER:', process.env.POSTGRES_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.POSTGRES_PROD_PORT);



const sequelize = new Sequelize(
    process.env.POSTGRES_DB!,
    process.env.POSTGRES_USER!,
    process.env.DB_PASSWORD,
    {
        // port: process.env.DB_PORT || 5432,
        port: port || 30002,
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT!! as 'postgres' | 'mysql' | 'sqlite' | 'mssql',
        logging: true, // optional
    }
);

export default sequelize;