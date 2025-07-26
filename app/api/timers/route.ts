import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
        // ... (your other checks for active timers, etc., are fine)

        // Start new timer
        const timer = await prisma.timer.create({
            data: {
                taskId: taskId,
                userId: session.user.id, // <-- FIX: Add the user ID from the session
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

    } catch (error) {
        console.error("Error starting timer:", error);
        return new Response("Error starting timer", { status: 500 });
    }
}

