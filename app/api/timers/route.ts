import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        // If manager/admin, get all timers. If professional/client, get only their timers
        const whereClause = ['SUPER_ADMIN', 'MANAGER'].includes(session.user.role || '') 
            ? {} 
            : {
                task: {
                    userId: session.user.id
                }
            };

        const timers = await prisma.timer.findMany({
            where: whereClause,
            include: {
                task: {
                    select: {
                        taskId: true,
                        title: true,
                        assignedTo: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        return new Response(JSON.stringify({
            success: true,
            timers
        }), { status: 200 });
    } catch {
        return new Response("Error fetching timers", { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
        return new Response("Task ID is required", { status: 400 });
    }

    try {
        // Check if task exists and user has access
        const task = await prisma.tasks.findUnique({
            where: { taskId }
        });

        if (!task) {
            return new Response("Task not found", { status: 404 });
        }

        // Check if user can track time for this task
        if (task.userId !== session.user.id && !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role || '')) {
            return new Response("Unauthorized to track time for this task", { status: 401 });
        }

        // Check if there's already an active timer for this user
        const activeTimer = await prisma.timer.findFirst({
            where: {
                endTime: null,
                task: {
                    userId: session.user.id
                }
            }
        });

        if (activeTimer) {
            return new Response("You already have an active timer running", { status: 400 });
        }

        // Start new timer
        const timer = await prisma.timer.create({
            data: {
                taskId,
                startTime: new Date()
            },
            include: {
                task: {
                    select: {
                        taskId: true,
                        title: true
                    }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            timer
        }), { status: 201 });
    } catch {
        return new Response("Error starting timer", { status: 500 });
    }
}
