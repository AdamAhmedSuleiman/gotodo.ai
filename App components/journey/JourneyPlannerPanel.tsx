
// src/components/journey/JourneyPlannerPanel.tsx
import React, { useState, useEffect } from 'react';
import { JourneyPlan, JourneyStop, StopActionType, JourneyAction } from '../../src/types.js';
import Button from '../ui/Button.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../src/constants.js';
import JourneyStopCard from './JourneyStopCard.js';
import Input from '../ui/Input.js';

interface JourneyPlannerPanelProps {
  journeyPlan: JourneyPlan;
  onUpdateStop: (stopId: string, updates: Partial<JourneyStop>) => void;
  onAddStop: () => void;
  onRemoveStop: (stopId: string) => void;
  onConfigureAction: (stopId: string, actionType: StopActionType, actionToEdit?: JourneyAction) => void;
  onFinalizeJourney: () => void;
  isFinalizingJourney: boolean;
  onSetMapActionForStop: (stopId: string) => void;
  onDeleteAction: (stopId: string, actionId: string) => void;
  onExitJourneyMode: () => void;
}

const JourneyPlannerPanel: React.FC<JourneyPlannerPanelProps> = ({
  journeyPlan,
  onUpdateStop,
  onAddStop,
  onRemoveStop,
  onConfigureAction,
  onFinalizeJourney,
  isFinalizingJourney,
  onSetMapActionForStop,
  onDeleteAction,
  onExitJourneyMode,
}) => {
  const [journeyTitle, setJourneyTitle] = useState(journeyPlan.title);
  const [selectedStopIdForGlobalActions, setSelectedStopIdForGlobalActions] = useState<string | null>(journeyPlan.stops[0]?.id || null);

  useEffect(() => {
    setJourneyTitle(journeyPlan.title);
    if (!selectedStopIdForGlobalActions && journeyPlan.stops.length > 0) {
        setSelectedStopIdForGlobalActions(journeyPlan.stops[0].id);
    } else if (journeyPlan.stops.length === 0) {
        setSelectedStopIdForGlobalActions(null);
    }
  }, [journeyPlan, selectedStopIdForGlobalActions]);


  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJourneyTitle(e.target.value);
    // Debounce or onBlur update for actual journeyPlan title
  };

  const handleTitleBlur = () => {
    if (disabled) return;
    if (journeyPlan.title !== journeyTitle) {
        // Create a shallow copy of the journey plan and update its title
        // Then call a function (passed as a prop, e.g., onUpdateJourneyPlan) to update the parent's state
        // For example: onUpdateJourneyPlan({ ...journeyPlan, title: journeyTitle });
        // For now, we'll assume onUpdateStop can handle a special "journey" ID or similar
        // or the parent component handles this logic.
        // A simple way for now, if the parent page directly manages currentJourneyPlan state:
        // setCurrentJourneyPlan(prev => prev ? {...prev, title: journeyTitle} : null);
        // This logic should ideally be in RequesterPortalPage.tsx.
        console.log("Journey title changed locally to:", journeyTitle, ". Parent should update.");
         onUpdateStop(journeyPlan.id, { name: journeyTitle } as any); // HACK: Using name field for title update
    }
  };
  
  const handleGlobalAction = (actionType: StopActionType) => {
    if (disabled) return;
    if (selectedStopIdForGlobalActions) {
      onConfigureAction(selectedStopIdForGlobalActions, actionType);
    } else {
      alert("Please select a stop first to add an action.");
    }
  };
  
  const selectedStopName = journeyPlan.stops.find(s => s.id === selectedStopIdForGlobalActions)?.name || "None Selected";
  const disabled = isFinalizingJourney;

  return (
    <div className="h-full flex flex-col">
      <div className="p-1 mb-3 border-b dark:border-gray-700">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Plan Your Journey</h2>
            <Button onClick={onExitJourneyMode} variant="ghost" size="sm" className="text-xs" disabled={disabled}>
                Exit Planner
            </Button>
        </div>
        <Input
          name="journeyTitle"
          value={journeyTitle}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          placeholder="Enter Journey Title (e.g., Weekend Trip)"
          wrapperClassName="mb-2"
          className="text-lg font-medium dark:bg-gray-700"
          disabled={disabled}
        />
      </div>

      <div className="flex-grow overflow-y-auto space-y-3 pr-1 pb-36"> {/* Increased pb for fixed bottom section */}
        {journeyPlan.stops.map((stop, index) => (
          <JourneyStopCard
            key={stop.id}
            stop={stop}
            stopCount={journeyPlan.stops.length}
            index={index}
            onUpdateStop={onUpdateStop}
            onRemoveStop={onRemoveStop}
            onConfigureAction={onConfigureAction}
            onSetMapAction={() => onSetMapActionForStop(stop.id)}
            onDeleteAction={onDeleteAction}
            isSelected={selectedStopIdForGlobalActions === stop.id}
            onSelectStop={() => setSelectedStopIdForGlobalActions(stop.id)}
            disabled={disabled}
          />
        ))}
        <Button onClick={onAddStop} fullWidth variant="outline" leftIcon={<Icon path={ICON_PATHS.PLUS_CIRCLE} />} disabled={disabled}>
          Add Stop
        </Button>
      </div>
      
      <div className="mt-auto p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2 fixed bottom-0 left-0 right-0 md:absolute md:w-full">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Quick Add Action to: <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedStopName}</span>
        </p>
         <div className="grid grid-cols-3 gap-2 text-xs">
             <Button onClick={() => handleGlobalAction('pickup_item')} size="sm" variant="ghost" className="border dark:border-gray-600" disabled={disabled || !selectedStopIdForGlobalActions}><Icon path={ICON_PATHS.SHOPPING_BAG_ICON} className="w-4 h-4 mr-1"/>Product</Button>
             <Button onClick={() => handleGlobalAction('pickup_person')}  size="sm" variant="ghost" className="border dark:border-gray-600" disabled={disabled || !selectedStopIdForGlobalActions}><Icon path={ICON_PATHS.TRUCK_SOLID_ICON} className="w-4 h-4 mr-1"/>Driver</Button>
             <Button onClick={() => handleGlobalAction('assign_task')} size="sm" variant="ghost" className="border dark:border-gray-600" disabled={disabled || !selectedStopIdForGlobalActions}><Icon path={ICON_PATHS.CLIPBOARD_DOCUMENT_LIST_ICON} className="w-4 h-4 mr-1"/>Service</Button>
        </div>
        <Button 
          onClick={onFinalizeJourney} 
          fullWidth 
          variant="primary" 
          size="lg" 
          isLoading={isFinalizingJourney} 
          disabled={disabled || journeyPlan.stops.some(s => !s.location) || (journeyPlan.stops.length > 2 && journeyPlan.stops.slice(1, -1).some(s => s.actions.length === 0))}
          title={journeyPlan.stops.some(s => !s.location) ? "All stops must have a location." : (journeyPlan.stops.length > 2 && journeyPlan.stops.slice(1, -1).some(s => s.actions.length === 0) ? "All intermediate stops (excluding Origin/Destination) must have at least one action if there are more than 2 stops." : "Finalize Journey")}
        >
          Finalize Journey & Get Options
        </Button>
      </div>
    </div>
  );
};

export default JourneyPlannerPanel;