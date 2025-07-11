import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response("Unauthenticated", { status: 401 });
    }
    
    if (session.user.role !== "SUPER_ADMIN") {
      return new Response("Unauthorized", { status: 403 });
    }

    const body = await request.json();
    const { username, name, email, password, role } = body;
    
    if (!username || !name || !email || !password || !role) {
      return new Response("Missing required fields", { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      return new Response("Username or email already exists", { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        username,
        name,
        email,
        password: hashedPassword,
        role: role
      },
    });
    
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(JSON.stringify({
      error: "Internal Server Error"
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}