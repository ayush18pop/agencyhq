"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
// HIGHLIGHT: Removed useState, useEffect, and useProjectStore as they are no longer needed
import { useProjects } from '@/hooks/useProjects';
import { useProjectsStats } from "@/hooks/useProjectsStats";
import { Skeleton } from "@/components/ui/skeleton";
// Interfaces can remain the same
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
  // HIGHLIGHT: Get projects DIRECTLY from TanStack Query and rename `data` to `projects`.
  // The `[]` default value prevents errors if data is transiently undefined.
  const { data: projects = [], isLoading, error } = useProjects(undefined);
  const { data: statsRes, isLoading: statsLoading, error: statsError } = useProjectsStats();

  const statsData: ProjectStats = statsRes?.data?.stats || {};

  // HIGHLIGHT: The useEffect and Zustand logic has been completely removed.
  // TanStack Query now manages this state automatically.

  // Helper functions can remain the same
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

  const getTaskStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'in-progress':
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'pending':
      case 'todo':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTaskCounts = (tasks: { status: string }[]) => {
    const counts = tasks.reduce((acc, task) => {
      const status = task.status.toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      completed: counts.completed || 0,
      inProgress: counts['in-progress'] || counts['in_progress'] || 0,
      pending: counts.pending || counts.todo || 0,
      total: tasks.length
    };
  };

  // Loading and Error states remain the same
  if(isLoading || statsLoading) {
    return <div className="flex-1 space-y-4 p-4 pt-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="h-8 w-48 rounded-md bg-secondary" />

            {/* Stats Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-card rounded-lg border border-border p-6 space-y-2">
                  <div className="h-4 w-1/2 rounded-md bg-secondary" />
                  <div className="h-8 w-1/4 rounded-md bg-secondary" />
                </div>
              ))}
            </div>

            {/* Projects Grid Skeleton */}
            <div className="bg-card/50 min-h-[400px] flex-1 rounded-xl p-4">
              <div className="h-6 w-40 mb-4 rounded-md bg-secondary" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="flex flex-col h-full min-h-[260px] rounded-lg border border-border bg-card p-4 space-y-4">
                    <div className="space-y-2">
                      <div className="h-5 w-3/4 rounded-md bg-secondary" />
                      <div className="h-4 w-1/2 rounded-md bg-secondary" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-full rounded-md bg-secondary" />
                      <div className="h-4 w-5/6 rounded-md bg-secondary" />
                    </div>
                    <div className="h-4 w-1/3 rounded-md bg-secondary" />
                  </div>
                ))}
              </div>
            </div>
          </div>
  }

  if (error || statsError) {
    return <div className="text-red-500 p-4">{(error as Error)?.message || (statsError as Error)?.message || 'Failed to load data'}</div>;
  }

  // The JSX part requires no changes because it already uses the `projects` variable.
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
      </div>
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.keys(statsData).map((key) => (
          <Card key={key} className="bg-card text-card-foreground rounded-lg border p-6">
            <CardTitle className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">{statLabels[key] || key}</h3>
            </CardTitle>
            <div className="text-2xl font-bold">
              {typeof statsData[key] === "number"
                ? (statFormat[key] ? statFormat[key](statsData[key]) : statsData[key])
                : "N/A"}
            </div>
          </Card>
        ))}
      </div>
      {/* Projects Grid */}
      <div className=" min-h-[400px] flex-1 rounded-xl m-0">
        <div className="mb-4"><div className="w-full"><div className="h-px bg-border" /></div></div>
        {
          projects.length === 0 ? (
            <p className="text-muted-foreground">No recent projects found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project) => {
                const taskCounts = getTaskCounts(project.tasks);
                return (
                  <Link key={project.id} href={`/projects/${project.id}`} className="block h-full">
                    <Card className="flex flex-col h-full min-h-[260px] hover:shadow-md transition-shadow duration-200 group">
                      <CardHeader className="pb-3 flex-shrink-0">
                        <CardTitle className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                          {project.name}
                        </CardTitle>
                        {project.client && (
                          <div className="text-xs text-muted-foreground">
                            {project.client.name}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="flex flex-col flex-1 justify-between pt-0">
                        <div className="space-y-3 flex-1">
                          <CardDescription className="text-sm line-clamp-3">
                            {project.description || "No description available"}
                          </CardDescription>
                          {/* Task Summary */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Tasks</span>
                              <span>{taskCounts.total}</span>
                            </div>
                            {taskCounts.total > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {taskCounts.completed > 0 && (
                                  <Badge variant="secondary" className={`text-xs px-2 py-1 ${getTaskStatusColor('completed')}`}>{taskCounts.completed} Done</Badge>
                                )}
                                {taskCounts.inProgress > 0 && (
                                  <Badge variant="secondary" className={`text-xs px-2 py-1 ${getTaskStatusColor('in-progress')}`}>{taskCounts.inProgress} Active</Badge>
                                )}
                                {taskCounts.pending > 0 && (
                                  <Badge variant="secondary" className={`text-xs px-2 py-1 ${getTaskStatusColor('pending')}`}>{taskCounts.pending} Pending</Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}