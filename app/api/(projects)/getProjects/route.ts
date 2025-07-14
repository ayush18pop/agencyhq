import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { user } = session;
    const { role, id: userId } = user;

    try {
        type ProjectWithTasks = {
            id: string;
            name: string;
            description: string | null;
            startDate: Date | null;
            endDate: Date | null;
            budget: number | null;
            createdAt: Date;
            updatedAt: Date;
            clientId: string | null;
            teamId: string | null;
            tasks: {
                taskId: string;
                title: string;
                status: string;
                dueDate: Date | null;
            }[];
        };

        let projects: ProjectWithTasks[];

        // Role-based project access
        if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
            // Admins and managers see all projects
            projects = await prisma.project.findMany({
                include: {
                    tasks: {
                        select: {
                            taskId: true,
                            title: true,
                            status: true,
                            dueDate: true
                        }
                    }
                }
            }) as ProjectWithTasks[];
        } else if (role === 'CLIENT') {
            // Clients see only their own projects
            projects = await prisma.project.findMany({
                where: {
                    clientId: userId
                },
                include: {
                    tasks: {
                        select: {
                            taskId: true,
                            title: true,
                            status: true,
                            dueDate: true
                        }
                    }
                }
            }) as ProjectWithTasks[];
        } else {
            // Professionals see projects where they're assigned to tasks
            projects = await prisma.project.findMany({
                where: {
                    tasks: {
                        some: {
                            assignedTo: { id: userId }
                        }
                    }
                },
                include: {
                    tasks: {
                        select: {
                            taskId: true,
                            title: true,
                            status: true,
                            dueDate: true
                        }
                    }
                }
            }) as ProjectWithTasks[];
        }

        const projectsWithStats = projects.map((project) => {
            const tasks = project.tasks;
            return {
                ...project,
                totalTasks: tasks.length,
                completedTasks: tasks.filter((t) => t.status === 'COMPLETED').length,
                pendingTasks: tasks.filter((t) => t.status === 'PENDING').length,
                inProgressTasks: tasks.filter((t) => t.status === 'IN_PROGRESS').length
            };
        });

        return Response.json({
            success: true,
            projects: projectsWithStats
        });
    } catch (error) {
        console.error("Error fetching projects:", error);
        return new Response("Internal server error", { status: 500 });
    }
}
