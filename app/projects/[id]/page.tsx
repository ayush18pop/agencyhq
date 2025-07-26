"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  tasks: { title: string; status: string; priority: string; dueDate: Date; assignedTo: { id:string; name: string; email: string; role: string} }[];
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
}

// The function to fetch a single project
const fetchProjectById = async (projectId: string) => {
  const res = await fetch(`/api/getProject?projectId=${projectId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error('Failed to fetch project details');
  }
  const data = await res.json();
  return data.project as ProjectWithStats;
};


export default function ProjectsPage() {
  const params = useParams();
  const projectId = typeof params.id === "string" ? params.id : undefined;

  // HIGHLIGHT: Get the Query Client instance to manually update the cache
  const queryClient = useQueryClient();

  // HIGHLIGHT: Use TanStack Query to fetch the project data
  // This replaces the manual useEffect, loading, and error states
  const { data: project, isLoading, isError, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProjectById(projectId!),
    enabled: !!projectId, // Only run the query if projectId is valid
  });

  // State for managing the inline title editor
  const [toggleTitleChange, setToggleTitleChange] = useState(false);
  const [titleInput, setTitleInput] = useState<string>("");

  // HIGHLIGHT: Use useEffect to sync the input field when the project data loads or changes
  useEffect(() => {
    if (project) {
      setTitleInput(project.name);
    }
  }, [project]);

  const handleTitleSave = async () => {
    if (!project || !projectId || titleInput.trim() === "" || titleInput === project.name) {
      setToggleTitleChange(false);
      return;
    }
    try {
      // 1. Update the database (this is correct)
      await axios.put("/api/editProject", { id: project.id, name: titleInput });

      // 2. INSTANTLY UPDATE THE MAIN PROJECTS LIST CACHE
      // This makes the change appear immediately on the /projects page without a refetch.
      // The queryKey ['projects', undefined] must match the key used on that page.
      queryClient.setQueryData(['projects', undefined], (oldData: ProjectWithStats[] | undefined) => {
        if (!oldData) return [];
        return oldData.map((p) =>
          p.id === project.id ? { ...p, name: titleInput } : p
        );
      });

      // 3. INSTANTLY UPDATE THE CACHE FOR *THIS* PROJECT
      // This updates the UI on the current page immediately.
      queryClient.setQueryData(['project', projectId], (oldData: ProjectWithStats | undefined) => {
        if (!oldData) return undefined;
        return { ...oldData, name: titleInput };
      });

      setToggleTitleChange(false);
    } catch (e) {
      console.log("error saving title", e);
      // Optional: Add user feedback for the error
    }
  };

  // Use the loading and error states from useQuery
  if (isLoading) {
    return <div className="container mx-auto p-4">
  <div className="mb-4 animate-pulse">
    {/* Skeleton for the Title */}
    <div className="h-14 w-3/4 mb-4 rounded-md bg-muted" />
    {/* Skeleton for the Description */}
    <div className="h-6 w-1/2 rounded-md bg-muted" />
  </div>

  {/* Skeletons for the Task Cards */}
  <div className="space-y-4">
    {/* We can create an array and map over it to render multiple skeletons */}
    {Array.from({ length: 3 }).map((_, index) => (
      <div className="p-4 border rounded-lg" key={index}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-2/5 rounded-md bg-muted" />
          <div className="flex justify-between">
            <div className="h-4 w-1/4 rounded-md bg-muted" />
            <div className="h-4 w-1/6 rounded-md bg-muted" />
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
  }

  if (isError) {
    return <div className="text-red-500 p-4">{error?.message || "An error occurred"}</div>;
  }

  if (!project) {
    return <div className="text-red-500 p-4">Project not found</div>;
  }

  // The JSX remains largely the same
  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
      <h1 className="text-5xl font-bold mb-4" onClick={() => { setTitleInput(project.name); setToggleTitleChange(!toggleTitleChange); }}>
        {!toggleTitleChange ? (
          <>{project.name}</>
        ) : (
          <input
            value={titleInput}
            onChange={e => setTitleInput(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={e => {
              if(e.key === "Enter") handleTitleSave();
              if(e.key === "Escape") {
                setTitleInput(project.name); // Reset on escape
                setToggleTitleChange(false);
              }
            }}
            autoFocus
            className="text-5xl font-bold w-full bg-transparent border-none text-inherit p-0 m-0 focus:outline-none"
          />
        )}
        </h1>
        <div className="text-muted-foreground">Description: {project.description || "No description"}</div>
        </div>
        {project.tasks.map((task, index) => (
          <Card className="mb-4 p-4" key={index}>
            {/* ...task details... */}
            <p>{task.title}</p>
          </Card>
        ))}
    </div>
  );
}