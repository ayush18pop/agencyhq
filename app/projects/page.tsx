"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
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

        // Fetch projects using axios
        const projectsRes = await axios.get("/api/getProjects", { withCredentials: true });
        
        // The API returns { success: true, projects: [...] }
        setRecentProjects(Array.isArray(projectsRes.data.projects) ? projectsRes.data.projects : []);
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
        <h3 className="text-lg font-medium mb-4">Projects</h3>
        {recentProjects.length === 0 ? (
          <p className="text-muted-foreground">No recent projects found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {recentProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="block mb-2">
                <Card className="p-4 flex flex-col flex-1/3">
                  <CardTitle className="flex text-lg text-primary-foreground items-center justify-center font-semibold">{project.name}</CardTitle>
                  <CardDescription className="text-sm text-accent line-clamp-3">{project.description}</CardDescription>
                  {/* shows only three tasks with todo like this */}
                  <div className="mt-2">
                    {project.tasks.slice(0, 3).map((task, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-sm text-muted-foreground">{}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
