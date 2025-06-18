// src/components/provider/ManageDocumentsModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';
import { ProviderDocument, DocumentStatus, ManageDocumentsModalProps } from '../../types.js';

const documentTypes = [
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'vehicle_registration', label: 'Vehicle Registration' },
  { value: 'vehicle_insurance', label: 'Vehicle Insurance' },
  { value: 'business_license', label: 'Business License (if applicable)' },
  { value: 'background_check', label: 'Background Check Confirmation' },
  { value: 'other', label: 'Other Document' },
];

const ManageDocumentsModal: React.FC<ManageDocumentsModalProps> = ({
  isOpen,
  onClose,
  documents,
  onAddDocument,
  onDeleteDocument,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<'drivers_license' | 'vehicle_registration' | 'vehicle_insurance' | 'business_license' | 'background_check' | 'other'>('drivers_license');
  const [customDocTypeName, setCustomDocTypeName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiresAt, setExpiresAt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleAddDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedFile) {
      setFormError('Please select a file to upload.');
      return;
    }
    if (selectedDocType === 'other' && !customDocTypeName.trim()) {
      setFormError('Please specify the document name for "Other" type.');
      return;
    }

    const documentData: Omit<ProviderDocument, 'id' | 'status' | 'uploadedAt' | 'verifiedAt'> = {
      type: selectedDocType,
      customTypeName: selectedDocType === 'other' ? customDocTypeName : undefined,
      fileName: selectedFile.name,
      expiresAt: expiresAt || undefined,
    };
    
    onAddDocument(documentData, selectedFile); // Pass the file for mock handling

    // Reset form
    setShowAddForm(false);
    setSelectedDocType('drivers_license');
    setCustomDocTypeName('');
    setSelectedFile(null);
    setExpiresAt('');
  };

  const getStatusChipClass = (status: DocumentStatus) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200';
      case 'pending_review': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-600 dark:text-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200';
      case 'not_uploaded':
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200';
    }
  };
  
  const closeAndReset = () => {
    setShowAddForm(false);
    setFormError(null);
    setSelectedDocType('drivers_license');
    setCustomDocTypeName('');
    setSelectedFile(null);
    setExpiresAt('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={closeAndReset} title="Manage Your Documents" size="2xl">
      <div className="space-y-6 p-1">
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            leftIcon={<Icon path={ICON_PATHS.DOCUMENT_ARROW_UP} className="w-5 h-5" />}
            variant="primary"
            className="mb-4"
          >
            Upload New Document
          </Button>
        )}

        {showAddForm && (
          <form onSubmit={handleAddDocumentSubmit} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow space-y-4 border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Upload New Document</h3>
            {formError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-2 rounded-md">{formError}</p>}
            
            <div>
              <label htmlFor="docType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Type</label>
              <select
                id="docType"
                name="docType"
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value as ProviderDocument['type'])}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
              >
                {documentTypes.map(doc => (
                  <option key={doc.value} value={doc.value}>{doc.label}</option>
                ))}
              </select>
            </div>

            {selectedDocType === 'other' && (
              <Input
                label="Custom Document Name"
                name="customDocTypeName"
                value={customDocTypeName}
                onChange={(e) => setCustomDocTypeName(e.target.value)}
                placeholder="e.g., Food Handler Permit"
                required
              />
            )}

            <Input
              label="Select File"
              name="documentFile"
              type="file"
              onChange={handleFileChange}
              required
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-blue-300 dark:hover:file:bg-gray-500"
            />
            {selectedFile && <p className="text-xs text-gray-500 dark:text-gray-400">Selected: {selectedFile.name}</p>}

            <Input
                label="Expires At (Optional)"
                name="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)} className="dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</Button>
              <Button type="submit" variant="primary">Upload Document</Button>
            </div>
          </form>
        )}

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Your Uploaded Documents</h3>
          {documents.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-4 text-center">You haven't uploaded any documents yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {documents.map((doc) => (
                <div key={doc.id} className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-blue-700 dark:text-blue-400">{doc.type === 'other' ? doc.customTypeName : documentTypes.find(dt => dt.value === doc.type)?.label}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">File: {doc.fileName || 'N/A'}</p>
                      {doc.expiresAt && <p className="text-xs text-gray-500 dark:text-gray-400">Expires: {new Date(doc.expiresAt).toLocaleDateString()}</p>}
                    </div>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusChipClass(doc.status)}`}>
                      {doc.status.replace('_', ' ')}
                    </span>
                  </div>
                  {doc.status === 'rejected' && doc.rejectionReason && (
                    <p className="text-xs text-red-500 dark:text-red-300 mt-1">Reason: {doc.rejectionReason}</p>
                  )}
                  <div className="mt-2 text-right">
                    {doc.status === 'pending_review' || doc.status === 'rejected' ? (
                       <Button size="sm" variant="ghost" onClick={() => alert(`Re-upload for ${doc.fileName} (Not Implemented)`)} className="dark:text-yellow-300 dark:hover:bg-gray-600">Re-upload</Button>
                    ) : null}
                    <Button size="sm" variant="danger" onClick={() => onDeleteDocument(doc.id)} className="ml-2">Delete</Button>
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

export default ManageDocumentsModal;