// Security Monitor - Logs de segurança (sem localStorage por segurança)

interface SecurityEvent {
  event_type: 'login_attempt' | 'failed_login' | 'account_lockout' | 'unauthorized_access' | 'data_access';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  timestamp: string;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 100;

  async logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.events.push(securityEvent);
    
    // Keep only last MAX_EVENTS in memory
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Log to console in development only
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', securityEvent);
    }

    // Critical events - log to console instead of localStorage
    // Note: localStorage removed for security - events should be logged server-side
    if (event.event_type === 'account_lockout' || event.event_type === 'unauthorized_access') {
      console.error('CRITICAL Security Event:', securityEvent);
    }
  }

  async logLoginAttempt(email: string, success: boolean, details?: Record<string, any>) {
    await this.logSecurityEvent({
      event_type: success ? 'login_attempt' : 'failed_login',
      // Mask email for security - don't log full email
      details: { email: email.substring(0, 3) + '***', success, ...details }
    });
  }

  async logUnauthorizedAccess(userId?: string, resource?: string, details?: Record<string, any>) {
    await this.logSecurityEvent({
      event_type: 'unauthorized_access',
      user_id: userId,
      details: { resource, ...details }
    });
  }

  async logDataAccess(userId: string, resource: string, action: string, details?: Record<string, any>) {
    await this.logSecurityEvent({
      event_type: 'data_access',
      user_id: userId,
      details: { resource, action, ...details }
    });
  }

  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  getEventsByType(eventType: SecurityEvent['event_type'], limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.event_type === eventType)
      .slice(-limit);
  }

  // Clear in-memory events (for logout/session end)
  clearEvents() {
    this.events = [];
  }
}

export const securityMonitor = new SecurityMonitor();
