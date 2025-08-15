import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { ethers } from 'ethers';

// Tipos de seguridad
export interface SecurityConfig {
  rateLimits: {
    global: RateLimitConfig;
    auth: RateLimitConfig;
    api: RateLimitConfig;
    admin: RateLimitConfig;
  };
  blacklist: {
    addresses: Set<string>;
    ips: Set<string>;
    patterns: RegExp[];
  };
  audit: {
    enabled: boolean;
    logLevel: 'info' | 'warn' | 'error';
    sensitiveEndpoints: string[];
    excludePaths: string[];
  };
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface AuditLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  userId?: string;
  ip: string;
  userAgent: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  requestBody?: any;
  responseBody?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface BlacklistEntry {
  type: 'address' | 'ip' | 'pattern';
  value: string;
  reason: string;
  addedBy: string;
  addedAt: Date;
  expiresAt?: Date;
}

// Clase principal de gestión de seguridad
export class SecurityManager {
  private config: SecurityConfig;
  private auditLogs: AuditLog[] = [];
  private blacklist: Map<string, BlacklistEntry> = new Map();
  private rateLimiters: Map<string, any> = new Map();

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      rateLimits: {
        global: { windowMs: 60 * 1000, max: 100 },
        auth: { windowMs: 15 * 60 * 1000, max: 5 },
        api: { windowMs: 60 * 1000, max: 30 },
        admin: { windowMs: 60 * 1000, max: 10 }
      },
      blacklist: {
        addresses: new Set(),
        ips: new Set(),
        patterns: []
      },
      audit: {
        enabled: true,
        logLevel: 'info',
        sensitiveEndpoints: ['/auth/*', '/admin/*', '/users/me/*'],
        excludePaths: ['/healthz', '/favicon.ico']
      },
      ...config
    };

    this.initializeRateLimiters();
    this.loadBlacklist();
  }

  // Inicializar rate limiters
  private initializeRateLimiters() {
    Object.entries(this.config.rateLimits).forEach(([name, config]) => {
      this.rateLimiters.set(name, rateLimit({
        windowMs: config.windowMs,
        max: config.max,
        message: config.message || `Rate limit exceeded for ${name}`,
        standardHeaders: config.standardHeaders ?? true,
        legacyHeaders: config.legacyHeaders ?? false,
        skipSuccessfulRequests: config.skipSuccessfulRequests ?? false,
        skipFailedRequests: config.skipFailedRequests ?? false,
        keyGenerator: (req) => {
          // Usar IP + User Agent para mejor identificación
          return `${req.ip}-${req.get('User-Agent')?.slice(0, 50) || 'unknown'}`;
        },
        handler: (req, res) => {
          this.logAudit('warn', req, res, {
            type: 'rate_limit_exceeded',
            limitType: name,
            limit: config.max,
            windowMs: config.windowMs
          });
          res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil(config.windowMs / 1000),
            limit: config.max,
            windowMs: config.windowMs
          });
        }
      }));
    });
  }

  // Middleware de rate limiting
  getRateLimiter(type: keyof SecurityConfig['rateLimits']) {
    return this.rateLimiters.get(type);
  }

  // Middleware de blacklist
  blacklistMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;
    const address = req.body?.address || req.params?.address;

    // Verificar IP en blacklist
    if (this.isBlacklisted('ip', ip)) {
      this.logAudit('warn', req, res, {
        type: 'blacklisted_ip',
        ip,
        reason: this.getBlacklistReason('ip', ip)
      });
      return res.status(403).json({
        error: 'Access denied',
        reason: 'IP address is blacklisted'
      });
    }

    // Verificar dirección en blacklist
    if (address && this.isBlacklisted('address', address)) {
      this.logAudit('warn', req, res, {
        type: 'blacklisted_address',
        address,
        reason: this.getBlacklistReason('address', address)
      });
      return res.status(403).json({
        error: 'Access denied',
        reason: 'Wallet address is blacklisted'
      });
    }

    // Verificar patrones
    const path = req.path;
    if (this.matchesBlacklistPattern(path)) {
      this.logAudit('warn', req, res, {
        type: 'blacklisted_pattern',
        path,
        pattern: this.getMatchingPattern(path)
      });
      return res.status(403).json({
        error: 'Access denied',
        reason: 'Request pattern is blacklisted'
      });
    }

    next();
  };

  // Middleware de auditoría
  auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!this.config.audit.enabled) {
      return next();
    }

    // Verificar si es un endpoint sensible
    const isSensitive = this.config.audit.sensitiveEndpoints.some(pattern => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(req.path);
    });

    // Verificar si debe ser excluido
    const isExcluded = this.config.audit.excludePaths.some(path => req.path === path);

    if (isExcluded) {
      return next();
    }

    const startTime = Date.now();
    const originalSend = res.send;

    // Interceptar respuesta
    res.send = function(body) {
      const responseTime = Date.now() - startTime;
      
      // Log de auditoría
      this.logAudit(
        res.statusCode >= 400 ? 'error' : 'info',
        req,
        res,
        {
          responseTime,
          requestBody: isSensitive ? this.sanitizeBody(req.body) : undefined,
          responseBody: isSensitive ? this.sanitizeBody(body) : undefined
        }
      );

      return originalSend.call(this, body);
    }.bind(this);

    next();
  };

  // Middleware de validación de JWT
  jwtValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      this.logAudit('warn', req, res, { type: 'missing_token' });
      return res.status(401).json({ error: 'Token requerido' });
    }

    try {
      // Verificar si el token está en blacklist
      if (this.isBlacklisted('token', token)) {
        this.logAudit('warn', req, res, { type: 'blacklisted_token' });
        return res.status(401).json({ error: 'Token inválido' });
      }

      // Aquí se verificaría el JWT (implementado en el middleware principal)
      next();
    } catch (error) {
      this.logAudit('error', req, res, { type: 'token_validation_error', error: error.message });
      return res.status(401).json({ error: 'Token inválido' });
    }
  };

  // Métodos de blacklist
  addToBlacklist(type: 'address' | 'ip' | 'pattern', value: string, reason: string, addedBy: string, expiresAt?: Date) {
    const entry: BlacklistEntry = {
      type,
      value,
      reason,
      addedBy,
      addedAt: new Date(),
      expiresAt
    };

    this.blacklist.set(`${type}:${value}`, entry);
    
    if (type === 'address') {
      this.config.blacklist.addresses.add(value.toLowerCase());
    } else if (type === 'ip') {
      this.config.blacklist.ips.add(value);
    } else if (type === 'pattern') {
      this.config.blacklist.patterns.push(new RegExp(value));
    }

    this.saveBlacklist();
    this.logAudit('info', null, null, {
      type: 'blacklist_added',
      entryType: type,
      value,
      reason,
      addedBy
    });
  }

  removeFromBlacklist(type: 'address' | 'ip' | 'pattern', value: string) {
    const key = `${type}:${value}`;
    const entry = this.blacklist.get(key);
    
    if (entry) {
      this.blacklist.delete(key);
      
      if (type === 'address') {
        this.config.blacklist.addresses.delete(value.toLowerCase());
      } else if (type === 'ip') {
        this.config.blacklist.ips.delete(value);
      } else if (type === 'pattern') {
        this.config.blacklist.patterns = this.config.blacklist.patterns.filter(
          pattern => pattern.source !== value
        );
      }

      this.saveBlacklist();
      this.logAudit('info', null, null, {
        type: 'blacklist_removed',
        entryType: type,
        value,
        removedBy: 'system'
      });
    }
  }

  isBlacklisted(type: 'address' | 'ip' | 'pattern' | 'token', value: string): boolean {
    const key = `${type}:${value}`;
    const entry = this.blacklist.get(key);
    
    if (!entry) return false;
    
    // Verificar expiración
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.removeFromBlacklist(type, value);
      return false;
    }
    
    return true;
  }

  getBlacklistReason(type: 'address' | 'ip' | 'pattern' | 'token', value: string): string {
    const key = `${type}:${value}`;
    const entry = this.blacklist.get(key);
    return entry?.reason || 'Unknown';
  }

  matchesBlacklistPattern(path: string): boolean {
    return this.config.blacklist.patterns.some(pattern => pattern.test(path));
  }

  getMatchingPattern(path: string): string {
    const matchingPattern = this.config.blacklist.patterns.find(pattern => pattern.test(path));
    return matchingPattern?.source || '';
  }

  // Métodos de auditoría
  logAudit(level: 'info' | 'warn' | 'error', req: Request | null, res: Response | null, metadata?: Record<string, any>) {
    if (!this.config.audit.enabled) return;

    const logEntry: AuditLog = {
      timestamp: new Date().toISOString(),
      level,
      userId: req?.user?.sub || req?.body?.address,
      ip: req?.ip || 'unknown',
      userAgent: req?.get('User-Agent') || 'unknown',
      method: req?.method || 'unknown',
      path: req?.path || 'unknown',
      statusCode: res?.statusCode || 0,
      responseTime: metadata?.responseTime || 0,
      requestBody: metadata?.requestBody,
      responseBody: metadata?.responseBody,
      error: metadata?.error,
      metadata
    };

    this.auditLogs.push(logEntry);

    // Mantener solo los últimos 1000 logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    // Log a consola
    const logMessage = `[AUDIT] ${level.toUpperCase()}: ${logEntry.method} ${logEntry.path} - ${logEntry.ip} - ${logEntry.userId || 'anonymous'}`;
    console[level](logMessage, metadata);
  }

  // Métodos de utilidad
  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sensitiveFields = ['password', 'token', 'secret', 'privateKey', 'mnemonic'];
    const sanitized = JSON.parse(JSON.stringify(body));
    
    const sanitizeObject = (obj: any) => {
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }

  private loadBlacklist() {
    try {
      // En producción, esto cargaría desde una base de datos
      // Por ahora, usamos un archivo JSON
      const fs = require('fs');
      const path = require('path');
      const blacklistPath = path.join(__dirname, '../../data/blacklist.json');
      
      if (fs.existsSync(blacklistPath)) {
        const data = JSON.parse(fs.readFileSync(blacklistPath, 'utf8'));
        data.forEach((entry: BlacklistEntry) => {
          this.blacklist.set(`${entry.type}:${entry.value}`, {
            ...entry,
            addedAt: new Date(entry.addedAt),
            expiresAt: entry.expiresAt ? new Date(entry.expiresAt) : undefined
          });
        });
      }
    } catch (error) {
      console.warn('No se pudo cargar blacklist:', error.message);
    }
  }

  private saveBlacklist() {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(__dirname, '../../data');
      const blacklistPath = path.join(dataDir, 'blacklist.json');
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const data = Array.from(this.blacklist.values());
      fs.writeFileSync(blacklistPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error guardando blacklist:', error);
    }
  }

  // Métodos de consulta
  getAuditLogs(limit: number = 100, offset: number = 0): AuditLog[] {
    return this.auditLogs.slice(offset, offset + limit);
  }

  getBlacklistEntries(): BlacklistEntry[] {
    return Array.from(this.blacklist.values());
  }

  getSecurityStats() {
    const now = new Date();
    const last24h = now.getTime() - 24 * 60 * 60 * 1000;
    
    const recentLogs = this.auditLogs.filter(log => 
      new Date(log.timestamp).getTime() > last24h
    );

    return {
      totalLogs: this.auditLogs.length,
      logsLast24h: recentLogs.length,
      blacklistEntries: this.blacklist.size,
      rateLimiters: Object.keys(this.config.rateLimits),
      errorsLast24h: recentLogs.filter(log => log.level === 'error').length,
      warningsLast24h: recentLogs.filter(log => log.level === 'warn').length
    };
  }

  // Métodos de limpieza
  cleanupExpiredEntries() {
    const now = new Date();
    const expiredKeys: string[] = [];
    
    this.blacklist.forEach((entry, key) => {
      if (entry.expiresAt && entry.expiresAt < now) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => {
      const [type, value] = key.split(':');
      this.removeFromBlacklist(type as any, value);
    });
  }
}

// Instancia global
export const securityManager = new SecurityManager();

// Middleware de limpieza automática
setInterval(() => {
  securityManager.cleanupExpiredEntries();
}, 60 * 60 * 1000); // Cada hora
