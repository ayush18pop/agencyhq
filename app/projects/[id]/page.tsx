"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useProjectStore } from "@/store/projectStore";
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
  tasks: { title: string; status: string; priority: string; dueDate: Date; assignedTo: { id: string; name: string; email: string; role: string} }[];
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
  const [toggleTitleChange, setToggleTitleChange]  = useState(false);
  useEffect(() => {
    if (!projectId) {
      setError("Invalid project ID");
      setLoading(false);
      return;
    }

    // Try to get project from store first
    const storeProject = useProjectStore.getState().getProjectById(projectId);
    if (storeProject) {
      setProject(storeProject);
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
        // Update store with fetched project
        useProjectStore.getState().updateProject(project);
      } catch {
        setError("Failed to fetch project details");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);
  const [titleInput, setTitleInput] = useState<string>(project?.name ?? "");
  const updateProject = useProjectStore((s) => s.updateProject);
  const handleTitleSave = async () => {
    if (!project) return;
    if (titleInput.trim() === "" || titleInput === project.name) {
      setToggleTitleChange(false);
      return;
    }
    try {
      await axios.put("/api/editProject", { id: project.id, name: titleInput });
      const updatedProject = { ...project, name: titleInput };
      setProject(updatedProject); // local state
      updateProject(updatedProject); // update Zustand store
      setToggleTitleChange(false);
    } catch (e) {
      console.log("error", e);
    }
  };
  

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
      <div className="mb-4">
      <h1 className="text-5xl font-bold mb-4" onClick={() => { setTitleInput(project?.name ?? ""); setToggleTitleChange(!toggleTitleChange); }}>
        {!toggleTitleChange ? (
          <>{project.name}</>
        ) : (
          <input
            value={titleInput}
            onChange={e => setTitleInput(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={e => {
              if(e.key === "Enter") handleTitleSave();
              if(e.key === "Escape") setToggleTitleChange(false);
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
            
          </Card>
      ))}
      
    </div>
  );
}