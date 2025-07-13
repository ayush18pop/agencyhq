import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PUT(request: Request) {
    const body = await request.json();
    const session = await getServerSession(authOptions);
    const role = session?.user.role;
    
    if (!session || !role) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Only SUPER_ADMIN and MANAGER can edit projects
    if (role !== 'SUPER_ADMIN' && role !== 'MANAGER') {
        return new Response("Insufficient permissions to edit projects", { status: 403 });
    }

    const { id, name, description } = body;

    if (!id) {
        return new Response("Project ID is required", { status: 400 });
    }

    if (!name && !description) {
        return new Response("At least one field (name or description) must be provided", { status: 400 });
    }

    if (name && (name.length < 3 || name.length > 100)) {
        return new Response("Project name must be between 3 and 100 characters", { status: 400 });
    }

    if (description && (description.length < 10 || description.length > 500)) {
        return new Response("Project description must be between 10 and 500 characters", { status: 400 });
    }

    try {
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

        if (name && name.trim() !== existingProject.name) {
            const nameConflict = await prisma.project.findFirst({
                where: {
                    name: {
                        equals: name.trim(),
                        mode: 'insensitive'
                    },
                    id: {
                        not: id
                    }
                }
            });

            if (nameConflict) {
                return new Response("A project with this name already exists", { status: 409 });
            }
        }

        const updateData: { name?: string; description?: string } = {};
        if (name) updateData.name = name.trim();
        if (description) updateData.description = description.trim();

        const updatedProject = await prisma.project.update({
            where: { id },
            data: updateData,
            include: {
                tasks: {
                    select: {
                        taskId: true,
                        title: true,
                        status: true
                    }
                },
                _count: {
                    select: { tasks: true }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            message: "Project updated successfully",
            project: updatedProject
        }), { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error updating project:", error);
        
        if (error instanceof Error) {
            if (error.message.includes('Unique constraint')) {
                return new Response("A project with this name already exists", { status: 409 });
            }
            if (error.message.includes('Record to update not found')) {
                return new Response("Project not found", { status: 404 });
            }
        }
        
        return new Response("Internal server error while updating project", { status: 500 });
    }
}
