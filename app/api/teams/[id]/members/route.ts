import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
        return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
        return new Response("User ID is required", { status: 400 });
    }

    try {
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return new Response("User not found", { status: 404 });
        }

        // Check if team exists
        const team = await prisma.team.findUnique({
            where: { id }
        });

        if (!team) {
            return new Response("Team not found", { status: 404 });
        }

        // Check if user is already in team
        const existingMembership = await prisma.userTeam.findUnique({
            where: {
                userId_teamId: {
                    userId,
                    teamId: id
                }
            }
        });

        if (existingMembership) {
            return new Response("User is already a member of this team", { status: 400 });
        }

        // Add user to team
        const userTeam = await prisma.userTeam.create({
            data: {
                userId,
                teamId: id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            userTeam
        }), { status: 201 });
    } catch {
        return new Response("Error adding user to team", { status: 500 });
    }
}
