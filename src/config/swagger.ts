import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zipline Fulfillment System API',
      version: '1.0.0',
      description:
        'A lightweight inventory management and order processing system for medical supply fulfillment',
      contact: {
        name: 'API Support',
        email: 'support@zipline.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.zipline.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            data: {
              type: 'object',
              nullable: true,
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            error: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Success message',
            },
            data: {
              type: 'object',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            product_id: {
              type: 'integer',
              example: 0,
            },
            product_name: {
              type: 'string',
              example: 'RBC A+ Adult',
            },
            mass_g: {
              type: 'integer',
              example: 700,
              description: 'Product mass in grams',
            },
          },
          required: ['product_id', 'product_name', 'mass_g'],
          example: {
            product_id: 0,
            product_name: 'RBC A+ Adult',
            mass_g: 700,
          },
        },
        Order: {
          type: 'object',
          properties: {
            order_id: {
              type: 'integer',
              example: 123,
            },
            requested: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_id: {
                    type: 'integer',
                    example: 0,
                  },
                  quantity: {
                    type: 'integer',
                    example: 2,
                  },
                },
                required: ['product_id', 'quantity'],
              },
            },
          },
          required: ['order_id', 'requested'],
          example: {
            order_id: 123,
            requested: [
              {
                product_id: 0,
                quantity: 2,
              },
              {
                product_id: 1,
                quantity: 1,
              },
            ],
          },
        },
        Restock: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product_id: {
                type: 'integer',
                example: 0,
              },
              quantity: {
                type: 'integer',
                example: 30,
              },
            },
            required: ['product_id', 'quantity'],
          },
          example: [
            {
              product_id: 0,
              quantity: 30,
            },
            {
              product_id: 1,
              quantity: 25,
            },
          ],
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
          },
          example: {
            id: 1,
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        AuthCredentials: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'SecurePassword123!',
            },
          },
          required: ['email', 'password'],
          example: {
            email: 'john.doe@example.com',
            password: 'SecurePassword123!',
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints',
      },
      {
        name: 'Fulfillment',
        description: 'Order fulfillment and inventory management',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);