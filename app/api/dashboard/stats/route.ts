
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { role, id: userId } = session.user;

    try {
        if (role === "SUPER_ADMIN" || role === "MANAGER") {
            const [projects, tasks, teamMembers, revenue] = await Promise.all([
                prisma.project.count(),
                prisma.tasks.count({ where: { status: { not: "COMPLETED" } } }),
                prisma.user.count({ where: { role: { not: "CLIENT" } } }),
                prisma.project.aggregate({ _sum: { budget: true } })
            ]);
            return Response.json({
                success: true,
                stats: {
                    projects,
                    tasks,
                    teamMembers,
                    revenue: revenue._sum.budget || 0
                },
                role
            });
        }

        if (role === "CLIENT") {
            const [projects, tasks, totalValue] = await Promise.all([
                prisma.project.count({ where: { clientId: userId } }),
                prisma.tasks.count({
                    where: {
                        project: { clientId: userId },
                        status: { not: "COMPLETED" }
                    }
                }),
                prisma.project.aggregate({ where: { clientId: userId }, _sum: { budget: true } })
            ]);
            const allTasks = await prisma.tasks.findMany({
                where: { project: { clientId: userId } },
                select: { status: true }
            });
            const completed = allTasks.filter(t => t.status === "COMPLETED").length;
            const completionRate = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;
            return Response.json({
                success: true,
                stats: {
                    projects,
                    tasks,
                    completionRate,
                    totalValue: totalValue._sum.budget || 0
                },
                role
            });
        }

        // PROFESSIONAL or other roles
        const [projects, tasks] = await Promise.all([
            prisma.project.count({ where: { tasks: { some: { assignedTo: { id: userId } } } } }),
            prisma.tasks.count({ where: { assignedTo: { id: userId }, status: { not: "COMPLETED" } } })
        ]);
        const myTasks = await prisma.tasks.findMany({ where: { assignedTo: { id: userId } }, select: { status: true } });
        const completed = myTasks.filter(t => t.status === "COMPLETED").length;
        const completionRate = myTasks.length > 0 ? Math.round((completed / myTasks.length) * 100) : 0;
        return Response.json({
            success: true,
            stats: {
                projects,
                tasks,
                completionRate,
                hoursLogged: 0
            },
            role
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return new Response("Internal server error", { status: 500 });
    }
}
