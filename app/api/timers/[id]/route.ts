import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        // Get the timer
        const timer = await prisma.timer.findUnique({
            where: { id: params.id },
            include: {
                task: {
                    select: {
                        userId: true,
                        title: true
                    }
                }
            }
        });

        if (!timer) {
            return new Response("Timer not found", { status: 404 });
        }

        // Check if user can stop this timer
        if (timer.task.userId !== session.user.id && !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role || '')) {
            return new Response("Unauthorized to stop this timer", { status: 401 });
        }

        // Check if timer is already stopped
        if (timer.endTime) {
            return new Response("Timer is already stopped", { status: 400 });
        }

        // Stop the timer
        const updatedTimer = await prisma.timer.update({
            where: { id: params.id },
            data: {
                endTime: new Date()
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

        // Calculate duration
        const duration = updatedTimer.endTime && updatedTimer.startTime 
            ? Math.round((updatedTimer.endTime.getTime() - updatedTimer.startTime.getTime()) / 1000)
            : 0;

        return new Response(JSON.stringify({
            success: true,
            timer: {
                ...updatedTimer,
                duration
            }
        }), { status: 200 });
    } catch {
        return new Response("Error stopping timer", { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        // Get the timer
        const timer = await prisma.timer.findUnique({
            where: { id: params.id },
            include: {
                task: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        if (!timer) {
            return new Response("Timer not found", { status: 404 });
        }

        // Check if user can delete this timer
        if (timer.task.userId !== session.user.id && !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role || '')) {
            return new Response("Unauthorized to delete this timer", { status: 401 });
        }

        // Delete the timer
        await prisma.timer.delete({
            where: { id: params.id }
        });

        return new Response(JSON.stringify({
            success: true,
            message: "Timer deleted successfully"
        }), { status: 200 });
    } catch {
        return new Response("Error deleting timer", { status: 500 });
    }
}
