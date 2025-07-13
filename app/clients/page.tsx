import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Clients</h3>
          </div>
          <div className="text-2xl font-bold">24</div>
          <p className="text-xs text-muted-foreground">+3 from last month</p>
        </div>
        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Clients</h3>
          </div>
          <div className="text-2xl font-bold">18</div>
          <p className="text-xs text-muted-foreground">Currently working</p>
        </div>
        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">New This Month</h3>
          </div>
          <div className="text-2xl font-bold">3</div>
          <p className="text-xs text-muted-foreground">New acquisitions</p>
        </div>
        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Retention Rate</h3>
          </div>
          <div className="text-2xl font-bold">95%</div>
          <p className="text-xs text-muted-foreground">Last 12 months</p>
        </div>
      </div>
      <div className="bg-muted/50 min-h-[400px] flex-1 rounded-xl p-4">
        <h3 className="text-lg font-medium mb-4">Client Directory</h3>
        <p className="text-muted-foreground">Client management interface will be implemented here.</p>
      </div>
    </div>
  );
}
