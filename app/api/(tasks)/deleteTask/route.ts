import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const session = await getServerSession(authOptions);
    const role = session?.user.role;
    
    if (!session || !role) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Only SUPER_ADMIN, MANAGER, and PROFESSIONAL can delete tasks
    if (!['SUPER_ADMIN', 'MANAGER', 'PROFESSIONAL'].includes(role)) {
        return new Response("Insufficient permissions to delete tasks", { status: 403 });
    }

    if (!taskId) {
        return new Response("Task ID is required", { status: 400 });
    }

    try {
        // Check if task exists
        const existingTask = await prisma.tasks.findUnique({
            where: { taskId },
            include: {
                assignedTo: true,
                assignedBy: true,
                Timer: true
            }
        });

        if (!existingTask) {
            return new Response("Task not found", { status: 404 });
        }

        // Non-SUPER_ADMIN users can only delete tasks they created
        if (role !== 'SUPER_ADMIN' && existingTask.assignedById !== session.user.id) {
            return new Response("You can only delete tasks you created", { status: 403 });
        }

        // Delete associated timers first (cascade delete)
        if (existingTask.Timer.length > 0) {
            await prisma.timer.deleteMany({
                where: { taskId }
            });
        }

        // Delete the task
        await prisma.tasks.delete({
            where: { taskId }
        });

        return new Response(JSON.stringify({
            success: true,
            message: "Task deleted successfully",
            deletedTaskId: taskId
        }), { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error deleting task:", error);
        return new Response("Internal server error while deleting task", { status: 500 });
    }
}
