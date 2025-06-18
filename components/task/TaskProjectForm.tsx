// src/components/task/TaskProjectForm.tsx
import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
    TaskProject, TaskProjectStatus, GeoLocation, TaskSubItem, TaskMilestone, 
    MeasuringUnit, ServiceType, RequestData, AIAnalysisResult, TaskAttachment, 
    TaskTeamMember, TaskComment, User, AISummaryExportModalProps, ProjectRisk, AICriticalPathInfo
} from '../../types.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import Textarea from '../ui/Textarea.js';
import LoadingSpinner from '../ui/LoadingSpinner.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS, TASK_PROJECT_TEMPLATES } from '../../constants.js';
import { analyzeForTaskPlanning, analyzeRequestWithGemini, prioritizeTaskSubItems, generateProjectSummaryAI, assessProjectRisksAI, identifyCriticalPathAI } from '../../services/geminiService.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useToast } from '../../contexts/ToastContext.js';
import * as userDataService from '../../services/userDataService.js';
import * as taskService from '../../services/taskService.js';
import TaskSubItemFormModal from './TaskSubItemFormModal.js'; 
import AISummaryExportModal from './AISummaryExportModal.js'; 
import GanttChartModal from './GanttChartModal.js';

interface TaskProjectFormProps {
  initialProjectData?: TaskProject;
  onSave: (project: TaskProject) => void;
  onCancel: () => void;
}

const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

const subItemStatuses: TaskSubItem['status'][] = ['pending', 'sourced', 'request_created', 'in_progress', 'completed', 'cancelled'];
const itemStatusColors: Record<TaskSubItem['status'], string> = {
  pending: '#fdba74', // orange-300
  sourced: '#fcd34d', // amber-300
  request_created: '#93c5fd', // blue-300
  in_progress: '#60a5fa', // blue-400
  completed: '#4ade80', // green-400
  cancelled: '#f87171', // red-400
};

const riskSeverityColors: Record<ProjectRisk['severity'], string> = {
    low: 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    medium: 'border-yellow-500 dark:border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    high: 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};


const TaskProjectForm: React.FC<TaskProjectFormProps> = ({ initialProjectData, onSave, onCancel }) => {
  const { user } = useAuth() as { user: User }; 
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [primaryLocationAddress, setPrimaryLocationAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState<number | string>('');
  
  const [items, setItems] = useState<TaskSubItem[]>([]);
  const [milestones, setMilestones] = useState<TaskMilestone[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [team, setTeam] = useState<TaskTeamMember[]>([]); 
  const [templateName, setTemplateName] = useState<string | undefined>(undefined);

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Contributor');

  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [editingComment, setEditingComment] = useState<TaskComment | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [aiAnalysisDescription, setAiAnalysisDescription] = useState<string | null>(null);
  const [aiSuggestedRawItems, setAiSuggestedRawItems] = useState<TaskSubItem[]>([]);
  const [aiSuggestedRawMilestones, setAiSuggestedRawMilestones] = useState<TaskMilestone[]>([]);
  const [aiIdentifiedRisks, setAiIdentifiedRisks] = useState<ProjectRisk[]>([]);
  const [aiRiskAssessmentSummary, setAiRiskAssessmentSummary] = useState<string | null>(null);
  const [criticalPathInfo, setCriticalPathInfo] = useState<AICriticalPathInfo | null>(null);

  const [isAnalyzingWithAI, setIsAnalyzingWithAI] = useState(false);
  const [isPrioritizingItems, setIsPrioritizingItems] = useState(false);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [isAssessingRisks, setIsAssessingRisks] = useState(false);
  const [isAnalyzingCriticalPath, setIsAnalyzingCriticalPath] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<TaskSubItem | undefined>(undefined);
  const [showProgressOverview, setShowProgressOverview] = useState(true);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(false);


  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [projectForSummary, setProjectForSummary] = useState<TaskProject | null>(null);
  const [isGanttChartModalOpen, setIsGanttChartModalOpen] = useState(false);


  const totalEstimatedCost = items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  const totalActualSpent = items.reduce((sum, item) => sum + (item.actualCost || 0), 0);
  const projectBudgetNumber = budget ? parseFloat(budget as string) : 0;
  const remainingBudget = projectBudgetNumber > 0 ? projectBudgetNumber - totalActualSpent : (totalActualSpent > 0 ? -totalActualSpent : undefined);

  const itemStatusCounts = items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<TaskSubItem['status'], number>);

  const itemStatusChartData = subItemStatuses.map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
    count: itemStatusCounts[status] || 0,
    fill: itemStatusColors[status]
  })).filter(d => d.count > 0);

  const completedMilestonesCount = milestones.filter(m => m.completed).length;
  const totalMilestones = milestones.length;
  const milestoneProgressPercent = totalMilestones > 0 ? (completedMilestonesCount / totalMilestones) * 100 : 0;


  const loadComments = useCallback(async () => {
    if (initialProjectData?.id) {
      setComments(await taskService.getTaskProjectComments(initialProjectData.id));
    }
  }, [initialProjectData?.id]);

  useEffect(() => {
    if (initialProjectData) {
      setTitle(initialProjectData.title);
      setDescription(initialProjectData.description);
      setPrimaryLocationAddress(initialProjectData.primaryLocation?.address || '');
      setStartDate(initialProjectData.startDate?.split('T')[0] || '');
      setEndDate(initialProjectData.endDate?.split('T')[0] || '');
      setBudget(initialProjectData.budget || '');
      setItems(initialProjectData.itemsNeeded || []);
      setMilestones(initialProjectData.milestones || []);
      setAttachments(initialProjectData.attachments || []);
      setTeam(initialProjectData.team || []); 
      setTemplateName(initialProjectData.templateName);
      setAiIdentifiedRisks(initialProjectData.aiIdentifiedRisks || []);
      setCriticalPathInfo(initialProjectData.aiCriticalPathInfo || null);
      if (initialProjectData.aiCriticalPathInfo) setShowCriticalPath(true);
      
      if (initialProjectData.aiIdentifiedRisks && initialProjectData.aiIdentifiedRisks.length > 0) {
        const summaryFromRisks = initialProjectData.aiIdentifiedRisks.find(r => r.id === 'assessment-summary-proxy')?.description;
        setAiRiskAssessmentSummary(summaryFromRisks || "Risks were previously identified.");
        setShowRiskAssessment(true); 
      } else {
        setAiRiskAssessmentSummary(null);
        setShowRiskAssessment(false);
      }
      setAiAnalysisDescription(initialProjectData.description); 
      loadComments();
    } else {
      // Reset all state for new project form
      setTitle(''); setDescription(''); setPrimaryLocationAddress(''); setStartDate(''); setEndDate('');
      setBudget(''); setItems([]); setMilestones([]); setAttachments([]); setTeam([]);
      setComments([]); setNewCommentText(''); setEditingComment(null); setTemplateName(undefined);
      setAiAnalysisDescription(null); setAiSuggestedRawItems([]); setAiSuggestedRawMilestones([]);
      setAiIdentifiedRisks([]); setAiRiskAssessmentSummary(null); setShowRiskAssessment(false);
      setCriticalPathInfo(null); setShowCriticalPath(false);
      setNewMemberName(''); setNewMemberRole('Contributor');
    }
  }, [initialProjectData, loadComments]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTemplateKey = e.target.value;
    if (selectedTemplateKey && TASK_PROJECT_TEMPLATES[selectedTemplateKey]) {
        const template = TASK_PROJECT_TEMPLATES[selectedTemplateKey];
        setTitle(template.title || '');
        setDescription(template.description || '');
        setItems(template.itemsNeeded || []);
        setMilestones(template.milestones || []);
        setTemplateName(selectedTemplateKey); // Store the key
        addToast(`Template "${template.title}" applied.`, 'info');
    } else if (!selectedTemplateKey) { // "None" selected
        setTitle(''); setDescription(''); setItems([]); setMilestones([]); setTemplateName(undefined);
    }
  };


  const handleAnalyzeWithAI = async () => {
    if (!description.trim() && !initialProjectData?.description) { 
      setFormError('Please provide a project description for AI analysis.');
      addToast('Project description is needed for AI analysis.', 'warning');
      return;
    }
    setIsAnalyzingWithAI(true);
    setFormError(null);
    try {
      let locationForAI: GeoLocation | undefined;
      if (primaryLocationAddress.trim()) {
        locationForAI = userDataService.createGeoLocationFromString(primaryLocationAddress.trim());
      }
      const descToAnalyze = description.trim() || initialProjectData?.description || "";
      const analysisResult = await analyzeForTaskPlanning(descToAnalyze, locationForAI);
      
      if (!title && (!initialProjectData || !initialProjectData.title)) { 
        setTitle(analysisResult.title || '');
      }
      
      setAiAnalysisDescription(analysisResult.description || descToAnalyze);
      setAiSuggestedRawItems(analysisResult.itemsNeeded || []);
      setAiSuggestedRawMilestones(analysisResult.milestones || []);

      addToast('AI analysis complete! Review the suggestions. You can add them to your project.', 'success');
    } catch (err) {
      const errorMsg = (err as Error).message || 'AI analysis failed.';
      setFormError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setIsAnalyzingWithAI(false);
    }
  };
  
  const handleMergeAISuggestions = () => {
    setItems(prev => [...prev, ...aiSuggestedRawItems.filter(newItem => !prev.find(ex => ex.name === newItem.name))]); 
    setMilestones(prev => [...prev, ...aiSuggestedRawMilestones.filter(newMile => !prev.find(ex => ex.name === newMile.name))]);
    setAiSuggestedRawItems([]);
    setAiSuggestedRawMilestones([]);
    if (aiAnalysisDescription && (!description || initialProjectData?.description === description)) { 
        setDescription(aiAnalysisDescription);
    }
    addToast("AI suggestions merged into project plan.", "info");
  };

  const handleAIPrioritizeItems = async () => {
    if (items.length < 2) {
      addToast("Need at least 2 items to prioritize.", "warning");
      return;
    }
    setIsPrioritizingItems(true);
    setFormError(null);
    try {
      const projectTitle = title || initialProjectData?.title || "Untitled Project";
      const projectDesc = description || initialProjectData?.description || "No description.";
      const itemsToPrioritize = items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        type: item.type,
        estimatedCost: item.estimatedCost,
        dependsOn: item.dependsOn || [] 
      }));

      const { orderedItemIds, justification } = await prioritizeTaskSubItems(projectTitle, projectDesc, itemsToPrioritize);
      
      const reorderedItems = orderedItemIds.map(id => items.find(item => item.id === id)).filter(item => item !== undefined) as TaskSubItem[];
      items.forEach(item => {
        if (!reorderedItems.find(ri => ri.id === item.id)) {
          reorderedItems.push(item);
        }
      });

      setItems(reorderedItems);
      addToast(`AI Prioritization: ${justification}`, 'success'); 

    } catch (err) {
      const errorMsg = (err as Error).message || 'AI item prioritization failed.';
      setFormError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setIsPrioritizingItems(false);
    }
  };

  const handleAssessRisks = async () => {
    if (!user) { addToast("User not found.", "error"); return; }
    setIsAssessingRisks(true);
    setFormError(null);
    try {
        const currentProjectData: TaskProject = {
            id: initialProjectData?.id || `temp-project-${Date.now()}`,
            creatorId: user.id,
            title: title.trim() || "Untitled Project",
            description: (description || aiAnalysisDescription || "").trim() || "No description.",
            status: initialProjectData?.status || TaskProjectStatus.DRAFT,
            creationDate: initialProjectData?.creationDate || new Date().toISOString(),
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            budget: budget ? parseFloat(budget as string) : undefined,
            totalSpent: totalActualSpent,
            primaryLocation: primaryLocationAddress.trim() ? userDataService.createGeoLocationFromString(primaryLocationAddress.trim()) : undefined,
            itemsNeeded: items,
            milestones: milestones.filter(m => m.name.trim() && m.date.trim()),
            templateName,
        };
        const { risks, assessmentSummary } = await assessProjectRisksAI(currentProjectData);
        setAiIdentifiedRisks(risks);
        setAiRiskAssessmentSummary(assessmentSummary);
        setShowRiskAssessment(true); 
        addToast("AI Risk Assessment complete!", "success");
    } catch (err) {
        const errorMsg = (err as Error).message || 'AI Risk Assessment failed.';
        setFormError(errorMsg);
        addToast(errorMsg, 'error');
    } finally {
        setIsAssessingRisks(false);
    }
  };

  const handleAnalyzeCriticalPath = async () => {
    if (!user) { addToast("User not found.", "error"); return; }
    setIsAnalyzingCriticalPath(true);
    setFormError(null);
    try {
        const currentProjectData: TaskProject = {
            id: initialProjectData?.id || `temp-project-${Date.now()}`,
            creatorId: user.id,
            title: title.trim() || "Untitled Project",
            description: (description || aiAnalysisDescription || "").trim() || "No description.",
            status: initialProjectData?.status || TaskProjectStatus.DRAFT,
            creationDate: initialProjectData?.creationDate || new Date().toISOString(),
            itemsNeeded: items,
            templateName,
        };
        const result = await identifyCriticalPathAI(currentProjectData);
        setCriticalPathInfo(result);
        setShowCriticalPath(true);
        addToast("AI Critical Path Analysis complete!", "success");
    } catch (err) {
        const errorMsg = (err as Error).message || 'AI Critical Path Analysis failed.';
        setFormError(errorMsg);
        addToast(errorMsg, 'error');
    } finally {
        setIsAnalyzingCriticalPath(false);
    }
  };

  const handleSaveItem = (item: TaskSubItem) => {
    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(i => i.id === item.id);
      if (existingIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingIndex] = item;
        return updatedItems;
      }
      return [...prevItems, { ...item, id: item.id || generateId() }];
    });
    setIsItemModalOpen(false);
    setItemToEdit(undefined);
    addToast(`Item "${item.name}" saved.`, "success");
  };

  const handleOpenItemModal = (item?: TaskSubItem) => {
    setItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    setItems(prevItems => prevItems.map(item => ({
        ...item,
        dependsOn: item.dependsOn?.filter(depId => depId !== itemId)
    })));
    addToast("Item removed.", "info");
  };

  const handleUpdateItemStatus = (itemId: string, newStatus: TaskSubItem['status']) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      )
    );
  };
  
  const handleAddMilestone = () => {
    setMilestones(prev => [...prev, { id: generateId(), name: '', date: '', completed: false }]);
  };

  const handleMilestoneChange = (index: number, field: keyof TaskMilestone, value: string | boolean) => {
    setMilestones(prev => 
      prev.map((m, i) => i === index ? { ...m, [field]: value } : m)
    );
  };
  
  const handleDeleteMilestone = (index: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
    addToast("Milestone removed.", "info");
  };

  const handleCreateRequestFromSubItem = async (item: TaskSubItem) => {
    if (!user) { addToast("User not found.", "error"); return; }
    setIsCreatingRequest(true);
    try {
      const parentProjectTitle = title || initialProjectData?.title || "Unnamed Project";
      const requestTextInput = `Need ${item.name} for project: "${parentProjectTitle}". Description: ${item.description || 'N/A'}.`;
      
      let serviceType: ServiceType = ServiceType.GENERAL_HELP;
      if (item.type === 'product') serviceType = ServiceType.PRODUCT_SALE;
      else if (item.type === 'service') serviceType = ServiceType.PROFESSIONAL_SERVICE;
      else if (item.type === 'logistics') serviceType = ServiceType.RIDE_DELIVERY;

      const requestDetailsForAIAnalysis: Pick<RequestData, 'textInput' | 'origin' | 'destination' | 'requestFor' | 'recipientDetails' | 'targetMapLocation'> & { taskContext?: string } = {
        textInput: requestTextInput,
        origin: primaryLocationAddress ? userDataService.createGeoLocationFromString(primaryLocationAddress) : undefined,
        taskContext: `Project: ${parentProjectTitle} - Task: ${item.name}`,
        requestFor: 'self', 
      };
      
      const aiAnalysisResult: AIAnalysisResult = await analyzeRequestWithGemini(requestDetailsForAIAnalysis);
      
      const newRequestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

       const requestDataForNavigation: Partial<RequestData> & { id: string; taskProjectId?: string; taskSubItemId?: string; taskContext?: string; } = {
        id: newRequestId,
        textInput: aiAnalysisResult.summary || requestTextInput,
        type: aiAnalysisResult.type !== ServiceType.UNKNOWN ? aiAnalysisResult.type : serviceType,
        origin: requestDetailsForAIAnalysis.origin,
        suggestedPrice: aiAnalysisResult.priceSuggestion ?? item.estimatedCost,
        aiAnalysisSummary: aiAnalysisResult.summary,
        aiExtractedEntities: aiAnalysisResult.entities,
        aiSuggestedTransportationModes: aiAnalysisResult.aiSuggestedTransportationModes,
        requestFor: 'self',
        taskProjectId: initialProjectData?.id || `temp-project-${Date.now()}`, 
        taskSubItemId: item.id,
        taskContext: requestDetailsForAIAnalysis.taskContext,
      };
      
      setItems(prevItems => prevItems.map(i => 
        i.id === item.id ? { ...i, linkedRequestId: newRequestId, status: 'request_created' } : i
      ));

      addToast(`Service request for "${item.name}" created. Redirecting...`, 'success');
      navigate('/requester-portal', { state: { newRequestFromInteraction: requestDataForNavigation, aiAnalysis: aiAnalysisResult } });

    } catch (err) {
      addToast(`Failed to create service request: ${(err as Error).message}`, 'error');
    } finally {
      setIsCreatingRequest(false);
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      if (attachments.length + filesArray.length > 5) {
        addToast("Maximum 5 attachments allowed per project.", "warning");
        return;
      }
      const newAttachments: TaskAttachment[] = filesArray.map(file => ({
        id: `attach-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        mockUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    const attachment = attachments.find(a => a.id === attachmentId);
    if (attachment?.mockUrl && attachment.type.startsWith('image/')) {
        URL.revokeObjectURL(attachment.mockUrl);
    }
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAddTeamMember = () => {
    if (!newMemberName.trim()) {
      addToast("Member name cannot be empty.", "warning");
      return;
    }
    const newMember: TaskTeamMember = {
      userId: `mock-user-${Date.now()}`, 
      name: newMemberName.trim(),
      roleInTask: newMemberRole.trim() || 'Contributor',
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(newMemberName.trim())}&background=random&color=fff&size=32`
    };
    setTeam(prev => [...prev, newMember]);
    setNewMemberName('');
    setNewMemberRole('Contributor'); 
    addToast(`${newMember.name} added to team.`, "success");
  };

  const handleRemoveTeamMember = (userIdToRemove: string) => {
    setTeam(prev => prev.filter(member => member.userId !== userIdToRemove));
    addToast("Team member removed.", "info");
  };

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !user || !initialProjectData?.id) return;
    setIsSubmittingComment(true);
    
    try {
        if (editingComment) {
          await taskService.editTaskProjectComment(initialProjectData.id, editingComment.id, newCommentText.trim());
          setEditingComment(null);
          addToast("Comment updated.", "success");
        } else {
          await taskService.addTaskProjectComment(initialProjectData.id, {
            authorId: user.id,
            authorName: user.name, 
            text: newCommentText.trim(),
          });
          addToast("Comment added.", "success");
        }
        setNewCommentText('');
        loadComments(); 
    } catch (err) {
        addToast("Failed to save comment.", "error");
    } finally {
        setIsSubmittingComment(false);
    }
  };

  const handleEditComment = (comment: TaskComment) => {
    setEditingComment(comment);
    setNewCommentText(comment.text);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (initialProjectData?.id && window.confirm("Are you sure you want to delete this comment?")) {
      await taskService.deleteTaskProjectComment(initialProjectData.id, commentId);
      loadComments();
      addToast("Comment deleted.", "info");
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const finalTitle = title.trim();
    const finalDescription = (description || aiAnalysisDescription || "").trim();

    if (!finalTitle) {
        setFormError('Project title is required.'); addToast('Project title is required.', 'error'); return;
    }
    if (!finalDescription) {
        setFormError('Project description is required.'); addToast('Project description is required.', 'error'); return;
    }
    if (!user) {
        setFormError('User not authenticated.'); addToast('User not authenticated.', 'error'); return;
    }

    let primaryLocation: GeoLocation | undefined;
    if (primaryLocationAddress.trim()) {
        primaryLocation = userDataService.createGeoLocationFromString(primaryLocationAddress.trim());
    }
    
    const calculatedTotalSpent = items.reduce((sum, item) => sum + (item.actualCost || 0), 0);

    const projectData: TaskProject = {
      id: initialProjectData?.id || `taskproj-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      creatorId: user.id,
      title: finalTitle,
      description: finalDescription,
      status: initialProjectData?.status || TaskProjectStatus.DRAFT,
      creationDate: initialProjectData?.creationDate || new Date().toISOString(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      budget: budget ? parseFloat(budget as string) : undefined,
      totalSpent: calculatedTotalSpent,
      primaryLocation: primaryLocation,
      itemsNeeded: items,
      milestones: milestones.filter(m => m.name.trim() && m.date.trim()), 
      attachments: attachments, 
      team: team, 
      aiIdentifiedRisks: aiIdentifiedRisks,
      aiCriticalPathInfo: criticalPathInfo,
      templateName: templateName, // Save template name
    };
    onSave(projectData);
  };
  
  const handleOpenSummaryModal = () => {
    const currentProjectData: TaskProject = {
        id: initialProjectData?.id || `temp-${Date.now()}`,
        creatorId: user?.id || 'unknown',
        title: title.trim(),
        description: (description || aiAnalysisDescription || "").trim(),
        status: initialProjectData?.status || TaskProjectStatus.DRAFT,
        creationDate: initialProjectData?.creationDate || new Date().toISOString(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        budget: budget ? parseFloat(budget as string) : undefined,
        totalSpent: totalActualSpent,
        primaryLocation: primaryLocationAddress.trim() ? userDataService.createGeoLocationFromString(primaryLocationAddress.trim()) : undefined,
        itemsNeeded: items,
        milestones: milestones.filter(m => m.name.trim() && m.date.trim()),
        attachments: attachments,
        team: team,
        aiIdentifiedRisks: aiIdentifiedRisks, 
        aiCriticalPathInfo: criticalPathInfo,
        templateName: templateName,
    };
    setProjectForSummary(currentProjectData);
    setIsSummaryModalOpen(true);
  };

  const currentProjectDescription = description || initialProjectData?.description || "";

  const getAttachmentDisplay = (attachment: TaskAttachment) => {
    const nameCount: Record<string, number> = {};
    attachments.forEach(att => {
        nameCount[att.name] = (nameCount[att.name] || 0) + 1;
    });

    let versionSuffix = "";
    if (nameCount[attachment.name] > 1) {
        let version = 0;
        for(let i=0; i < attachments.length; i++) {
            if (attachments[i].id === attachment.id) {
                version = attachments.filter(a => a.name === attachment.name && attachments.indexOf(a) <= i).length;
                break;
            }
        }
        if (version > 1) versionSuffix = ` (v${version})`;
    }
    return `${attachment.name}${versionSuffix}`;
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4 p-1 max-h-[75vh] overflow-y-auto pr-2">
      {formError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-2 rounded-md">{formError}</p>}
      
      <Input label="Project Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Kitchen Renovation Q4" required />
      
      <Textarea 
        label="Project Description" 
        name="description" 
        value={currentProjectDescription}
        onChange={(e) => {
            setDescription(e.target.value);
            if (aiAnalysisDescription && e.target.value !== aiAnalysisDescription) {
                 setAiAnalysisDescription(null); 
            }
        }} 
        placeholder="Describe the overall goal and scope of your project. AI can help refine this." 
        rows={currentProjectDescription.length > 100 ? 4 : 3} 
        required 
      />
       {aiAnalysisDescription && currentProjectDescription === aiAnalysisDescription && (
          <p className="text-xs text-blue-600 dark:text-blue-400 -mt-3 ml-1">AI has refined your description. You can edit it further.</p>
       )}
      
      {!initialProjectData && (
        <div className="mb-3">
            <label htmlFor="templateSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start with a Template (Optional)</label>
            <select
                id="templateSelect"
                name="templateSelect"
                value={templateName || ""}
                onChange={handleTemplateChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
            >
                <option value="">None - Start Fresh</option>
                {Object.entries(TASK_PROJECT_TEMPLATES).map(([key, template]) => (
                    <option key={key} value={key}>{template.title}</option>
                ))}
            </select>
        </div>
      )}

      <div className="flex items-end space-x-2">
        <Input label="Primary Location (Optional Address)" name="primaryLocationAddress" value={primaryLocationAddress} onChange={(e) => setPrimaryLocationAddress(e.target.value)} placeholder="e.g., 123 Main St, Anytown" wrapperClassName="flex-grow" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={handleAnalyzeWithAI} isLoading={isAnalyzingWithAI} variant="outline" leftIcon={<Icon path={ICON_PATHS.SPARKLES} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700" disabled={!currentProjectDescription.trim()}>
            {isAnalyzingWithAI ? 'AI Analyzing...' : 'Analyze with AI & Get Suggestions'}
        </Button>
        {initialProjectData && (
            <>
            <Button type="button" onClick={handleOpenSummaryModal} variant="outline" leftIcon={<Icon path={ICON_PATHS.EXPORT_ICON} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                AI Summary/Export
            </Button>
            <Button type="button" onClick={handleAssessRisks} isLoading={isAssessingRisks} variant="outline" leftIcon={<Icon path={ICON_PATHS.SHIELD_EXCLAMATION} className="w-4 h-4 mr-1" />} className="dark:text-yellow-300 dark:border-yellow-600 dark:hover:bg-yellow-700/50 border-yellow-500 text-yellow-700" disabled={!currentProjectDescription.trim() && items.length === 0 && !budget}>
                {isAssessingRisks ? 'Assessing Risks...' : 'Assess Risks with AI'}
            </Button>
            <Button type="button" onClick={handleAnalyzeCriticalPath} isLoading={isAnalyzingCriticalPath} variant="outline" leftIcon={<Icon path={ICON_PATHS.FIRE_ICON} className="w-4 h-4 mr-1" />} className="dark:text-orange-300 dark:border-orange-600 dark:hover:bg-orange-700/50 border-orange-500 text-orange-700" disabled={items.length < 1}>
                {isAnalyzingCriticalPath ? 'Analyzing Path...' : 'Identify Critical Path (AI)'}
            </Button>
             <Button type="button" onClick={() => setIsGanttChartModalOpen(true)} variant="outline" leftIcon={<Icon path={ICON_PATHS.CHART_BAR} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                View Gantt Chart (Mock)
            </Button>
            </>
        )}
      </div>


      {(aiSuggestedRawItems.length > 0 || aiSuggestedRawMilestones.length > 0) && !isAnalyzingWithAI && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-md border border-yellow-200 dark:border-yellow-700 space-y-2">
          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">AI Suggestions Ready:</h4>
          {aiSuggestedRawItems.length > 0 && <p className="text-xs text-yellow-700 dark:text-yellow-300">{aiSuggestedRawItems.length} items suggested.</p>}
          {aiSuggestedRawMilestones.length > 0 && <p className="text-xs text-yellow-700 dark:text-yellow-300">{aiSuggestedRawMilestones.length} milestones suggested.</p>}
          <Button onClick={handleMergeAISuggestions} size="sm" variant="secondary" className="dark:bg-yellow-600 dark:hover:bg-yellow-500">Merge into Plan</Button>
        </div>
      )}
      
      {initialProjectData && (
        <details className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600" open={showProgressOverview} onToggle={() => setShowProgressOverview(prev => !prev)}>
            <summary className="text-md font-semibold text-gray-800 dark:text-gray-100 cursor-pointer flex items-center">
                <Icon path={ICON_PATHS.CHART_BAR} className="w-5 h-5 mr-2"/>
                Project Progress Overview
                <Icon path={showProgressOverview ? "M19.5 8.25l-7.5 7.5-7.5-7.5" : "M8.25 4.5l7.5 7.5-7.5 7.5"} className="w-4 h-4 ml-auto"/>
            </summary>
            <div className="mt-3 space-y-4">
                <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Sub-Item Statuses:</h5>
                    {items.length > 0 ? (
                        <>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                            {subItemStatuses.map(s => `${s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}: ${itemStatusCounts[s] || 0}`).filter(s => !s.endsWith(': 0')).join(', ') || "No items with status."}
                        </p>
                        {itemStatusChartData.length > 0 && (
                            <div style={{ width: '100%', height: 150 }}>
                            <ResponsiveContainer>
                                <BarChart data={itemStatusChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'currentColor' }} />
                                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: 'currentColor' }} />
                                <Tooltip wrapperStyle={{ fontSize: '12px', backgroundColor: 'var(--background-color, #fff)', color: 'var(--text-color, #333)', border: '1px solid #ccc' }} itemStyle={{ color: '#333' }}/>
                                <Bar dataKey="count" barSize={20}>
                                    {itemStatusChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            </div>
                        )}
                        </>
                    ) : <p className="text-xs text-gray-500 dark:text-gray-400">No sub-items defined.</p>}
                </div>
                <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Milestone Progress:</h5>
                    {totalMilestones > 0 ? (
                        <>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">{completedMilestonesCount} of {totalMilestones} milestones completed.</p>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                                <div 
                                    className="bg-green-500 dark:bg-green-400 h-2.5 rounded-full transition-all duration-500" 
                                    style={{ width: `${milestoneProgressPercent}%` }}
                                    aria-valuenow={milestoneProgressPercent}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    role="progressbar"
                                ></div>
                            </div>
                        </>
                    ) : <p className="text-xs text-gray-500 dark:text-gray-400">No milestones defined.</p>}
                </div>
            </div>
        </details>
      )}

        {initialProjectData && showRiskAssessment && (aiIdentifiedRisks.length > 0 || aiRiskAssessmentSummary) && (
            <details className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600" open={showRiskAssessment} onToggle={() => setShowRiskAssessment(prev => !prev)}>
                <summary className="text-md font-semibold text-gray-800 dark:text-gray-100 cursor-pointer flex items-center">
                    <Icon path={ICON_PATHS.SHIELD_EXCLAMATION} className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400"/>
                    AI Risk Assessment
                    <Icon path={showRiskAssessment ? "M19.5 8.25l-7.5 7.5-7.5-7.5" : "M8.25 4.5l7.5 7.5-7.5 7.5"} className="w-4 h-4 ml-auto"/>
                </summary>
                <div className="mt-3 space-y-3">
                    {aiRiskAssessmentSummary && <p className="text-sm italic text-gray-600 dark:text-gray-300">{aiRiskAssessmentSummary}</p>}
                    {aiIdentifiedRisks.length > 0 ? (
                        <ul className="space-y-2">
                        {aiIdentifiedRisks.map(risk => (
                            <li key={risk.id} className={`p-2 border-l-4 rounded-r-md ${riskSeverityColors[risk.severity]}`}>
                                <p className="font-semibold text-sm">{risk.description}</p>
                                <p className="text-xs">Severity: <span className="font-medium">{risk.severity.toUpperCase()}</span></p>
                                {risk.mitigationSuggestion && <p className="text-xs mt-0.5">Suggestion: {risk.mitigationSuggestion}</p>}
                            </li>
                        ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">No specific risks identified by AI, or assessment not run.</p>
                    )}
                </div>
            </details>
        )}
        
        {initialProjectData && showCriticalPath && criticalPathInfo && (
            <details className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600" open={showCriticalPath} onToggle={() => setShowCriticalPath(prev => !prev)}>
                <summary className="text-md font-semibold text-gray-800 dark:text-gray-100 cursor-pointer flex items-center">
                    <Icon path={ICON_PATHS.FIRE_ICON} className="w-5 h-5 mr-2 text-orange-500 dark:text-orange-400"/>
                    AI Critical Path Analysis
                     <Icon path={showCriticalPath ? "M19.5 8.25l-7.5 7.5-7.5-7.5" : "M8.25 4.5l7.5 7.5-7.5 7.5"} className="w-4 h-4 ml-auto"/>
                </summary>
                 <div className="mt-3 space-y-2">
                    <p className="text-sm italic text-gray-600 dark:text-gray-300">{criticalPathInfo.analysisNotes}</p>
                    {criticalPathInfo.pathItemIds.length > 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Critical Path Item IDs (in order): {criticalPathInfo.pathItemIds.map(id => items.find(i=>i.id===id)?.name || `ID ${id.substring(0,5)}...`).join(' → ')}
                        </p>
                    ) : <p className="text-xs text-gray-500 dark:text-gray-400">No critical path identified or applicable.</p>}
                </div>
            </details>
        )}


        <section className="space-y-1 pt-2 border-t dark:border-gray-600">
            <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-1">Financial Overview</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs p-2 bg-gray-50 dark:bg-gray-700/30 rounded">
                <div>Budget: <span className="font-medium text-gray-700 dark:text-gray-200">${projectBudgetNumber > 0 ? projectBudgetNumber.toFixed(2) : 'N/A'}</span></div>
                <div>Est. Cost: <span className="font-medium text-gray-700 dark:text-gray-200">${totalEstimatedCost.toFixed(2)}</span></div>
                <div>Actual Spent: <span className="font-medium text-gray-700 dark:text-gray-200">${totalActualSpent.toFixed(2)}</span></div>
                {remainingBudget !== undefined && (
                  <div className="sm:col-span-3">Remaining: 
                    <span className={`font-semibold ${remainingBudget < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      ${remainingBudget.toFixed(2)}
                    </span>
                  </div>
                )}
            </div>
        </section>

        <section className="space-y-2 pt-2 border-t dark:border-gray-600">
             <div className="flex justify-between items-center">
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100">Items / Sub-Tasks</h4>
                <div className="space-x-2">
                    <Button type="button" size="sm" variant="outline" onClick={handleAIPrioritizeItems} leftIcon={<Icon path={ICON_PATHS.LIST_BULLET} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700" disabled={items.length < 2 || isPrioritizingItems} isLoading={isPrioritizingItems}>
                        AI Prioritize
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => handleOpenItemModal()} leftIcon={<Icon path={ICON_PATHS.PLUS_CIRCLE} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Add Item</Button>
                </div>
            </div>
            {items.length === 0 ? <p className="text-xs text-gray-500 dark:text-gray-400">No items added yet.</p> : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {items.map(item => {
                        const isCritical = criticalPathInfo?.pathItemIds.includes(item.id);
                        const isBlocked = item.dependsOn?.some(depId => {
                            const depItem = items.find(i => i.id === depId);
                            return depItem && depItem.status !== 'completed';
                        });
                        return (
                        <div key={item.id} className={`p-2 border rounded-md ${item.status === 'completed' ? 'bg-green-50 dark:bg-green-900/30 opacity-70' : 'bg-white dark:bg-gray-700/50'} ${isCritical ? 'border-orange-500 dark:border-orange-400 ring-1 ring-orange-500 dark:ring-orange-400' : 'dark:border-gray-600'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex-grow">
                                    <h5 className={`text-sm font-medium flex items-center ${item.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                                        {isCritical && <Icon path={ICON_PATHS.FIRE_ICON} className="w-3.5 h-3.5 mr-1 text-orange-500 dark:text-orange-400" />}
                                        {isBlocked && <Icon path={ICON_PATHS.LOCK_CLOSED} className="w-3 h-3 mr-1 text-yellow-600 dark:text-yellow-400" />}
                                        {item.name} <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">({item.type})</span>
                                    </h5>
                                    {item.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>}
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity || 1} {item.unit || ''} | Est: ${item.estimatedCost?.toFixed(2) || '0.00'} | Actual: ${item.actualCost?.toFixed(2) || '0.00'}</p>
                                    {item.assignedResources && item.assignedResources.length > 0 && (
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">Assigned: {item.assignedResources.join(', ')}</p>
                                    )}
                                    {item.dependsOn && item.dependsOn.length > 0 && (
                                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                                            Depends on: {item.dependsOn.map(depId => items.find(i => i.id === depId)?.name || `ID ${depId.substring(0,5)}`).join(', ')}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end space-y-1 flex-shrink-0 ml-2">
                                    <select value={item.status} onChange={(e) => handleUpdateItemStatus(item.id, e.target.value as TaskSubItem['status'])} className="text-xs p-0.5 border rounded-md dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 focus:ring-1 focus:ring-blue-500" disabled={item.status === 'request_created'}>
                                        {subItemStatuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                                    </select>
                                    <div className="space-x-1">
                                        {item.type !== 'logistics' && item.status !== 'request_created' && item.status !== 'completed' && !isBlocked && (
                                            <Button type="button" variant="ghost" size="xs" onClick={() => handleCreateRequestFromSubItem(item)} isLoading={isCreatingRequest} className="text-blue-500 dark:text-blue-400 p-0.5" title="Create Service Request from this item"><Icon path={ICON_PATHS.ARROW_RIGHT_ON_RECTANGLE} className="w-3.5 h-3.5"/></Button>
                                        )}
                                        {item.status === 'request_created' && item.linkedRequestId && (
                                            <Button type="button" variant="ghost" size="xs" onClick={() => navigate('/requester-portal', { state: { highlightedRequestId: item.linkedRequestId } })} className="text-purple-500 dark:text-purple-400 p-0.5" title="View linked Service Request"><Icon path={ICON_PATHS.ARROW_RIGHT_ON_RECTANGLE} className="w-3.5 h-3.5"/></Button>
                                        )}
                                        <Button type="button" variant="ghost" size="xs" onClick={() => handleOpenItemModal(item)} className="p-0.5"><Icon path={ICON_PATHS.COG_6_TOOTH} className="w-3.5 h-3.5"/></Button>
                                        <Button type="button" variant="ghost" size="xs" onClick={() => handleDeleteItem(item.id)} className="p-0.5 text-red-500"><Icon path={ICON_PATHS.TRASH_ICON} className="w-3.5 h-3.5"/></Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </section>

        <section className="space-y-2 pt-2 border-t dark:border-gray-600">
            <div className="flex justify-between items-center">
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100">Milestones</h4>
                <Button type="button" size="sm" variant="outline" onClick={handleAddMilestone} leftIcon={<Icon path={ICON_PATHS.PLUS_CIRCLE} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Add Milestone</Button>
            </div>
            {milestones.length === 0 ? <p className="text-xs text-gray-500 dark:text-gray-400">No milestones defined yet.</p> : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {milestones.map((milestone, index) => (
                        <div key={milestone.id || index} className={`p-2 border rounded-md ${milestone.completed ? 'bg-green-50 dark:bg-green-900/30 opacity-70' : 'bg-white dark:bg-gray-700/50'} dark:border-gray-600 flex items-center space-x-2`}>
                            <input type="checkbox" checked={milestone.completed} onChange={(e) => handleMilestoneChange(index, 'completed', e.target.checked)} className="form-checkbox h-4 w-4 text-blue-500 dark:bg-gray-600 rounded focus:ring-blue-400" />
                            <Input name={`milestoneName-${index}`} value={milestone.name} onChange={(e) => handleMilestoneChange(index, 'name', e.target.value)} placeholder="Milestone Name" wrapperClassName="flex-grow mb-0" className={`text-sm ${milestone.completed ? 'line-through' : ''}`} />
                            <Input name={`milestoneDate-${index}`} type="date" value={milestone.date} onChange={(e) => handleMilestoneChange(index, 'date', e.target.value)} wrapperClassName="mb-0" className={`text-sm ${milestone.completed ? 'line-through' : ''}`} />
                            <Button type="button" variant="ghost" size="xs" onClick={() => handleDeleteMilestone(index)} className="p-1 text-red-500"><Icon path={ICON_PATHS.TRASH_ICON} className="w-4 h-4"/></Button>
                        </div>
                    ))}
                </div>
            )}
        </section>

         <section className="space-y-2 pt-2 border-t dark:border-gray-600">
            <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100">Team Members</h4>
            <div className="flex items-end space-x-2">
                <Input label="Member Name" name="newMemberName" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="e.g., Alex Smith" wrapperClassName="flex-grow mb-0" />
                <Input label="Role" name="newMemberRole" value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} placeholder="e.g., Designer" wrapperClassName="flex-grow mb-0" />
                <Button type="button" size="sm" variant="outline" onClick={handleAddTeamMember} leftIcon={<Icon path={ICON_PATHS.USER_PLUS_ICON} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Add</Button>
            </div>
            {team.length === 0 ? <p className="text-xs text-gray-500 dark:text-gray-400">No team members added yet.</p> : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto pr-1">
                    {team.map(member => (
                        <div key={member.userId} className="p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700/50 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <img src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=24&background=random`} alt={member.name} className="w-6 h-6 rounded-full"/>
                                <div>
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{member.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{member.roleInTask}</p>
                                </div>
                            </div>
                            <Button type="button" variant="ghost" size="xs" onClick={() => handleRemoveTeamMember(member.userId)} className="p-0.5 text-red-500"><Icon path={ICON_PATHS.TRASH_ICON} className="w-3.5 h-3.5"/></Button>
                        </div>
                    ))}
                </div>
            )}
        </section>

        <section className="space-y-2 pt-2 border-t dark:border-gray-600">
            <div className="flex justify-between items-center">
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100">Attachments</h4>
                <label htmlFor="file-upload-project" className="cursor-pointer">
                    <Button type="button" size="sm" variant="outline" leftIcon={<Icon path={ICON_PATHS.UPLOAD} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Upload Files</Button>
                </label>
                <input id="file-upload-project" name="file-upload-project" type="file" multiple className="sr-only" onChange={handleFileSelect} />
            </div>
            {attachments.length === 0 ? <p className="text-xs text-gray-500 dark:text-gray-400">No attachments yet.</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {attachments.map(att => (
                        <div key={att.id} className="p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700/50 flex items-center justify-between">
                            <div className="flex items-center space-x-2 overflow-hidden">
                                {att.mockUrl && att.type.startsWith('image/') ? (
                                    <img src={att.mockUrl} alt={att.name} className="w-8 h-8 object-cover rounded flex-shrink-0"/>
                                ) : (
                                    <Icon path={ICON_PATHS.DOCUMENT_TEXT} className="w-6 h-6 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
                                )}
                                <div className="overflow-hidden">
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate" title={att.name}>{getAttachmentDisplay(att)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(att.size)}</p>
                                </div>
                            </div>
                            <Button type="button" variant="ghost" size="xs" onClick={() => handleRemoveAttachment(att.id)} className="p-0.5 text-red-500"><Icon path={ICON_PATHS.TRASH_ICON} className="w-3.5 h-3.5"/></Button>
                        </div>
                    ))}
                </div>
            )}
        </section>

      {initialProjectData?.id && user && (
        <section className="space-y-3 pt-3 border-t dark:border-gray-600">
            <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100">Project Discussion & Comments</h4>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {comments.length === 0 ? <p className="text-xs text-gray-500 dark:text-gray-400">No comments yet.</p> : 
                    comments.map(comment => (
                        <div key={comment.id} className={`p-2 rounded-md border ${comment.authorId === user.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`}>
                            <div className="flex items-start space-x-2">
                                <img src={comment.authorAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&size=24&background=random`} alt={comment.authorName} className="w-6 h-6 rounded-full"/>
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{comment.authorName}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{comment.text}</p>
                                    <p className="text-xxs text-gray-400 dark:text-gray-500 mt-0.5">{new Date(comment.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                            {comment.authorId === user.id && (
                                <div className="text-right mt-1 space-x-1">
                                    <Button size="xs" variant="ghost" onClick={() => handleEditComment(comment)} className="p-0.5 text-xs"><Icon path={ICON_PATHS.COG_6_TOOTH} className="w-3 h-3"/></Button>
                                    <Button size="xs" variant="ghost" onClick={() => handleDeleteComment(comment.id)} className="p-0.5 text-red-500 text-xs"><Icon path={ICON_PATHS.TRASH_ICON} className="w-3 h-3"/></Button>
                                </div>
                            )}
                        </div>
                    ))
                }
            </div>
            <form onSubmit={handleCommentSubmit} className="flex items-start space-x-2">
                <Textarea
                    name="newCommentText"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder={editingComment ? "Edit your comment..." : "Add a comment..."}
                    rows={2}
                    required
                    wrapperClassName="flex-grow mb-0"
                />
                <div className="flex flex-col space-y-1">
                    <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingComment}>
                        {editingComment ? 'Update' : 'Post'}
                    </Button>
                    {editingComment && <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingComment(null); setNewCommentText('');}}>Cancel Edit</Button>}
                </div>
            </form>
        </section>
      )}


      <div className="mt-4 pt-4 border-t dark:border-gray-600 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="dark:bg-gray-600 dark:hover:bg-gray-500">
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {initialProjectData ? 'Save Changes' : 'Create Project'}
        </Button>
      </div>
    </form>
    <TaskSubItemFormModal
        isOpen={isItemModalOpen}
        onClose={() => { setIsItemModalOpen(false); setItemToEdit(undefined); }}
        onSave={handleSaveItem}
        initialData={itemToEdit}
        projectId={initialProjectData?.id || `temp-project-${Date.now()}`}
        allItemsInProject={items}
        teamMembers={team}
    />
     {projectForSummary && (
        <AISummaryExportModal
            isOpen={isSummaryModalOpen}
            onClose={() => setIsSummaryModalOpen(false)}
            project={projectForSummary}
        />
    )}
    {isGanttChartModalOpen && (
        <GanttChartModal
            isOpen={isGanttChartModalOpen}
            onClose={() => setIsGanttChartModalOpen(false)}
            items={items}
            milestones={milestones}
            projectStartDate={startDate || initialProjectData?.startDate || new Date().toISOString().split('T')[0]}
        />
    )}
    </>
  );
};

export default TaskProjectForm;