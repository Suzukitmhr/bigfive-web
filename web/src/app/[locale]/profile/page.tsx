import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/db';
import { Report } from '@/actions';

async function getReports(userId: string): Promise<Report[]> {
  const db = await connectToDatabase();
  const collection = db.collection('test_sessions');
  const reports = await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
  return reports.map((report) => ({
    id: report._id.toString(),
    timestamp: report.createdAt.getTime(),
    availableLanguages: [],
    language: report.lang,
    results: []
  }));
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <div>Not logged in</div>;
  }

  const reports = await getReports(session.user.id);

  return (
    <div>
      <h1>Past Results</h1>
      <ul>
        {reports.map((report) => (
          <li key={report.id}>
            <a href={`/result/${report.id}`}>{new Date(report.timestamp).toLocaleString()}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
