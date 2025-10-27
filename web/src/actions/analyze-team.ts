'use server';

import { connectToDatabase } from '@/db';
import { ObjectId } from 'mongodb';
import { generateAnalysis } from '@/lib/gemini';
import generateResult from '@bigfive-org/results';

export async function analyzeTeam(ids: string[]): Promise<string> {
  try {
    const db = await connectToDatabase();
    const facetScoresCollection = db.collection('facet_scores');

    const teamScores = [];
    for (const id of ids) {
      const sessionId = new ObjectId(id);
      const facetScoresCursor = facetScoresCollection.find({ sessionId });
      const facetScores = await facetScoresCursor.toArray();

      const scores = {};
      for (const facetScore of facetScores) {
        if (!scores[facetScore.domain]) {
          scores[facetScore.domain] = {};
        }
        scores[facetScore.domain][facetScore.facet] = facetScore.score;
      }
      const results = generateResult({ lang: 'en', scores });
      teamScores.push(results);
    }

    const prompt = `Based on the following Big Five personality scores for a team of ${teamScores.length} individuals, provide a detailed analysis of the team's strengths, weaknesses, and points of caution. The team's results are: ${JSON.stringify(teamScores)}`;
    const analysisText = await generateAnalysis(prompt);

    return analysisText;
  } catch (error) {
    console.error("Error analyzing team:", error);
    throw new Error("Failed to analyze team.");
  }
}
