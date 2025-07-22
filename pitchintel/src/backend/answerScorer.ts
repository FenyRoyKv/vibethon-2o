import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ScoredAnswer {
    score: number; // 0 to 100
    label: 'red' | 'yellow' | 'green';
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
    const prompt = `
You are an expert venture capitalist reviewing a founder’s answer to a pitch question.

Question: "${question}"
Answer: "${answer}"

Rate this answer on a scale from 0 to 100 based on clarity, completeness, and credibility.
Explain what was strong or weak.
Suggest how the founder could improve it.

Respond in JSON format like:
{
"score": 78,
"explanation": "...",
"improvement": "...",
"label": "yellow" // red (0–49), yellow (50–79), green (80–100)
}
`;

    const res = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
    });

    try {
        const text = res.choices[0].message?.content?.trim();
        const parsed = JSON.parse(text || '{}');

        return {
            score: parsed.score ?? 0,
            explanation: parsed.explanation ?? '',
            improvement: parsed.improvement ?? '',
            label: parsed.label ?? 'red',
        };

    } catch (err) {
        console.error('Failed to parse scored answer:', err);
        return null;
    }
}