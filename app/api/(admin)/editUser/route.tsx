import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return new Response("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { usernameToUpdate, username, email, role, name } = body;

        if (!usernameToUpdate) {
            return new Response("usernameToUpdate is required", { status: 400 });
        }

        if (!username && !email && !role) {
            return new Response(JSON.stringify({
                error: "At least one field (username, email, or role) must be provided for update"
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { username: usernameToUpdate }
        });

        if (!existingUser) {
            return new Response(JSON.stringify({
                error: "User not found"
            }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const updateData: Partial<{ username: string; email: string; role: Role; name: string }> = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        //reason to not use `as Role` here is to ensure that the role is a valid Role type
        if (role) updateData.role = role as Role;
        if (name) updateData.name = name;
        if (name) updateData.name = name;

        if (username && username !== existingUser.username) {
            const duplicateUsername = await prisma.user.findUnique({
                where: { username }
            });
            if (duplicateUsername) {
                return new Response(JSON.stringify({
                    error: "Username already exists"
                }), { 
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        if (email && email !== existingUser.email) {
            const duplicateEmail = await prisma.user.findUnique({
                where: { email }
            });
            if (duplicateEmail) {
                return new Response(JSON.stringify({
                    error: "Email already exists"
                }), { 
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { username: usernameToUpdate },
            data: { ...updateData }
        });

        return new Response(JSON.stringify({
            success: true,
            message: "User updated successfully",
            user: {
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                name: updatedUser.name
            }
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Error updating user:", error);
        
        if (error instanceof Error) {
            if (error.message.includes('Unique constraint')) {
                return new Response(JSON.stringify({
                    error: "Username or email already exists"
                }), { 
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response(JSON.stringify({
            error: "Internal Server Error"
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}