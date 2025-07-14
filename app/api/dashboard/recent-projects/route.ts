import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }
    
    if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'MANAGER') {
        const recentProjects = await prisma.project.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            take: 5,
            include: {
                client: {
                    select: { name: true }
                },
                tasks: {
                    select: { status: true }
                }
            }
        });
        return new Response(JSON.stringify(recentProjects), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } else if (session.user.role === 'CLIENT') {
        const recentProjects = await prisma.project.findMany({
            where: {
                clientId: session.user.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5,
            include: {
                tasks: {
                    select: { status: true }
                }
            }
        });
        return new Response(JSON.stringify(recentProjects), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } else {
        const recentProjects = await prisma.project.findMany({
            where: {
                tasks: {
                    some: {
                        assignedTo: { id: session.user.id }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5,
            include: {
                client: {
                    select: { name: true }
                },
                tasks: {
                    select: { status: true }
                }
            }
        });
        return new Response(JSON.stringify(recentProjects), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    }

}