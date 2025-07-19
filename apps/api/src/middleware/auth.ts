import { Request, Response, NextFunction } from 'express';
import { getUserFromToken } from '../config/supabase';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Check if we're in demo mode (explicitly enabled and NOT in production)
  const isDemoMode = process.env.DEMO_MODE === 'true';
  const isProduction = process.env.NODE_ENV === 'production';
  const isSupabaseConfigured = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
  
  // Completely disable demo mode in production environments
  if (isDemoMode && isProduction) {
    console.error('🚨 SECURITY: Demo mode cannot be enabled in production environment');
    return res.status(500).json({
      error: 'Invalid configuration detected'
    });
  }
  
  if (isDemoMode && !isSupabaseConfigured) {
    // Mock user for demo purposes only when explicitly enabled in non-production
    req.user = {
      id: 'demo-user-123',
      email: 'demo@culturalsoundlab.com',
      role: 'user'
    };
    console.warn('⚠️ Demo mode active: Using mock authentication (development only)');
    return next();
  }
  
  if (!isSupabaseConfigured) {
    return res.status(500).json({
      error: 'Authentication service not configured. Please set up Supabase credentials.'
    });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        error: 'No token provided'
      });
    }

    const user = await getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }

    // Attach user info to request object
    req.user = {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role || 'user'
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed'
    });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'User not authenticated'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireContributor = requireRole(['admin', 'cultural_contributor']);
export const requireAuth = authenticateUser;

export { AuthenticatedRequest };