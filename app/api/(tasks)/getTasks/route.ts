import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Status } from "@prisma/client";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as Status | null;
    const projectId = searchParams.get('projectId') || '';
    const assignedTo = searchParams.get('assignedTo') || '';
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
    const validSortFields = ['createdAt', 'updatedAt', 'dueDate', 'title', 'status'];
    const validSortOrders = ['asc', 'desc'];
    
    if (!validSortFields.includes(sortBy) || !validSortOrders.includes(sortOrder)) {
        return new Response("Invalid sort parameters", { status: 400 });
    }

    const skip = (page - 1) * limit;

    try {
        // Build where clause based on role
        const baseWhere: Record<string, unknown> = {};

        // Role-based filtering
        if (role === 'CLIENT') {
            // Clients can only see tasks assigned to them
            baseWhere.userId = session.user.id;
        } else if (role === 'PROFESSIONAL') {
            // Professionals can see tasks they created or are assigned to
            baseWhere.OR = [
                { userId: session.user.id },
                { assignedById: session.user.id }
            ];
        }
        // MANAGER and SUPER_ADMIN can see all tasks

        // Apply filters
        const whereClause: Record<string, unknown> = { ...baseWhere };

        if (search) {
            const existingOr = Array.isArray(whereClause.OR) ? whereClause.OR : [];
            whereClause.OR = [
                ...existingOr,
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (status) {
            whereClause.status = status;
        }

        if (projectId) {
            whereClause.projectId = projectId;
        }

        if (assignedTo) {
            whereClause.userId = assignedTo;
        }

        // Get total count for pagination
        const totalTasks = await prisma.tasks.count({
            where: whereClause
        });

        // Get tasks with pagination and sorting
        const tasks = await prisma.tasks.findMany({
            where: whereClause,
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
                },
                Timer: {
                    select: {
                        id: true,
                        duration: true
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
        const totalPages = Math.ceil(totalTasks / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        // Add calculated fields to tasks
        const tasksWithStats = tasks.map(task => ({
            ...task,
            totalTimeSpent: task.Timer.reduce((sum, timer) => sum + (timer.duration || 0), 0),
            timerCount: task.Timer.length
        }));

        return new Response(JSON.stringify({
            success: true,
            data: {
                tasks: tasksWithStats,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalTasks,
                    limit,
                    hasNext,
                    hasPrev
                },
                filters: {
                    search,
                    status,
                    projectId,
                    assignedTo,
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
        console.error("Error fetching tasks:", error);
        return new Response("Internal server error while fetching tasks", { status: 500 });
    }
}
