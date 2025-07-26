// in app/api/(tasks)/getTask/route.ts

import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const session = await getServerSession(authOptions);
    const role = session?.user.role;
    
    if (!session || !role) {
        return new Response("Unauthorized", { status: 401 });
    }

    if (!taskId) {
        return new Response("Task ID is required", { status: 400 });
    }

    try {
        const task = await prisma.tasks.findUnique({
            where: { taskId },
            include: {
                assignedTo: { select: { id: true, name: true, email: true, role: true } },
                assignedBy: { select: { id: true, name: true, email: true, role: true } },
                project: { select: { id: true, name: true, description: true } },
                // FIX: Changed 'Timer' to 'timeLogs' to match your Prisma schema
                timeLogs: {
                    select: {
                        id: true,
                        startTime: true,
                        endTime: true,
                        duration: true
                    },
                    orderBy: {
                        startTime: 'desc'
                    }
                }
            }
        });

        if (!task) {
            return new Response("Task not found", { status: 404 });
        }

        // ... (rest of your permission and statistics logic is fine)
        const canViewTask = 
            role === 'SUPER_ADMIN' || 
            role === 'MANAGER' ||
            task.assignedById === session.user.id ||
            task.userId === session.user.id;

        if (!canViewTask) {
            return new Response("You don't have permission to view this task", { status: 403 });
        }

        const totalTimeSpent = task.timeLogs.reduce((sum, timer) => sum + (timer.duration || 0), 0);
        // ... etc.

        const taskWithStats = {
            ...task,
            statistics: {
                totalTimeSpent,
                // ... rest of your stats
            }
        };

        return new Response(JSON.stringify({
            success: true,
            task: taskWithStats
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Error fetching task:", error);
        return new Response("Internal server error while fetching task", { status: 500 });
    }
}