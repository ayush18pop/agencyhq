import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { user } = session;
    const { role, id: userId } = user;

    try {
        let stats;

        if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
            const [projectCount, taskCount, userCount, totalRevenue] = await Promise.all([
                prisma.project.count(),
                prisma.tasks.count({ where: { status: { not: 'COMPLETED' } } }),
                prisma.user.count({ where: { role: { not: 'CLIENT' } } }),
                prisma.project.aggregate({ _sum: { budget: true } })
            ]);

            stats = {
                projects: projectCount,
                tasks: taskCount,
                teamMembers: userCount,
                revenue: totalRevenue._sum.budget || 0
            };
        } else if (role === 'CLIENT') {
            const [projectCount, taskCount, totalValue] = await Promise.all([
                prisma.project.count({ where: { clientId: userId } }),
                prisma.tasks.count({
                    where: {
                        project: { clientId: userId },
                        status: { not: 'COMPLETED' }
                    }
                }),
                prisma.project.aggregate({
                    where: { clientId: userId },
                    _sum: { budget: true }
                })
            ]);

            const allTasks = await prisma.tasks.findMany({
                where: { project: { clientId: userId } },
                select: { status: true }
            });

            const completedTasks = allTasks.filter((task: { status: string }) => task.status === 'COMPLETED').length;
            const completionPercentage = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

            stats = {
                projects: projectCount,
                tasks: taskCount,
                completionRate: completionPercentage,
                totalValue: totalValue._sum.budget || 0
            };
        } else {
            const [projectCount, taskCount] = await Promise.all([
                prisma.project.count({
                    where: {
                        tasks: { some: { assignedTo: { id: userId } } }
                    }
                }),
                prisma.tasks.count({
                    where: {
                        assignedTo: { id: userId },
                        status: { not: 'COMPLETED' }
                    }
                })
            ]);

            const myTasks = await prisma.tasks.findMany({
                where: { assignedTo: { id: userId } },
                select: { status: true }
            });

            const myCompletedTasks = myTasks.filter((task: { status: string }) => task.status === 'COMPLETED').length;
            const myCompletionPercentage = myTasks.length > 0 ? Math.round((myCompletedTasks / myTasks.length) * 100) : 0;

            stats = {
                projects: projectCount,
                tasks: taskCount,
                completionRate: myCompletionPercentage,
                hoursLogged: 0
            };
        }

        return Response.json({ success: true, stats, role });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return new Response("Internal server error", { status: 500 });
    }
}
