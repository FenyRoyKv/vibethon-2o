interface TokenUsage {
  endpoint: string;
  tokens: number;
  timestamp: number;
  cost: number;
}

interface Stats {
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  averageTokensPerRequest: number;
  dailyUsage: {
    [date: string]: { tokens: number; cost: number; requests: number };
  };
  endpointBreakdown: {
    [endpoint: string]: { tokens: number; cost: number; requests: number };
  };
}

export class TokenTracker {
  private usage: TokenUsage[] = [];

  // Updated to accept actual cost instead of calculating with outdated pricing
  track(endpoint: string, tokens: number, actualCost?: number): void {
    // If no actual cost provided, use a rough estimate for GPT-4o Mini
    const cost = actualCost ?? (tokens / 1000000) * 0.375; // Average of input/output costs for GPT-4o Mini

    this.usage.push({
      endpoint,
      tokens,
      timestamp: Date.now(),
      cost,
    });

    // Keep only last 30 days of data
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    this.usage = this.usage.filter((u) => u.timestamp > thirtyDaysAgo);
  }

  getStats(): Stats {
    const totalTokens = this.usage.reduce((sum, u) => sum + u.tokens, 0);
    const totalCost = this.usage.reduce((sum, u) => sum + u.cost, 0);
    const requestCount = this.usage.length;

    // Daily breakdown
    const dailyUsage: {
      [date: string]: { tokens: number; cost: number; requests: number };
    } = {};

    this.usage.forEach((u) => {
      const date = new Date(u.timestamp).toISOString().split("T")[0];
      if (!dailyUsage[date]) {
        dailyUsage[date] = { tokens: 0, cost: 0, requests: 0 };
      }
      dailyUsage[date].tokens += u.tokens;
      dailyUsage[date].cost += u.cost;
      dailyUsage[date].requests += 1;
    });

    // Endpoint breakdown
    const endpointBreakdown: {
      [endpoint: string]: { tokens: number; cost: number; requests: number };
    } = {};

    this.usage.forEach((u) => {
      if (!endpointBreakdown[u.endpoint]) {
        endpointBreakdown[u.endpoint] = { tokens: 0, cost: 0, requests: 0 };
      }
      endpointBreakdown[u.endpoint].tokens += u.tokens;
      endpointBreakdown[u.endpoint].cost += u.cost;
      endpointBreakdown[u.endpoint].requests += 1;
    });

    return {
      totalTokens,
      totalCost,
      requestCount,
      averageTokensPerRequest:
        requestCount > 0 ? totalTokens / requestCount : 0,
      dailyUsage,
      endpointBreakdown,
    };
  }

  getTodaysUsage(): { tokens: number; cost: number; requests: number } {
    const today = new Date().toISOString().split("T")[0];
    const todayUsage = this.usage.filter((u) => {
      const usageDate = new Date(u.timestamp).toISOString().split("T")[0];
      return usageDate === today;
    });

    return {
      tokens: todayUsage.reduce((sum, u) => sum + u.tokens, 0),
      cost: todayUsage.reduce((sum, u) => sum + u.cost, 0),
      requests: todayUsage.length,
    };
  }

  clearStats(): void {
    this.usage = [];
  }

  // New: Check if usage exceeds daily limits
  checkDailyLimits(
    maxDailyCost: number = 10,
    maxDailyTokens: number = 1000000
  ): { costExceeded: boolean; tokensExceeded: boolean } {
    const today = this.getTodaysUsage();
    return {
      costExceeded: today.cost >= maxDailyCost,
      tokensExceeded: today.tokens >= maxDailyTokens,
    };
  }
}
