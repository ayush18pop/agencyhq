import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";
export async function POST(request: Request) {
    const body = request.json();
    const session = await getServerSession(authOptions);
    
}