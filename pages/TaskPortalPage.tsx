// src/pages/TaskPortalPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { TaskProject, TaskProjectStatus, User } from '../types.js';
import Button from '../components/ui/Button.js';
import Icon from '../components/ui/Icon.js';
import Modal from '../components/ui/Modal.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.js';
import { ICON_PATHS } from '../constants.js';
import * as taskService from '../services/taskService.js';
import { useToast } from '../contexts/ToastContext.js';
import TaskProjectCard from '../components/task/TaskProjectCard.js';
import TaskProjectForm from '../components/task/TaskProjectForm.js';
import ContextualHelpPanel from '../components/ui/ContextualHelpPanel.js';

const TaskPortalPage: React.FC = () => {
  const { user } = useAuth() as { user: User }; 
  const { addToast } = useToast();

  const [taskProjects, setTaskProjects] = useState<TaskProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<TaskProject | null>(null);
  const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(false);


  const loadProjects = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      const projects = await taskService.getTaskProjects(user.id);
      setTaskProjects(projects.sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()));
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleOpenCreateModal = () => {
    setProjectToEdit(null); // Ensure we are in "create" mode
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (project: TaskProject) => {
    setProjectToEdit(project);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setProjectToEdit(null); // Clear editing state
  };

  const handleSaveProject = async (project: TaskProject) => {
    if (user) {
      await taskService.saveTaskProject(user.id, project);
      loadProjects(); 
      addToast(`Project "${project.title}" ${projectToEdit ? 'updated' : 'created'} successfully!`, 'success');
      handleCloseFormModal();
    } else {
      addToast('Error: User not found.', 'error');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (user) {
      const projectToDelete = taskProjects.find(p => p.id === projectId);
      if (window.confirm(`Are you sure you want to delete project: "${projectToDelete?.title || projectId}"?`)) {
        await taskService.deleteTaskProject(user.id, projectId);
        loadProjects();
        addToast('Project deleted.', 'info');
      }
    }
  };

  const handleViewDetails = (projectId: string) => {
    addToast(`Viewing details for project ${projectId} (Not Implemented Yet)`, 'info');
  };

  if (isLoading && !user) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner text="Loading user data..." /></div>;
  }
  
  return (
    <>
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
          <Icon path={ICON_PATHS.VIEW_BOARDS_ICON} className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
          My Task Projects
        </h1>
        <Button onClick={handleOpenCreateModal} variant="primary" leftIcon={<Icon path={ICON_PATHS.PLUS_CIRCLE} />}>
          Create New Project
        </Button>
      </div>

      {isLoading && taskProjects.length === 0 ? (
         <div className="flex justify-center items-center py-10"><LoadingSpinner text="Loading projects..." /></div>
      ) : taskProjects.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <Icon path={ICON_PATHS.CLIPBOARD_DOCUMENT_LIST_ICON} className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Projects Yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Get started by creating your first complex task or project. Let AI help you plan!
          </p>
          <Button onClick={handleOpenCreateModal} variant="primary" size="lg">
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {taskProjects.map((project) => (
            <TaskProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
              onViewDetails={handleViewDetails}
              onEdit={() => handleOpenEditModal(project)} // Pass edit handler
            />
          ))}
        </div>
      )}

      <Modal 
        isOpen={isFormModalOpen} 
        onClose={handleCloseFormModal} 
        title={projectToEdit ? "Edit Task Project" : "Create New Task Project"} 
        size="3xl" // Increased size for more content
      >
        <TaskProjectForm
          initialProjectData={projectToEdit || undefined} // Pass project data for editing
          onSave={handleSaveProject}
          onCancel={handleCloseFormModal}
        />
      </Modal>
       <Button
        onClick={() => setIsHelpPanelOpen(true)}
        variant="ghost"
        className="fixed bottom-6 right-6 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-900"
        aria-label="Help"
      >
        <Icon path={ICON_PATHS.QUESTION_MARK_CIRCLE} className="w-6 h-6" />
      </Button>
       <ContextualHelpPanel 
        isOpen={isHelpPanelOpen}
        onClose={() => setIsHelpPanelOpen(false)}
        pageKey="task-portal"
      />
    </div>
    </>
  );
};

export default TaskPortalPage;