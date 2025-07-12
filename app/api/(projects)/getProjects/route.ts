import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const session = await getServerSession(authOptions);
    const role = session?.user.role;
    
    if (!session || !role) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
        return new Response("Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100", { status: 400 });
    }

    // Validate sort parameters
    const validSortFields = ['createdAt', 'updatedAt', 'name'];
    const validSortOrders = ['asc', 'desc'];
    
    if (!validSortFields.includes(sortBy) || !validSortOrders.includes(sortOrder)) {
        return new Response("Invalid sort parameters", { status: 400 });
    }

    const skip = (page - 1) * limit;

    try {
        // Build where clause for search
        const whereClause: Record<string, unknown> = {};

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Get total count for pagination
        const totalProjects = await prisma.project.count({
            where: whereClause
        });

        // Get projects with pagination and sorting
        const projects = await prisma.project.findMany({
            where: whereClause,
            include: {
                tasks: {
                    select: {
                        taskId: true,
                        title: true,
                        status: true,
                        dueDate: true,
                        Timer: {
                            select: {
                                duration: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                [sortBy]: sortOrder
            },
            skip,
            take: limit
        });

        // Calculate pagination info
        const totalPages = Math.ceil(totalProjects / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        // Add calculated fields to projects
        const projectsWithStats = projects.map(project => {
            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter(task => task.status === 'COMPLETED').length;
            const pendingTasks = project.tasks.filter(task => task.status === 'PENDING').length;
            const inProgressTasks = project.tasks.filter(task => task.status === 'IN_PROGRESS').length;
            const overdueTasks = project.tasks.filter(task => 
                task.dueDate && 
                new Date(task.dueDate) < new Date() && 
                task.status !== 'COMPLETED'
            ).length;
            
            const totalTimeSpent = project.tasks.reduce((sum, task) => 
                sum + task.Timer.reduce((timerSum, timer) => timerSum + (timer.duration || 0), 0), 0
            );
            
            const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return {
                ...project,
                statistics: {
                    totalTasks,
                    completedTasks,
                    pendingTasks,
                    inProgressTasks,
                    overdueTasks,
                    completionPercentage,
                    totalTimeSpent
                }
            };
        });

        return new Response(JSON.stringify({
            success: true,
            data: {
                projects: projectsWithStats,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalProjects,
                    limit,
                    hasNext,
                    hasPrev
                },
                filters: {
                    search,
                    sortBy,
                    sortOrder
                }
            }
        }), { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error fetching projects:", error);
        return new Response("Internal server error while fetching projects", { status: 500 });
    }
}
