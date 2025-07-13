import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    const body = await request.json();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { name, description, color, icon } = body;

    if (!name) {
        return new Response("Team name is required", { status: 400 });
    }

    try {
        const team = await prisma.team.create({
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
        }), { status: 201 });
    } catch {
        return new Response("Error creating team", { status: 500 });
    }
}
