import type { SlideAnalysis } from "./batchAnalyzer";
import { OpenAIClient } from "./openaiClient";

type VCStyle = "skeptic" | "numbers_hawk" | "operator";

export interface VCQuestion {
  slideIndex: number;
  vc: VCStyle;
  question: string;
}

function getSystemPrompt(vc: VCStyle): string {
  switch (vc) {
    case "skeptic":
      return "You are a skeptical VC who challenges assumptions.";
    case "numbers_hawk":
      return "You are a numbers-focused VC obsessed with unit economics.";
    case "operator":
      return "You are a pragmatic VC who cares about execution and customer traction.";
  }
}

export async function generateQuestionsFromAnalysis(
  slideAnalyses: SlideAnalysis[],
  vcStyle: VCStyle
): Promise<VCQuestion[]> {
  const questions: VCQuestion[] = [];
  const client = OpenAIClient.getInstance();

  for (const slide of slideAnalyses) {
    const weaknessesText = slide.weaknesses.join("; ");
    const flagsText = slide.flags.join("; ");

    const prompt = `
      Given this slide content:
      "${slide.slideText}"
    
      And these issues:
      Weaknesses: ${weaknessesText}
      Flags: ${flagsText}
    
      As a ${vcStyle.replace(
        "_",
        " "
      )}, generate ONE question you would ask the founder about this slide.
      The question should be short, specific, and sound like a tough VC.
    `;

    try {
      const result = await client.createChatCompletion(
        [
          { role: "system", content: getSystemPrompt(vcStyle) },
          { role: "user", content: prompt },
        ],
        {
          model: "gpt-4o-mini", // Use cost-optimized model
          temperature: 0.7,
        }
      );

      const text = result.content?.trim();

      if (text) {
        questions.push({
          slideIndex: slide.slideIndex,
          vc: vcStyle,
          question: text,
        });
      }
    } catch (error) {
      console.error(
        `Error generating question for slide ${slide.slideIndex}:`,
        error
      );
      // Continue with other slides even if one fails
    }
  }

  return questions;
}
