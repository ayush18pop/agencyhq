import { create } from 'zustand';
import { ProjectWithStats } from '../app/projects/[id]/page';

interface ProjectState {
  projects: ProjectWithStats[];
  setProjects: (projects: ProjectWithStats[]) => void;
  getProjectById: (id: string) => ProjectWithStats | undefined;
  updateProject: (project: ProjectWithStats) => void;
  addProject: (project: ProjectWithStats) => void;
  removeProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  getProjectById: (id) => get().projects.find((p) => p.id === id),
  updateProject: (project) => set((state) => ({
    projects: state.projects.map((p) => (p.id === project.id ? project : p)),
  })),
  addProject: (project) => set((state) => ({
    projects: [...state.projects, project],
  })),
  removeProject: (id) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== id),
  })),
}));