import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Users can view their own teams, managers/admins can view any user's teams
    if (session.user.id !== params.id && !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role || '')) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const userTeams = await prisma.userTeam.findMany({
            where: {
                userId: params.id
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        color: true,
                        icon: true,
                        _count: {
                            select: {
                                userTeams: true,
                                projects: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                joinedAt: 'desc'
            }
        });

        return new Response(JSON.stringify({
            success: true,
            teams: userTeams.map(ut => ({
                ...ut.team,
                joinedAt: ut.joinedAt
            }))
        }), { status: 200 });
    } catch {
        return new Response("Error fetching user teams", { status: 500 });
    }
}
