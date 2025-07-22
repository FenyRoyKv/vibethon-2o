import OpenAI from "openai";

// Lazy initialization to ensure environment variables are loaded first
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

// Current OpenAI pricing (per 1M tokens)
const MODEL_COSTS = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4": { input: 30.0, output: 60.0 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  "gpt-4o": { input: 2.5, output: 10.0 },
} as const;

export class OpenAIClient {
  private static instance: OpenAIClient;
  private rateLimitDelay = 0;

  static getInstance(): OpenAIClient {
    if (!OpenAIClient.instance) {
      OpenAIClient.instance = new OpenAIClient();
    }
    return OpenAIClient.instance;
  }

  async createChatCompletion(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      maxInputTokens?: number; // New: limit input tokens
    } = {},
    retryOptions: RetryOptions = {}
  ): Promise<{ content: string; tokensUsed: number; cost: number }> {
    const {
      model = "gpt-4o-mini", // Changed from 'gpt-4' to save ~83% on costs
      temperature = 0.7,
      maxTokens = 2000,
      maxInputTokens = 100000, // Reasonable default limit
    } = options;

    // Estimate input tokens to prevent expensive requests
    const estimatedInputTokens = this.estimateTokensSync(
      JSON.stringify(messages)
    );
    if (estimatedInputTokens > maxInputTokens) {
      throw new Error(
        `Input too large: ${estimatedInputTokens} tokens exceeds limit of ${maxInputTokens}`
      );
    }

    const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = retryOptions;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (this.rateLimitDelay > 0) {
          await this.sleep(this.rateLimitDelay);
          this.rateLimitDelay = 0;
        }

        const client = getOpenAIClient(); // Get the lazily initialized client
        const response = await client.chat.completions.create({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        });

        const content = response.choices[0]?.message?.content || "";
        const usage = response.usage;
        const tokensUsed = usage?.total_tokens || 0;

        // Calculate actual cost based on model pricing
        const cost = this.calculateCost(
          model,
          usage?.prompt_tokens || 0,
          usage?.completion_tokens || 0
        );

        return { content, tokensUsed, cost };
      } catch (error) {
        lastError = error as Error;

        if (this.isRateLimitError(error)) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          this.rateLimitDelay = delay;

          if (attempt < maxRetries) {
            console.log(
              `Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${
                maxRetries + 1
              })`
            );
            continue;
          }
        } else if (this.isRetriableError(error) && attempt < maxRetries) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          console.log(
            `Retriable error, retrying in ${delay}ms (attempt ${attempt + 1}/${
              maxRetries + 1
            })`
          );
          await this.sleep(delay);
          continue;
        } else {
          break;
        }
      }
    }

    throw lastError || new Error("Unknown error occurred");
  }

  private calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const pricing = MODEL_COSTS[model as keyof typeof MODEL_COSTS];
    if (!pricing) {
      console.warn(
        `Unknown model pricing for ${model}, using GPT-4o Mini pricing`
      );
      return (
        (inputTokens * MODEL_COSTS["gpt-4o-mini"].input +
          outputTokens * MODEL_COSTS["gpt-4o-mini"].output) /
        1000000
      );
    }

    return (
      (inputTokens * pricing.input + outputTokens * pricing.output) / 1000000
    );
  }

  private isRateLimitError(error: unknown): boolean {
    if (error && typeof error === "object" && "status" in error) {
      return (error as { status: number }).status === 429;
    }
    return false;
  }

  private isRetriableError(error: unknown): boolean {
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      return status >= 500 || status === 408 || status === 429;
    }
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async estimateTokens(text: string): Promise<number> {
    return this.estimateTokensSync(text);
  }

  private estimateTokensSync(text: string): number {
    // Improved token estimation (still approximate but more accurate)
    return Math.ceil(text.length / 3.5); // Updated ratio for better accuracy
  }

  // New: Get supported models and their costs
  getSupportedModels(): typeof MODEL_COSTS {
    return MODEL_COSTS;
  }
}
