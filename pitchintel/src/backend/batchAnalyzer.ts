import { analyzeSlide } from './gptAnalysis';

export interface SlideAnalysis {
    slideIndex: number;
    slideText: string;
    credibility_score: number;
    weaknesses: string[];
    flags: string[];
}

export async function analyzeDeck(slides: string[]): Promise<SlideAnalysis[]> {
    const results: SlideAnalysis[] = [];

    for (let i = 0; i < slides.length; i++) {
        const text = slides[i];

        const result = await analyzeSlide(text);

        if (result) {
            results.push({
                slideIndex: i,
                slideText: text,
                credibility_score: result.credibility_score || 0,
                weaknesses: result.weaknesses || [],
                flags: result.flags || [],
            });
        } else {
            results.push({
                slideIndex: i,
                slideText: text,
                credibility_score: 0,
                weaknesses: ['Slide could not be analyzed'],
                flags: [],
            });
        }

        // Optional: delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 500));

    }

    return results;
}