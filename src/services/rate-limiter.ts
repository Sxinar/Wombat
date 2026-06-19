interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  bypassAdmins?: boolean;
}

export class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(private config: RateLimitConfig) {}

  check(identifier: string, isAdmin = false): boolean {
    if (this.config.bypassAdmins && isAdmin) return true;
    
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(
      time => now - time < this.config.windowMs
    );
    
    if (recentRequests.length >= this.config.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }
}
