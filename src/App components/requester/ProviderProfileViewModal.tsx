// src/components/requester/ProviderProfileViewModal.tsx
import React from 'react';
import Modal from '../ui/Modal.js';
import Button from '../ui/Button.js';
import Icon from '../ui/Icon.js';
import StarRating from '../ui/StarRating.js';
import { ICON_PATHS } from '../../constants.js';
import { ProviderProfileViewModalProps, MockProviderProfile, Review, Product, ProfessionalService, Vehicle } from '../../types.js';

const ProviderProfileViewModal: React.FC<ProviderProfileViewModalProps> = ({
  isOpen,
  onClose,
  provider,
}) => {
  if (!provider) return null;

  const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode; fullWidth?: boolean }> = ({ label, value, fullWidth }) => (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 break-words">{value || 'N/A'}</dd>
    </div>
  );

  const renderVerificationBadge = (level?: 'basic' | 'plus' | 'pro') => {
    if (!level) return null;
    let color = 'bg-gray-400 dark:bg-gray-500';
    let text = 'Verified';
    if (level === 'plus') { color = 'bg-blue-500 dark:bg-blue-400'; text = 'Verified Plus'; }
    if (level === 'pro') { color = 'bg-green-500 dark:bg-green-400'; text = 'Verified Pro'; }
    return <span className={`text-xs text-white px-1.5 py-0.5 rounded-full ${color} ml-2`}>{text}</span>;
  };
  
  const mockPhotoGalleryItems = [
    ...(provider.vehiclesOffered?.flatMap(v => v.photos).slice(0, 2) || []),
    ...(provider.productsOffered?.flatMap(p => p.photos).slice(0, 2) || []),
    provider.avatarUrl || `https://picsum.photos/seed/${provider.id}/200/200` // Fallback
  ].filter(Boolean).slice(0,3);


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={provider.name}
      size="2xl" // Increased size for more details
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => alert(`Contact ${provider.name} (Not Implemented)`)} className="dark:bg-gray-600 dark:hover:bg-gray-500">
            Contact Provider (Mock)
          </Button>
          <Button variant="primary" onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="space-y-4 p-1 max-h-[75vh] overflow-y-auto"> {/* Added max-h and overflow */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
          <img
            src={provider.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=random&color=fff`}
            alt={`${provider.name}'s avatar`}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
          />
          <div className="text-center sm:text-left flex-grow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-center sm:justify-start">
                {provider.name}
                {renderVerificationBadge(provider.verificationLevel)}
            </h3>
            {provider.averageRating > 0 && (
              <div className="my-1 flex justify-center sm:justify-start items-center">
                <StarRating rating={provider.averageRating} readOnly size="md" />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">({provider.averageRating.toFixed(1)} from {provider.detailedReviews?.length || 0} reviews)</span>
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">{provider.location.address}</p>
             {provider.memberSinceDate && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Member since: {new Date(provider.memberSinceDate).toLocaleDateString()}</p>
             )}
             {provider.tasksCompletedCount !== undefined && (
                <p className="text-xs text-gray-400 dark:text-gray-500">Tasks completed: {provider.tasksCompletedCount}+</p>
             )}
             {provider.badges && provider.badges.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-1.5">
                    {provider.badges.map(badge => (
                        <span key={badge} className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-700 dark:text-teal-200 px-2 py-0.5 rounded-full">{badge}</span>
                    ))}
                </div>
             )}
          </div>
        </div>

        {provider.bio && (
          <div className="border-t dark:border-gray-700 pt-3">
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-1">About {provider.name}:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{provider.bio}"</p>
          </div>
        )}

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 border-t dark:border-gray-700 pt-3">
          {provider.specialties && provider.specialties.length > 0 && (
            <DetailItem label="Specialties" value={provider.specialties.join(', ')} fullWidth />
          )}
          <DetailItem label="Primary Service Types" value={provider.serviceTypes.map(st => st.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ')} />
          {provider.skills && provider.skills.length > 0 && (
            <DetailItem label="Skills" value={provider.skills.join(', ')} fullWidth />
          )}
          {provider.equipment && provider.equipment.length > 0 && (
            <DetailItem label="Equipment" value={provider.equipment.join(', ')} fullWidth />
          )}
          {provider.operationalHours && <DetailItem label="Operational Hours" value={provider.operationalHours} />}
          {provider.transportationMode && provider.transportationMode !== "none" && <DetailItem label="Primary Transport" value={provider.transportationMode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />}
        </dl>

        {mockPhotoGalleryItems.length > 0 && (
            <div className="border-t dark:border-gray-700 pt-3">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Gallery (Mock)</h4>
                <div className="grid grid-cols-3 gap-2">
                    {mockPhotoGalleryItems.map((photoUrl, index) => (
                        <img key={index} src={photoUrl} alt={`Gallery item ${index+1}`} className="w-full h-20 object-cover rounded-md border dark:border-gray-600"/>
                    ))}
                </div>
            </div>
        )}

        {provider.servicesOffered && provider.servicesOffered.length > 0 && (
          <div className="border-t dark:border-gray-700 pt-3">
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-1">Services Offered:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300 pl-2">
              {provider.servicesOffered.map(service => (
                <li key={service.id}><strong>{service.name}</strong> - ${service.rate.toFixed(2)} ({service.rateType})<br/><span className="text-xs">{service.description}</span></li>
              ))}
            </ul>
          </div>
        )}
        {provider.productsOffered && provider.productsOffered.length > 0 && (
          <div className="border-t dark:border-gray-700 pt-3">
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-1">Products Offered:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300 pl-2">
              {provider.productsOffered.map(product => (
                <li key={product.id}><strong>{product.name}</strong> - ${product.price.toFixed(2)}<br/><span className="text-xs">{product.description} (Stock: {product.stock})</span></li>
              ))}
            </ul>
          </div>
        )}

        {provider.detailedReviews && provider.detailedReviews.length > 0 && (
          <div className="border-t dark:border-gray-700 pt-3">
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Customer Reviews ({provider.detailedReviews.length})</h4>
            <div className="space-y-3">
              {provider.detailedReviews.map((review, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-1">
                    <StarRating rating={review.rating} readOnly size="sm" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(review.date).toLocaleDateString()}</span>
                  </div>
                  {review.reviewTitle && <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{review.reviewTitle}</h5>}
                  <p className="text-xs text-gray-600 dark:text-gray-300 italic">"{review.text}"</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">- {review.reviewerName || 'Anonymous'}</p>
                  {review.aspectRatings && (
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {review.aspectRatings.quality && <span>Quality: {review.aspectRatings.quality}/5</span>}
                        {review.aspectRatings.communication && <span>Comm: {review.aspectRatings.communication}/5</span>}
                        {review.aspectRatings.timeliness && <span>Time: {review.aspectRatings.timeliness}/5</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};

export default ProviderProfileViewModal;