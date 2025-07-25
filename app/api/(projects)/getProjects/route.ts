import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    let limit: number | undefined = undefined;
    try{
    const body = await req.json();
    const parsedInt = parseInt(body.limit,10);
        if(!isNaN(parsedInt) && parsedInt>0){
            limit = parsedInt;
        }
    }
    catch(e){
        console.log("error getting body/parsing body", e);
    }
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if(session.user.role == "SUPER_ADMIN" || session.user.role == "MANAGER") {
        const projects = await prisma.project.findMany({
            include: { tasks: true },
            take: limit
        });
        return NextResponse.json({ projects });
    }
    else if(session.user.role == "CLIENT") {
        const projects = await prisma.project.findMany({
            where: { clientId: session.user.id },
            include: { tasks: true },
            take: limit
        });
        return NextResponse.json({ projects });
    }   
    else if(session.user.role == "PROFESSIONAL") {
        const projects = await prisma.project.findMany({
            where: { tasks: { some: { assignedTo: { id: session.user.id } } } },
            include: { tasks: true },
            take: limit
        });
        return NextResponse.json({ projects });
    }
 return NextResponse.json(session.user);

}