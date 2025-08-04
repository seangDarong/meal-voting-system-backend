import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Expense Tracker API',
            version: '1.0.0',
            description: 'API for expense tracker',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Category: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string', example: 'Food' },
                        color: { type: 'string', example: '#ff0000' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    }
                },
                CategoryInput: {
                    type: 'object',
                    required: ['name', 'color'],
                    properties: {
                        name: { type: 'string', example: 'Services' },
                        color: { type: 'string', example: '#00ffcc' },
                    }
                },
                Record: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        title: { type: 'string', example: 'Grocery Shopping' },
                        date: { type: 'string', format: 'date', example: '2025-07-21' },
                        currency: { type: 'string', enum: ['USD', 'KHR'], example: 'USD' },
                        amount: { type: 'number', format: 'float', example: 25.50 },
                        note: { type: 'string', example: 'Weekly grocery expenses' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    }
                },
                RecordInput: {
                    type: 'object',
                    required: ['title', 'date', 'currency', 'amount'],
                    properties: {
                        title: { type: 'string', example: 'Grocery Shopping' },
                        date: { type: 'string', format: 'date', example: '2025-07-21' },
                        currency: { type: 'string', enum: ['USD', 'KHR'], example: 'USD' },
                        amount: { type: 'number', format: 'float', example: 25.50 },
                        note: { type: 'string', example: 'Weekly grocery expenses' },
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },

    apis: ['controllers/*.js', 'routes/*.js'],

};

const swaggerSpec = swaggerJSDoc(options);

export const serveSwagger = swaggerUi.serve;
export const setupSwagger = swaggerUi.setup(swaggerSpec);