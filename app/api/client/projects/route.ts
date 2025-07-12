import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Only clients can access this endpoint
    if (session.user.role !== 'CLIENT') {
        return new Response("This endpoint is for clients only", { status: 403 });
    }

    try {
        const projects = await prisma.project.findMany({
            where: {
                clientId: session.user.id
            },
            include: {
                tasks: {
                    select: {
                        taskId: true,
                        title: true,
                        status: true,
                        priority: true,
                        dueDate: true,
                        assignedTo: {
                            select: {
                                name: true,
                                image: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                team: {
                    select: {
                        name: true,
                        color: true,
                        icon: true
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
                                role: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 3 // Latest 3 comments
                },
                _count: {
                    select: {
                        tasks: true,
                        comments: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Calculate progress for each project
        const projectsWithProgress = projects.map(project => {
            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter(task => task.status === 'COMPLETED').length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            return {
                ...project,
                progress,
                totalTasks,
                completedTasks
            };
        });

        return new Response(JSON.stringify({
            success: true,
            projects: projectsWithProgress
        }), { status: 200 });
    } catch {
        return new Response("Error fetching client projects", { status: 500 });
    }
}
