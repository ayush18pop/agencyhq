import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    const body = await request.json();
    const session = await getServerSession(authOptions);
    const role = session?.user.role;
    
    if (!session || !role) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Only SUPER_ADMIN and MANAGER can create projects
    if (role !== 'SUPER_ADMIN' && role !== 'MANAGER') {
        return new Response("Insufficient permissions to create projects", { status: 403 });
    }

    const { name, description, clientId, teamId, startDate, endDate, budget } = body;

    if (!name || !description) {
        return new Response("Missing required fields: name and description", { status: 400 });
    }

    // Validate input lengths
    if (name.length < 3 || name.length > 100) {
        return new Response("Project name must be between 3 and 100 characters", { status: 400 });
    }

    if (description.length < 10 || description.length > 500) {
        return new Response("Project description must be between 10 and 500 characters", { status: 400 });
    }

    try {
        // Check if project with same name already exists
        const existingProject = await prisma.project.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive' // Case-insensitive search
                }
            }
        });

        if (existingProject) {
            return new Response("A project with this name already exists", { status: 409 });
        }

        const projectData = {
            name: name.trim(),
            description: description.trim(),
            clientId: clientId || null,
            teamId: teamId || null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            budget: budget ? parseFloat(budget) : null,
        };

        const project = await prisma.project.create({
            data: projectData,
            include: {
                tasks: true,
                team: {
                    select: {
                        name: true,
                        color: true,
                        icon: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: { 
                        tasks: true,
                        comments: true
                    }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            message: "Project created successfully",
            project: project
        }), { 
            status: 201,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error creating project:", error);
        
        // Handle specific Prisma errors
        if (error instanceof Error) {
            if (error.message.includes('Unique constraint')) {
                return new Response("A project with this name already exists", { status: 409 });
            }
        }
        
        return new Response("Internal server error while creating project", { status: 500 });
    }
}