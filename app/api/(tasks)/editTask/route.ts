import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { Status } from "@prisma/client";

interface TaskUpdateData {
    title?: string;
    description?: string;
    dueDate?: Date;
    status?: Status;
    userId?: string;
    projectId?: string | null;
}

export async function PUT(request: Request) {
    const body = await request.json();
    const session = await getServerSession(authOptions);
    const role = session?.user.role;
    
    if (!session || !role) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Only SUPER_ADMIN, MANAGER, and PROFESSIONAL can edit tasks
    if (!['SUPER_ADMIN', 'MANAGER', 'PROFESSIONAL'].includes(role)) {
        return new Response("Insufficient permissions to edit tasks", { status: 403 });
    }

    const { taskId, title, description, dueDate, assignedTo, projectId, status } = body;

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
                project: true
            }
        });

        if (!existingTask) {
            return new Response("Task not found", { status: 404 });
        }

        // Non-SUPER_ADMIN users can only edit tasks they created or are assigned to
        if (role !== 'SUPER_ADMIN' && existingTask.assignedById !== session.user.id && existingTask.userId !== session.user.id) {
            return new Response("You can only edit tasks you created or are assigned to", { status: 403 });
        }

        // Validate input if provided
        const updates: TaskUpdateData = {};

        if (title !== undefined) {
            if (title.length < 3 || title.length > 200) {
                return new Response("Task title must be between 3 and 200 characters", { status: 400 });
            }
            updates.title = title.trim();
        }

        if (description !== undefined) {
            if (description.length < 10 || description.length > 1000) {
                return new Response("Task description must be between 10 and 1000 characters", { status: 400 });
            }
            updates.description = description.trim();
        }

        if (dueDate !== undefined) {
            const parsedDueDate = new Date(dueDate);
            if (isNaN(parsedDueDate.getTime())) {
                return new Response("Invalid due date format", { status: 400 });
            }
            updates.dueDate = parsedDueDate;
        }

        if (status !== undefined) {
            const validStatuses: Status[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
            if (!validStatuses.includes(status as Status)) {
                return new Response("Invalid status. Must be PENDING, IN_PROGRESS, COMPLETED, ON_HOLD, or CANCELLED", { status: 400 });
            }
            updates.status = status as Status;
        }

        // Handle assignedTo update
        if (assignedTo !== undefined) {
            const assignedUser = await prisma.user.findUnique({
                where: { id: assignedTo },
                select: { id: true }
            });

            if (!assignedUser) {
                return new Response("Assigned user not found", { status: 404 });
            }

            updates.userId = assignedTo;
        }

        // Handle project update
        if (projectId !== undefined) {
            if (projectId) {
                const project = await prisma.project.findUnique({
                    where: { id: projectId },
                    select: { id: true }
                });

                if (!project) {
                    return new Response("Project not found", { status: 404 });
                }

                updates.projectId = projectId;
            } else {
                updates.projectId = null;
            }
        }

        const updatedTask = await prisma.tasks.update({
            where: { taskId },
            data: updates,
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
                        email: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            message: "Task updated successfully",
            task: updatedTask
        }), { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error updating task:", error);
        return new Response("Internal server error while updating task", { status: 500 });
    }
}
