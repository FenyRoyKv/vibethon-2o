import { OpenAIClient } from "./openaiClient";
import type OpenAI from "openai";

interface Message {
  role: string;
  content?: string;
  text?: string;
}

export async function analyzeSlides(
  messages: Message[]
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
      temperature: 0.7,
      maxTokens: 2000,
    });

    return {
      content: result.content,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
    };
  } catch (error) {
    console.error("Slide analysis error:", error);
    return null;
  }
}
