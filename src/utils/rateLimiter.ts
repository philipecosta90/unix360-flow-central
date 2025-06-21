
interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000, blockDurationMs: number = 30 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.blockDurationMs = blockDurationMs;
  }

  isBlocked(identifier: string): boolean {
    const entry = this.attempts.get(identifier);
    if (!entry) return false;

    const now = Date.now();
    
    // Check if still blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return true;
    }

    // Reset if block period has expired
    if (entry.blockedUntil && now >= entry.blockedUntil) {
      this.attempts.delete(identifier);
      return false;
    }

    return false;
  }

  recordAttempt(identifier: string): { blocked: boolean; remainingAttempts: number } {
    const now = Date.now();
    let entry = this.attempts.get(identifier);

    if (!entry) {
      entry = { attempts: 0, lastAttempt: now };
    }

    // Reset attempts if window has expired
    if (now - entry.lastAttempt > this.windowMs) {
      entry.attempts = 0;
    }

    entry.attempts++;
    entry.lastAttempt = now;

    // Block if max attempts exceeded
    if (entry.attempts >= this.maxAttempts) {
      entry.blockedUntil = now + this.blockDurationMs;
      this.attempts.set(identifier, entry);
      return { blocked: true, remainingAttempts: 0 };
    }

    this.attempts.set(identifier, entry);
    return { 
      blocked: false, 
      remainingAttempts: this.maxAttempts - entry.attempts 
    };
  }

  getRemainingAttempts(identifier: string): number {
    const entry = this.attempts.get(identifier);
    if (!entry) return this.maxAttempts;

    const now = Date.now();
    
    // Reset if window expired
    if (now - entry.lastAttempt > this.windowMs) {
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - entry.attempts);
  }

  getBlockTimeRemaining(identifier: string): number {
    const entry = this.attempts.get(identifier);
    if (!entry?.blockedUntil) return 0;

    const remaining = entry.blockedUntil - Date.now();
    return Math.max(0, remaining);
  }
}

export const authRateLimiter = new RateLimiter(5, 15 * 60 * 1000, 30 * 60 * 1000); // 5 attempts per 15 minutes, block for 30 minutes
export const formRateLimiter = new RateLimiter(10, 60 * 1000, 5 * 60 * 1000); // 10 attempts per minute, block for 5 minutes
