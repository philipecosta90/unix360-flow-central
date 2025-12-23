interface LogData {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  debug(message: string, data?: LogData) {
    if (this.isDevelopment) {
      console.log(`🔧 ${message}`, data ? data : '');
    }
  }

  info(message: string, data?: LogData) {
    if (this.isDevelopment) {
      console.info(`ℹ️ ${message}`, data ? data : '');
    }
  }

  warn(message: string, data?: LogData) {
    console.warn(`⚠️ ${message}`, data ? data : '');
  }

  error(message: string, error?: any, data?: LogData) {
    console.error(`❌ ${message}`, error || '', data ? data : '');
    
    // Em produção, aqui seria enviado para serviço de monitoramento
    if (!this.isDevelopment && error) {
      // TODO: Implementar envio para serviço de monitoramento (Sentry, etc.)
    }
  }

  security(message: string, data?: LogData) {
    // Logs de segurança sempre são registrados
    console.warn(`🔒 ${message}`, data ? data : '');
  }

  auth(message: string, data?: LogData) {
    if (this.isDevelopment) {
      console.info(`🔑 ${message}`, data ? data : '');
    }
  }

  business(message: string, data?: LogData) {
    if (this.isDevelopment) {
      console.info(`💼 ${message}`, data ? data : '');
    }
  }

  ui(component: string, action: string, data?: LogData) {
    if (this.isDevelopment) {
      console.log(`🎨 [${component}] ${action}`, data ? data : '');
    }
  }
}

export const logger = new Logger();