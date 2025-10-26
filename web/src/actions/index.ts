'use server';

import { connectToDatabase } from '@/db';
import { ObjectId } from 'mongodb';
import { B5Error, DbResult, Feedback } from '@/types';
import calculateScore from '@bigfive-org/score';
import generateResult, {
  getInfo,
  Language,
  Domain
} from '@bigfive-org/results';

const collectionName = process.env.DB_COLLECTION || 'results';
const resultLanguages = getInfo().languages;

export type Report = {
  id: string;
  timestamp: number;
  availableLanguages: Language[];
  language: string;
  results: Domain[];
};

export async function getTestResult(
  id: string,
  language?: string
): Promise<Report | undefined> {
  'use server';
  try {
    const sessionId = new ObjectId(id);
    const db = await connectToDatabase();
    const testSessionsCollection = db.collection('test_sessions');
    const testSession = await testSessionsCollection.findOne({ _id: sessionId });

    if (!testSession) {
      console.error(`The test results with id ${id} are not found!`);
      throw new B5Error({
        name: 'NotFoundError',
        message: `The test results with id ${id} is not found in the database!`
      });
    }

    const facetScoresCollection = db.collection('facet_scores');
    const facetScoresCursor = facetScoresCollection.find({ sessionId });
    const facetScores = await facetScoresCursor.toArray();

    const scores = {};
    for (const facetScore of facetScores) {
      if (!scores[facetScore.domain]) {
        scores[facetScore.domain] = {};
      }
      scores[facetScore.domain][facetScore.facet] = facetScore.score;
    }

    const selectedLanguage =
      language ||
      (!!resultLanguages.find((l) => l.id == testSession.lang) ? testSession.lang : 'en');
    const results = generateResult({ lang: selectedLanguage, scores });

    return {
      id: testSession._id.toString(),
      timestamp: testSession.createdAt.getTime(),
      availableLanguages: resultLanguages,
      language: selectedLanguage,
      results
    };
  } catch (error) {
    if (error instanceof B5Error) {
      throw error;
    }
    throw new Error('Something wrong happend. Failed to get test result!');
  }
}

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

export async function saveTest(testResult: DbResult) {
  'use server';
  try {
    const session = await getServerSession(authOptions);
    if (session) {
      testResult.userId = session.user.id;
    }
    const db = await connectToDatabase();
    const testSessionsCollection = db.collection('test_sessions');
    const { answers, ...testSessionData } = testResult;
    const result = await testSessionsCollection.insertOne({ ...testSessionData, answers, createdAt: new Date() });
    const sessionId = result.insertedId;

    const scores = calculateScore({ answers: testResult.answers });
    const facetScoresCollection = db.collection('facet_scores');
    const facetScores = [];
    for (const domain in scores) {
      for (const facet in scores[domain]) {
        facetScores.push({
          sessionId,
          userId: testResult.userId,
          domain,
          facet,
          score: scores[domain][facet]
        });
      }
    }
    await facetScoresCollection.insertMany(facetScores);

    return { id: sessionId.toString() };
  } catch (error) {
    console.error(error);
    throw new B5Error({
      name: 'SavingError',
      message: 'Failed to save test result!'
    });
  }
}

export type FeebackState = {
  message: string;
  type: 'error' | 'success';
};

export async function saveFeedback(
  prevState: FeebackState,
  formData: FormData
): Promise<FeebackState> {
  'use server';
  const feedback: Feedback = {
    name: String(formData.get('name')),
    email: String(formData.get('email')),
    message: String(formData.get('message'))
  };
  try {
    const db = await connectToDatabase();
    const collection = db.collection('feedback');
    await collection.insertOne({ feedback });
    return {
      message: 'Sent successfully!',
      type: 'success'
    };
  } catch (error) {
    return {
      message: 'Error sending feedback!',
      type: 'error'
    };
  }
}
