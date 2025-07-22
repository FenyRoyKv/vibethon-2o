type VCStyle = 'skeptic' | 'numbers_hawk' | 'operator';

const getVCSystemPrompt = (vcStyle: VCStyle): string => {
  switch (vcStyle) {
    case 'skeptic':
      return 'You are a brutally skeptical VC who challenges every assumption. Focus on identifying unvalidated claims, logical gaps, and potential risks.';
    case 'numbers_hawk':
      return 'You are a numbers-obsessed VC who scrutinizes unit economics, financial projections, and metrics. Focus on identifying weak financial assumptions and missing key metrics.';
    case 'operator':
      return 'You are a pragmatic VC focused on execution, customer validation, and go-to-market strategy. Focus on identifying execution risks and market validation gaps.';
  }
};

export async function analyzeSlides(slides: string[], vcStyle: VCStyle) {
  const messages = [
    {
      role: "system",
      content: `${getVCSystemPrompt(vcStyle)} You will analyze pitch deck slides and flag weaknesses, unvalidated claims, and score each slide's credibility from 0–100.`,
    },
    {
      role: "user",
      content: `Here is a pitch deck with ${slides.length} slides:\n\n${slides
        .map((text, i) => `Slide ${i + 1}:\n${text}`)
        .join("\n\n")}`,
    },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}
