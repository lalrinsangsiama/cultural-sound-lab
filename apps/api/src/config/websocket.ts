import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { supabase } from '@/config/supabase';
import { logger } from '@/config/logger';
import { redis } from '@/config/redis';

export interface SocketUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

interface Socket {
  id: string;
  user?: SocketUser;
  emit(event: string, ...args: any[]): boolean;
  on(event: string, listener: (...args: any[]) => void): this;
  join(rooms: string | string[]): this;
  leave(room: string): this;
  disconnect(): this;
}

class WebSocketService {
  private io: SocketServer | null = null;
  private readonly CORS_ORIGINS: string[];
  private readonly JWT_SECRET: string;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> socketIds
  
  constructor() {
    this.CORS_ORIGINS = process.env.NODE_ENV === 'production'
      ? (process.env.ALLOWED_ORIGINS || '').split(',')
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  }

  /**
   * Initialize WebSocket server
   */
  public init(server: Server): void {
    this.io = new SocketServer(server, {
      cors: {
        origin: this.CORS_ORIGINS,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('WebSocket server initialized');
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    if (!this.io) return;

    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          throw new Error('No authentication token provided');
        }

        // Verify JWT token
        const decoded = jwt.verify(token, this.JWT_SECRET) as any;
        
        // Get user from database
        const { data: user, error } = await supabase
          .from('profiles')
          .select('id, email, role')
          .eq('id', decoded.sub)
          .single();

        if (error || !user) {
          throw new Error('User not found');
        }

        socket.user = {
          id: user.id,
          email: user.email,
          role: user.role || 'user',
        };

        next();
      } catch (error) {
        logger.warn({ error, socketId: socket.id }, 'WebSocket authentication failed');
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: any) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    if (!socket.user) return;

    const userId = socket.user.id;
    const socketId = socket.id;

    // Track connected user
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socketId);

    // Join user-specific room
    socket.join(`user:${userId}`);
    
    // Join admin room if user is admin
    if (socket.user.role === 'admin') {
      socket.join('admin');
    }

    logger.info({
      userId,
      socketId,
      email: socket.user.email,
      role: socket.user.role,
    }, 'User connected via WebSocket');

    // Send connection acknowledgment
    socket.emit('connected', {
      message: 'Connected successfully',
      user: socket.user,
      timestamp: new Date().toISOString(),
    });

    // Handle generation progress subscription
    socket.on('subscribe:generation', (generationId: string) => {
      socket.join(`generation:${generationId}`);
      logger.debug({ userId, generationId }, 'Subscribed to generation updates');
    });

    // Handle generation progress unsubscription
    socket.on('unsubscribe:generation', (generationId: string) => {
      socket.leave(`generation:${generationId}`);
      logger.debug({ userId, generationId }, 'Unsubscribed from generation updates');
    });

    // Handle queue monitoring subscription (admin only)
    socket.on('subscribe:queue', () => {
      if (socket.user?.role === 'admin') {
        socket.join('queue:monitoring');
        logger.debug({ userId }, 'Subscribed to queue monitoring');
      } else {
        socket.emit('error', { message: 'Insufficient permissions for queue monitoring' });
      }
    });

    // Handle system monitoring subscription (admin only)
    socket.on('subscribe:system', () => {
      if (socket.user?.role === 'admin') {
        socket.join('system:monitoring');
        logger.debug({ userId }, 'Subscribed to system monitoring');
      } else {
        socket.emit('error', { message: 'Insufficient permissions for system monitoring' });
      }
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle client errors
    socket.on('error', (error) => {
      logger.error({ userId, socketId, error }, 'WebSocket client error');
    });
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socket: AuthenticatedSocket, reason: string): void {
    if (!socket.user) return;

    const userId = socket.user.id;
    const socketId = socket.id;

    // Remove from connected users tracking
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }

    logger.info({
      userId,
      socketId,
      reason,
    }, 'User disconnected from WebSocket');
  }

  /**
   * Emit generation progress update to specific user
   */
  public emitGenerationProgress(generationId: string, userId: string, progress: {
    status: string;
    progress: number;
    message?: string;
    result_url?: string;
    error?: string;
  }): void {
    if (!this.io) return;

    const payload = {
      generationId,
      ...progress,
      timestamp: new Date().toISOString(),
    };

    // Emit to user-specific room
    this.io.to(`user:${userId}`).emit('generation:progress', payload);
    
    // Emit to generation-specific room
    this.io.to(`generation:${generationId}`).emit('generation:progress', payload);

    logger.debug({ generationId, userId, progress }, 'Emitted generation progress');
  }

  /**
   * Emit queue statistics to admin users
   */
  public emitQueueStats(stats: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }): void {
    if (!this.io) return;

    const payload = {
      ...stats,
      timestamp: new Date().toISOString(),
    };

    this.io.to('queue:monitoring').emit('queue:stats', payload);
    logger.debug({ stats }, 'Emitted queue stats to admins');
  }

  /**
   * Emit system health update to admin users
   */
  public emitSystemHealth(health: {
    memory: any;
    cpu?: any;
    uptime: number;
    connections: number;
  }): void {
    if (!this.io) return;

    const payload = {
      ...health,
      timestamp: new Date().toISOString(),
    };

    this.io.to('system:monitoring').emit('system:health', payload);
    logger.debug({ health }, 'Emitted system health to admins');
  }

  /**
   * Broadcast notification to all connected users
   */
  public broadcastNotification(notification: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    data?: any;
  }): void {
    if (!this.io) return;

    const payload = {
      ...notification,
      timestamp: new Date().toISOString(),
    };

    this.io.emit('notification', payload);
    logger.info({ notification }, 'Broadcasted notification to all users');
  }

  /**
   * Send notification to specific user
   */
  public notifyUser(userId: string, notification: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    data?: any;
  }): void {
    if (!this.io) return;

    const payload = {
      ...notification,
      timestamp: new Date().toISOString(),
    };

    this.io.to(`user:${userId}`).emit('notification', payload);
    logger.debug({ userId, notification }, 'Sent notification to user');
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected sockets count
   */
  public getConnectedSocketsCount(): number {
    let totalSockets = 0;
    this.connectedUsers.forEach(sockets => {
      totalSockets += sockets.size;
    });
    return totalSockets;
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get WebSocket server instance
   */
  public getIO(): SocketServer | null {
    return this.io;
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    if (!this.io) return;

    logger.info('Shutting down WebSocket server...');
    
    // Notify all connected clients
    this.io.emit('server:shutdown', {
      message: 'Server is shutting down',
      timestamp: new Date().toISOString(),
    });

    // Close all connections
    this.io.close();
    this.connectedUsers.clear();
    
    logger.info('WebSocket server shut down');
  }
}

export const webSocketService = new WebSocketService();