// src/components/task/TaskSubItemFormModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import Textarea from '../ui/Textarea.js';
import { TaskSubItem, TaskSubItemFormModalProps, MeasuringUnit, TaskTeamMember } from '../../types.js';
import { useToast } from '../../contexts/ToastContext.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';

const generateId = () => `subitem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

const genericResources = ["Laptop", "Software License", "Camera", "Microphone", "Vehicle", "Meeting Room A", "Specialized Tool X"];


const TaskSubItemFormModal: React.FC<TaskSubItemFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  projectId, 
  allItemsInProject = [], 
  teamMembers = [],
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'product' | 'service' | 'logistics'>('service');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [unit, setUnit] = useState<MeasuringUnit | string>(MeasuringUnit.PIECES);
  const [estimatedCost, setEstimatedCost] = useState<number | string>('');
  const [actualCost, setActualCost] = useState<number | string>('');
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [assignedResources, setAssignedResources] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setDescription(initialData.description || '');
      setQuantity(initialData.quantity || 1);
      setUnit(initialData.unit || MeasuringUnit.PIECES);
      setEstimatedCost(initialData.estimatedCost || '');
      setActualCost(initialData.actualCost || '');
      setDependsOn(initialData.dependsOn || []);
      setAssignedResources(initialData.assignedResources || []);
    } else {
      setName('');
      setType('service');
      setDescription('');
      setQuantity(1);
      setUnit(MeasuringUnit.PIECES);
      setEstimatedCost('');
      setActualCost('');
      setDependsOn([]);
      setAssignedResources([]);
    }
    setFormError(null);
  }, [initialData, isOpen]);

  const handleDependencyToggle = (itemId: string) => {
    setDependsOn(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        if (initialData?.id) {
            const potentialDependencyItem = allItemsInProject.find(item => item.id === itemId);
            if (potentialDependencyItem?.dependsOn?.includes(initialData.id)) {
                addToast(`Cannot create circular dependency: ${potentialDependencyItem.name} already depends on this item.`, "warning");
                return prev;
            }
        }
        return [...prev, itemId];
      }
    });
  };

  const handleResourceToggle = (resourceName: string) => {
    setAssignedResources(prev => 
      prev.includes(resourceName) ? prev.filter(r => r !== resourceName) : [...prev, resourceName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Item name is required.');
      return;
    }
    const numQuantity = parseFloat(quantity as string);
    if (isNaN(numQuantity) || numQuantity < 0) {
      setFormError('Quantity must be a non-negative number.');
      return;
    }
    const numEstCost = estimatedCost ? parseFloat(estimatedCost as string) : undefined;
    if (estimatedCost && (numEstCost === undefined || isNaN(numEstCost) || numEstCost < 0)) {
      setFormError('Estimated cost must be a valid non-negative number if provided.');
      return;
    }
    const numActualCost = actualCost ? parseFloat(actualCost as string) : undefined;
    if (actualCost && (numActualCost === undefined || isNaN(numActualCost) || numActualCost < 0)) {
      setFormError('Actual cost must be a valid non-negative number if provided.');
      return;
    }

    const itemData: TaskSubItem = {
      id: initialData?.id || generateId(),
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      quantity: numQuantity,
      unit,
      estimatedCost: numEstCost,
      actualCost: numActualCost,
      status: initialData?.status || 'pending', 
      linkedRequestId: initialData?.linkedRequestId,
      dependsOn: dependsOn.length > 0 ? dependsOn : undefined,
      assignedResources: assignedResources.length > 0 ? assignedResources : undefined,
    };
    onSave(itemData);
  };
  
  const otherAvailableItems = allItemsInProject.filter(item => item.id !== initialData?.id);
  const availableTeamMembers = teamMembers.map(tm => tm.name);
  const allAvailableResources = Array.from(new Set([...availableTeamMembers, ...genericResources]));


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Sub-Item' : 'Add New Sub-Item'}
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} className="dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</Button>
          <Button type="submit" variant="primary" form="task-subitem-form">
            {initialData ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      }
    >
      <form id="task-subitem-form" onSubmit={handleSubmit} className="space-y-3 p-1 max-h-[70vh] overflow-y-auto pr-2">
        {formError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-2 rounded-md">{formError}</p>}
        
        <Input label="Item Name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
        
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
          <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as TaskSubItem['type'])} className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-100">
            <option value="service">Service</option>
            <option value="product">Product</option>
            <option value="logistics">Logistics</option>
          </select>
        </div>
        
        <Textarea label="Description (Optional)" name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        
        <div className="grid grid-cols-2 gap-3">
          <Input label="Quantity" name="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0" />
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
            <select id="unit" name="unit" value={unit} onChange={(e) => setUnit(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-100">
              {Object.values(MeasuringUnit).map(uVal => <option key={uVal} value={uVal}>{uVal}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Estimated Cost ($ Optional)" name="estimatedCost" type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} min="0" step="0.01" />
          <Input label="Actual Cost ($ Optional)" name="actualCost" type="number" value={actualCost} onChange={(e) => setActualCost(e.target.value)} min="0" step="0.01" />
        </div>
        
        {otherAvailableItems.length > 0 && (
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dependencies (Optional - this item depends on):</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50">
                    {otherAvailableItems.map(item => (
                        <label key={item.id} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-xs">
                            <input
                            type="checkbox"
                            checked={dependsOn.includes(item.id)}
                            onChange={() => handleDependencyToggle(item.id)}
                            className="form-checkbox h-3.5 w-3.5 text-blue-600 dark:bg-gray-600 dark:border-gray-500 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-700 dark:text-gray-300 truncate" title={item.name}>{item.name}</span>
                        </label>
                    ))}
                </div>
            </div>
        )}
        
        {allAvailableResources.length > 0 && (
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Resources (Optional):</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50">
                    {allAvailableResources.map(resourceName => (
                        <label key={resourceName} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-xs">
                            <input
                            type="checkbox"
                            checked={assignedResources.includes(resourceName)}
                            onChange={() => handleResourceToggle(resourceName)}
                            className="form-checkbox h-3.5 w-3.5 text-blue-600 dark:bg-gray-600 dark:border-gray-500 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-700 dark:text-gray-300 truncate" title={resourceName}>{resourceName}</span>
                        </label>
                    ))}
                </div>
            </div>
        )}

      </form>
    </Modal>
  );
};

export default TaskSubItemFormModal;