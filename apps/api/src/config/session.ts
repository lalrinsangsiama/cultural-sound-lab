import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { queueRedis } from './redis';

// Session configuration
export const sessionConfig: session.SessionOptions = {
  store: process.env.REDIS_URL ? new RedisStore({ client: queueRedis }) : undefined,
  secret: process.env.SESSION_SECRET || 'cultural-sound-lab-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // CSRF protection
  },
  name: 'csl.sid', // Custom session name
};

// Session helper functions
export const sessionHelpers = {
  // Get user ID from session
  getUserId(req: any): string | null {
    return req.session?.userId || null;
  },

  // Set user ID in session
  setUserId(req: any, userId: string): void {
    if (!req.session) {
      throw new Error('Session not initialized');
    }
    req.session.userId = userId;
  },

  // Clear user session
  clearUser(req: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!req.session) {
        resolve();
        return;
      }
      
      req.session.destroy((err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  // Check if user is authenticated
  isAuthenticated(req: any): boolean {
    return !!req.session?.userId;
  },

  // Get session data
  getSessionData(req: any): any {
    return req.session?.data || {};
  },

  // Set session data
  setSessionData(req: any, key: string, value: any): void {
    if (!req.session) {
      throw new Error('Session not initialized');
    }
    if (!req.session.data) {
      req.session.data = {};
    }
    req.session.data[key] = value;
  },

  // Remove session data
  removeSessionData(req: any, key: string): void {
    if (req.session?.data) {
      delete req.session.data[key];
    }
  },

  // Regenerate session ID (for security after login)
  regenerateSession(req: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!req.session) {
        resolve();
        return;
      }
      
      req.session.regenerate((err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};

// Session middleware factory
export const createSessionMiddleware = () => {
  if (!process.env.REDIS_URL) {
    console.warn('⚠️  Redis not configured - using memory store for sessions (not suitable for production)');
  } else {
    console.log('✅ Redis session store configured');
  }
  
  return session(sessionConfig);
};

export default sessionConfig;