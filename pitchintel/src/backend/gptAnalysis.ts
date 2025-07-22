import { OpenAIClient } from "./openaiClient";

export async function analyzeSlide(slideText: string) {
  const prompt = `As a critical VC, analyze this slide:

"${slideText}"

Return JSON:
{
"credibility_score": 0-100,
"weaknesses": ["weakness1", "weakness2"],
"flags": ["flag1", "flag2"]
}`;

  try {
    const client = OpenAIClient.getInstance();
    const result = await client.createChatCompletion(
      [{ role: "user", content: prompt }],
      {
        model: "gpt-4o-mini", // Use cost-optimized model
        temperature: 0.7,
        maxTokens: 1000,
      }
    );

    const json = JSON.parse(result.content || "{}");
    return { ...json, tokensUsed: result.tokensUsed, cost: result.cost };
  } catch (err) {
    console.error("Error analyzing slide:", err);
    return null;
  }
}
