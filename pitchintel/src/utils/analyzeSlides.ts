export async function analyzeSlides(slides: string[]) {
  const messages = [
    {
      role: "system",
      content: `You are a brutally honest VC. You will analyze pitch deck slides and flag weaknesses, unvalidated claims, and score each slide's credibility from 0–100.`,
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
