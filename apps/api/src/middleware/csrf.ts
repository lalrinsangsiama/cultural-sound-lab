import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { redis } from '../config/redis';

interface CSRFRequest extends Request {
  csrfToken?: string;
  session: {
    csrfSecret?: string;
  } & any;
}

const CSRF_TOKEN_LENGTH = 32;
const CSRF_SECRET_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

const generateSecret = (): string => {
  return crypto.randomBytes(CSRF_SECRET_LENGTH).toString('hex');
};

const generateToken = (secret: string): string => {
  const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const hash = crypto.createHmac('sha256', secret).update(token).digest('hex');
  return `${token}.${hash}`;
};

const verifyToken = (token: string, secret: string): boolean => {
  try {
    const [tokenPart, hashPart] = token.split('.');
    if (!tokenPart || !hashPart) return false;
    
    const expectedHash = crypto.createHmac('sha256', secret).update(tokenPart).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hashPart, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
};

const getSecretKey = (req: CSRFRequest): string => {
  const userId = (req as any).user?.id || 'anonymous';
  const userAgent = req.get('User-Agent') || 'unknown';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  return `csrf:${userId}:${crypto.createHash('sha256').update(`${userAgent}:${ip}`).digest('hex')}`;
};

export const csrfMiddleware = () => {
  return async (req: CSRFRequest, res: Response, next: NextFunction) => {
    try {
      const secretKey = getSecretKey(req);
      
      // For safe methods, generate and store CSRF token
      if (SAFE_METHODS.includes(req.method)) {
        let secret = await redis.get(secretKey);
        
        if (!secret) {
          secret = generateSecret();
          await redis.setex(secretKey, CSRF_TOKEN_EXPIRY, secret);
        }
        
        const token = generateToken(secret);
        req.csrfToken = token;
        
        // Add token to response headers for client-side access
        res.setHeader('X-CSRF-Token', token);
        
        return next();
      }
      
      // For state-changing methods, verify CSRF token
      if (STATE_CHANGING_METHODS.includes(req.method)) {
        const token = req.get('X-CSRF-Token') || req.body._csrf || req.query._csrf;
        
        if (!token) {
          return res.status(403).json({
            error: 'CSRF token missing',
            message: 'CSRF token is required for this operation',
            statusCode: 403,
            timestamp: new Date().toISOString()
          });
        }
        
        const secret = await redis.get(secretKey);
        
        if (!secret) {
          return res.status(403).json({
            error: 'CSRF token expired',
            message: 'CSRF token has expired. Please refresh and try again',
            statusCode: 403,
            timestamp: new Date().toISOString()
          });
        }
        
        if (!verifyToken(token, secret)) {
          return res.status(403).json({
            error: 'Invalid CSRF token',
            message: 'CSRF token is invalid',
            statusCode: 403,
            timestamp: new Date().toISOString()
          });
        }
        
        // Regenerate token after successful verification for additional security
        const newSecret = generateSecret();
        await redis.setex(secretKey, CSRF_TOKEN_EXPIRY, newSecret);
        const newToken = generateToken(newSecret);
        res.setHeader('X-CSRF-Token', newToken);
      }
      
      next();
    } catch (error) {
      console.error('CSRF middleware error:', error);
      return res.status(500).json({
        error: 'CSRF protection error',
        message: 'An error occurred during CSRF validation',
        statusCode: 500,
        timestamp: new Date().toISOString()
      });
    }
  };
};

// Middleware to add CSRF token to template context
export const csrfToken = (req: CSRFRequest, res: Response, next: NextFunction) => {
  res.locals.csrfToken = req.csrfToken;
  next();
};

// Route handler to get CSRF token via API
export const getCsrfToken = (req: CSRFRequest, res: Response) => {
  res.json({
    csrfToken: req.csrfToken,
    expiresIn: CSRF_TOKEN_EXPIRY
  });
};

// Additional security middleware to validate origin for state-changing requests
export const originValidation = (allowedOrigins: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (STATE_CHANGING_METHODS.includes(req.method)) {
      const origin = req.get('Origin') || req.get('Referer');
      
      if (!origin) {
        return res.status(403).json({
          error: 'Missing origin',
          message: 'Origin header is required for state-changing requests',
          statusCode: 403,
          timestamp: new Date().toISOString()
        });
      }
      
      const originUrl = new URL(origin);
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed === '*') return true;
        
        try {
          const allowedUrl = new URL(allowed);
          return originUrl.hostname === allowedUrl.hostname &&
                 originUrl.protocol === allowedUrl.protocol &&
                 (allowedUrl.port === '' || originUrl.port === allowedUrl.port);
        } catch {
          return false;
        }
      });
      
      if (!isAllowed) {
        return res.status(403).json({
          error: 'Invalid origin',
          message: 'Request origin is not allowed',
          statusCode: 403,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    next();
  };
};

// Double-submit cookie pattern as alternative CSRF protection
export const doubleSubmitCookie = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (STATE_CHANGING_METHODS.includes(req.method)) {
      const cookieToken = req.cookies?._csrf;
      const headerToken = req.get('X-CSRF-Token');
      
      if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({
          error: 'CSRF validation failed',
          message: 'CSRF tokens do not match',
          statusCode: 403,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // Set CSRF cookie for GET requests
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie('_csrf', token, {
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: CSRF_TOKEN_EXPIRY * 1000
      });
      res.setHeader('X-CSRF-Token', token);
    }
    
    next();
  };
};