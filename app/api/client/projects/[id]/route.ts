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

    if (session.user.role !== 'CLIENT') {
        return new Response("This endpoint is for clients only", { status: 403 });
    }

    try {
        const project = await prisma.project.findUnique({
            where: {
                id,
                clientId: session.user.id // Ensure client can only see their own projects
            },
            include: {
                tasks: {
                    select: {
                        taskId: true,
                        title: true,
                        description: true,
                        status: true,
                        priority: true,
                        dueDate: true,
                        createdAt: true,
                        updatedAt: true,
                        assignedTo: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                role: true
                            }
                        },
                        assignedBy: {
                            select: {
                                name: true
                            }
                        },
                        comments: {
                            select: {
                                id: true,
                                content: true,
                                createdAt: true,
                                author: {
                                    select: {
                                        name: true,
                                        role: true,
                                        image: true
                                    }
                                }
                            },
                            orderBy: {
                                createdAt: 'desc'
                            },
                            take: 5
                        },
                        _count: {
                            select: {
                                comments: true
                            }
                        }
                    },
                    orderBy: [
                        { status: 'asc' }, // Show pending tasks first
                        { priority: 'desc' },
                        { dueDate: 'asc' }
                    ]
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                        icon: true,
                        userTeams: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        image: true,
                                        role: true
                                    }
                                }
                            }
                        }
                    }
                },
                comments: {
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
                },
                _count: {
                    select: {
                        tasks: true,
                        comments: true
                    }
                }
            }
        });

        if (!project) {
            return new Response("Project not found", { status: 404 });
        }

        // Calculate progress
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter((task: typeof project.tasks[0]) => task.status === 'COMPLETED').length;
        const inProgressTasks = project.tasks.filter((task: typeof project.tasks[0]) => task.status === 'IN_PROGRESS').length;
        const pendingTasks = project.tasks.filter((task: typeof project.tasks[0]) => task.status === 'PENDING').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Check if project is overdue
        const isOverdue = project.endDate && new Date() > project.endDate && progress < 100;

        return new Response(JSON.stringify({
            success: true,
            project: {
                ...project,
                progress,
                totalTasks,
                completedTasks,
                inProgressTasks,
                pendingTasks,
                isOverdue
            }
        }), { status: 200 });
    } catch {
        return new Response("Error fetching project", { status: 500 });
    }
}
