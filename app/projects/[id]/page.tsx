"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/Card";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useSession } from "next-auth/react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the possible statuses to be used in this component
const statuses = ["PENDING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;
type Status = typeof statuses[number];


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
  tasks: { taskId: string; title: string; status: Status; priority: string; dueDate?: Date; assignedTo: { id:string; name: string; email: string; role: string} }[];
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
  const { data: session } = useSession();
const userId = session?.user?.id; // Or however you get it
  const params = useParams();
  const projectId = typeof params.id === "string" ? params.id : undefined;

  const queryClient = useQueryClient();

  const { data: project, isLoading, isError, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProjectById(projectId!),
    enabled: !!projectId, 
  });

  const [toggleTitleChange, setToggleTitleChange] = useState(false);
  const [titleInput, setTitleInput] = useState<string>("");

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
      await axios.put("/api/editProject", { id: project.id, name: titleInput });
      queryClient.setQueryData(['projects', undefined], (oldData: ProjectWithStats[] | undefined) => {
        if (!oldData) return [];
        return oldData.map((p) =>
          p.id === project.id ? { ...p, name: titleInput } : p
        );
      });
      queryClient.setQueryData(['project', projectId], (oldData: ProjectWithStats | undefined) => {
        if (!oldData) return undefined;
        return { ...oldData, name: titleInput };
      });
      toast.success("Project title updated successfully!");
      setToggleTitleChange(false);
    } catch (e) {
      toast.error("Failed to update project title.");
      console.error("error saving title", e);
    }
  };

  // Handler for changing a task's status
  const handleStatusChange = async (taskId: string, newStatus: Status) => {
    if (!project || !projectId) return;

    // Optimistic UI Update: Instantly update the local cache
    queryClient.setQueryData(['project', projectId], (oldData: ProjectWithStats | undefined) => {
        if (!oldData) return undefined;
        return {
            ...oldData,
            tasks: oldData.tasks.map(task => 
                task.taskId === taskId ? { ...task, status: newStatus } : task
            )
        };
    });

    // Then, make the API call to persist the change
    try {
        await axios.put('/api/editTask', { taskId: taskId, status: newStatus });
        toast.success("Task status updated.");
    } catch (e) {
        toast.error("Failed-You can only update assigned-tasks. Reverting.");
        console.error("Failed to update task status:", e);
        // If the API call fails, revert the optimistic update by refetching
        queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    }
  };

  const formatStatusText = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  };

  if (isLoading) {
    return (
        <div className="container mx-auto p-4">
            <div className="mb-4 animate-pulse">
                <div className="h-14 w-3/4 mb-4 rounded-md bg-muted" />
                <div className="h-6 w-1/2 rounded-md bg-muted" />
            </div>
            <div className="space-y-4">
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
    );
  }

  if (isError) {
    return <div className="text-red-500 p-4">{error?.message || "An error occurred"}</div>;
  }

  if (!project) {
    return <div className="text-red-500 p-4">Project not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Toaster richColors />
      <div className="mb-8">
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
                  setTitleInput(project.name); 
                  setToggleTitleChange(false);
                }
              }}
              autoFocus
              className="text-5xl font-bold w-full bg-transparent border-none text-inherit p-0 m-0 focus:outline-none"
            />
          )}
        </h1>
        <p className="text-muted-foreground">{project.description || "No description provided."}</p>
      </div>

      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {project.tasks.length > 0 ? project.tasks.map((task) => (
              <div
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                style={task.assignedTo.id === userId ? { borderColor: "var(--primary)" } : {}}
                key={task.taskId}
              >
                <div className="flex-1">
                  <p className="font-semibold text-card-foreground">{task.title}</p>
                  <div className="text-sm text-muted-foreground flex items-center space-x-4 mt-1">
                    <span>Assigned to: {task.assignedTo.name}</span>
                    {task.dueDate && (
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <Select
                  value={task.status}
                  onValueChange={(newStatus: Status) => handleStatusChange(task.taskId, newStatus)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {formatStatusText(status)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )) : (
              <p className="text-muted-foreground text-center p-4">No tasks found for this project.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
