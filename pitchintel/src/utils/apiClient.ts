interface ApiResponse<T> {
  data?: T;
  error?: string;
  cached?: boolean;
  tokensUsed?: number;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "/api";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        data: data.content || data,
        cached: data.cached || false,
        tokensUsed: data.tokensUsed || 0,
      };
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async analyzeSlides(
    messages: Array<{ role: string; content: string }>
  ): Promise<ApiResponse<string>> {
    return this.request<string>("/analyze-slides", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    temperature = 0.8,
    conversationId?: string,
    systemPrompt?: string
  ): Promise<ApiResponse<string & { conversationId?: string }>> {
    return this.request<string & { conversationId?: string }>("/chat", {
      method: "POST",
      body: JSON.stringify({
        messages,
        temperature,
        conversationId,
        systemPrompt,
      }),
    });
  }

  async getUsageStats(): Promise<ApiResponse<unknown>> {
    return this.request<unknown>("/usage-stats");
  }

  async getConversationStats(): Promise<ApiResponse<unknown>> {
    return this.request<unknown>("/conversation-stats");
  }

  async deleteConversation(
    conversationId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(
      `/conversations/${conversationId}`,
      {
        method: "DELETE",
      }
    );
  }

  async clearCache(): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>("/clear-cache", {
      method: "POST",
    });
  }

  async clearConversations(): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>("/clear-conversations", {
      method: "POST",
    });
  }
}

export const apiClient = new ApiClient();
