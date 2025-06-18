// src/components/provider/ProductScanModal.tsx
import React, { useState, useRef, ChangeEvent } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';
import { ProductScanModalProps, Product } from '../../types.js';
import { mockScanAndFetchProductDetails, analyzeImageForProduct } from '../../services/geminiService.js';
import LoadingSpinner from '../ui/LoadingSpinner.js';
import { useToast } from '../../contexts/ToastContext.js';
import Input from '../ui/Input.js'; // Added Input import

const ProductScanModal: React.FC<ProductScanModalProps> = ({
  isOpen,
  onClose,
  onProductDetailsReceived,
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'image'>('scan');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleSimulateScan = async (scanType: 'barcode' | 'qrcode') => {
    setIsLoading(true);
    setError(null);
    try {
      const productDetails = await mockScanAndFetchProductDetails(scanType);
      onProductDetailsReceived(productDetails);
      addToast(`Mock ${scanType} scan successful. Product details fetched.`, 'success');
      onClose(); 
    } catch (err) {
      const errorMessage = (err as Error).message || `Failed to simulate ${scanType} scan.`;
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setError("Image file is too large (max 4MB). Please select a smaller file.");
        addToast("Image too large. Max 4MB.", "error");
        setImagePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        return;
    }

    setIsLoading(true);
    setError(null);
    setImagePreview(URL.createObjectURL(file));

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Image = (reader.result as string).split(',')[1];
        const productDetails = await analyzeImageForProduct(base64Image, file.type);
        onProductDetailsReceived(productDetails);
        addToast('Product image analyzed successfully.', 'success');
        onClose();
      };
      reader.onerror = () => {
        throw new Error("Failed to read image file.");
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to analyze product image.';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      setImagePreview(null); // Clear preview on error
    } finally {
      setIsLoading(false);
      if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
    }
  };
  
  const handleCloseModal = () => {
    setError(null);
    setIsLoading(false);
    setImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCloseModal} title="Add Product via Scan/Image" size="lg">
      <div className="space-y-4 p-1">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('scan')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none
                ${activeTab === 'scan'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}
            >
              Scan Barcode/QR (Simulated)
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm focus:outline-none
                ${activeTab === 'image'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}
            >
              Analyze Product Image
            </button>
          </nav>
        </div>

        {isLoading && <div className="text-center py-6"><LoadingSpinner text="AI Processing..." /></div>}
        {error && !isLoading && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-md">{error}</p>}

        {!isLoading && activeTab === 'scan' && (
          <div className="text-center space-y-3 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Simulate scanning a product's barcode or QR code to automatically fetch its details.</p>
            <Button onClick={() => handleSimulateScan('barcode')} variant="outline" leftIcon={<Icon path={ICON_PATHS.QR_CODE_ICON} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
              Simulate Barcode Scan
            </Button>
            <Button onClick={() => handleSimulateScan('qrcode')} variant="outline" leftIcon={<Icon path={ICON_PATHS.QR_CODE_ICON} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 ml-2">
              Simulate QR Code Scan
            </Button>
          </div>
        )}

        {!isLoading && activeTab === 'image' && (
          <div className="py-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Upload an image of the product. Our AI will try to identify it and fill in the details.</p>
            <Input
              ref={fileInputRef}
              type="file"
              name="productImage"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-blue-300 dark:hover:file:bg-gray-500"
              wrapperClassName="mb-0"
            />
            {imagePreview && (
              <div className="mt-3 text-center">
                <img src={imagePreview} alt="Product preview" className="max-h-48 mx-auto rounded border dark:border-gray-600" />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProductScanModal;