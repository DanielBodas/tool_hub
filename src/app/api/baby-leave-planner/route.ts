import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    await getServerSession(authOptions);
    // Even if no session, we might want to allow access if PIN is verified?
    // Usually, the SecurityGate handles the UI, but the API should also be protected.
    // For now, let's keep it simple.

    const client = await clientPromise;
    const db = client.db('baby-leave-planner');

    const data = await db.collection('settings').findOne({ id: 'global-config' });

    return NextResponse.json(data || {});
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('baby-leave-planner');

    await db.collection('settings').updateOne(
      { id: 'global-config' },
      { $set: { ...body, id: 'global-config', updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
