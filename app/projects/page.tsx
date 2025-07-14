"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

interface ProjectStats {
  [key: string]: number;
}

export interface RecentProject {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
  teamId?: string;
  client?: { name: string };
  tasks: { status: string }[];
}

export default function ProjectsPage() {
  const [statsData, setStatsData] = useState<ProjectStats>({});
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const statsRes = await fetch("/api/dashboard/stats", { credentials: "include" });
        if (!statsRes.ok) {
          throw new Error("Failed to fetch project stats");
        }
        const statsJson = await statsRes.json();
        setStatsData(statsJson.stats || {});

        const recentProjectsRes = await fetch("/api/dashboard/recent-projects", { credentials: "include" });
        if (!recentProjectsRes.ok) {
          throw new Error("Failed to fetch recent projects");
        }
        const recentProjects: RecentProject[] = await recentProjectsRes.json();
        setRecentProjects(recentProjects);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const statFormat: { [key: string]: (val: number) => string } = {
    revenue: (val) => `$${val.toLocaleString()}`,
    totalValue: (val) => `$${val.toLocaleString()}`,
    completionRate: (val) => `${val}%`,
    hoursLogged: (val) => `${val}h`
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

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
        {recentProjects.length === 0 ? (
          <p className="text-muted-foreground">No recent projects found.</p>
        ) : (
          <ul className="space-y-4">
            {recentProjects.map((project) => (
              <li key={project.id}>
                <Link href={`/projects/${project.id}`} className="block">
                  <Card className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <span className="font-semibold">{project.name}</span>
                        {project.client && (
                          <span className="ml-2 text-muted-foreground">({project.client.name})</span>
                        )}
                      </div>
                      <span className="mt-2 md:mt-0 text-xs text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
