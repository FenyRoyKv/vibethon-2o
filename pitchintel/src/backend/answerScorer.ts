import { OpenAIClient } from "./openaiClient";

export interface ScoredAnswer {
  score: number; // 0 to 100
  label: "red" | "yellow" | "green";
  explanation: string;
  improvement: string;
}

export async function scoreAnswer({
  question,
  answer,
}: {
  question: string;
  answer: string;
}): Promise<ScoredAnswer | null> {
  const prompt = `Rate this VC pitch answer (0-100) on clarity, completeness, credibility.

Q: "${question}"
A: "${answer}"

Return JSON:
{
"score": 78,
"explanation": "Brief explanation of strengths/weaknesses",
"improvement": "Key improvement suggestion",
"label": "yellow"
}

Labels: red (0-49), yellow (50-79), green (80-100)`;

  try {
    const client = OpenAIClient.getInstance();
    const result = await client.createChatCompletion(
      [{ role: "user", content: prompt }],
      {
        model: "gpt-4o-mini", // Use cost-optimized model
        temperature: 0.7,
      }
    );

    const text = result.content?.trim();
    const parsed = JSON.parse(text || "{}");

    return {
      score: parsed.score ?? 0,
      explanation: parsed.explanation ?? "",
      improvement: parsed.improvement ?? "",
      label: parsed.label ?? "red",
    };
  } catch (err) {
    console.error("Failed to parse scored answer:", err);
    return null;
  }
}
