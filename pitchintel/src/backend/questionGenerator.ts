import type { SlideAnalysis } from './batchAnalyzer';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

type VCStyle = 'skeptic' | 'numbers_hawk' | 'operator';

export interface VCQuestion {
    slideIndex: number;
    vc: VCStyle;
    question: string;
}

function getSystemPrompt(vc: VCStyle): string {
    switch (vc) {
        case 'skeptic':
            return 'You are a skeptical VC who challenges assumptions.';
        case 'numbers_hawk':
            return 'You are a numbers-focused VC obsessed with unit economics.';
        case 'operator':
            return 'You are a pragmatic VC who cares about execution and customer traction.';
    }
}

export async function generateQuestionsFromAnalysis(
    slideAnalyses: SlideAnalysis[],
    vcStyle: VCStyle
): Promise<VCQuestion[]> {
    const questions: VCQuestion[] = [];

    for (const slide of slideAnalyses) {
        const weaknessesText = slide.weaknesses.join('; ');
        const flagsText = slide.flags.join('; ');

        const prompt = `
      Given this slide content:
      "${slide.slideText}"
    
      And these issues:
      Weaknesses: ${weaknessesText}
      Flags: ${flagsText}
    
      As a ${vcStyle.replace('_', ' ')}, generate ONE question you would ask the founder about this slide.
      The question should be short, specific, and sound like a tough VC.
    `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: getSystemPrompt(vcStyle) },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
        });

        const text = response.choices[0].message?.content?.trim();

        if (text) {
            questions.push({
                slideIndex: slide.slideIndex,
                vc: vcStyle,
                question: text,
            });
        }

    }

    return questions;
}