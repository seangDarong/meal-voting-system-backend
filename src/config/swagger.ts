import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Meal Voting API',
            version: '1.0.0',
            description: 'API for managing meal voting system',
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
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'User unique identifier'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'User email address'
                        },
                        password: {
                            type: 'string',
                            description: 'User password (hashed)'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'staff', 'voter'],
                            description: 'User role'
                        },
                        isVerified: {
                            type: 'boolean',
                            description: 'Email verification status'
                        },
                        isActive: {
                            type: 'boolean',
                            description: 'Account active status'
                        },
                        verificationToken: {
                            type: 'string',
                            description: 'Email verification token'
                        },
                        verificationExpires: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Verification token expiry date'
                        },
                        resetPasswordToken: {
                            type: 'string',
                            description: 'Password reset token'
                        },
                        resetPasswordExpires: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Password reset token expiry date'
                        },
                        expectedGraduationDate: {
                            type: 'string',
                            format: 'date',
                            description: 'Expected graduation date'
                        },
                        microsoftId: {
                            type: 'string',
                            description: 'Microsoft account identifier'
                        },
                        displayName: {
                            type: 'string',
                            description: 'Display name from Microsoft'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Category: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Category unique identifier'
                        },
                        name: {
                            type: 'string',
                            description: 'Category name in English'
                        },
                        name_kh: {
                            type: 'string',
                            description: 'Category name in Khmer'
                        },
                        description: {
                            type: 'string',
                            description: 'Category description in English'
                        },
                        description_kh: {
                            type: 'string',
                            description: 'Category description in Khmer'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Dish: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Dish unique identifier'
                        },
                        name: {
                            type: 'string',
                            description: 'Dish name in English'
                        },
                        name_kh: {
                            type: 'string',
                            description: 'Dish name in Khmer'
                        },
                        imageURL: {
                            type: 'string',
                            description: 'Dish image URL'
                        },
                        ingredient: {
                            type: 'string',
                            description: 'Dish ingredients in English'
                        },
                        ingredient_kh: {
                            type: 'string',
                            description: 'Dish ingredients in Khmer'
                        },
                        description: {
                            type: 'string',
                            description: 'Dish description in English'
                        },
                        description_kh: {
                            type: 'string',
                            description: 'Dish description in Khmer'
                        },
                        userId: {
                            type: 'string',
                            format: 'uuid',
                            description: 'ID of user who created the dish'
                        },
                        categoryId: {
                            type: 'integer',
                            description: 'Category ID'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Vote: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Vote unique identifier'
                        },
                        userId: {
                            type: 'string',
                            format: 'uuid',
                            description: 'ID of user who voted'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                VotePoll: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Vote poll unique identifier'
                        },
                        voteDate: {
                            type: 'string',
                            format: 'date',
                            description: 'Date when voting takes place'
                        },
                        mealDate: {
                            type: 'string',
                            format: 'date',
                            description: 'Date for the meal'
                        },
                        userId: {
                            type: 'string',
                            format: 'uuid',
                            description: 'ID of user who created the poll'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                CandidateDish: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Candidate dish unique identifier'
                        },
                        isSelected: {
                            type: 'boolean',
                            description: 'Whether the dish is selected for voting'
                        },
                        dishId: {
                            type: 'integer',
                            description: 'ID of the dish'
                        },
                        votePollId: {
                            type: 'integer',
                            description: 'ID of the vote poll'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                WishList: {
                    type: 'object',
                    properties: {
                        userId: {
                            type: 'string',
                            format: 'uuid',
                            description: 'User ID (primary key)'
                        },
                        dishId: {
                            type: 'integer',
                            description: 'Dish ID in the wishlist'
                        },
                        lastModified: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Last modification date'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                VoteHistory: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Vote history unique identifier'
                        },
                        votedDate: {
                            type: 'string',
                            format: 'date',
                            description: 'Date when the vote was cast'
                        },
                        dishId: {
                            type: 'integer',
                            description: 'ID of the voted dish'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Feedback: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Feedback unique identifier'
                        },
                        content: {
                            type: 'string',
                            description: 'Feedback content'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                CandidateDishHistory: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Candidate dish history unique identifier'
                        },
                        voteCount: {
                            type: 'integer',
                            description: 'Number of votes received'
                        },
                        isSelected: {
                            type: 'boolean',
                            description: 'Whether the dish was selected'
                        },
                        dishId: {
                            type: 'integer',
                            description: 'ID of the dish'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            description: 'Error message'
                        },
                        error: {
                            type: 'string',
                            description: 'Error description'
                        }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            description: 'Success message'
                        },
                        data: {
                            type: 'object',
                            description: 'Response data'
                        }
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
