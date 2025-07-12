import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function DELETE(
    request: Request,
    { params }: { params: { id: string; userId: string } }
) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        // Check if membership exists
        const userTeam = await prisma.userTeam.findUnique({
            where: {
                userId_teamId: {
                    userId: params.userId,
                    teamId: params.id
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
                    userId: params.userId,
                    teamId: params.id
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
