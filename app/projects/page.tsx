import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Projects</h3>
          </div>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">+2 from last month</p>
        </div>
        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Projects</h3>
          </div>
          <div className="text-2xl font-bold">8</div>
          <p className="text-xs text-muted-foreground">+1 from last week</p>
        </div>
        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Completed</h3>
          </div>
          <div className="text-2xl font-bold">4</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </div>
        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Revenue</h3>
          </div>
          <div className="text-2xl font-bold">$24,500</div>
          <p className="text-xs text-muted-foreground">+18% from last month</p>
        </div>
      </div>
      <div className="bg-muted/50 min-h-[400px] flex-1 rounded-xl p-4">
        <h3 className="text-lg font-medium mb-4">Recent Projects</h3>
        <p className="text-muted-foreground">
          Project list will be implemented here with the API integration.
        </p>
      </div>
    </div>
  );
}
