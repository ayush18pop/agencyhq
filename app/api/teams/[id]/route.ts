import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const team = await prisma.team.findUnique({
            where: { id: params.id },
            include: {
                userTeams: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                image: true
                            }
                        }
                    }
                },
                projects: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: {
                    select: {
                        userTeams: true,
                        projects: true
                    }
                }
            }
        });

        if (!team) {
            return new Response("Team not found", { status: 404 });
        }

        return new Response(JSON.stringify({
            success: true,
            team
        }), { status: 200 });
    } catch {
        return new Response("Error fetching team", { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
        return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, icon } = body;

    if (!name) {
        return new Response("Team name is required", { status: 400 });
    }

    try {
        const team = await prisma.team.update({
            where: { id: params.id },
            data: {
                name: name.trim(),
                description: description?.trim(),
                color,
                icon,
            }
        });

        return new Response(JSON.stringify({
            success: true,
            team
        }), { status: 200 });
    } catch {
        return new Response("Error updating team", { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'SUPER_ADMIN') {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        await prisma.team.delete({
            where: { id: params.id }
        });

        return new Response(JSON.stringify({
            success: true,
            message: "Team deleted successfully"
        }), { status: 200 });
    } catch {
        return new Response("Error deleting team", { status: 500 });
    }
}
