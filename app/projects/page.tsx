import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
interface ProjectStats {
  [key: string]: number;
}

interface Project{
  id: string;
  name: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'| 'ON_HOLD'| 'CANCELLED'; 
  client: string;
  money: number;
  tasks: number;
  createdAt: string;

}

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }


  // Use headers() to get the raw cookie string for API authentication (Next.js 15+)
  const incomingHeaders = await headers();
  const cookie = incomingHeaders.get("cookie") ?? "";

  const statsRes = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/dashboard/stats`, {
    headers: { cookie },
    cache: "no-store"
  });

  if (!statsRes.ok) {
    const errorText = await statsRes.text();
    console.error("Stats API error:", errorText);
    throw new Error("Failed to fetch project stats");
  }

  const statsJson = await statsRes.json();
  const statsData: ProjectStats = statsJson.stats || {};

  // Define a mapping for display names
  const statLabels: { [key: string]: string } = {
    projects: "Total Projects",
    tasks: "Active Tasks",
    teamMembers: "Team Members",
    revenue: "Revenue",
    completed: "Completed",
    completionRate: "Completion Rate",
    totalValue: "Total Value",
    hoursLogged: "Hours Logged"
  };

  // Define a mapping for formatting
  const statFormat: { [key: string]: (val: number) => string } = {
    revenue: (val) => `$${val.toLocaleString()}`,
    totalValue: (val) => `$${val.toLocaleString()}`,
    completionRate: (val) => `${val}%`,
    hoursLogged: (val) => `${val}h`
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.keys(statsData).map((key) => (
          <div key={key} className="bg-card text-card-foreground rounded-lg border p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">{statLabels[key] || key}</h3>
            </div>
            <div className="text-2xl font-bold">
              {typeof statsData[key] === "number"
                ? (statFormat[key] ? statFormat[key](statsData[key]) : statsData[key])
                : "N/A"}
            </div>
          </div>
        ))}
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
