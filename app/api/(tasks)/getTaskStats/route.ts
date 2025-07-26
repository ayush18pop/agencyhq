import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  try {
    const timers = await prisma.timer.findMany({
      where: { taskId: taskId },
      orderBy: { startTime: 'desc' },
    });

    // --- Statistics Calculation Logic ---
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - now.getDay()); // Assumes week starts on Sunday

    const totalTimeSpent = timers.reduce((sum, timer) => sum + (timer.duration || 0), 0);
    
    const timeSpentToday = timers
      .filter(timer => timer.startTime && new Date(timer.startTime) >= startOfToday)
      .reduce((sum, timer) => sum + (timer.duration || 0), 0);

    const timeSpentThisWeek = timers
      .filter(timer => timer.startTime && new Date(timer.startTime) >= startOfWeek)
      .reduce((sum, timer) => sum + (timer.duration || 0), 0);

    const timerCount = timers.length;
    const lastWorkedOn = timers.length > 0 && timers[0].endTime 
        ? timers[0].endTime.toISOString() 
        : null;

    const stats = {
      totalTimeSpent,
      timeSpentToday,
      timeSpentThisWeek,
      timerCount,
      lastWorkedOn,
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error(`Error fetching stats for task ${taskId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
