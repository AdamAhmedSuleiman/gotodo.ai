
// src/components/journey/JourneyStopCard.tsx
import React, { useState } from 'react';
import { JourneyStop, StopActionType, JourneyAction, GeoLocation, PickupPersonActionDetails, PickupItemActionDetails, AssignTaskActionDetails } from '../../src/types.js';
import Button from '../ui/Button.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../src/constants.js';
import Input from '../ui/Input.js';
import * as mapService from '../../src/services/mapService.js';

interface JourneyStopCardProps {
  stop: JourneyStop;
  stopCount: number;
  index: number;
  onUpdateStop: (stopId: string, updates: Partial<JourneyStop>) => void;
  onRemoveStop: (stopId: string) => void;
  onConfigureAction: (stopId: string, actionType: StopActionType, actionToEdit?: JourneyAction) => void;
  onSetMapAction: () => void;
  onDeleteAction: (stopId: string, actionId: string) => void;
  isSelected: boolean;
  onSelectStop: () => void;
  disabled?: boolean;
}

const JourneyStopCard: React.FC<JourneyStopCardProps> = ({
  stop,
  stopCount,
  index,
  onUpdateStop,
  onRemoveStop,
  onConfigureAction,
  onSetMapAction,
  onDeleteAction,
  isSelected,
  onSelectStop,
  disabled = false,
}) => {
  const [address, setAddress] = useState(stop.addressInput);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState<Record<string, boolean>>({});

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleAddressBlur = async () => {
    if (disabled) return;
    if (address.trim() === stop.addressInput.trim() && stop.location) return; 
    if (!address.trim()) {
        onUpdateStop(stop.id, { addressInput: "", location: undefined});
        return;
    }
    setIsGeocoding(true);
    try {
      const results = await mapService.geocodeAddress(address);
      if (results && results.length > 0) {
        const { lat, lng } = results[0].geometry.location;
        const newLocation: GeoLocation = { lat: lat(), lng: lng(), address: results[0].formatted_address };
        onUpdateStop(stop.id, { addressInput: address, location: newLocation });
      } else {
        onUpdateStop(stop.id, { addressInput: address, location: undefined }); 
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      onUpdateStop(stop.id, { addressInput: address, location: undefined });
    } finally {
      setIsGeocoding(false);
    }
  };
  
  const getStopTypeName = () => {
    if (index === 0) return "Origin";
    if (index === stopCount - 1) return "Final Destination";
    return `Stop ${index}`;
  };

  const getActionIcon = (type: StopActionType) => {
    switch(type) {
        case 'pickup_person': return ICON_PATHS.USER_PLUS_ICON;
        case 'pickup_item': return ICON_PATHS.ARROW_DOWN_TRAY_ICON;
        case 'dropoff_person': return ICON_PATHS.USER; 
        case 'dropoff_item': return ICON_PATHS.ARROW_UP_TRAY_ICON;
        case 'assign_task': return ICON_PATHS.CLIPBOARD_DOCUMENT_LIST_ICON;
        default: return ICON_PATHS.COG_6_TOOTH;
    }
  }
  
  const getActionSummary = (action: JourneyAction): string => {
    const details = action.details;
    switch(action.type) {
        case 'pickup_person':
            const ppDetails = details as PickupPersonActionDetails;
            return `Pick up ${ppDetails.passengerCount || 1} person(s)`;
        case 'pickup_item':
            const piDetails = details as PickupItemActionDetails;
            return `Pick up ${piDetails.quantity || 1} ${piDetails.unit || 'item(s)'}`;
        case 'dropoff_person': return `Drop off person(s)`; 
        case 'dropoff_item': return `Drop off item(s)`; 
        case 'assign_task':
            const atDetails = details as AssignTaskActionDetails;
            return `Task: ${atDetails.taskDetails?.substring(0,20) || 'Details' }...`;
        default: return 'Configured Action';
    }
  }

  const toggleActionSubMenu = (buttonId: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    if (disabled) return;
    setIsActionMenuOpen(prev => ({ ...Object.keys(prev).reduce((acc, key) => ({...acc, [key]:false}), {}), [buttonId]: !prev[buttonId] }));
  };


  return (
    <div 
        className={`p-3 border rounded-lg shadow-sm dark:border-gray-700 transition-all duration-150 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/70 border-blue-500 dark:border-blue-600 ring-2 ring-blue-500 dark:ring-blue-600' : 'bg-white dark:bg-gray-800 hover:shadow-md'} ${disabled ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}
        onClick={disabled ? undefined : onSelectStop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { if (!disabled) onSelectStop(); }}}
        aria-current={isSelected ? "true" : "false"}
        aria-label={`Journey Stop ${index + 1}: ${stop.name}. Address: ${address || 'Not set'}. Status: ${isSelected ? 'Selected' : 'Not selected'}`}
    >
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-gray-700 dark:text-gray-200">{getStopTypeName()}: {stop.name.replace(getStopTypeName(), '').trim()}</h4>
        {(stopCount > 2 && (index !== 0 && index !== stopCount -1)) && ( 
          <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); if (!disabled) onRemoveStop(stop.id); }} className="text-red-500 dark:text-red-400 p-1" disabled={disabled} aria-label={`Remove stop ${stop.name}`}>
            <Icon path={ICON_PATHS.TRASH_ICON} className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Input
          name={`address-${stop.id}`}
          value={address}
          onChange={handleAddressChange}
          onBlur={handleAddressBlur}
          placeholder="Enter address or click locate"
          wrapperClassName="flex-grow mb-0"
          className="text-sm"
          disabled={isGeocoding || disabled}
          leftIcon={isGeocoding ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div> : <Icon path={ICON_PATHS.MAP_PIN} className="w-4 h-4 text-gray-400"/>}
        />
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); if (!disabled) onSetMapAction(); }} className="p-1.5 border dark:border-gray-600" title="Locate on Map" disabled={disabled} aria-label={`Set location for stop ${stop.name} on map`}>
          <Icon path={ICON_PATHS.LOCATION_MARKER} className="w-4 h-4" />
        </Button>
      </div>
      {stop.location?.address && address !== stop.location.address && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Geocoded: {stop.location.address}</p>
      )}

      {stop.actions.length > 0 && (
        <div className="mt-2 pt-2 border-t dark:border-gray-600 space-y-1">
            <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Actions at this stop:</h5>
            {stop.actions.map(action => (
                <div key={action.id} className="flex justify-between items-center p-1.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                    <div className="flex items-center">
                        <Icon path={getActionIcon(action.type)} className="w-3.5 h-3.5 mr-1.5 text-blue-500 dark:text-blue-400" />
                        <span className="text-gray-700 dark:text-gray-200">{getActionSummary(action)}</span>
                    </div>
                    <div>
                        <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); if (!disabled) onConfigureAction(stop.id, action.type, action); }} className="p-0.5" disabled={disabled} aria-label={`Edit action ${getActionSummary(action)}`}><Icon path={ICON_PATHS.COG_6_TOOTH} className="w-3.5 h-3.5"/></Button>
                        <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); if (!disabled) onDeleteAction(stop.id, action.id);}} className="p-0.5 text-red-500 dark:text-red-400" disabled={disabled} aria-label={`Delete action ${getActionSummary(action)}`}><Icon path={ICON_PATHS.TRASH_ICON} className="w-3.5 h-3.5"/></Button>
                    </div>
                </div>
            ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-1 mt-3 text-xs">
        <div className="relative">
            <Button variant="ghost" size="sm" onClick={(e) => toggleActionSubMenu('pickup', e)} className="w-full border dark:border-gray-600" disabled={disabled} aria-haspopup="true" aria-expanded={isActionMenuOpen['pickup']}>
                <Icon path={ICON_PATHS.ARROW_DOWN_TRAY_ICON} className="w-3.5 h-3.5 mr-1"/> Pick Up
            </Button>
            {isActionMenuOpen['pickup'] && !disabled && (
                <div className="absolute left-0 mt-1 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded shadow-lg z-10" role="menu">
                    <button onClick={(e) => { e.stopPropagation(); onConfigureAction(stop.id, 'pickup_person'); toggleActionSubMenu('pickup');}} className="block w-full text-left px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600" role="menuitem">Person</button>
                    <button onClick={(e) => { e.stopPropagation(); onConfigureAction(stop.id, 'pickup_item'); toggleActionSubMenu('pickup');}} className="block w-full text-left px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600" role="menuitem">Item/Product</button>
                </div>
            )}
        </div>
         <div className="relative">
            <Button variant="ghost" size="sm" onClick={(e) => toggleActionSubMenu('dropoff', e)} className="w-full border dark:border-gray-600" disabled={disabled} aria-haspopup="true" aria-expanded={isActionMenuOpen['dropoff']}>
                <Icon path={ICON_PATHS.ARROW_UP_TRAY_ICON} className="w-3.5 h-3.5 mr-1"/> Drop Off
            </Button>
            {isActionMenuOpen['dropoff'] && !disabled && (
                <div className="absolute left-0 mt-1 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded shadow-lg z-10" role="menu">
                    <button onClick={(e) => { e.stopPropagation(); onConfigureAction(stop.id, 'dropoff_person'); toggleActionSubMenu('dropoff');}} className="block w-full text-left px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600" role="menuitem">Person</button>
                    <button onClick={(e) => { e.stopPropagation(); onConfigureAction(stop.id, 'dropoff_item'); toggleActionSubMenu('dropoff');}} className="block w-full text-left px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600" role="menuitem">Item/Product</button>
                </div>
            )}
        </div>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); if (!disabled) onConfigureAction(stop.id, 'assign_task'); }} className="w-full border dark:border-gray-600" disabled={disabled}>
          <Icon path={ICON_PATHS.CLIPBOARD_DOCUMENT_LIST_ICON} className="w-3.5 h-3.5 mr-1"/> Task
        </Button>
      </div>
    </div>
  );
};

export default JourneyStopCard;