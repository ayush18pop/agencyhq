import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: Request) {
    const body = await request.json();
    const session = await getServerSession(authOptions);
    const role = session?.user.role;
    
    if (!session || !role) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Only SUPER_ADMIN, MANAGER, and PROFESSIONAL can create tasks
    if (!['SUPER_ADMIN', 'MANAGER', 'PROFESSIONAL'].includes(role)) {
        return new Response("Insufficient permissions to create tasks", { status: 403 });
    }

    const { title, description, dueDate, assignedTo, projectId } = body;

    if (!title || !description || !dueDate || !assignedTo) {
        return new Response("Missing required fields: title, description, dueDate, assignedTo", { status: 400 });
    }

    // Validate input lengths
    if (title.length < 3 || title.length > 200) {
        return new Response("Task title must be between 3 and 200 characters", { status: 400 });
    }

    if (description.length < 10 || description.length > 1000) {
        return new Response("Task description must be between 10 and 1000 characters", { status: 400 });
    }

    // Validate due date
    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
        return new Response("Invalid due date format", { status: 400 });
    }

    if (parsedDueDate < new Date()) {
        return new Response("Due date cannot be in the past", { status: 400 });
    }

    try {
        // Verify assigned user exists
        const assignedUser = await prisma.user.findUnique({
            where: { id: assignedTo },
            select: { id: true, name: true, email: true, role: true }
        });

        if (!assignedUser) {
            return new Response("Assigned user not found", { status: 404 });
        }

        // Verify project exists if provided
        if (projectId) {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { id: true, name: true }
            });

            if (!project) {
                return new Response("Project not found", { status: 404 });
            }
        }

        const taskData = {
            title: title.trim(),
            description: description.trim(),
            dueDate: parsedDueDate,
            userId: assignedTo,
            assignedById: session.user.id,
            ...(projectId && {
                projectId: projectId
            })
        };

        const task = await prisma.tasks.create({
            data: taskData,
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
            message: "Task created successfully",
            task: task
        }), { 
            status: 201,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error creating task:", error);
        return new Response("Internal server error while creating task", { status: 500 });
    }
}