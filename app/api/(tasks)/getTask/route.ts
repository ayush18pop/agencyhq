import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

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
        // Get task with full details
        const task = await prisma.tasks.findUnique({
            where: { taskId },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                },
                assignedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                Timer: {
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

        // Check permissions
        const canViewTask = 
            role === 'SUPER_ADMIN' || 
            role === 'MANAGER' ||
            task.assignedById === session.user.id ||
            task.userId === session.user.id;

        if (!canViewTask) {
            return new Response("You don't have permission to view this task", { status: 403 });
        }

        // Calculate task statistics
        const totalTimeSpent = task.Timer.reduce((sum, timer) => sum + (timer.duration || 0), 0);
        const timerCount = task.Timer.length;
        const lastWorkedOn = task.Timer.length > 0 ? task.Timer[0].endTime : null;
        const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' : false;

        // Calculate days until due
        const daysUntilDue = task.dueDate ? Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;

        const taskWithStats = {
            ...task,
            statistics: {
                totalTimeSpent,
                timerCount,
                lastWorkedOn,
                isOverdue,
                daysUntilDue,
                timeSpentToday: task.Timer
                    .filter(timer => {
                        const today = new Date();
                        const timerDate = timer.startTime ? new Date(timer.startTime) : null;
                        return timerDate && 
                               timerDate.toDateString() === today.toDateString();
                    })
                    .reduce((sum, timer) => sum + (timer.duration || 0), 0),
                timeSpentThisWeek: task.Timer
                    .filter(timer => {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        const timerDate = timer.startTime ? new Date(timer.startTime) : null;
                        return timerDate && timerDate >= weekAgo;
                    })
                    .reduce((sum, timer) => sum + (timer.duration || 0), 0)
            }
        };

        return new Response(JSON.stringify({
            success: true,
            task: taskWithStats
        }), { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error fetching task:", error);
        return new Response("Internal server error while fetching task", { status: 500 });
    }
}
