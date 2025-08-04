import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        port: process.env.DB_PORT || 5432,
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        logging: false, // optional
    }
);

export default sequelize;