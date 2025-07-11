import { Request, Response, NextFunction } from 'express';
import { getUserFromToken } from '@/config/supabase';

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
  // Check if we're in mock mode (no Supabase configured)
  const isSupabaseConfigured = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
  
  if (!isSupabaseConfigured) {
    // Mock user for demo purposes
    req.user = {
      id: 'demo-user-123',
      email: 'demo@culturalsoundlab.com',
      role: 'user'
    };
    console.log('🎭 Mock auth: Using demo user');
    return next();
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

export { AuthenticatedRequest };