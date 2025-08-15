import { Request, Response } from 'express';
import { securityManager } from './securityManager';

export class SecurityController {
  // Endpoints de blacklist
  async getBlacklist(req: Request, res: Response): Promise<void> {
    try {
      const entries = securityManager.getBlacklistEntries();
      res.json({
        success: true,
        data: {
          entries,
          total: entries.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener blacklist'
      });
    }
  }

  async addToBlacklist(req: Request, res: Response): Promise<void> {
    try {
      const { type, value, reason, expiresAt } = req.body;
      const addedBy = req.user?.sub || 'admin';

      if (!type || !value || !reason) {
        res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos: type, value, reason'
        });
        return;
      }

      if (!['address', 'ip', 'pattern'].includes(type)) {
        res.status(400).json({
          success: false,
          error: 'Tipo inválido. Debe ser: address, ip, o pattern'
        });
        return;
      }

      const expirationDate = expiresAt ? new Date(expiresAt) : undefined;
      
      securityManager.addToBlacklist(
        type as 'address' | 'ip' | 'pattern',
        value,
        reason,
        addedBy,
        expirationDate
      );

      res.json({
        success: true,
        message: `Entrada agregada a blacklist: ${type}:${value}`,
        data: {
          type,
          value,
          reason,
          addedBy,
          expiresAt: expirationDate
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al agregar a blacklist'
      });
    }
  }

  async removeFromBlacklist(req: Request, res: Response): Promise<void> {
    try {
      const { type, value } = req.params;

      if (!type || !value) {
        res.status(400).json({
          success: false,
          error: 'Faltan parámetros: type y value'
        });
        return;
      }

      if (!['address', 'ip', 'pattern'].includes(type)) {
        res.status(400).json({
          success: false,
          error: 'Tipo inválido'
        });
        return;
      }

      securityManager.removeFromBlacklist(
        type as 'address' | 'ip' | 'pattern',
        value
      );

      res.json({
        success: true,
        message: `Entrada removida de blacklist: ${type}:${value}`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al remover de blacklist'
      });
    }
  }

  async checkBlacklist(req: Request, res: Response): Promise<void> {
    try {
      const { type, value } = req.query;

      if (!type || !value) {
        res.status(400).json({
          success: false,
          error: 'Faltan parámetros: type y value'
        });
        return;
      }

      if (!['address', 'ip', 'pattern', 'token'].includes(type as string)) {
        res.status(400).json({
          success: false,
          error: 'Tipo inválido'
        });
        return;
      }

      const isBlacklisted = securityManager.isBlacklisted(
        type as 'address' | 'ip' | 'pattern' | 'token',
        value as string
      );

      const reason = isBlacklisted ? 
        securityManager.getBlacklistReason(
          type as 'address' | 'ip' | 'pattern' | 'token',
          value as string
        ) : null;

      res.json({
        success: true,
        data: {
          type,
          value,
          isBlacklisted,
          reason
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al verificar blacklist'
      });
    }
  }

  // Endpoints de auditoría
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const level = req.query.level as string;
      const userId = req.query.userId as string;
      const ip = req.query.ip as string;
      const path = req.query.path as string;

      let logs = securityManager.getAuditLogs(limit, offset);

      // Filtros adicionales
      if (level) {
        logs = logs.filter(log => log.level === level);
      }
      if (userId) {
        logs = logs.filter(log => log.userId === userId);
      }
      if (ip) {
        logs = logs.filter(log => log.ip === ip);
      }
      if (path) {
        logs = logs.filter(log => log.path.includes(path));
      }

      res.json({
        success: true,
        data: {
          logs,
          total: logs.length,
          limit,
          offset
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener logs de auditoría'
      });
    }
  }

  async getAuditStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = securityManager.getSecurityStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener estadísticas de auditoría'
      });
    }
  }

  // Endpoints de configuración de seguridad
  async getSecurityConfig(req: Request, res: Response): Promise<void> {
    try {
      // Solo mostrar configuración no sensible
      const config = {
        rateLimits: {
          global: { windowMs: 60000, max: 100 },
          auth: { windowMs: 900000, max: 5 },
          api: { windowMs: 60000, max: 30 },
          admin: { windowMs: 60000, max: 10 }
        },
        audit: {
          enabled: true,
          logLevel: 'info',
          sensitiveEndpoints: ['/auth/*', '/admin/*', '/users/me/*'],
          excludePaths: ['/healthz', '/favicon.ico']
        }
      };

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener configuración de seguridad'
      });
    }
  }

  // Endpoints de monitoreo
  async getSecurityHealth(req: Request, res: Response): Promise<void> {
    try {
      const stats = securityManager.getSecurityStats();
      const blacklistEntries = securityManager.getBlacklistEntries();
      
      // Verificar salud del sistema
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats,
        blacklist: {
          total: blacklistEntries.length,
          byType: {
            address: blacklistEntries.filter(e => e.type === 'address').length,
            ip: blacklistEntries.filter(e => e.type === 'ip').length,
            pattern: blacklistEntries.filter(e => e.type === 'pattern').length
          }
        },
        rateLimits: {
          global: 'active',
          auth: 'active',
          api: 'active',
          admin: 'active'
        }
      };

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al obtener estado de salud de seguridad'
      });
    }
  }

  // Endpoints de limpieza
  async cleanupExpiredEntries(req: Request, res: Response): Promise<void> {
    try {
      securityManager.cleanupExpiredEntries();
      
      res.json({
        success: true,
        message: 'Limpieza de entradas expiradas completada'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error durante la limpieza'
      });
    }
  }

  // Endpoints de exportación
  async exportAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const format = req.query.format as string || 'json';
      const logs = securityManager.getAuditLogs(1000, 0); // Últimos 1000 logs

      if (format === 'csv') {
        const csv = this.convertLogsToCSV(logs);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
        res.send(csv);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
        res.json(logs);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al exportar logs'
      });
    }
  }

  async exportBlacklist(req: Request, res: Response): Promise<void> {
    try {
      const format = req.query.format as string || 'json';
      const entries = securityManager.getBlacklistEntries();

      if (format === 'csv') {
        const csv = this.convertBlacklistToCSV(entries);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=blacklist.csv');
        res.send(csv);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=blacklist.json');
        res.json(entries);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error al exportar blacklist'
      });
    }
  }

  // Métodos de utilidad para exportación
  private convertLogsToCSV(logs: any[]): string {
    const headers = ['timestamp', 'level', 'userId', 'ip', 'userAgent', 'method', 'path', 'statusCode', 'responseTime'];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      const row = headers.map(header => {
        const value = log[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  private convertBlacklistToCSV(entries: any[]): string {
    const headers = ['type', 'value', 'reason', 'addedBy', 'addedAt', 'expiresAt'];
    const csvRows = [headers.join(',')];
    
    entries.forEach(entry => {
      const row = headers.map(header => {
        const value = entry[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }
}
