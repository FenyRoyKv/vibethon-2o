import { analyzeDeck, type SlideAnalysis } from './batchAnalyzer';
import { generateQuestionsFromAnalysis, type VCQuestion } from './questionGenerator';
// Optional: import { scoreAnswer } from './answerScorer';

export interface FinalReport {
    slides: SlideAnalysis[]; // includes score, flags, weaknesses
    heatmap: { slideIndex: number; score: number }[];
    topVulnerabilities: { slideIndex: number; issue: string }[];
    questions: {
        vc: 'skeptic' | 'numbers_hawk' | 'operator';
        questions: VCQuestion[];
    }[];
    // future: winningResponses, answerScores, etc.
}

export async function buildReport(slides: string[]): Promise<FinalReport> {
    const slideAnalyses = await analyzeDeck(slides);

    // Create heatmap
    const heatmap = slideAnalyses.map((s) => ({
        slideIndex: s.slideIndex,
        score: s.credibility_score,
    }));

    // Top vulnerabilities = all weaknesses from red/yellow slides
    const topVulnerabilities: { slideIndex: number; issue: string }[] = [];
    for (const slide of slideAnalyses) {
        if (slide.credibility_score < 80) {
            slide.weaknesses.forEach((w) =>
                topVulnerabilities.push({ slideIndex: slide.slideIndex, issue: w })
            );
        }
    }

    // Generate VC questions
    const skeptic = await generateQuestionsFromAnalysis(slideAnalyses, 'skeptic');
    const hawk = await generateQuestionsFromAnalysis(slideAnalyses, 'numbers_hawk');
    const operator = await generateQuestionsFromAnalysis(slideAnalyses, 'operator');

    return {
        slides: slideAnalyses,
        heatmap,
        topVulnerabilities,
        questions: [
            { vc: 'skeptic', questions: skeptic },
            { vc: 'numbers_hawk', questions: hawk },
            { vc: 'operator', questions: operator },
        ],
    };
}