// src/components/provider/ManageProductsModal.tsx
import React, { useState } from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Input from '../ui/Input.js';
import Textarea from '../ui/Textarea.js';
import Icon from '../ui/Icon.js';
import { ICON_PATHS } from '../../constants.js';
import { Product, ManageProductsModalProps, ProductStockHistoryEntry } from '../../types.js';

// Simple modal for showing stock history
const ProductStockHistoryModal: React.FC<{isOpen: boolean, onClose: () => void, product: Product | null}> = ({isOpen, onClose, product}) => {
    if (!product) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Stock History for ${product.name}`} size="lg">
            {product.stockHistory && product.stockHistory.length > 0 ? (
                <ul className="space-y-1 text-xs max-h-60 overflow-y-auto">
                    {product.stockHistory.map((entry, index) => (
                        <li key={index} className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded">
                            {new Date(entry.date).toLocaleString()}: {entry.change > 0 ? `+${entry.change}` : entry.change} ({entry.reason}). New Stock: {entry.newStockLevel}
                        </li>
                    ))}
                </ul>
            ) : <p className="text-sm text-gray-500 dark:text-gray-400">No stock history recorded.</p>}
        </Modal>
    );
};


const ManageProductsModal: React.FC<ManageProductsModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddProduct,
  onOpenScanModal, 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductPhotos, setNewProductPhotos] = useState(''); 
  const [newProductStock, setNewProductStock] = useState<number | string>('');
  const [newProductPrice, setNewProductPrice] = useState<number | string>('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductBarcode, setNewProductBarcode] = useState('');
  const [newProductVariantsText, setNewProductVariantsText] = useState('');
  const [newProductReorderLevel, setNewProductReorderLevel] = useState<number | string>(''); 
  const [formError, setFormError] = useState<string | null>(null);

  const [isStockHistoryModalOpen, setIsStockHistoryModalOpen] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);


  const resetFormFields = () => {
    setNewProductName(''); setNewProductDesc(''); setNewProductPhotos('');
    setNewProductStock(''); setNewProductPrice(''); setNewProductCategory('');
    setNewProductBarcode(''); setNewProductVariantsText(''); setNewProductReorderLevel('');
    setFormError(null);
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newProductName.trim() || !newProductDesc.trim() || newProductStock === '' || newProductPrice === '') {
      setFormError('Product name, description, stock, and price are required.');
      return;
    }
    const stockNumber = parseInt(newProductStock as string, 10);
    const priceNumber = parseFloat(newProductPrice as string);
    const reorderLevelNumber = newProductReorderLevel ? parseInt(newProductReorderLevel as string, 10) : undefined;

    if (isNaN(stockNumber) || stockNumber < 0) {
      setFormError('Please enter a valid non-negative number for stock.'); return;
    }
    if (isNaN(priceNumber) || priceNumber <= 0) {
      setFormError('Please enter a valid positive number for the price.'); return;
    }
    if (reorderLevelNumber !== undefined && (isNaN(reorderLevelNumber) || reorderLevelNumber < 0)) {
        setFormError('Reorder level must be a valid non-negative number if set.'); return;
    }

    onAddProduct({
      name: newProductName, description: newProductDesc,
      photos: newProductPhotos.split(',').map(url => url.trim()).filter(url => url),
      stock: stockNumber, price: priceNumber, category: newProductCategory,
      barcode: newProductBarcode, variantsText: newProductVariantsText,
      reorderLevel: reorderLevelNumber,
      stockHistory: [], // Initialize with empty history
    });
    resetFormFields(); setShowAddForm(false);
  };
  
  const closeAndResetForm = () => {
    resetFormFields(); setShowAddForm(false); onClose();
  };

  const openStockHistory = (product: Product) => {
    setSelectedProductForHistory(product);
    setIsStockHistoryModalOpen(true);
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={closeAndResetForm} title="Manage Your Products" size="xl">
      <div className="space-y-6 p-1">
        {!showAddForm && (
          <div className="flex space-x-2 mb-4">
            <Button onClick={() => setShowAddForm(true)} leftIcon={<Icon path={ICON_PATHS.PLUS_CIRCLE} className="w-5 h-5" />} variant="primary">
                Add New Product Manually
            </Button>
            {onOpenScanModal && (
                <Button onClick={onOpenScanModal} leftIcon={<Icon path={ICON_PATHS.QR_CODE_ICON} className="w-5 h-5" />} variant="outline" className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                    Scan/Image Add
                </Button>
            )}
          </div>
        )}
        
        {showAddForm && (
          <form onSubmit={handleAddProductSubmit} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow space-y-4 border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Add New Product</h3>
              {onOpenScanModal && (
                <Button type="button" onClick={onOpenScanModal} variant="ghost" size="sm" leftIcon={<Icon path={ICON_PATHS.QR_CODE_ICON} />} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 border">
                  Use Scan/Image Instead
                </Button>
              )}
            </div>
            {formError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-2 rounded-md">{formError}</p>}
            <Input label="Product Name" name="productName" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="e.g., Artisan Coffee Beans" required />
            <Textarea label="Product Description" name="productDescription" value={newProductDesc} onChange={(e) => setNewProductDesc(e.target.value)} placeholder="Detailed description of the product." rows={3} required />
            <Input label="Photos (comma-separated URLs)" name="productPhotos" value={newProductPhotos} onChange={(e) => setNewProductPhotos(e.target.value)} placeholder="e.g., http://url1.jpg, http://url2.png" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Stock Quantity" name="productStock" type="number" value={newProductStock} onChange={(e) => setNewProductStock(e.target.value)} placeholder="e.g., 100" min="0" required />
              <Input label="Price ($)" name="productPrice" type="number" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} placeholder="e.g., 19.99" min="0.01" step="0.01" required />
              <Input label="Reorder Level (Optional)" name="reorderLevel" type="number" value={newProductReorderLevel} onChange={e => setNewProductReorderLevel(e.target.value)} placeholder="e.g., 10" min="0"/>
            </div>
            <Input label="Category (Optional)" name="productCategory" value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)} placeholder="e.g., Apparel, Electronics, Food" />
            <Input label="Barcode/UPC (Optional)" name="productBarcode" value={newProductBarcode} onChange={(e) => setNewProductBarcode(e.target.value)} placeholder="e.g., 123456789012" />
            <Textarea label="Variants (Optional)" name="productVariantsText" value={newProductVariantsText} onChange={(e) => setNewProductVariantsText(e.target.value)} placeholder="e.g., Sizes: S, M, L; Colors: Red, Blue, Green" rows={2} />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="secondary" onClick={() => { setShowAddForm(false); resetFormFields(); }} className="dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</Button>
              <Button type="submit" variant="primary">Add Product</Button>
            </div>
          </form>
        )}

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Your Current Products</h3>
          {products.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-4 text-center">You haven't added any products yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {products.map((product) => (
                <div key={product.id} className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm hover:shadow-md dark:hover:shadow-gray-600 transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-semibold text-blue-700 dark:text-blue-400">{product.name}</h4>
                        {product.reorderLevel !== undefined && product.stock <= product.reorderLevel && (
                             <span className="text-xs bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200 px-1.5 py-0.5 rounded-full ml-1">Low Stock</span>
                        )}
                    </div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      ${product.price.toFixed(2)} (Stock: {product.stock})
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{product.description}</p>
                  {product.category && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Category: {product.category}</p>}
                  <div className="mt-2 flex justify-between items-center">
                    <Button size="xs" variant="ghost" onClick={() => openStockHistory(product)} className="border dark:border-gray-500">Stock History</Button>
                    <div className="space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => alert(`Edit feature for "${product.name}" coming soon!`)} className="dark:text-gray-300 dark:hover:bg-gray-600">Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => alert(`Delete feature for "${product.name}" coming soon!`)}>Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
    {selectedProductForHistory && (
        <ProductStockHistoryModal
            isOpen={isStockHistoryModalOpen}
            onClose={() => setIsStockHistoryModalOpen(false)}
            product={selectedProductForHistory}
        />
    )}
    </>
  );
};

export default ManageProductsModal;