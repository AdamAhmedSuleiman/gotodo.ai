
// src/components/journey/ConfigureStopActionModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import Textarea from '../ui/Textarea.js';
import { 
    ConfigureStopActionModalProps, JourneyAction, StopActionType, 
    PickupPersonActionDetails, PickupItemActionDetails, 
    DropoffPersonActionDetails, DropoffItemActionDetails, AssignTaskActionDetails
} from '../../src/types.js';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const ConfigureStopActionModal: React.FC<ConfigureStopActionModalProps> = ({
  isOpen,
  onClose,
  stopId,
  actionType,
  onSaveAction,
  existingAction,
}) => {
  const [formData, setFormData] = useState<any>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { 
      if (existingAction && existingAction.type === actionType) {
        setFormData(existingAction.details);
      } else {
        switch (actionType) {
          case 'pickup_person':
            setFormData({ passengerCount: 1, luggage: 'None', pickupFor: 'myself', targetNameOrId: '', targetMobile: '', notes: '', setDateTime: '', transportationType: '', vehicleSubType: '', transportationDetails: '' } as PickupPersonActionDetails);
            break;
          case 'pickup_item':
            setFormData({ quantity: 1, unit: 'Pcs', pickupFrom: 'myself', companyName: '', nameOrUserId: '', mobile: '', productNameOrCode: '', itemDescription: '', instructionsToDriver: '', setDateTime: '' } as PickupItemActionDetails);
            break;
          case 'dropoff_person':
            setFormData({ passengerSelection: 'All', luggage: 'None', dropoffTo: 'myself', targetNameOrId: '', notes: '', setDateTime: '' } as DropoffPersonActionDetails);
            break;
          case 'dropoff_item':
            setFormData({ itemSelection: 'All Picked Up Items', quantity: 1, unit: 'Pcs', dropoffTo: 'myself', targetNameOrId: '', companyName: '', mobile: '', itemDescription: '', notes: '', setDateTime: '' } as DropoffItemActionDetails);
            break;
          case 'assign_task':
            setFormData({ assignTo: 'myself', taskDetails: '', selectedPersonId: '', notes: '' } as AssignTaskActionDetails);
            break;
          default:
            setFormData({});
        }
      }
      setFormError(null); 
    }
  }, [isOpen, actionType, existingAction]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) || (name === 'passengerCount' || name === 'quantity' ? 1 : 0) : value; 
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (actionType === 'assign_task' && !formData.taskDetails?.trim()) {
      setFormError('Task details are required.');
      return;
    }
    if ((actionType === 'pickup_person') && formData.pickupFor === 'someone_else' && !formData.targetNameOrId?.trim()) {
        setFormError('Target person\'s name/ID is required when picking up for someone else.');
        return;
    }
    // Corrected logic for pickup_item: check if pickupFrom is 'store_or_business' or 'someone_else'
    if (actionType === 'pickup_item' && (formData.pickupFrom === 'store_or_business' || formData.pickupFrom === 'someone_else') && !formData.nameOrUserId?.trim()) {
        setFormError('Contact person name/ID at pickup is required when picking up from a store/business or someone else.');
        return;
    }
    if ((actionType === 'dropoff_person') && formData.dropoffTo === 'someone_else' && !formData.targetNameOrId?.trim()) {
        setFormError('Recipient person\'s name/ID is required when dropping off to someone else.');
        return;
    }
     if ((actionType === 'dropoff_item') && formData.dropoffTo === 'someone_else' && !formData.targetNameOrId?.trim()) {
        setFormError('Recipient name/ID is required when dropping off item to someone else/company.');
        return;
    }
    if (actionType === 'pickup_item' && (!formData.itemDescription?.trim() && !formData.productNameOrCode?.trim())) {
        setFormError('Either item description or product name/code is required for picking up an item.');
        return;
    }


    const newAction: JourneyAction = {
      id: existingAction?.id || `action-${generateId()}`,
      type: actionType,
      details: formData,
      status: 'configured',
    };
    onSaveAction(stopId, newAction);
    onClose(); 
  };

  const renderFormFields = () => {
    switch (actionType) {
      case 'pickup_person':
        const pp = formData as PickupPersonActionDetails;
        return (
          <>
            <Input label="Number of Passengers" name="passengerCount" type="number" value={pp.passengerCount ?? 1} onChange={handleChange} min="1" required />
            <Input label="Luggage (e.g., None, Small, 2 Large bags)" name="luggage" value={pp.luggage ?? 'None'} onChange={handleChange} />
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Pickup For:</label>
            <select name="pickupFor" value={pp.pickupFor ?? 'myself'} onChange={handleChange} className="mt-1 block w-full p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700">
              <option value="myself">Myself</option>
              <option value="someone_else">Someone Else</option>
            </select>
            {pp.pickupFor === 'someone_else' && (
              <>
                <Input label="Target Person Name/ID" name="targetNameOrId" value={pp.targetNameOrId ?? ''} onChange={handleChange} required />
                <Input label="Target Person Mobile (Optional)" name="targetMobile" value={pp.targetMobile ?? ''} onChange={handleChange} />
              </>
            )}
            <Input label="Pickup Date/Time (Optional)" name="setDateTime" type="datetime-local" value={pp.setDateTime ?? ''} onChange={handleChange} />
            <Input label="Preferred Transportation Type (e.g. Sedan, SUV, Van - Optional)" name="transportationType" value={pp.transportationType ?? ''} onChange={handleChange} />
            <Input label="Vehicle Sub-type (e.g. XL, Premium - Optional)" name="vehicleSubType" value={pp.vehicleSubType ?? ''} onChange={handleChange} />
            <Textarea label="Additional Transportation Details (e.g. specific needs - Optional)" name="transportationDetails" value={pp.transportationDetails ?? ''} onChange={handleChange} rows={2} />
            <Textarea label="Notes (Optional)" name="notes" value={pp.notes ?? ''} onChange={handleChange} rows={2} />
          </>
        );
      case 'pickup_item':
        const pi = formData as PickupItemActionDetails;
        return (
          <>
            <Input label="Product Name or Code (Optional)" name="productNameOrCode" value={pi.productNameOrCode ?? ''} onChange={handleChange} />
            <Input label="Item Description (if no product code)" name="itemDescription" value={pi.itemDescription ?? ''} onChange={handleChange} required={!pi.productNameOrCode} />
            <div className="grid grid-cols-2 gap-2">
                <Input label="Quantity" name="quantity" type="number" value={pi.quantity ?? 1} onChange={handleChange} min="1" required />
                <Input label="Unit (e.g., Pcs, Kg, Box)" name="unit" value={pi.unit ?? 'Pcs'} onChange={handleChange} />
            </div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Pickup From:</label>
            <select name="pickupFrom" value={pi.pickupFrom ?? 'myself'} onChange={handleChange} className="mt-1 block w-full p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700">
              <option value="myself">Myself (My Location)</option>
              <option value="store_or_business">Store / Business</option>
              <option value="someone_else">Someone Else (Residential)</option>
            </select>
            {(pi.pickupFrom === 'store_or_business' || pi.pickupFrom === 'someone_else') && (
                 <>
                    {pi.pickupFrom === 'store_or_business' && <Input label="Company/Store Name" name="companyName" value={pi.companyName ?? ''} onChange={handleChange} />}
                    <Input label="Contact Person Name/ID at Pickup" name="nameOrUserId" value={pi.nameOrUserId ?? ''} onChange={handleChange} required />
                    <Input label="Contact Mobile (Optional)" name="mobile" value={pi.mobile ?? ''} onChange={handleChange} />
                 </>
            )}
            <Input label="Pickup Date/Time (Optional)" name="setDateTime" type="datetime-local" value={pi.setDateTime ?? ''} onChange={handleChange} />
            <Textarea label="Instructions to Driver (Optional)" name="instructionsToDriver" value={pi.instructionsToDriver ?? ''} onChange={handleChange} rows={2} placeholder="e.g., Ask for order #123, Collect from reception" />
          </>
        );
      case 'dropoff_person':
        const dp = formData as DropoffPersonActionDetails;
        return (
          <>
            <Input label="Passenger(s) for Dropoff (e.g., All, John Doe)" name="passengerSelection" value={dp.passengerSelection ?? 'All'} onChange={handleChange} required />
            <Input label="Luggage (e.g., None, Small, 2 Large bags)" name="luggage" value={dp.luggage ?? 'None'} onChange={handleChange} />
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Dropoff To:</label>
            <select name="dropoffTo" value={dp.dropoffTo ?? 'myself'} onChange={handleChange} className="mt-1 block w-full p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700">
              <option value="myself">Myself</option>
              <option value="someone_else">Someone Else</option>
            </select>
            {dp.dropoffTo === 'someone_else' && (
                <Input label="Recipient Name/ID" name="targetNameOrId" value={dp.targetNameOrId ?? ''} onChange={handleChange} required />
            )}
            <Input label="Dropoff Date/Time (Optional)" name="setDateTime" type="datetime-local" value={dp.setDateTime ?? ''} onChange={handleChange} />
            <Textarea label="Notes (Optional)" name="notes" value={dp.notes ?? ''} onChange={handleChange} rows={2} />
          </>
        );
      case 'dropoff_item':
        const di = formData as DropoffItemActionDetails;
        return (
          <>
            <Input label="Item(s) for Dropoff (e.g., All picked up items, Laptop)" name="itemSelection" value={di.itemSelection ?? 'All picked up items'} onChange={handleChange} required />
            <Input label="Item Description (if not from specific pickup)" name="itemDescription" value={di.itemDescription ?? ''} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-2">
                <Input label="Quantity (if specific)" name="quantity" type="number" value={di.quantity ?? 1} onChange={handleChange} min="1" />
                <Input label="Unit (e.g., Pcs, Kg, Box)" name="unit" value={di.unit ?? 'Pcs'} onChange={handleChange} />
            </div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Dropoff To:</label>
            <select name="dropoffTo" value={di.dropoffTo ?? 'myself'} onChange={handleChange} className="mt-1 block w-full p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700">
              <option value="myself">Myself</option>
              <option value="someone_else">Someone Else / Company</option>
            </select>
            {di.dropoffTo === 'someone_else' && (
                 <>
                    <Input label="Recipient Name/ID or Company Name" name="targetNameOrId" value={di.targetNameOrId ?? ''} onChange={handleChange} required />
                    <Input label="Recipient Contact Mobile (Optional)" name="mobile" value={di.mobile ?? ''} onChange={handleChange} />
                 </>
            )}
             <Input label="Dropoff Date/Time (Optional)" name="setDateTime" type="datetime-local" value={di.setDateTime ?? ''} onChange={handleChange} />
            <Textarea label="Notes (Optional)" name="notes" value={di.notes ?? ''} onChange={handleChange} rows={2} />
          </>
        );
      case 'assign_task':
        const at = formData as AssignTaskActionDetails;
        return (
          <>
            <Textarea label="Task Details" name="taskDetails" value={at.taskDetails ?? ''} onChange={handleChange} rows={3} required />
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Assign To:</label>
            <select name="assignTo" value={at.assignTo ?? 'myself'} onChange={handleChange} className="mt-1 block w-full p-2 border dark:border-gray-600 rounded-md dark:bg-gray-700">
              <option value="myself">Myself (at this stop)</option>
              <option value="someone_else">Someone Else (at this stop)</option>
            </select>
            {at.assignTo === 'someone_else' && (
                <Input label="Person/Team ID (Optional)" name="selectedPersonId" value={at.selectedPersonId ?? ''} onChange={handleChange} />
            )}
            <Textarea label="Notes (Optional)" name="notes" value={at.notes ?? ''} onChange={handleChange} rows={2} />
          </>
        );
      default:
        return <p>Configuration for this action type is not yet available.</p>;
    }
  };

  const title = existingAction 
    ? `Edit Action: ${actionType.replace(/_/g, ' ')}` 
    : `Configure Action: ${actionType.replace(/_/g, ' ')}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} className="dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</Button>
          <Button type="submit" variant="primary" form="configure-action-form">
            {existingAction ? 'Save Changes' : 'Add Action'}
          </Button>
        </div>
      }
    >
      <form id="configure-action-form" onSubmit={handleSubmit} className="space-y-3 p-1 max-h-[60vh] overflow-y-auto pr-2">
        {formError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-2 rounded-md">{formError}</p>}
        {renderFormFields()}
      </form>
    </Modal>
  );
};

export default ConfigureStopActionModal;