import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
        return new Response("Unauthorized", { status: 401 });
    }

    if (!projectId) {
        return new Response("Project ID is required", { status: 400 });
    }

    const { user } = session;
    const { role, id: userId } = user;

    try {
        let project;

        // Role-based project access
        if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
            // Admins and managers can see any project
            project = await prisma.project.findUnique({
                where: { id: projectId },
                include: {
                    tasks: {
                        include: {
                            assignedTo: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    role: true
                                }
                            }
                        }
                    }
                }
            });
        } else {
            // Professionals and clients can only see projects they're assigned to
            project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    tasks: {
                        some: {
                            assignedTo: {
                                id: userId
                            }
                        }
                    }
                },
                include: {
                    tasks: {
                        include: {
                            assignedTo: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    role: true
                                }
                            }
                        }
                    }
                }
            });
        }

        if (!project) {
            return new Response("Project not found", { status: 404 });
        }

        const tasks = project.tasks;
        const projectWithStats = {
            ...project,
            totalTasks: tasks.length,
            completedTasks: tasks.filter((t: typeof tasks[0]) => t.status === 'COMPLETED').length,
            pendingTasks: tasks.filter((t: typeof tasks[0]) => t.status === 'PENDING').length,
            inProgressTasks: tasks.filter((t: typeof tasks[0]) => t.status === 'IN_PROGRESS').length
        };

        return Response.json({
            success: true,
            project: projectWithStats
        });
    } catch (error) {
        console.error("Error fetching project:", error);
        return new Response("Internal server error", { status: 500 });
    }
}
