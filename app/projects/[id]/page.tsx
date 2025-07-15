"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";

export interface ProjectWithStats {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
  teamId?: string | null;
  tasks: { status: string }[];
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
}

export default function ProjectsPage() {
  const params = useParams();
  const projectId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;

  const [project, setProject] = useState<ProjectWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setError("Invalid project ID");
      setLoading(false);
      return;
    }

    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/getProject?projectId=${projectId}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const errorText = await res.text();
          setError("Failed to fetch project details: " + errorText);
          setLoading(false);
          return;
        }
        const { project } = await res.json();
        setProject(project);
      } catch {
        setError("Failed to fetch project details");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!project) {
    return <div className="text-red-500 p-4">Project not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{project.name}</h1>
      <Card className="mb-4 p-4">
        <div>Description: {project.description || "No description"}</div>
        <div>Budget: {project.budget ? `$${project.budget}` : "N/A"}</div>
        <div>Total Tasks: {project.totalTasks}</div>
        <div>Completed: {project.completedTasks}</div>
        <div>Pending: {project.pendingTasks}</div>
        <div>In Progress: {project.inProgressTasks}</div>
      </Card>
      {/* ...render more project details here... */}
    </div>
  );
}