import express from "express";
import type { Request, Response } from "express";
import { analyzeSlides } from "./slideAnalyzer";
import { analyzeChat } from "./chatAnalyzer";
import { TokenTracker } from "./tokenTracker";
import { ResponseCache } from "./responseCache";
import { ConversationMemory } from "./conversationMemory";

const router = express.Router();
const tokenTracker = new TokenTracker();
const cache = new ResponseCache();
const conversationMemory = new ConversationMemory();

// Cost protection limits
const DAILY_COST_LIMIT = 50; // $50 per day
const DAILY_TOKEN_LIMIT = 10000000; // 10M tokens per day
const MAX_REQUEST_TOKENS = 50000; // 50K tokens per request

router.post("/analyze-slides", async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    // Check daily limits before processing
    const limits = tokenTracker.checkDailyLimits(
      DAILY_COST_LIMIT,
      DAILY_TOKEN_LIMIT
    );
    if (limits.costExceeded) {
      return res.status(429).json({
        error: "Daily cost limit exceeded",
        limit: DAILY_COST_LIMIT,
        usage: tokenTracker.getTodaysUsage(),
      });
    }
    if (limits.tokensExceeded) {
      return res.status(429).json({
        error: "Daily token limit exceeded",
        limit: DAILY_TOKEN_LIMIT,
        usage: tokenTracker.getTodaysUsage(),
      });
    }

    const cacheKey = ResponseCache.createCacheKey("analyze-slides", {
      messages,
    });
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      return res.json({
        ...cachedResponse,
        cached: true,
        tokensUsed: 0,
      });
    }

    const result = await analyzeSlides(messages);

    if (result) {
      cache.set(cacheKey, result);
      tokenTracker.track("analyze-slides", result.tokensUsed || 0, result.cost);
    }

    res.json(result);
  } catch (error) {
    console.error("Slide analysis error:", error);
    res.status(500).json({ error: "Analysis failed" });
  }
});

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const {
      messages,
      temperature = 0.8,
      conversationId,
      systemPrompt,
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    // Check daily limits before processing
    const limits = tokenTracker.checkDailyLimits(
      DAILY_COST_LIMIT,
      DAILY_TOKEN_LIMIT
    );
    if (limits.costExceeded) {
      return res.status(429).json({
        error: "Daily cost limit exceeded",
        limit: DAILY_COST_LIMIT,
        usage: tokenTracker.getTodaysUsage(),
      });
    }
    if (limits.tokensExceeded) {
      return res.status(429).json({
        error: "Daily token limit exceeded",
        limit: DAILY_TOKEN_LIMIT,
        usage: tokenTracker.getTodaysUsage(),
      });
    }

    let convId = conversationId;

    // Create new conversation if none provided
    if (!convId) {
      convId = conversationMemory.createConversation(systemPrompt);
    }

    // Add user message to conversation memory
    const latestUserMessage = messages[messages.length - 1];
    if (latestUserMessage && latestUserMessage.role === "user") {
      conversationMemory.addMessage(convId, "user", latestUserMessage.content);
    }

    // Get full conversation history
    const conversationHistory = conversationMemory.getFormattedMessages(convId);
    if (!conversationHistory) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }

    const cacheKey = ResponseCache.createCacheKey("chat", {
      messages: conversationHistory,
      temperature,
    });
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      return res.json({
        ...cachedResponse,
        cached: true,
        tokensUsed: 0,
        conversationId: convId,
      });
    }

    const result = await analyzeChat(conversationHistory, temperature);

    if (result) {
      // Add assistant response to conversation memory
      conversationMemory.addMessage(
        convId,
        "assistant",
        result.content,
        result.tokensUsed
      );

      cache.set(cacheKey, result);
      tokenTracker.track("chat", result.tokensUsed || 0, result.cost);
    }

    res.json({ ...result, conversationId: convId });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Chat failed" });
  }
});

// New: Get usage stats endpoint
router.get("/usage-stats", (_req: Request, res: Response) => {
  try {
    const stats = tokenTracker.getStats();
    const cacheStats = cache.getStats();
    const limits = tokenTracker.checkDailyLimits(
      DAILY_COST_LIMIT,
      DAILY_TOKEN_LIMIT
    );

    res.json({
      usage: stats,
      cache: cacheStats,
      limits: {
        dailyCostLimit: DAILY_COST_LIMIT,
        dailyTokenLimit: DAILY_TOKEN_LIMIT,
        maxRequestTokens: MAX_REQUEST_TOKENS,
        costExceeded: limits.costExceeded,
        tokensExceeded: limits.tokensExceeded,
      },
      todaysUsage: tokenTracker.getTodaysUsage(),
    });
  } catch (error) {
    console.error("Usage stats error:", error);
    res.status(500).json({ error: "Failed to get usage stats" });
  }
});

// New: Clear cache endpoint (for admin use)
router.post("/clear-cache", (_req: Request, res: Response) => {
  try {
    cache.clear();
    res.json({ success: true, message: "Cache cleared successfully" });
  } catch (error) {
    console.error("Clear cache error:", error);
    res.status(500).json({ error: "Failed to clear cache" });
  }
});

router.get("/conversation-stats", (_req: Request, res: Response) => {
  res.json(conversationMemory.getStats());
});

router.delete("/conversations/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = conversationMemory.deleteConversation(id);
  res.json({ success: deleted });
});

router.post("/clear-conversations", (_req: Request, res: Response) => {
  conversationMemory.clearAllConversations();
  res.json({ success: true });
});

export default router;
