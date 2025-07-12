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

    try {
        const project = await prisma.project.findUnique({
            where: { id: params.id },
            select: {
                clientId: true,
                teamId: true,
                team: {
                    select: {
                        userTeams: {
                            select: {
                                userId: true
                            }
                        }
                    }
                }
            }
        });

        if (!project) {
            return new Response("Project not found", { status: 404 });
        }

        const isTeamMember = project.team?.userTeams.some(ut => ut.userId === session.user.id);
        const hasAccess = project.clientId === session.user.id ||
                         isTeamMember ||
                         ['SUPER_ADMIN', 'MANAGER'].includes(session.user.role || '');

        if (!hasAccess) {
            return new Response("Unauthorized", { status: 401 });
        }

        const comments = await prisma.projectComment.findMany({
            where: { projectId: params.id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        image: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        return new Response(JSON.stringify({
            success: true,
            comments
        }), { status: 200 });
    } catch {
        return new Response("Error fetching comments", { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
        return new Response("Comment content is required", { status: 400 });
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id: params.id },
            select: {
                clientId: true,
                teamId: true,
                team: {
                    select: {
                        userTeams: {
                            select: {
                                userId: true
                            }
                        }
                    }
                }
            }
        });

        if (!project) {
            return new Response("Project not found", { status: 404 });
        }

        const isTeamMember = project.team?.userTeams.some(ut => ut.userId === session.user.id);
        const hasAccess = project.clientId === session.user.id ||
                         isTeamMember ||
                         ['SUPER_ADMIN', 'MANAGER'].includes(session.user.role || '');

        if (!hasAccess) {
            return new Response("Unauthorized", { status: 401 });
        }

        const comment = await prisma.projectComment.create({
            data: {
                content: content.trim(),
                projectId: params.id,
                authorId: session.user.id
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        image: true
                    }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            comment
        }), { status: 201 });
    } catch {
        return new Response("Error creating comment", { status: 500 });
    }
}
