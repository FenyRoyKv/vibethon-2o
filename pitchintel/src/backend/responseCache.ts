interface CacheEntry {
  data: unknown;
  timestamp: number;
  expiresAt: number;
  hits: number; // Track how often this entry is accessed
}

interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  totalHits: number;
  totalRequests: number;
}

export class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_SIZE = 1000;
  private totalHits = 0;
  private totalRequests = 0;

  private ttl: number;

  constructor(ttl: number = 0) {
    this.ttl = ttl || this.DEFAULT_TTL;
    this.startCleanup();
  }

  set(key: string, data: unknown, customTTL?: number): void {
    if (this.cache.size >= this.MAX_SIZE) {
      this.evictOldest();
    }

    const now = Date.now();
    const expiresAt = now + (customTTL || this.ttl);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
      hits: 0,
    });
  }

  get(key: string): unknown | null {
    this.totalRequests++;
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Track hit and update entry
    entry.hits++;
    this.totalHits++;
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.totalHits = 0;
    this.totalRequests = 0;
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): CacheStats {
    return {
      size: this.cache.size,
      maxSize: this.MAX_SIZE,
      hitRate: this.totalRequests > 0 ? this.totalHits / this.totalRequests : 0,
      totalHits: this.totalHits,
      totalRequests: this.totalRequests,
    };
  }

  private evictOldest(): void {
    let oldest: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldest = key;
      }
    }

    if (oldest) {
      this.cache.delete(oldest);
    }
  }

  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }

  // New: Create smarter cache keys that normalize similar requests
  static createCacheKey(
    endpoint: string,
    data: Record<string, unknown>
  ): string {
    const normalized = {
      endpoint,
      // Sort messages to handle reordering
      messages: Array.isArray(data.messages)
        ? data.messages.map((msg: Record<string, unknown>) => ({
            role: msg.role,
            content:
              typeof msg.content === "string"
                ? msg.content.trim()
                : msg.content,
          }))
        : data.messages,
      // Round temperature to 2 decimal places to group similar values
      temperature:
        typeof data.temperature === "number"
          ? Math.round(data.temperature * 100) / 100
          : data.temperature,
      // Exclude fields that don't affect output
      systemPrompt: data.systemPrompt,
    };

    return JSON.stringify(normalized);
  }

  // New: Get most popular cache entries
  getMostHitEntries(
    limit: number = 10
  ): Array<{ key: string; hits: number; data: unknown }> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, hits: entry.hits, data: entry.data }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);

    return entries;
  }
}
