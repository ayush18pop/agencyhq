"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import axios from "axios";

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

//   const handleTitleSave = async () => {
//   axios.put(`${process.env.NEXTAUTH_URL}/app/api/editProject`,{id: project.id, name: titleInput});
//   // Call your API to update the title here
//   // await axios.put("/api/editProject", { id: project.id, name: titleInput });
//   setProject((p) => p ? { ...p, name: titleInput } : p);
//   setToggleTitleChange(false);
// };

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
      <h1 className="text-5xl font-bold mb-4" onClick={()=> setToggleTitleChange(!toggleTitleChange)}>
        {!toggleTitleChange ? (
          <>{project.name}</>
        ) : (
          <Input></Input>
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