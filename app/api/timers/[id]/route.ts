import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// FILE: /api/timers/[id]/route.ts

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        // 1. Get the timer first to read its startTime
        const timer = await prisma.timer.findUnique({
            where: { id },
        });

        if (!timer) {
            return new Response("Timer not found", { status: 404 });
        }
        if (timer.endTime) {
            return new Response("Timer is already stopped", { status: 400 });
        }

        // 2. Calculate the duration
        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - timer.startTime.getTime()) / 1000);

        // 3. Update the database with BOTH endTime and the calculated duration
        const updatedTimer = await prisma.timer.update({
            where: { id },
            data: {
                endTime: endTime,
                duration: duration, // <-- This is the crucial fix
            },
        });

        return new Response(JSON.stringify({
            success: true,
            timer: updatedTimer
        }), { status: 200 });

    } catch (error) {
        console.error("Error stopping timer:", error);
        return new Response("Error stopping timer", { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        // Get the timer
        const timer = await prisma.timer.findUnique({
            where: { id },
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
            where: { id }
        });

        return new Response(JSON.stringify({
            success: true,
            message: "Timer deleted successfully"
        }), { status: 200 });
    } catch {
        return new Response("Error deleting timer", { status: 500 });
    }
}
