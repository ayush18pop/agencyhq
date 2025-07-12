import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const session = await getServerSession(authOptions);
    const role = session?.user.role;
    
    if (!session || !role) {
        return new Response("Unauthorized", { status: 401 });
    }

    if (!projectId) {
        return new Response("Project ID is required", { status: 400 });
    }

    try {
        // Get project with full details
        const project = await prisma.project.findUnique({
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
                        },
                        assignedBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                        Timer: {
                            select: {
                                id: true,
                                startTime: true,
                                endTime: true,
                                duration: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!project) {
            return new Response("Project not found", { status: 404 });
        }

        // Calculate detailed project statistics
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(task => task.status === 'COMPLETED').length;
        const pendingTasks = project.tasks.filter(task => task.status === 'PENDING').length;
        const inProgressTasks = project.tasks.filter(task => task.status === 'IN_PROGRESS').length;
        const onHoldTasks = project.tasks.filter(task => task.status === 'ON_HOLD').length;
        const cancelledTasks = project.tasks.filter(task => task.status === 'CANCELLED').length;
        
        const overdueTasks = project.tasks.filter(task => 
            task.dueDate && 
            new Date(task.dueDate) < new Date() && 
            task.status !== 'COMPLETED'
        ).length;
        
        const dueSoonTasks = project.tasks.filter(task => {
            if (!task.dueDate || task.status === 'COMPLETED') return false;
            const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            return daysUntilDue <= 3 && daysUntilDue >= 0;
        }).length;
        
        const totalTimeSpent = project.tasks.reduce((sum, task) => 
            sum + task.Timer.reduce((timerSum, timer) => timerSum + (timer.duration || 0), 0), 0
        );
        
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Get unique team members working on this project
        const teamMembersMap = new Map();
        project.tasks.forEach(task => {
            if (!teamMembersMap.has(task.assignedTo.id)) {
                teamMembersMap.set(task.assignedTo.id, task.assignedTo);
            }
        });
        const teamMembers = Array.from(teamMembersMap.values());

        // Calculate time spent per team member
        const teamMemberStats = teamMembers.map(member => {
            const memberTasks = project.tasks.filter(task => task.assignedTo.id === member.id);
            const memberTimeSpent = memberTasks.reduce((sum, task) => 
                sum + task.Timer.reduce((timerSum, timer) => timerSum + (timer.duration || 0), 0), 0
            );
            const memberCompletedTasks = memberTasks.filter(task => task.status === 'COMPLETED').length;

            return {
                id: member.id,
                name: member.name,
                email: member.email,
                role: member.role,
                stats: {
                    totalTasks: memberTasks.length,
                    completedTasks: memberCompletedTasks,
                    timeSpent: memberTimeSpent,
                    completionRate: memberTasks.length > 0 ? Math.round((memberCompletedTasks / memberTasks.length) * 100) : 0
                }
            };
        });

        // Recent activity (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const recentTasks = project.tasks.filter(task => 
            new Date(task.updatedAt) >= weekAgo
        ).slice(0, 10);

        const projectWithStats = {
            ...project,
            statistics: {
                totalTasks,
                completedTasks,
                pendingTasks,
                inProgressTasks,
                onHoldTasks,
                cancelledTasks,
                overdueTasks,
                dueSoonTasks,
                completionPercentage,
                totalTimeSpent,
                teamMemberCount: teamMembers.length,
                averageTaskCompletionTime: completedTasks > 0 ? Math.round(totalTimeSpent / completedTasks) : 0
            },
            teamMembers: teamMemberStats,
            recentActivity: recentTasks.map(task => ({
                taskId: task.taskId,
                title: task.title,
                status: task.status,
                updatedAt: task.updatedAt,
                assignedTo: task.assignedTo.name
            }))
        };

        return new Response(JSON.stringify({
            success: true,
            project: projectWithStats
        }), { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error fetching project:", error);
        return new Response("Internal server error while fetching project", { status: 500 });
    }
}
