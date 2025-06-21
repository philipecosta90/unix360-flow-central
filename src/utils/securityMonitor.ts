import { supabase } from "@/integrations/supabase/client";

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

  async logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.events.push(securityEvent);
    
    // Keep only last 100 events in memory
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', securityEvent);
    }

    // In production, you might want to send this to a logging service
    // For now, we'll store critical events in localStorage for debugging
    if (event.event_type === 'account_lockout' || event.event_type === 'unauthorized_access') {
      const criticalEvents = JSON.parse(localStorage.getItem('security_events') || '[]');
      criticalEvents.push(securityEvent);
      localStorage.setItem('security_events', JSON.stringify(criticalEvents.slice(-50)));
    }
  }

  async logLoginAttempt(email: string, success: boolean, details?: Record<string, any>) {
    await this.logSecurityEvent({
      event_type: success ? 'login_attempt' : 'failed_login',
      details: { email, success, ...details }
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
}

export const securityMonitor = new SecurityMonitor();
