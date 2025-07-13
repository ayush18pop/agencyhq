import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string; userId: string }> }
) {
    const { id, userId } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        // Check if membership exists
        const userTeam = await prisma.userTeam.findUnique({
            where: {
                userId_teamId: {
                    userId: userId,
                    teamId: id
                }
            }
        });

        if (!userTeam) {
            return new Response("User is not a member of this team", { status: 404 });
        }

        // Remove user from team
        await prisma.userTeam.delete({
            where: {
                userId_teamId: {
                    userId: userId,
                    teamId: id
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            message: "User removed from team successfully"
        }), { status: 200 });
    } catch {
        return new Response("Error removing user from team", { status: 500 });
    }
}
