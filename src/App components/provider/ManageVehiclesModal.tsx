// src/components/provider/ManageVehiclesModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import Textarea from '../ui/Textarea.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';
import { Vehicle, ManageVehiclesModalProps, TransportationMode } from '../../types.js';

const ManageVehiclesModal: React.FC<ManageVehiclesModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  onAddVehicle,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicleMode, setNewVehicleMode] = useState<TransportationMode>(TransportationMode.CAR_SEDAN);
  const [newVehicleMake, setNewVehicleMake] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleYear, setNewVehicleYear] = useState<number | string>('');
  const [newVehicleColor, setNewVehicleColor] = useState('');
  const [newVehicleLicense, setNewVehicleLicense] = useState('');
  const [newVehicleCapacity, setNewVehicleCapacity] = useState('');
  const [newVehiclePhotos, setNewVehiclePhotos] = useState(''); // Comma-separated URLs
  const [newVehicleSpecialEq, setNewVehicleSpecialEq] = useState(''); // Comma-separated
  const [newVehicleFeatures, setNewVehicleFeatures] = useState(''); 
  const [formError, setFormError] = useState<string | null>(null);

  const resetFormFields = () => {
    setNewVehicleMode(TransportationMode.CAR_SEDAN);
    setNewVehicleMake('');
    setNewVehicleModel('');
    setNewVehicleYear('');
    setNewVehicleColor('');
    setNewVehicleLicense('');
    setNewVehicleCapacity('');
    setNewVehiclePhotos('');
    setNewVehicleSpecialEq('');
    setNewVehicleFeatures('');
    setFormError(null);
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    resetFormFields();
  };


  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newVehicleMake.trim() || !newVehicleModel.trim()) {
      setFormError('Vehicle make and model are required.');
      return;
    }
    
    const yearNumber = newVehicleYear ? parseInt(newVehicleYear as string, 10) : undefined;
    if (newVehicleYear && (isNaN(yearNumber) || yearNumber < 1900 || yearNumber > new Date().getFullYear() + 1)) {
        setFormError('Please enter a valid year.');
        return;
    }

    onAddVehicle({
      mode: newVehicleMode,
      make: newVehicleMake,
      model: newVehicleModel,
      year: yearNumber,
      color: newVehicleColor,
      licensePlate: newVehicleLicense,
      capacity: newVehicleCapacity,
      photos: newVehiclePhotos.split(',').map(url => url.trim()).filter(url => url),
      specialEquipment: newVehicleSpecialEq.split(',').map(eq => eq.trim()).filter(eq => eq),
      features: newVehicleFeatures.split(',').map(f => f.trim()).filter(f => f), 
    });

    resetFormFields();
    setShowAddForm(false);
  };
  
  const closeAndResetForm = () => {
    handleCancelEdit(); 
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={closeAndResetForm} title="Manage Your Vehicles" size="xl">
      <div className="space-y-6 p-1">
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            leftIcon={<Icon path={ICON_PATHS.PLUS_CIRCLE} className="w-5 h-5" />}
            variant="primary"
            className="mb-4"
          >
            Add New Vehicle
          </Button>
        )}

        {showAddForm && (
          <form onSubmit={handleAddVehicleSubmit} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow space-y-4 border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Add New Vehicle</h3>
            {formError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-2 rounded-md">{formError}</p>}
            
            <div>
              <label htmlFor="vehicleMode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transportation Mode</label>
              <select
                id="vehicleMode"
                name="vehicleMode"
                value={newVehicleMode}
                onChange={(e) => setNewVehicleMode(e.target.value as TransportationMode)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
              >
                {Object.keys(TransportationMode).map((key) => (
                  <option key={key} value={TransportationMode[key as keyof typeof TransportationMode]}>
                    {TransportationMode[key as keyof typeof TransportationMode].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Make" name="vehicleMake" value={newVehicleMake} onChange={(e) => setNewVehicleMake(e.target.value)} placeholder="e.g., Toyota" required />
              <Input label="Model" name="vehicleModel" value={newVehicleModel} onChange={(e) => setNewVehicleModel(e.target.value)} placeholder="e.g., Camry" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Year" name="vehicleYear" type="number" value={newVehicleYear} onChange={(e) => setNewVehicleYear(e.target.value)} placeholder="e.g., 2022" />
              <Input label="Color (Optional)" name="vehicleColor" value={newVehicleColor} onChange={(e) => setNewVehicleColor(e.target.value)} placeholder="e.g., Blue" />
            </div>
             <Input label="License Plate (Optional)" name="vehicleLicense" value={newVehicleLicense} onChange={(e) => setNewVehicleLicense(e.target.value)} placeholder="e.g., ABC-123" />
             <Input label="Capacity (Optional)" name="vehicleCapacity" value={newVehicleCapacity} onChange={(e) => setNewVehicleCapacity(e.target.value)} placeholder="e.g., 5 passengers, 1 ton" />
             <Input
              label="Photos (comma-separated URLs, optional)"
              name="vehiclePhotos"
              value={newVehiclePhotos}
              onChange={(e) => setNewVehiclePhotos(e.target.value)}
              placeholder="e.g., http://url1.jpg, http://url2.png"
            />
            <Textarea
              label="Special Equipment (comma-separated, optional)"
              name="vehicleSpecialEq"
              value={newVehicleSpecialEq}
              onChange={(e) => setNewVehicleSpecialEq(e.target.value)}
              placeholder="e.g., GPS, Wheelchair Accessible, Refrigeration"
              rows={2}
            />
             <Textarea
              label="Features/Equipment (comma-separated, Optional for filtering)"
              name="vehicleFeatures"
              value={newVehicleFeatures}
              onChange={(e) => setNewVehicleFeatures(e.target.value)}
              placeholder="e.g., Ladder Rack, Heavy Tools, Winch"
              rows={2}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="secondary" onClick={handleCancelEdit} className="dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</Button>
              <Button type="submit" variant="primary">Add Vehicle</Button>
            </div>
          </form>
        )}

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Your Current Vehicles</h3>
          {vehicles.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-4 text-center">You haven't added any vehicles yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm hover:shadow-md dark:hover:shadow-gray-600 transition-shadow">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-400">{vehicle.make} {vehicle.model} ({vehicle.year || 'N/A'})</h4>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {(vehicle.mode as string).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  {vehicle.licensePlate && <p className="text-xs text-gray-500 dark:text-gray-400">License: {vehicle.licensePlate}</p>}
                  {vehicle.capacity && <p className="text-xs text-gray-500 dark:text-gray-400">Capacity: {vehicle.capacity}</p>}
                  {vehicle.specialEquipment && vehicle.specialEquipment.length > 0 && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Special Eq: {vehicle.specialEquipment.join(', ')}</p>}
                  {vehicle.features && vehicle.features.length > 0 && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Features: {vehicle.features.join(', ')}</p>}
                  {vehicle.photos && vehicle.photos.length > 0 && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Photos: {vehicle.photos.join(', ')}</p>}
                  <div className="mt-2 text-right space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => alert(`Edit feature for "${vehicle.make} ${vehicle.model}" coming soon!`)} className="dark:text-gray-300 dark:hover:bg-gray-600">Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => alert(`Delete feature for "${vehicle.make} ${vehicle.model}" coming soon!`)}>Delete</Button>
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

export default ManageVehiclesModal;