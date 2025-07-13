import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        // Check if user has access to this task
        const task = await prisma.tasks.findUnique({
            where: { taskId: id },
            include: {
                project: {
                    select: {
                        clientId: true
                    }
                }
            }
        });

        if (!task) {
            return new Response("Task not found", { status: 404 });
        }

        // Check access: assigned user, creator, client of project, or manager/admin
        const hasAccess = task.userId === session.user.id || 
                         task.assignedById === session.user.id ||
                         task.project?.clientId === session.user.id ||
                         ['SUPER_ADMIN', 'MANAGER'].includes(session.user.role || '');

        if (!hasAccess) {
            return new Response("Unauthorized", { status: 401 });
        }

        const comments = await prisma.taskComment.findMany({
            where: { taskId: id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        image: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        return new Response(JSON.stringify({
            success: true,
            comments
        }), { status: 200 });
    } catch {
        return new Response("Error fetching comments", { status: 500 });
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
        return new Response("Comment content is required", { status: 400 });
    }

    try {
        // Check if user has access to this task
        const task = await prisma.tasks.findUnique({
            where: { taskId: id },
            include: {
                project: {
                    select: {
                        clientId: true
                    }
                }
            }
        });

        if (!task) {
            return new Response("Task not found", { status: 404 });
        }

        // Check access: assigned user, creator, client of project, or manager/admin
        const hasAccess = task.userId === session.user.id || 
                         task.assignedById === session.user.id ||
                         task.project?.clientId === session.user.id ||
                         ['SUPER_ADMIN', 'MANAGER'].includes(session.user.role || '');

        if (!hasAccess) {
            return new Response("Unauthorized", { status: 401 });
        }

        const comment = await prisma.taskComment.create({
            data: {
                content: content.trim(),
                taskId: id,
                authorId: session.user.id
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        image: true
                    }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            comment
        }), { status: 201 });
    } catch {
        return new Response("Error creating comment", { status: 500 });
    }
}
