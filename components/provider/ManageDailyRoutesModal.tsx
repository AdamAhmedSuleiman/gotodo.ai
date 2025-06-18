// src/components/provider/ManageDailyRoutesModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import Textarea from '../ui/Textarea.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';
import { DailyRoutineRoute, DailyRoutineRouteSlot, GeoLocation, ManageDailyRoutesModalProps } from '../../types.js';
import { createGeoLocationFromString } from '../../services/userDataService.js';
import { optimizeDailyRouteAI } from '../../services/geminiService.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { useToast } from '../../contexts/ToastContext.js';
import LoadingSpinner from '../ui/LoadingSpinner.js';


const daysOfWeek: DailyRoutineRouteSlot['days'][number][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ManageDailyRoutesModal: React.FC<ManageDailyRoutesModalProps> = ({
  isOpen,
  onClose,
  routes,
  onSaveRoute,
  onDeleteRoute,
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<DailyRoutineRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Form state
  const [routeName, setRouteName] = useState('');
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [intermediateStops, setIntermediateStops] = useState<GeoLocation[]>([]); // Store as GeoLocation[]
  const [intermediateStopsStr, setIntermediateStopsStr] = useState(''); // For display in textarea
  const [isOptimizedByAI, setIsOptimizedByAI] = useState(false);

  const [selectedDays, setSelectedDays] = useState<DailyRoutineRouteSlot['days'][number][]>([]);
  const [routeTime, setRouteTime] = useState('08:00');
  const [isReturnTrip, setIsReturnTrip] = useState(false);
  const [availableForSharing, setAvailableForSharing] = useState(false);
  const [allowedDeviationKm, setAllowedDeviationKm] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editingRoute) {
      setRouteName(editingRoute.routeName || '');
      setOriginAddress(editingRoute.origin?.address || '');
      setDestinationAddress(editingRoute.destination?.address || '');
      setIntermediateStops(editingRoute.intermediateStops || []);
      setIntermediateStopsStr(editingRoute.intermediateStops?.map(s => s.address || `${s.lat},${s.lng}`).join('\n') || '');
      setIsOptimizedByAI(editingRoute.isOptimizedByAI || false);
      setSelectedDays(editingRoute.schedule?.[0]?.days || []);
      setRouteTime(editingRoute.schedule?.[0]?.time || '08:00');
      setIsReturnTrip(editingRoute.schedule?.[0]?.isReturnTrip || false);
      setAvailableForSharing(editingRoute.availableForSharing || false);
      setAllowedDeviationKm(editingRoute.allowedDeviationKm || '');
      setNotes(editingRoute.notes || '');
      setShowAddForm(true);
    } else {
      resetForm();
    }
  }, [editingRoute]);

  const resetForm = () => {
    setRouteName(''); setOriginAddress(''); setDestinationAddress('');
    setIntermediateStops([]); setIntermediateStopsStr(''); setIsOptimizedByAI(false);
    setSelectedDays([]); setRouteTime('08:00'); setIsReturnTrip(false);
    setAvailableForSharing(false); setAllowedDeviationKm(''); setNotes('');
    setFormError(null);
  };

  const handleDayToggle = (day: DailyRoutineRouteSlot['days'][number]) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleIntermediateStopsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIntermediateStopsStr(e.target.value);
    // Debounce or on blur, parse and geocode these. For now, simple string.
    // This will require a more complex UI or parsing logic for real use.
    // For simplicity, we'll geocode them on submit for now.
  };
  
  const handleOptimizeStopsAI = async () => {
    if (intermediateStops.length < 2) {
      addToast("Need at least two intermediate stops to optimize.", "warning");
      return;
    }
    setIsOptimizing(true);
    try {
      const { optimizedStops, notes: optimizationNotes } = await optimizeDailyRouteAI(intermediateStops, routeName);
      setIntermediateStops(optimizedStops);
      setIntermediateStopsStr(optimizedStops.map(s => s.address || `${s.lat},${s.lng}`).join('\n'));
      setIsOptimizedByAI(true);
      addToast(`Route stops optimized by AI: ${optimizationNotes}`, "success");
    } catch (error) {
      addToast("AI Stop Optimization Failed.", "error");
      console.error(error);
    } finally {
      setIsOptimizing(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!user) { setFormError('User not found.'); return; }
    if (!routeName.trim() || !originAddress.trim() || !destinationAddress.trim() || selectedDays.length === 0) {
      setFormError('Route name, origin, destination, and at least one day are required.');
      return;
    }

    let originLoc: GeoLocation, destLoc: GeoLocation;
    let parsedIntermediateStops: GeoLocation[] = [];

    try {
      originLoc = createGeoLocationFromString(originAddress);
      destLoc = createGeoLocationFromString(destinationAddress);
      if (intermediateStopsStr.trim()) {
          parsedIntermediateStops = intermediateStopsStr.split('\n')
              .map(addr => addr.trim())
              .filter(addr => addr)
              .map(addr => createGeoLocationFromString(addr));
      }
    } catch (error) {
      setFormError('Failed to parse addresses. Please check them.');
      return;
    }

    const newRoute: DailyRoutineRoute = {
      id: editingRoute?.id || `route-temp-${Date.now()}`,
      providerId: user.id,
      routeName,
      origin: originLoc,
      destination: destLoc,
      intermediateStops: parsedIntermediateStops,
      isOptimizedByAI,
      schedule: [{ days: selectedDays, time: routeTime, isReturnTrip }],
      availableForSharing,
      allowedDeviationKm: allowedDeviationKm ? parseFloat(allowedDeviationKm as string) : undefined,
      notes,
    };
    onSaveRoute(newRoute);
    resetForm();
    setShowAddForm(false);
    setEditingRoute(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingRoute ? "Edit Daily Route" : "Manage Daily Routes"} size="2xl">
      <div className="space-y-4 p-1">
        {!showAddForm && (
          <Button
            onClick={() => { setEditingRoute(null); setShowAddForm(true); }}
            leftIcon={<Icon path={ICON_PATHS.PLUS_CIRCLE} />}
            variant="primary"
            className="mb-3"
          >
            Add New Route
          </Button>
        )}

        {showAddForm ? (
          <form onSubmit={handleSubmit} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow border dark:border-gray-600 space-y-3">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
              {editingRoute ? 'Edit Route Details' : 'Add New Daily Route'}
            </h3>
            {formError && <p className="text-sm text-red-500 dark:text-red-400 p-2 bg-red-100 dark:bg-red-900/30 rounded">{formError}</p>}
            
            <Input label="Route Name" value={routeName} onChange={e => setRouteName(e.target.value)} placeholder="e.g., Morning School Run" required />
            <Input label="Origin Address" value={originAddress} onChange={e => setOriginAddress(e.target.value)} placeholder="e.g., 123 Home St, City" required />
            <Input label="Destination Address" value={destinationAddress} onChange={e => setDestinationAddress(e.target.value)} placeholder="e.g., 456 Work Ave, City" required />
            
            <Textarea label="Intermediate Stops (Optional, one address per line)" value={intermediateStopsStr} onChange={handleIntermediateStopsChange} rows={3} placeholder="e.g., 789 Cafe Rd&#10;101 Park Way"/>
            {intermediateStops.length > 1 && (
                <Button type="button" size="sm" variant="outline" onClick={handleOptimizeStopsAI} isLoading={isOptimizing} leftIcon={<Icon path={ICON_PATHS.SPARKLES}/>} className="dark:text-gray-300 dark:border-gray-600">
                    AI Optimize Stops
                </Button>
            )}
            {isOptimizedByAI && <p className="text-xs text-green-600 dark:text-green-400">Intermediate stops order optimized by AI.</p>}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Days of Week</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <Button
                    key={day} type="button" size="sm"
                    variant={selectedDays.includes(day) ? 'primary' : 'outline'}
                    onClick={() => handleDayToggle(day)}
                    className={`text-xs ${selectedDays.includes(day) ? '' : 'dark:text-gray-300 dark:border-gray-500'}`}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
            <Input label="Time (HH:MM)" type="time" value={routeTime} onChange={e => setRouteTime(e.target.value)} required />
             <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={isReturnTrip} onChange={(e) => setIsReturnTrip(e.target.checked)} className="form-checkbox h-4 w-4 text-blue-600 dark:bg-gray-600 rounded focus:ring-blue-500"/>
                <span className="text-sm text-gray-700 dark:text-gray-300">This is a return trip (e.g., Work to Home)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={availableForSharing} onChange={(e) => setAvailableForSharing(e.target.checked)} className="form-checkbox h-4 w-4 text-blue-600 dark:bg-gray-600 rounded focus:ring-blue-500"/>
                <span className="text-sm text-gray-700 dark:text-gray-300">Available for Sharing (Allow others to join/send items)</span>
            </label>
            {availableForSharing && <Input label="Allowed Deviation (km, Optional)" type="number" value={allowedDeviationKm} onChange={e => setAllowedDeviationKm(e.target.value)} min="0" placeholder="e.g., 5"/>}
            <Textarea label="Notes (Optional)" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g., Avoid toll roads, Preferred parking spot"/>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="secondary" onClick={() => { setShowAddForm(false); setEditingRoute(null); resetForm(); }} className="dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</Button>
              <Button type="submit" variant="primary">{editingRoute ? 'Save Changes' : 'Add Route'}</Button>
            </div>
          </form>
        ) : (
          <div>
            <h3 className="text-md font-medium text-gray-800 dark:text-gray-100 mb-2">Your Saved Routes</h3>
            {routes.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No daily routes configured yet.</p>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {routes.map(route => (
                  <li key={route.id} className="p-3 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-700/50">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-blue-600 dark:text-blue-400">{route.routeName}</h4>
                      <div>
                        <Button variant="ghost" size="xs" onClick={() => setEditingRoute(route)} className="mr-1 p-1"><Icon path={ICON_PATHS.COG_6_TOOTH} className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="xs" onClick={() => onDeleteRoute(route.id)} className="p-1 text-red-500"><Icon path={ICON_PATHS.TRASH_ICON} className="w-4 h-4"/></Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">From: {route.origin.address}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">To: {route.destination.address}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Schedule: {route.schedule.map(s => `${s.days.join('/')} at ${s.time}`).join('; ')}</p>
                    {route.availableForSharing && <span className="text-xs bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200 px-1.5 py-0.5 rounded-full">Sharing Enabled</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ManageDailyRoutesModal;
