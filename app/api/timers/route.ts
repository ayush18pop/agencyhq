import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client"; // Import Prisma types for safety

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const paramTaskId = searchParams.get("taskId");

    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const whereClause: Prisma.TimerWhereInput = {};

        if (!['SUPER_ADMIN', 'MANAGER'].includes(session.user.role || '')) {
            whereClause.task = {
                userId: session.user.id
            };
        }

        if (paramTaskId) {
            whereClause.taskId = paramTaskId;
        }

        const timers = await prisma.timer.findMany({
            where: whereClause, 
            include: {
                task: {
                    select: {
                        taskId: true,
                        title: true,
                        assignedTo: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        return new Response(JSON.stringify({
            timers
        }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
        console.error("Error fetching timers:", error);
        return new Response("Error fetching timers", { status: 500 });
    }
}