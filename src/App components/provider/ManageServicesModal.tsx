// src/components/provider/ManageServicesModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import Textarea from '../ui/Textarea.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';
import { ProfessionalService, ManageServicesModalProps } from '../../types.js';

const ManageServicesModal: React.FC<ManageServicesModalProps> = ({
  isOpen,
  onClose,
  services,
  onAddService,
  onUpdateService, 
  onDeleteService, 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceQual, setNewServiceQual] = useState('');
  const [newServiceRateType, setNewServiceRateType] = useState<'hourly' | 'fixed' | 'quote_based'>('hourly');
  const [newServiceRate, setNewServiceRate] = useState<number | string>('');
  const [newServiceArea, setNewServiceArea] = useState('');
  const [newServiceTags, setNewServiceTags] = useState(''); 
  const [formError, setFormError] = useState<string | null>(null);

  const resetFormFields = () => {
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServiceQual('');
    setNewServiceRateType('hourly');
    setNewServiceRate('');
    setNewServiceArea('');
    setNewServiceTags('');
    setFormError(null);
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    resetFormFields();
  };

  const handleAddServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newServiceName.trim() || !newServiceDesc.trim() || (newServiceRateType !== 'quote_based' && newServiceRate === '')) {
      setFormError('Service name, description, and rate (unless quote-based) are required.');
      return;
    }
    const rateNumber = newServiceRateType !== 'quote_based' ? parseFloat(newServiceRate as string) : 0;
    if (newServiceRateType !== 'quote_based' && (isNaN(rateNumber) || rateNumber <= 0)) {
      setFormError('Please enter a valid positive number for the rate.');
      return;
    }

    onAddService({
      name: newServiceName,
      description: newServiceDesc,
      qualifications: newServiceQual,
      rateType: newServiceRateType,
      rate: rateNumber,
      serviceArea: newServiceArea,
      tagsOrSkills: newServiceTags.split(',').map(tag => tag.trim()).filter(tag => tag),
    });

    resetFormFields();
    setShowAddForm(false);
  };
  
  const closeAndResetForm = () => {
    setShowAddForm(false);
    resetFormFields();
    onClose();
  };
  
  // Mock handlers if props are not passed, to prevent errors
  const handleUpdateService = onUpdateService || ((service: ProfessionalService) => alert(`Update for "${service.name}" (not implemented).`));
  const handleDeleteService = onDeleteService || ((serviceId: string) => alert(`Delete for ID "${serviceId}" (not implemented).`));


  return (
    <Modal isOpen={isOpen} onClose={closeAndResetForm} title="Manage Your Professional Services" size="xl">
      <div className="space-y-6 p-1">
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            leftIcon={<Icon path={ICON_PATHS.PLUS_CIRCLE} className="w-5 h-5" />}
            variant="primary"
            className="mb-4"
          >
            Add New Service
          </Button>
        )}

        {showAddForm && (
          <form onSubmit={handleAddServiceSubmit} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow space-y-4 border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Add New Professional Service</h3>
            {formError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-2 rounded-md">{formError}</p>}
            <Input
              label="Service Name"
              name="serviceName"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              placeholder="e.g., Expert Web Design"
              required
            />
            <Textarea
              label="Service Description"
              name="serviceDescription"
              value={newServiceDesc}
              onChange={(e) => setNewServiceDesc(e.target.value)}
              placeholder="Detailed description of the service you offer."
              rows={3}
              required
            />
            <Input
              label="Qualifications (Optional)"
              name="serviceQualifications"
              value={newServiceQual}
              onChange={(e) => setNewServiceQual(e.target.value)}
              placeholder="e.g., Certified, 5+ years experience"
            />
             <Input
              label="Tags/Skills (comma-separated, Optional)"
              name="serviceTags"
              value={newServiceTags}
              onChange={(e) => setNewServiceTags(e.target.value)}
              placeholder="e.g., plumbing, electrical, drain cleaning"
            />
            <Input
              label="Service Area (Optional)"
              name="serviceArea"
              value={newServiceArea}
              onChange={(e) => setNewServiceArea(e.target.value)}
              placeholder="e.g., Citywide, 50km radius from downtown"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rateType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rate Type</label>
                <select
                  id="rateType"
                  name="rateType"
                  value={newServiceRateType}
                  onChange={(e) => setNewServiceRateType(e.target.value as 'hourly' | 'fixed' | 'quote_based')}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="hourly">Hourly</option>
                  <option value="fixed">Fixed Price</option>
                  <option value="quote_based">Quote Based</option>
                </select>
              </div>
              <Input
                label={newServiceRateType === 'hourly' ? "Rate per Hour ($)" : (newServiceRateType === 'fixed' ? "Fixed Rate ($)" : "Base Rate ($ Optional)")}
                name="serviceRate"
                type="number"
                value={newServiceRate}
                onChange={(e) => setNewServiceRate(e.target.value)}
                placeholder={newServiceRateType === 'quote_based' ? "e.g. 50 (for estimates)" : "e.g., 50 or 1500"}
                min={newServiceRateType === 'quote_based' ? "0" : "0.01"}
                step="0.01"
                required={newServiceRateType !== 'quote_based'}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="secondary" onClick={handleCancelEdit} className="dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</Button>
              <Button type="submit" variant="primary">Add Service</Button>
            </div>
          </form>
        )}

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Your Current Services</h3>
          {services.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-4 text-center">You haven't added any services yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {services.map((service) => (
                <div key={service.id} className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm hover:shadow-md dark:hover:shadow-gray-600 transition-shadow">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center">
                        <Icon path={ICON_PATHS.WRENCH} className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <h4 className="font-semibold text-blue-700 dark:text-blue-400">{service.name}</h4>
                    </div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {service.rateType === 'quote_based' ? 'Quote Based' : `$${service.rate.toFixed(2)} ${service.rateType === 'hourly' ? '/hr' : '(Fixed)'}`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate ml-7">{service.description}</p>
                  {service.qualifications && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">Qualifications: {service.qualifications}</p>}
                  {service.serviceArea && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">Area: {service.serviceArea}</p>}
                  {service.tagsOrSkills && service.tagsOrSkills.length > 0 && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">Skills: {service.tagsOrSkills.join(', ')}</p>}
                  <div className="mt-2 text-right space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => handleUpdateService(service)} className="dark:text-gray-300 dark:hover:bg-gray-600">Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteService(service.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ManageServicesModal;