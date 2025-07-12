import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const activeTimer = await prisma.timer.findFirst({
            where: {
                endTime: null,
                task: {
                    userId: session.user.id
                }
            },
            include: {
                task: {
                    select: {
                        taskId: true,
                        title: true
                    }
                }
            }
        });

        if (!activeTimer) {
            return new Response(JSON.stringify({
                success: true,
                activeTimer: null
            }), { status: 200 });
        }

        // Calculate current duration
        const duration = activeTimer.startTime 
            ? Math.round((new Date().getTime() - activeTimer.startTime.getTime()) / 1000)
            : 0;

        return new Response(JSON.stringify({
            success: true,
            activeTimer: {
                ...activeTimer,
                duration
            }
        }), { status: 200 });
    } catch {
        return new Response("Error fetching active timer", { status: 500 });
    }
}
