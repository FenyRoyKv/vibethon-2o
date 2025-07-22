import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeSlide(slideText: string) {
    const prompt = `
Act like a critical VC investor. Given the content of this slide:

"${slideText}"

Output a JSON object with:
- credibility_score: 0–100 (how believable is this slide?)
- weaknesses: array of short descriptions of weak/missing arguments
- flags: array of claims that need more validation`;

    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
    });

    try {
        const rawText = response.choices[0].message?.content;
        const json = JSON.parse(rawText || "{}");
        return json;
    } catch (err) {
        console.error("Error parsing GPT response:", err);
        return null;
    }
}