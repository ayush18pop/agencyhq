import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Users can view their own profile, managers/admins can view any
    if (session.user.id !== id && !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role || '')) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                role: true,
                image: true,
                createdAt: true,
                userTeams: {
                    include: {
                        team: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                                icon: true
                            }
                        }
                    }
                },
                assignedTasks: {
                    select: {
                        taskId: true,
                        title: true,
                        status: true,
                        dueDate: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 10
                },
                _count: {
                    select: {
                        userTeams: true,
                        assignedTasks: true,
                        createdTasks: true
                    }
                }
            }
        });

        if (!user) {
            return new Response("User not found", { status: 404 });
        }

        return new Response(JSON.stringify({
            success: true,
            user
        }), { status: 200 });
    } catch {
        return new Response("Error fetching user", { status: 500 });
    }
}

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Users can edit their own profile, admins can edit any
    if (session.user.id !== id && session.user.role !== 'SUPER_ADMIN') {
        return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, username, email, role } = body;

    // Only admins can change roles
    if (role && session.user.role !== 'SUPER_ADMIN') {
        return new Response("Unauthorized to change role", { status: 401 });
    }

    try {
        const updateData: {
            name?: string;
            username?: string;
            email?: string;
            role?: 'SUPER_ADMIN' | 'MANAGER' | 'PROFESSIONAL' | 'CLIENT';
        } = {};
        if (name) updateData.name = name.trim();
        if (username) updateData.username = username.trim();
        if (email) updateData.email = email.trim();
        if (role && session.user.role === 'SUPER_ADMIN') {
            updateData.role = role as 'SUPER_ADMIN' | 'MANAGER' | 'PROFESSIONAL' | 'CLIENT';
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                role: true,
                image: true
            }
        });

        return new Response(JSON.stringify({
            success: true,
            user
        }), { status: 200 });
    } catch {
        return new Response("Error updating user", { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'SUPER_ADMIN') {
        return new Response("Unauthorized", { status: 401 });
    }

    // Prevent deleting yourself
    if (session.user.id === id) {
        return new Response("Cannot delete your own account", { status: 400 });
    }

    try {
        await prisma.user.delete({
            where: { id }
        });

        return new Response(JSON.stringify({
            success: true,
            message: "User deleted successfully"
        }), { status: 200 });
    } catch {
        return new Response("Error deleting user", { status: 500 });
    }
}
