import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const session = await getServerSession(authOptions);
    const role = session?.user.role;
    
    if (!session || !role) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Only SUPER_ADMIN can delete projects
    if (role !== 'SUPER_ADMIN') {
        return new Response("Only Super Admin can delete projects", { status: 403 });
    }

    if (!id) {
        return new Response("Project ID is required", { status: 400 });
    }

    try {
        // Check if project exists and has tasks
        const existingProject = await prisma.project.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { tasks: true }
                }
            }
        });

        if (!existingProject) {
            return new Response("Project not found", { status: 404 });
        }

        if (existingProject._count.tasks > 0) {
            return new Response("Cannot delete project with existing tasks. Please remove all tasks first.", { status: 400 });
        }

        await prisma.project.delete({
            where: { id }
        });

        return new Response(JSON.stringify({
            success: true,
            message: "Project deleted successfully"
        }), { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error deleting project:", error);
        
        if (error instanceof Error) {
            if (error.message.includes('Record to delete does not exist')) {
                return new Response("Project not found", { status: 404 });
            }
        }
        
        return new Response("Internal server error while deleting project", { status: 500 });
    }
}
