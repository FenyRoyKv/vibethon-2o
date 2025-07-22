import { OpenAIClient } from "./openaiClient";
import type OpenAI from "openai";

interface Message {
  role: string;
  content?: string;
  text?: string;
}

export async function analyzeChat(
  messages: Message[],
  temperature: number = 0.8
): Promise<{ content: string; tokensUsed: number; cost: number } | null> {
  try {
    const client = OpenAIClient.getInstance();

    const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      messages.map((msg) => ({
        role: (msg.role || "user") as "user" | "assistant" | "system",
        content: msg.content || msg.text || "",
      }));

    const result = await client.createChatCompletion(formattedMessages, {
      model: "gpt-4o-mini", // Explicitly use the cost-optimized model
      temperature,
      maxTokens: 2000,
    });

    return {
      content: result.content,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
    };
  } catch (error) {
    console.error("Chat analysis error:", error);
    return null;
  }
}
