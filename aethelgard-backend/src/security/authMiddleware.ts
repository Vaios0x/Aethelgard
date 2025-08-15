import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { securityManager } from './securityManager';

// Extender la interfaz Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        typ: string;
        iat: number;
        exp: number;
      };
    }
  }
}

export interface JWTPayload {
  sub: string;
  typ: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export class AuthMiddleware {
  private jwtSecret: string;
  private accessTokenTTL: number;

  constructor(jwtSecret: string, accessTokenTTL: number = 3600) {
    this.jwtSecret = jwtSecret;
    this.accessTokenTTL = accessTokenTTL;
  }

  // Middleware de autenticación principal
  authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        securityManager.logAudit('warn', req, res, { type: 'missing_auth_header' });
        return res.status(401).json({ error: 'Token de autorización requerido' });
      }

      const token = authHeader.replace('Bearer ', '');
      
      if (!token) {
        securityManager.logAudit('warn', req, res, { type: 'empty_token' });
        return res.status(401).json({ error: 'Token vacío' });
      }

      // Verificar si el token está en blacklist
      if (securityManager.isBlacklisted('token', token)) {
        securityManager.logAudit('warn', req, res, { type: 'blacklisted_token' });
        return res.status(401).json({ error: 'Token inválido' });
      }

      // Verificar y decodificar JWT
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      
      // Validaciones adicionales
      if (decoded.typ !== 'access') {
        securityManager.logAudit('warn', req, res, { type: 'invalid_token_type', tokenType: decoded.typ });
        return res.status(401).json({ error: 'Tipo de token inválido' });
      }

      if (decoded.exp < Date.now() / 1000) {
        securityManager.logAudit('warn', req, res, { type: 'expired_token' });
        return res.status(401).json({ error: 'Token expirado' });
      }

      // Verificar si la dirección está en blacklist
      if (securityManager.isBlacklisted('address', decoded.sub)) {
        securityManager.logAudit('warn', req, res, { 
          type: 'blacklisted_user', 
          address: decoded.sub 
        });
        return res.status(403).json({ error: 'Usuario bloqueado' });
      }

      // Asignar usuario al request
      req.user = decoded;
      
      // Log de acceso exitoso
      securityManager.logAudit('info', req, res, { 
        type: 'successful_auth',
        userId: decoded.sub
      });

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        securityManager.logAudit('warn', req, res, { 
          type: 'jwt_validation_error',
          error: error.message 
        });
        return res.status(401).json({ error: 'Token inválido' });
      }
      
      if (error instanceof jwt.TokenExpiredError) {
        securityManager.logAudit('warn', req, res, { type: 'token_expired' });
        return res.status(401).json({ error: 'Token expirado' });
      }

      securityManager.logAudit('error', req, res, { 
        type: 'auth_error',
        error: error.message 
      });
      return res.status(500).json({ error: 'Error de autenticación' });
    }
  };

  // Middleware para roles específicos
  requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Autenticación requerida' });
      }

      // Aquí se implementaría la lógica de roles
      // Por ahora, verificamos si el usuario tiene permisos de admin
      const isAdmin = req.user.sub === process.env.ADMIN_ADDRESS;
      
      if (roles.includes('admin') && !isAdmin) {
        securityManager.logAudit('warn', req, res, { 
          type: 'insufficient_permissions',
          userId: req.user.sub,
          requiredRoles: roles
        });
        return res.status(403).json({ error: 'Permisos insuficientes' });
      }

      next();
    };
  };

  // Middleware para verificar propiedad de recursos
  requireOwnership = (resourceType: string, resourceIdParam: string = 'id') => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Autenticación requerida' });
      }

      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({ error: 'ID de recurso requerido' });
      }

      // Aquí se implementaría la verificación de propiedad
      // Por ahora, permitimos acceso si el usuario está autenticado
      // En producción, se verificaría contra la base de datos
      
      securityManager.logAudit('info', req, res, { 
        type: 'resource_access',
        userId: req.user.sub,
        resourceType,
        resourceId
      });

      next();
    };
  };

  // Middleware para rate limiting específico por usuario
  userRateLimit = (maxRequests: number, windowMs: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next();
      }

      const userId = req.user.sub;
      const key = `user:${userId}`;
      
      // Implementación básica de rate limiting por usuario
      // En producción, usar Redis o similar
      const now = Date.now();
      const userRequests = (global as any).userRequests || new Map();
      
      if (!userRequests.has(key)) {
        userRequests.set(key, { count: 0, resetTime: now + windowMs });
      }
      
      const userData = userRequests.get(key);
      
      if (now > userData.resetTime) {
        userData.count = 0;
        userData.resetTime = now + windowMs;
      }
      
      userData.count++;
      
      if (userData.count > maxRequests) {
        securityManager.logAudit('warn', req, res, { 
          type: 'user_rate_limit_exceeded',
          userId,
          count: userData.count,
          maxRequests
        });
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((userData.resetTime - now) / 1000)
        });
      }
      
      (global as any).userRequests = userRequests;
      next();
    };
  };

  // Middleware para validación de entrada
  validateInput = (schema: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const { error } = schema.validate(req.body);
        
        if (error) {
          securityManager.logAudit('warn', req, res, { 
            type: 'validation_error',
            error: error.details[0].message 
          });
          return res.status(400).json({ 
            error: 'Datos de entrada inválidos',
            details: error.details[0].message 
          });
        }
        
        next();
      } catch (error) {
        securityManager.logAudit('error', req, res, { 
          type: 'validation_error',
          error: error.message 
        });
        return res.status(500).json({ error: 'Error de validación' });
      }
    };
  };

  // Middleware para sanitización de entrada
  sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitizar body
      if (req.body) {
        req.body = this.sanitizeObject(req.body);
      }
      
      // Sanitizar query params
      if (req.query) {
        req.query = this.sanitizeObject(req.query);
      }
      
      // Sanitizar params
      if (req.params) {
        req.params = this.sanitizeObject(req.params);
      }
      
      next();
    } catch (error) {
      securityManager.logAudit('error', req, res, { 
        type: 'sanitization_error',
        error: error.message 
      });
      return res.status(500).json({ error: 'Error de sanitización' });
    }
  };

  // Método para sanitizar objetos
  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    const sanitized: any = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Sanitizar strings
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursión para objetos anidados
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Método para sanitizar strings
  private sanitizeString(str: string): string {
    return str
      .replace(/[<>]/g, '') // Remover < y >
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, '') // Remover event handlers
      .trim();
  }

  // Método para generar tokens
  generateTokens(address: string): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(
      { 
        sub: address, 
        typ: 'access' 
      },
      this.jwtSecret,
      { expiresIn: this.accessTokenTTL }
    );

    const refreshToken = jwt.sign(
      { 
        sub: address, 
        typ: 'refresh' 
      },
      this.jwtSecret,
      { expiresIn: '30d' }
    );

    return { accessToken, refreshToken };
  }

  // Método para invalidar token (agregar a blacklist)
  invalidateToken(token: string, reason: string = 'Manual invalidation') {
    securityManager.addToBlacklist('token', token, reason, 'system');
  }
}

// Instancia global
export const authMiddleware = new AuthMiddleware(
  process.env.JWT_SECRET || 'dev-secret',
  Number(process.env.ACCESS_TTL_SEC || 3600)
);
