// src/components/provider/ManageAvailabilityModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import { ManageAvailabilityModalProps, ProviderAvailabilitySlot, BlockedTimeSlot } from '../../types.js'; 
import Icon from '../ui/Icon.js'; 
import { ICON_PATHS } from '../../constants.js'; 
import { useToast } from '../../contexts/ToastContext.js';

const daysOfWeek: ProviderAvailabilitySlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ManageAvailabilityModal: React.FC<ManageAvailabilityModalProps> = ({
  isOpen,
  onClose,
  availability: initialAvailability,
  onSaveAvailability,
  blockedTimeSlots = [], 
  onAddBlockedTimeSlot, 
  onDeleteBlockedTimeSlot, 
}) => {
  const [currentAvailability, setCurrentAvailability] = useState<ProviderAvailabilitySlot[]>([]);
  const [showAddBlockForm, setShowAddBlockForm] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockStartDate, setNewBlockStartDate] = useState('');
  const [newBlockEndDate, setNewBlockEndDate] = useState('');
  const [newBlockStartTime, setNewBlockStartTime] = useState('');
  const [newBlockEndTime, setNewBlockEndTime] = useState('');
  const [newBlockIsAllDay, setNewBlockIsAllDay] = useState(true);
  const [newBlockRecurring, setNewBlockRecurring] = useState<'none' | 'weekly_on_this_day' | 'monthly_on_this_date' | 'every_weekday' | 'every_weekend_day'>('none');
  const { addToast } = useToast();


  useEffect(() => {
    if (isOpen) {
      const fullAvailability = daysOfWeek.map(day => {
        const existingSlot = initialAvailability.find(slot => slot.day === day);
        if (existingSlot) {
          return {
            ...existingSlot,
            slots: existingSlot.isAvailable && (!existingSlot.slots || existingSlot.slots.length === 0) 
                   ? [{ startTime: '09:00', endTime: '17:00' }] 
                   : (existingSlot.slots || []) 
          };
        }
        return { day, isAvailable: false, slots: [] }; 
      });
      setCurrentAvailability(fullAvailability);
      setShowAddBlockForm(false); 
    }
  }, [isOpen, initialAvailability]);


  const handleToggleAvailable = (day: ProviderAvailabilitySlot['day']) => {
    setCurrentAvailability(prev =>
      prev.map(slot => {
        if (slot.day === day) {
          const newIsAvailable = !slot.isAvailable;
          const newSlots = newIsAvailable && slot.slots.length === 0 
            ? [{ startTime: '09:00', endTime: '17:00' }] 
            : (newIsAvailable ? slot.slots : []); 
          return { ...slot, isAvailable: newIsAvailable, slots: newSlots };
        }
        return slot;
      })
    );
  };

  const handleTimeChange = (day: ProviderAvailabilitySlot['day'], slotIndex: number, timeField: 'startTime' | 'endTime', value: string) => {
    setCurrentAvailability(prev =>
      prev.map(slot => {
        if (slot.day === day) {
          const updatedSlots = [...slot.slots];
          if (updatedSlots[slotIndex]) {
            updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], [timeField]: value };
          }
          return { ...slot, slots: updatedSlots };
        }
        return slot;
      })
    );
  };
  
  const handleAddSlotToDay = (day: ProviderAvailabilitySlot['day']) => {
    setCurrentAvailability(prev => 
      prev.map(slot => 
        slot.day === day 
          ? { ...slot, slots: [...slot.slots, { startTime: '09:00', endTime: '17:00' }] } 
          : slot
      )
    );
  };

  const handleRemoveSlotFromDay = (day: ProviderAvailabilitySlot['day'], slotIndex: number) => {
    setCurrentAvailability(prev => 
      prev.map(slot => {
        if (slot.day === day) {
          const newSlots = slot.slots.filter((_, index) => index !== slotIndex);
          // If all slots are removed, mark as unavailable
          const newIsAvailable = newSlots.length > 0 ? slot.isAvailable : false;
          return { ...slot, slots: newSlots, isAvailable: newIsAvailable };
        }
        return slot;
      })
    );
  };


  const handleSave = () => {
    onSaveAvailability(currentAvailability);
    onClose();
  };
  
  const handleAddBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddBlockedTimeSlot) return;
    if (!newBlockStartDate) { addToast("Start date is required for blocking time.", "error"); return; }
    if (!newBlockIsAllDay && (!newBlockStartTime || !newBlockEndTime)) { addToast("Start and end times are required if not all day.", "error"); return; }

    const newBlock: Omit<BlockedTimeSlot, 'id'> = { 
      title: newBlockTitle || `Blocked Time (${newBlockIsAllDay ? 'All Day' : `${newBlockStartTime}-${newBlockEndTime}`})`,
      startDate: newBlockStartDate,
      endDate: newBlockIsAllDay && newBlockEndDate ? newBlockEndDate : (newBlockIsAllDay ? newBlockStartDate : undefined), 
      startTime: newBlockIsAllDay ? undefined : newBlockStartTime,
      endTime: newBlockIsAllDay ? undefined : newBlockEndTime,
      isAllDay: newBlockIsAllDay,
      recurring: newBlockRecurring,
    };
    onAddBlockedTimeSlot(newBlock); 
    setShowAddBlockForm(false);
    setNewBlockTitle(''); setNewBlockStartDate(''); setNewBlockEndDate(''); 
    setNewBlockStartTime(''); setNewBlockEndTime(''); setNewBlockIsAllDay(true); setNewBlockRecurring('none');
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Your Availability & Blocked Time" size="3xl"
      footer={
        <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose} className="dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save Availability</Button>
        </div>
      }
    >
      <div className="space-y-4 p-1 max-h-[70vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Weekly Availability</h3>
        {currentAvailability.map((slot) => (
          <div key={slot.day} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-800 dark:text-gray-100">{slot.day}</h4>
              <label className="flex items-center cursor-pointer">
                <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">Available:</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={slot.isAvailable}
                    onChange={() => handleToggleAvailable(slot.day)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white dark:peer-checked:after:border-gray-800 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-300 after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600"></div>
                </div>
              </label>
            </div>
            {slot.isAvailable && (
                slot.slots.map((timeSlot, slotIndex) => (
                    <div key={slotIndex} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center mb-1.5">
                        <Input label={slotIndex === 0 ? "Start Time" : ""} type="time" name={`startTime-${slot.day}-${slotIndex}`} value={timeSlot.startTime} onChange={(e) => handleTimeChange(slot.day, slotIndex, 'startTime', e.target.value)} wrapperClassName="mb-0 sm:col-span-2" className="text-sm"/>
                        <Input label={slotIndex === 0 ? "End Time" : ""} type="time" name={`endTime-${slot.day}-${slotIndex}`} value={timeSlot.endTime} onChange={(e) => handleTimeChange(slot.day, slotIndex, 'endTime', e.target.value)} wrapperClassName="mb-0 sm:col-span-2" className="text-sm"/>
                        <Button variant="danger" size="xs" onClick={() => handleRemoveSlotFromDay(slot.day, slotIndex)} className="mt-3 sm:mt-0 p-1.5 self-end" aria-label="Remove time slot">
                            <Icon path={ICON_PATHS.TRASH_ICON} className="w-3.5 h-3.5"/>
                        </Button>
                    </div>
                ))
            )}
             {slot.isAvailable && (
                <Button variant="ghost" size="xs" onClick={() => handleAddSlotToDay(slot.day)} className="mt-1 border dark:border-gray-500 text-xs">
                    <Icon path={ICON_PATHS.PLUS_CIRCLE} className="w-3.5 h-3.5 mr-1"/> Add Time Slot
                </Button>
            )}
          </div>
        ))}
        
        <div className="mt-6 pt-4 border-t dark:border-gray-600">
            <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-2">Blocked Time Slots</h4>
            {!showAddBlockForm && onAddBlockedTimeSlot && (
                 <Button onClick={() => setShowAddBlockForm(true)} variant="outline" size="sm" leftIcon={<Icon path={ICON_PATHS.PLUS_CIRCLE} />} className="mb-3 dark:border-gray-500">
                    Add Blocked Time
                </Button>
            )}
            {showAddBlockForm && onAddBlockedTimeSlot && (
                <form onSubmit={handleAddBlockSubmit} className="p-3 mb-3 bg-gray-100 dark:bg-gray-700/50 rounded-md border dark:border-gray-600 space-y-2">
                    <Input label="Block Title (Optional)" value={newBlockTitle} onChange={e => setNewBlockTitle(e.target.value)} placeholder="e.g., Vacation, Doctor's Appointment"/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Input label="Start Date" type="date" value={newBlockStartDate} onChange={e => setNewBlockStartDate(e.target.value)} required/>
                        <Input label="End Date (for multi-day all-day blocks)" type="date" value={newBlockEndDate} onChange={e => setNewBlockEndDate(e.target.value)} disabled={!newBlockIsAllDay}/>
                    </div>
                     <label className="flex items-center space-x-2 cursor-pointer text-sm">
                        <input type="checkbox" checked={newBlockIsAllDay} onChange={(e) => setNewBlockIsAllDay(e.target.checked)} className="form-checkbox h-4 w-4 text-blue-600 dark:bg-gray-600 rounded focus:ring-blue-500"/>
                        <span>All Day</span>
                    </label>
                    {!newBlockIsAllDay && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input label="Start Time" type="time" value={newBlockStartTime} onChange={e => setNewBlockStartTime(e.target.value)} required={!newBlockIsAllDay} />
                            <Input label="End Time" type="time" value={newBlockEndTime} onChange={e => setNewBlockEndTime(e.target.value)} required={!newBlockIsAllDay} />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">Recurring (Optional)</label>
                        <select value={newBlockRecurring} onChange={e => setNewBlockRecurring(e.target.value as any)} className="block w-full p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 text-sm">
                            <option value="none">None</option>
                            <option value="weekly_on_this_day">Weekly on this day</option>
                            <option value="monthly_on_this_date">Monthly on this date</option>
                            <option value="every_weekday">Every Weekday</option>
                            <option value="every_weekend_day">Every Weekend Day</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddBlockForm(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" size="sm">Add Block</Button>
                    </div>
                </form>
            )}
            {blockedTimeSlots.length > 0 ? (
                <ul className="space-y-1.5">
                    {blockedTimeSlots.map(block => (
                        <li key={block.id} className="text-xs p-2 border dark:border-gray-600 rounded-md bg-red-50 dark:bg-red-900/30 flex justify-between items-center">
                           <div>
                             <span className="font-medium text-red-700 dark:text-red-300">{block.title}</span>: {new Date(block.startDate).toLocaleDateString()} {block.isAllDay ? '(All Day)' : `${block.startTime} - ${block.endTime}`}
                             {block.endDate && block.endDate !== block.startDate && ` to ${new Date(block.endDate).toLocaleDateString()}`}
                             {block.recurring !== 'none' && <span className="ml-1 italic text-red-600 dark:text-red-400">({block.recurring.replace(/_/g, ' ')})</span>}
                           </div>
                           {onDeleteBlockedTimeSlot && <Button variant="ghost" size="xs" onClick={() => onDeleteBlockedTimeSlot(block.id)} className="p-0.5 text-red-500"><Icon path={ICON_PATHS.TRASH_ICON} className="w-3.5 h-3.5"/></Button>}
                        </li>
                    ))}
                </ul>
            ) : !showAddBlockForm && <p className="text-xs text-gray-500 dark:text-gray-400">No time currently blocked off.</p>}
        </div>

        {/* Calendar Integration Section */}
        <div className="mt-6 pt-4 border-t dark:border-gray-600">
          <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-2">External Calendar Integrations (Mock)</h4>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => addToast("Google Calendar connection initiated (mock).", "info")}
              className="dark:border-gray-500"
            >
              Connect Google Calendar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => addToast("Outlook Calendar connection initiated (mock).", "info")}
              className="dark:border-gray-500"
            >
              Connect Outlook Calendar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ManageAvailabilityModal;