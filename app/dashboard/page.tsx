import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  // Protect the route
  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <div className="flex min-h-screen">
        <div className="w-64 bg-sidebar p-6">
          <Button/>
        </div>
        <div className="flex-1 bg-background p-6">

        </div>
      </div>
    </>
  );
}