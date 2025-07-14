

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PieChart, Users, Folder, DollarSign, CheckCircle, Clock } from "lucide-react";


export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  // Fetch stats and recent projects from API routes
  const [statsRes, recentRes] = await Promise.all([
    fetch(`${process.env.NEXTAUTH_URL || ''}/api/dashboard/stats`, { headers: { cookie: '' } }),
    fetch(`${process.env.NEXTAUTH_URL || ''}/api/dashboard/recent-projects`, { headers: { cookie: '' } })
  ]);
  const statsData = statsRes.ok ? await statsRes.json() : { stats: null };
  const recentProjects = recentRes.ok ? await recentRes.json() : [];

  const role = session.user.role || "CLIENT";
  const stats = statsData.stats || {};
  const projects = Array.isArray(recentProjects) ? recentProjects : recentProjects.projects || recentProjects;

  // Stat cards config
  const statCards = [
    role === "SUPER_ADMIN" || role === "MANAGER"
      ? { label: "Projects", value: stats.projects, icon: <Folder className="text-primary" /> }
      : { label: "My Projects", value: stats.projects, icon: <Folder className="text-primary" /> },
    { label: "Tasks", value: stats.tasks, icon: <CheckCircle className="text-green-500" /> },
    role === "SUPER_ADMIN" || role === "MANAGER"
      ? { label: "Team Members", value: stats.teamMembers, icon: <Users className="text-blue-500" /> }
      : null,
    role === "SUPER_ADMIN" || role === "MANAGER"
      ? { label: "Revenue", value: stats.revenue ? `$${stats.revenue}` : "$0", icon: <DollarSign className="text-yellow-500" /> }
      : null,
    stats.completionRate !== undefined
      ? { label: "Completion Rate", value: `${stats.completionRate}%`, icon: <PieChart className="text-purple-500" /> }
      : null,
    stats.hoursLogged !== undefined
      ? { label: "Hours Logged", value: stats.hoursLogged, icon: <Clock className="text-orange-500" /> }
      : null,
    stats.totalValue !== undefined
      ? { label: "Total Value", value: `$${stats.totalValue}`, icon: <DollarSign className="text-yellow-500" /> }
      : null,
  ].filter(Boolean);

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
          <AvatarFallback>{session.user.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-2xl font-bold">Hey, {session.user.name}</div>
          <div className="text-muted-foreground capitalize">Role: {role.replace("_", " ").toLowerCase()}</div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {statCards.map((card, i) => (
          <Card key={i} className="flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              {card?.icon}
              <CardTitle className="text-lg font-semibold">{card?.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card?.value ?? '-'}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Recent Projects</h2>
          <Button variant="outline" asChild>
            <a href="/projects">View All</a>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects && projects.length > 0 ? (
            projects.map((project: {
              id: string | number;
              name: string;
              client?: { name?: string };
              createdAt: string | Date;
              tasks?: { status: string }[];
            }) => {
              const completed = project.tasks?.filter((t) => t.status === 'COMPLETED').length || 0;
              const total = project.tasks?.length || 0;
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <Card key={project.id} className="flex flex-col justify-between">
                  <CardHeader>
                    <CardTitle className="truncate">{project.name}</CardTitle>
                    <CardDescription>
                      {project.client?.name && <span>Client: {project.client.name} · </span>}
                      <span className="text-xs text-muted-foreground">{new Date(project.createdAt).toLocaleDateString()}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground min-w-[32px] text-right">{percent}%</span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {completed} of {total} tasks completed
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" asChild>
                      <a href={`/projects/${project.id}`}>Open Project</a>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center text-muted-foreground">No recent projects found.</div>
          )}
        </div>
      </div>
    </div>
  );
}