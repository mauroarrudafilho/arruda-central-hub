import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project } from '@/hooks/useProjects';

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // Recuperar projeto atual do localStorage na inicialização
  useEffect(() => {
    const savedProjectId = localStorage.getItem('currentProjectId');
    if (savedProjectId && projects.length > 0) {
      const savedProject = projects.find(p => p.id === savedProjectId);
      if (savedProject) {
        setCurrentProject(savedProject);
      }
    }
  }, [projects]);

  // Salvar projeto atual no localStorage quando mudar
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('currentProjectId', currentProject.id);
    } else {
      localStorage.removeItem('currentProjectId');
    }
  }, [currentProject]);

  const handleSetCurrentProject = (project: Project | null) => {
    setCurrentProject(project);
  };

  return (
    <ProjectContext.Provider 
      value={{ 
        currentProject, 
        setCurrentProject: handleSetCurrentProject, 
        projects, 
        setProjects 
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};