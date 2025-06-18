// src/components/admin/SystemConfigPanel.tsx
import React, { useState, useEffect } from 'react';
import { SystemConfiguration } from '../../types.js';
import * as adminService from '../../services/adminService.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import Textarea from '../ui/Textarea.js';
import { useToast } from '../../contexts/ToastContext.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';

const SystemConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<SystemConfiguration>(adminService.getSystemConfiguration());
  const [isLoading, setIsLoading] = useState(false);
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [newFeatureFlagKey, setNewFeatureFlagKey] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    setConfig(adminService.getSystemConfiguration());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith("notificationTemplates.")) {
        const parts = name.split('.'); // e.g. notificationTemplates.newBid.subject
        const templateKey = parts[1];
        const fieldKey = parts[2] as 'subject' | 'body';
        setConfig(prev => ({
            ...prev,
            notificationTemplates: {
                ...prev.notificationTemplates,
                [templateKey]: {
                    ...(prev.notificationTemplates[templateKey] || { subject: '', body: '' }), // Ensure templateKey exists
                    [fieldKey]: value
                }
            }
        }));
    } else if (name.startsWith("featureFlags.")) {
        const flagKey = name.split('.')[1];
        const isChecked = (e.target as HTMLInputElement).type === 'checkbox' ? (e.target as HTMLInputElement).checked : Boolean(value);
        setConfig(prev => ({
            ...prev,
            featureFlags: {
                ...prev.featureFlags,
                [flagKey]: isChecked
            }
        }));
    } else {
        setConfig(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    }
  };

  const handleSaveConfiguration = () => {
    setIsLoading(true);
    adminService.saveSystemConfiguration(config);
    setTimeout(() => { // Simulate save
      setIsLoading(false);
      addToast('System configuration saved successfully!', 'success');
    }, 1000);
  };

  const handleAddServiceCategory = () => {
    if (newServiceCategory.trim() && !config.serviceCategories.includes(newServiceCategory.trim())) {
      setConfig(prev => ({
        ...prev,
        serviceCategories: [...prev.serviceCategories, newServiceCategory.trim()].sort(),
      }));
      setNewServiceCategory('');
      addToast('Service category added.', 'success');
    } else if (config.serviceCategories.includes(newServiceCategory.trim())) {
      addToast('Service category already exists.', 'warning');
    } else {
      addToast('Service category name cannot be empty.', 'error');
    }
  };

  const handleRemoveServiceCategory = (categoryToRemove: string) => {
    setConfig(prev => ({
      ...prev,
      serviceCategories: prev.serviceCategories.filter(cat => cat !== categoryToRemove),
    }));
    addToast('Service category removed.', 'info');
  };

  const handleAddFeatureFlag = () => {
    if (newFeatureFlagKey.trim() && config.featureFlags && !(newFeatureFlagKey.trim() in config.featureFlags)) {
        setConfig(prev => ({
            ...prev,
            featureFlags: {
                ...prev.featureFlags,
                [newFeatureFlagKey.trim()]: false // Default to false
            }
        }));
        setNewFeatureFlagKey('');
        addToast('New feature flag added (defaulted to false).', 'success');
    } else if (config.featureFlags && newFeatureFlagKey.trim() in config.featureFlags) {
        addToast('Feature flag key already exists.', 'warning');
    } else {
         addToast('Feature flag key cannot be empty.', 'error');
    }
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Commission Rate (%)"
          name="commissionRatePercent"
          type="number"
          value={config.commissionRatePercent}
          onChange={handleChange}
          min="0" max="100" step="0.1"
        />
        <Input
          label="Minimum Commission (USD)"
          name="minimumCommissionUSD"
          type="number"
          value={config.minimumCommissionUSD}
          onChange={handleChange}
          min="0" step="0.01"
        />
      </div>

      <div>
        <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-200">Service Categories</h4>
        <div className="flex flex-wrap gap-2 mb-2">
          {config.serviceCategories.map(category => (
            <span key={category} className="flex items-center bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded-full">
              {category}
              <button onClick={() => handleRemoveServiceCategory(category)} className="ml-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-100">
                <Icon path={ICON_PATHS.X_MARK_ICON} className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-end space-x-2">
          <Input
            label="Add New Category"
            name="newServiceCategory"
            value={newServiceCategory}
            onChange={(e) => setNewServiceCategory(e.target.value)}
            placeholder="e.g., Home Renovation"
            wrapperClassName="flex-grow mb-0"
          />
          <Button type="button" onClick={handleAddServiceCategory} size="sm" variant="outline" className="dark:text-gray-300 dark:border-gray-600">Add</Button>
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-200">Notification Templates</h4>
        {Object.entries(config.notificationTemplates).map(([key, template]) => (
          <div key={key} className="mb-3 p-3 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50">
            <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1')}</h5>
            <Input
              label="Subject"
              name={`notificationTemplates.${key}.subject`}
              value={template.subject}
              onChange={handleChange}
              wrapperClassName="mb-2"
            />
            <Textarea
              label="Body (use {placeholders})"
              name={`notificationTemplates.${key}.body`}
              value={template.body}
              onChange={handleChange}
              rows={3}
            />
          </div>
        ))}
      </div>
      
      <div>
        <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-200">Feature Flags</h4>
        <div className="space-y-2">
            {config.featureFlags && Object.entries(config.featureFlags).map(([key, value]) => (
                 <label key={key} className="flex items-center justify-between cursor-pointer p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md border dark:border-gray-600">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                    <input 
                        type="checkbox" 
                        name={`featureFlags.${key}`}
                        checked={Boolean(value)} 
                        onChange={handleChange} 
                        className="relative w-10 h-5 bg-gray-300 rounded-full appearance-none cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 checked:bg-blue-600 dark:checked:bg-blue-500
                                    after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow-sm after:transition-transform after:duration-200 after:ease-in-out checked:after:translate-x-full"
                    />
                </label>
            ))}
        </div>
         <div className="flex items-end space-x-2 mt-3">
          <Input
            label="Add New Feature Flag Key"
            name="newFeatureFlagKey"
            value={newFeatureFlagKey}
            onChange={(e) => setNewFeatureFlagKey(e.target.value)}
            placeholder="e.g., enableNewDashboard"
            wrapperClassName="flex-grow mb-0"
          />
          <Button type="button" onClick={handleAddFeatureFlag} size="sm" variant="outline" className="dark:text-gray-300 dark:border-gray-600">Add Flag</Button>
        </div>
      </div>


      <div className="mt-6 pt-4 border-t dark:border-gray-700">
        <Button onClick={handleSaveConfiguration} variant="primary" isLoading={isLoading} size="lg">
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

export default SystemConfigPanel;