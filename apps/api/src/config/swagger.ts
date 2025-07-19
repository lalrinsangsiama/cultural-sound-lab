import * as swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import * as swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cultural Sound Lab API',
      version: '1.0.0',
      description: 'API for Cultural Sound Lab platform - enabling musicians and cultural communities to monetize traditional and cultural music through AI-powered generation, licensing, and creative tools.',
      contact: {
        name: 'Cultural Sound Lab',
        email: 'support@culturalsoundlab.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.culturalsoundlab.com'
          : 'http://localhost:3001',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            message: {
              type: 'string',
              description: 'Detailed error description',
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp',
            },
          },
          required: ['error', 'statusCode'],
        },
        AudioSample: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the audio sample',
            },
            title: {
              type: 'string',
              description: 'Title of the audio sample',
            },
            description: {
              type: 'string',
              description: 'Description of the audio sample',
            },
            instrument_type: {
              type: 'string',
              description: 'Type of instrument',
            },
            cultural_origin: {
              type: 'string',
              description: 'Cultural origin of the sample',
            },
            usage_rights: {
              type: 'string',
              enum: ['commercial', 'non-commercial', 'attribution'],
              description: 'Usage rights for the sample',
            },
            duration: {
              type: 'number',
              description: 'Duration in seconds',
            },
            file_url: {
              type: 'string',
              format: 'uri',
              description: 'URL to the audio file',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
          required: ['id', 'title', 'instrument_type', 'cultural_origin', 'usage_rights'],
        },
        Generation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the generation',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'User who created the generation',
            },
            type: {
              type: 'string',
              enum: ['sound-logo', 'playlist', 'social-clip', 'long-form'],
              description: 'Type of generation',
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed'],
              description: 'Current status of the generation',
            },
            parameters: {
              type: 'object',
              description: 'Generation parameters',
            },
            result_url: {
              type: 'string',
              format: 'uri',
              description: 'URL to the generated result',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
          required: ['id', 'user_id', 'type', 'status', 'parameters'],
        },
        PaymentIntent: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Payment intent ID',
            },
            amount: {
              type: 'integer',
              description: 'Amount in cents',
            },
            currency: {
              type: 'string',
              description: 'Currency code',
            },
            status: {
              type: 'string',
              description: 'Payment status',
            },
            client_secret: {
              type: 'string',
              description: 'Client secret for frontend processing',
            },
          },
          required: ['id', 'amount', 'currency', 'status'],
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ok', 'degraded', 'unhealthy'],
              description: 'Overall system status',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Health check timestamp',
            },
            uptime: {
              type: 'number',
              description: 'Server uptime in seconds',
            },
            environment: {
              type: 'string',
              description: 'Current environment',
            },
            database: {
              type: 'boolean',
              description: 'Database connection status',
            },
            redis: {
              type: 'boolean',
              description: 'Redis connection status',
            },
          },
          required: ['status', 'timestamp', 'uptime', 'environment', 'database', 'redis'],
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Unauthorized',
                message: 'Authentication token is missing or invalid',
                statusCode: 401,
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions to access this resource',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Forbidden',
                message: 'Insufficient permissions to access this resource',
                statusCode: 403,
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Not Found',
                message: 'The requested resource was not found',
                statusCode: 404,
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Validation Error',
                message: 'Request validation failed',
                statusCode: 400,
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Internal Server Error',
                message: 'An unexpected error occurred',
                statusCode: 500,
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check and system status endpoints',
      },
      {
        name: 'Audio',
        description: 'Audio sample management and browsing',
      },
      {
        name: 'Generation',
        description: 'AI music generation endpoints',
      },
      {
        name: 'Payment',
        description: 'Payment processing and billing',
      },
      {
        name: 'License',
        description: 'Licensing and usage rights management',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/index.ts',
  ],
};

const specs = swaggerJsdoc.default(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Cultural Sound Lab API Documentation',
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  }));
  
  // Serve raw OpenAPI spec
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export { specs };