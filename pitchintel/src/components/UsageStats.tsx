import { useState, useEffect } from "react";
import { apiClient } from "../utils/apiClient";

interface UsageStats {
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

interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  totalHits: number;
  totalRequests: number;
}

interface Limits {
  dailyCostLimit: number;
  dailyTokenLimit: number;
  maxRequestTokens: number;
  costExceeded: boolean;
  tokensExceeded: boolean;
}

interface TodaysUsage {
  tokens: number;
  cost: number;
  requests: number;
}

interface ExtendedStats {
  usage: UsageStats;
  cache: CacheStats;
  limits: Limits;
  todaysUsage: TodaysUsage;
}

export function UsageStats() {
  const [stats, setStats] = useState<ExtendedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    const result = await apiClient.getUsageStats();

    if (result.error) {
      setError(result.error);
    } else {
      setStats(result.data as ExtendedStats);
      setError(null);
    }
    setLoading(false);
  };

  const handleClearCache = async () => {
    const result = await apiClient.clearCache();
    if (!result.error) {
      alert("Cache cleared successfully!");
      fetchStats(); // Refresh stats after clearing cache
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading)
    return <div className="text-center p-4">Loading usage stats...</div>;
  if (error) return <div className="text-red-600 p-4">Error: {error}</div>;
  if (!stats)
    return <div className="text-center p-4">No usage data available</div>;

  const costSavingsFromCache =
    stats.cache.totalHits *
    (stats.usage.totalCost / Math.max(stats.usage.requestCount, 1));
  const todaysCostPercent =
    (stats.todaysUsage.cost / stats.limits.dailyCostLimit) * 100;
  const todaysTokenPercent =
    (stats.todaysUsage.tokens / stats.limits.dailyTokenLimit) * 100;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">OpenAI Usage & Cost Optimization</h2>
        <button
          onClick={handleClearCache}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Clear Cache
        </button>
      </div>

      {/* Daily Usage Overview */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Today's Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-3 rounded ${
              stats.limits.costExceeded ? "bg-red-100" : "bg-green-100"
            }`}
          >
            <h4
              className={`font-semibold ${
                stats.limits.costExceeded ? "text-red-800" : "text-green-800"
              }`}
            >
              Cost: ${stats.todaysUsage.cost.toFixed(4)}
            </h4>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className={`h-2.5 rounded-full ${
                  stats.limits.costExceeded ? "bg-red-600" : "bg-green-600"
                }`}
                style={{ width: `${Math.min(todaysCostPercent, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {todaysCostPercent.toFixed(1)}% of ${stats.limits.dailyCostLimit}{" "}
              limit
            </p>
          </div>

          <div
            className={`p-3 rounded ${
              stats.limits.tokensExceeded ? "bg-red-100" : "bg-blue-100"
            }`}
          >
            <h4
              className={`font-semibold ${
                stats.limits.tokensExceeded ? "text-red-800" : "text-blue-800"
              }`}
            >
              Tokens: {stats.todaysUsage.tokens.toLocaleString()}
            </h4>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className={`h-2.5 rounded-full ${
                  stats.limits.tokensExceeded ? "bg-red-600" : "bg-blue-600"
                }`}
                style={{ width: `${Math.min(todaysTokenPercent, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {todaysTokenPercent.toFixed(1)}% of{" "}
              {(stats.limits.dailyTokenLimit / 1000000).toFixed(0)}M limit
            </p>
          </div>

          <div className="bg-purple-100 p-3 rounded">
            <h4 className="font-semibold text-purple-800">
              Requests: {stats.todaysUsage.requests}
            </h4>
            <p className="text-sm text-gray-600">API calls made today</p>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-semibold text-blue-800">Total Tokens</h3>
          <p className="text-2xl font-bold text-blue-600">
            {stats.usage.totalTokens.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <h3 className="font-semibold text-green-800">Total Cost</h3>
          <p className="text-2xl font-bold text-green-600">
            ${stats.usage.totalCost.toFixed(2)}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <h3 className="font-semibold text-purple-800">Requests</h3>
          <p className="text-2xl font-bold text-purple-600">
            {stats.usage.requestCount}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded">
          <h3 className="font-semibold text-orange-800">Avg Tokens/Request</h3>
          <p className="text-2xl font-bold text-orange-600">
            {Math.round(stats.usage.averageTokensPerRequest)}
          </p>
        </div>
      </div>

      {/* Cache Performance */}
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-yellow-800">
          Cache Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <h4 className="font-semibold">Hit Rate</h4>
            <p className="text-xl font-bold text-green-600">
              {(stats.cache.hitRate * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Cache Size</h4>
            <p className="text-xl">
              {stats.cache.size} / {stats.cache.maxSize}
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Total Hits</h4>
            <p className="text-xl">{stats.cache.totalHits}</p>
          </div>
          <div>
            <h4 className="font-semibold">Estimated Savings</h4>
            <p className="text-xl font-bold text-green-600">
              ${costSavingsFromCache.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Endpoint Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Usage by Endpoint</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(stats.usage.endpointBreakdown).map(
            ([endpoint, data]) => (
              <div key={endpoint} className="border p-4 rounded">
                <h4 className="font-semibold capitalize">
                  {endpoint.replace("-", " ")}
                </h4>
                <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                  <div>
                    <span className="text-gray-600">Tokens:</span>
                    <br />
                    <span className="font-semibold">
                      {data.tokens.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cost:</span>
                    <br />
                    <span className="font-semibold">
                      ${data.cost.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Requests:</span>
                    <br />
                    <span className="font-semibold">{data.requests}</span>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Cost Optimization Tips */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">
          💡 Optimization Status
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Using GPT-4o Mini (83% cost savings vs GPT-4)
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Response caching enabled ({(stats.cache.hitRate * 100).toFixed(1)}%
            hit rate)
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Daily cost limits in place (${stats.limits.dailyCostLimit})
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Optimized prompts for reduced token usage
          </li>
          {stats.cache.hitRate < 0.3 && (
            <li className="flex items-center">
              <span className="text-yellow-500 mr-2">⚠</span>
              Cache hit rate could be improved - consider longer cache TTL
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
