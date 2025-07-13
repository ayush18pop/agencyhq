import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                role: true,
                image: true,
                createdAt: true,
                _count: {
                    select: {
                        userTeams: true,
                        assignedTasks: true,
                        createdTasks: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return new Response(JSON.stringify({
            success: true,
            users
        }), { status: 200 });
    } catch {
        return new Response("Error fetching users", { status: 500 });
    }
}
