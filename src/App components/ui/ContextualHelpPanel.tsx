// src/components/ui/ContextualHelpPanel.tsx
import React from 'react';
import Icon from './Icon.js'; 
import { ICON_PATHS } from '../../constants.js';
import { ContextualHelpPanelProps } from '../../types.js';
import Button from './Button.js'; 

const helpContent: Record<ContextualHelpPanelProps['pageKey'], { title: string; tips: string[] }> = {
  'home': {
    title: 'Home Page Tips',
    tips: [
      "Use the main input to describe any request or ask Gemma questions.",
      "Try the 'Speak your Request' or 'Live AI Video Session' for quick interactions.",
      "Explore different service categories using the buttons below the main input.",
      "Your dashboard (Requester or Provider) is accessible via the button at the bottom."
    ],
  },
  'requester-portal': {
    title: 'Requester Portal Tips',
    tips: [
      "Describe your needs clearly for the best AI analysis results.",
      "Upload relevant images if they help explain your request (e.g., a picture of a broken item).",
      "Use the 'Speak your Request' or 'Live AI Video Session' on the Home Page for quick input!",
      "Check your active requests section to see their status.",
      "The map provides a visual overview related to your current or new request.",
      "Plan multi-stop journeys using the 'Plan a Multi-Stop Journey Instead' button.",
    ],
  },
  'provider-portal': {
    title: 'Provider Portal Tips',
    tips: [
      "Keep your listed services accurate and detailed to attract the right requests.",
      "Toggle 'Online' status to start receiving incoming request notifications.",
      "Review your earnings chart and AI insights to optimize your work strategy.",
      "Make sure your availability is up-to-date.",
      "High ratings and good reviews can lead to more opportunities.",
      "Manage your documents and payout settings to ensure smooth operations."
    ],
  },
  'admin-portal': {
    title: 'Admin Portal Tips',
    tips: [
      "Monitor platform analytics for user activity and service trends.",
      "Review flagged requests promptly to maintain platform integrity.",
      "User management tools allow you to view details, suspend, or delete user accounts if necessary.",
      "Keep an eye on system health and report any anomalies.",
    ],
  },
  'settings-page': {
    title: 'Settings Page Tips',
    tips: [
        "Update your profile information like name, phone number, and avatar here.",
        "Change your password regularly for security (this is a mock feature).",
        "Manage your notification preferences to control how we contact you.",
        "Add and manage saved places (e.g., Home, Work) for quicker request creation.",
        "Add and manage saved members/recipients to easily pre-fill details for requests made for others."
    ],
  },
  'task-portal': { 
    title: 'Task Portal Tips',
    tips: [
      "Describe your complex project in the creation form.",
      "Use the 'Analyze Project with AI' button to get suggestions for sub-tasks and milestones.",
      "Review and modify AI suggestions before saving your project.",
      "Track all your major projects and their progress here."
    ],
  }
};

const ContextualHelpPanel: React.FC<ContextualHelpPanelProps> = ({
  isOpen,
  onClose,
  pageKey,
  position = 'bottom-right',
}) => {
  if (!isOpen) return null;

  const content = helpContent[pageKey];
  if (!content) { 
    console.warn(`ContextualHelpPanel: No help content defined for pageKey "${pageKey}"`);
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4 sm:bottom-6 sm:right-6', 
    'bottom-left': 'bottom-20 left-4 sm:bottom-6 sm:left-6',
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 w-full max-w-sm p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out transform ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-panel-title"
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <h3 id="help-panel-title" className="text-lg font-semibold text-blue-600 dark:text-blue-400 flex items-center">
          <Icon path={ICON_PATHS.QUESTION_MARK_CIRCLE} className="w-6 h-6 mr-2" />
          {content.title}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label="Close help panel"
        >
          <Icon path={ICON_PATHS.X_MARK_ICON} className="w-5 h-5" />
        </button>
      </div>
      <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
        {content.tips.map((tip, index) => (
          <li key={index} className="flex items-start">
            <Icon path={ICON_PATHS.SPARKLES} className="w-4 h-4 mr-2 mt-0.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-right">
        <Button size="sm" variant="ghost" onClick={onClose} className="dark:text-gray-300 dark:hover:bg-gray-700">
            Got it!
        </Button>
      </div>
    </div>
  );
};

export default ContextualHelpPanel;