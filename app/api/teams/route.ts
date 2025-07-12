import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const teams = await prisma.team.findMany({
            include: {
                _count: {
                    select: {
                        userTeams: true,
                        projects: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return new Response(JSON.stringify({
            success: true,
            teams
        }), { status: 200 });
    } catch {
        return new Response("Error fetching teams", { status: 500 });
    }
}
