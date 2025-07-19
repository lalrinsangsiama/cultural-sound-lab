import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  received?: any;
}

export interface ValidatedRequest<
  TBody = any,
  TQuery = any,
  TParams = any
> extends Request {
  body: TBody;
  query: TQuery & any;
  params: TParams & any;
}

// Transform Zod errors into a more user-friendly format
const formatZodError = (error: ZodError): ValidationError[] => {
  return error.issues.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    received: err.code === 'invalid_type' ? (err as any).received : undefined,
  }));
};

// Generic validation middleware factory
export const validate = <
  TBody = any,
  TQuery = any,
  TParams = any
>(schemas: {
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
  params?: ZodSchema<TParams>;
}) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void | Response => {
    const errors: ValidationError[] = [];

    try {
      // Validate request body
      if (schemas.body) {
        const bodyResult = schemas.body.safeParse(req.body);
        if (!bodyResult.success) {
          errors.push(...formatZodError(bodyResult.error));
        } else {
          req.body = bodyResult.data;
        }
      }

      // Validate query parameters
      if (schemas.query) {
        const queryResult = schemas.query.safeParse(req.query);
        if (!queryResult.success) {
          errors.push(...formatZodError(queryResult.error));
        } else {
          (req as any).query = queryResult.data;
        }
      }

      // Validate route parameters
      if (schemas.params) {
        const paramsResult = schemas.params.safeParse(req.params);
        if (!paramsResult.success) {
          errors.push(...formatZodError(paramsResult.error));
        } else {
          (req as any).params = paramsResult.data;
        }
      }

      // If there are validation errors, return 400
      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Request validation failed',
          statusCode: 400,
          timestamp: new Date().toISOString(),
          details: {
            errors,
            validationCount: errors.length,
          },
        });
      }

      next();
    } catch (error) {
      // Handle unexpected validation errors
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during request validation',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  };
};

// Legacy methods for backward compatibility
export const validateRequest = (schema: z.ZodSchema) => validate({ body: schema });
export const validateQuery = (schema: z.ZodSchema) => validate({ query: schema });
export const validateParams = (schema: z.ZodSchema) => validate({ params: schema });

// Specific validation middleware for common patterns
export const validateBody = <T>(schema: ZodSchema<T>) => validate({ body: schema });

// File validation middleware for multipart uploads
export const validateFile = (
  fileSchema: ZodSchema,
  options: {
    required?: boolean;
    fieldName?: string;
  } = {}
) => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const { required = true, fieldName = 'audio' } = options;
    const file = req.file || (req.files as any)?.[fieldName];

    if (required && !file) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `File upload is required for field: ${fieldName}`,
        statusCode: 400,
        timestamp: new Date().toISOString(),
        details: {
          errors: [{
            field: fieldName,
            message: 'File is required',
            code: 'missing_file',
          }],
        },
      });
    }

    if (file) {
      const result = fileSchema.safeParse(file);
      if (!result.success) {
        const errors = formatZodError(result.error);
        return res.status(400).json({
          error: 'Validation Error',
          message: 'File validation failed',
          statusCode: 400,
          timestamp: new Date().toISOString(),
          details: {
            errors,
            validationCount: errors.length,
          },
        });
      }
    }

    next();
  };
};

// Response validation middleware (for development/testing)
export const validateResponse = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    if (process.env.NODE_ENV === 'development') {
      const originalJson = res.json;
      
      res.json = function(data: any) {
        const result = schema.safeParse(data);
        if (!result.success) {
          console.warn('Response validation failed:', {
            path: req.path,
            method: req.method,
            errors: formatZodError(result.error),
          });
        }
        return originalJson.call(this, data);
      };
    }
    
    next();
  };
};

// Middleware to sanitize and transform request data
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Remove null bytes and control characters from strings
  const sanitizeString = (str: string): string => {
    return str.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body, query, and params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};