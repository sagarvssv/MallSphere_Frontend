// components/vendor/dashboard/modals/EditFlashDealModal.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaImage, FaSpinner, FaTrash, FaBolt, FaClock, FaPercent } from 'react-icons/fa';
import vendorApi from '../../../../hooks/vendorApi';

const EditFlashDealModal = ({ flashDeal, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    startDate: '',
    endDate: '',
    termsAndConditions: '',
    timezone: 'Asia/Dubai',
    stock: '',
    maxPerUser: '',
    minPurchase: ''
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    if (flashDeal && isOpen) {
      try {
        console.log('Editing flash deal:', flashDeal);

        // Extract flash deal data from various possible structures
        const title = flashDeal.title || flashDeal.flashDealTitle || '';
        const description = flashDeal.description || flashDeal.flashDealDescription || '';
        const discountType = flashDeal.discountType || flashDeal.flashDealType || 'percentage';
        const discountValue = flashDeal.discountValue || flashDeal.discount || flashDeal.flashDealValue || '';
        const terms = flashDeal.termsAndConditions || flashDeal.terms || flashDeal.flashDealTermsAndConditions || '';
        const timezone = flashDeal.timezone || 'Asia/Dubai';
        const stock = flashDeal.stock || '';
        const maxPerUser = flashDeal.maxPerUser || '';
        const minPurchase = flashDeal.minPurchase || '';

        // Format dates for datetime-local input
        let startDate = '';
        let endDate = '';
        
        const startDateTime = flashDeal.startDate || flashDeal.flashDealStartTime;
        if (startDateTime) {
          const date = new Date(startDateTime);
          if (!isNaN(date.getTime())) {
            startDate = date.toISOString().slice(0, 16);
          }
        }
        
        const endDateTime = flashDeal.endDate || flashDeal.flashDealEndTime;
        if (endDateTime) {
          const date = new Date(endDateTime);
          if (!isNaN(date.getTime())) {
            endDate = date.toISOString().slice(0, 16);
          }
        }
        
        setFormData({
          title,
          description,
          discountType,
          discountValue,
          startDate,
          endDate,
          termsAndConditions: terms,
          timezone,
          stock,
          maxPerUser,
          minPurchase
        });
        
        // Calculate duration
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          if (!isNaN(start) && !isNaN(end)) {
            const diffMs = end - start;
            const diffHours = diffMs / (1000 * 60 * 60);
            if (diffHours < 1) {
              setDuration(`${Math.floor(diffMs / 60000)} minutes`);
            } else if (diffHours < 24) {
              setDuration(`${Math.floor(diffHours)}h ${Math.floor((diffHours % 1) * 60)}m`);
            } else {
              const days = Math.floor(diffHours / 24);
              const hours = Math.floor(diffHours % 24);
              setDuration(`${days} day${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours}h` : ''}`);
            }
          }
        }
        
        // Set existing images
        const images = flashDeal.flashDealImages || flashDeal.images || [];
        if (images.length > 0) {
          setExistingImages(images);
        }
        
        setNewImages([]);
        setError('');
      } catch (err) {
        console.error('Error setting flash deal form data:', err);
        setError('Error loading flash deal data');
      }
    }
  }, [flashDeal, isOpen]);

  // Update duration when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (!isNaN(start) && !isNaN(end) && end > start) {
        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 1) {
          setDuration(`${Math.floor(diffMs / 60000)} minutes`);
        } else if (diffHours < 24) {
          setDuration(`${Math.floor(diffHours)}h ${Math.floor((diffHours % 1) * 60)}m`);
        } else {
          const days = Math.floor(diffHours / 24);
          const hours = Math.floor(diffHours % 24);
          setDuration(`${days} day${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours}h` : ''}`);
        }
      } else {
        setDuration('');
      }
    } else {
      setDuration('');
    }
  }, [formData.startDate, formData.endDate]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    try {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
        if (!isValidType) alert(`${file.name} is not an image file`);
        if (!isValidSize) alert(`${file.name} is too large (max 5MB)`);
        return isValidType && isValidSize;
      });

      if (validFiles.length + newImages.length + existingImages.length > 3) {
        alert('Maximum 3 images allowed for flash deals');
        return;
      }

      setNewImages(prev => [...prev, ...validFiles]);
      setError('');
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Error uploading images');
    }
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!flashDeal || !flashDeal._id) {
      setError('Invalid flash deal data');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError('Please enter flash deal title');
        setLoading(false);
        return;
      }

      if (!formData.description.trim()) {
        setError('Please enter flash deal description');
        setLoading(false);
        return;
      }

      if (!formData.startDate || !formData.endDate) {
        setError('Please select both start and end date/time');
        setLoading(false);
        return;
      }

      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const now = new Date();

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setError('Invalid date format');
        setLoading(false);
        return;
      }

      if (endDate <= now && flashDeal.status !== 'expired') {
        setError('End date must be in the future');
        setLoading(false);
        return;
      }

      if (endDate <= startDate) {
        setError('End date must be after start date');
        setLoading(false);
        return;
      }

      // Check duration (max 48 hours for flash deals)
      const diffHours = (endDate - startDate) / (1000 * 60 * 60);
      if (diffHours > 48) {
        setError('Flash deal duration cannot exceed 48 hours');
        setLoading(false);
        return;
      }

      if (diffHours < 1) {
        setError('Flash deal duration must be at least 1 hour');
        setLoading(false);
        return;
      }

      // Validate discount value
      const discountValue = parseFloat(formData.discountValue);
      if (isNaN(discountValue) || discountValue <= 0) {
        setError('Please enter a valid discount value');
        setLoading(false);
        return;
      }

      if (formData.discountType === 'percentage') {
        if (discountValue <= 0 || discountValue > 100) {
          setError('Percentage discount must be between 1 and 100');
          setLoading(false);
          return;
        }
      }

      // Validate stock if provided
      if (formData.stock && (parseInt(formData.stock) < 0 || isNaN(parseInt(formData.stock)))) {
        setError('Please enter a valid stock quantity');
        setLoading(false);
        return;
      }

      // Validate max per user if provided
      if (formData.maxPerUser && (parseInt(formData.maxPerUser) < 1 || isNaN(parseInt(formData.maxPerUser)))) {
        setError('Max per user must be at least 1');
        setLoading(false);
        return;
      }

      const flashDealData = {
        title: formData.title,
        description: formData.description,
        discountType: formData.discountType,
        discountValue: discountValue,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        termsAndConditions: formData.termsAndConditions,
        timezone: formData.timezone
      };

      // Add optional fields if provided
      if (formData.stock) flashDealData.stock = parseInt(formData.stock);
      if (formData.maxPerUser) flashDealData.maxPerUser = parseInt(formData.maxPerUser);
      if (formData.minPurchase) flashDealData.minPurchase = parseFloat(formData.minPurchase);

      console.log('Submitting flash deal update:', flashDealData);

      const response = await vendorApi.editFlashDeal(flashDeal._id, flashDealData, newImages);

      console.log('Edit flash deal response:', response);

      if (response && response.success) {
        if (onSuccess) onSuccess(response.data || response);
        if (onClose) onClose();
      } else {
        setError(response?.message || 'Failed to update flash deal');
      }
    } catch (err) {
      console.error('Edit flash deal error:', err);
      setError(err.message || 'An error occurred while updating the flash deal');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTimeInTimezone = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      timeZone: formData.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isOpen || !flashDeal) return null;

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      className="flex items-center justify-center p-4"
    >
      <div
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(107,114,128,0.75)' }}
        onClick={onClose}
      />

      <div
        className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto"
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FaBolt className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-900">Edit Flash Deal</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-amber-600 mt-1">⚡ Time-sensitive promotion with higher visibility</p>
          </div>

          <div className="px-6 py-5">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flash Deal Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g., 24-Hour Mega Sale ⚡"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Describe your flash deal details..."
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type *
                  </label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (AED)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    required
                    min={formData.discountType === 'percentage' ? 1 : 0.01}
                    max={formData.discountType === 'percentage' ? 100 : undefined}
                    step={formData.discountType === 'percentage' ? 1 : 'any'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.discountType === 'percentage' 
                      ? 'Enter percentage (1-100)' 
                      : 'Enter amount in AED'}
                  </p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Duration Display */}
              {duration && (
                <div className="bg-amber-50 rounded-lg px-4 py-2.5 border border-amber-100 flex items-center justify-between text-sm">
                  <span className="text-amber-700 font-medium flex items-center gap-2">
                    <FaClock className="h-4 w-4" />
                    Duration:
                  </span>
                  <span className="text-amber-600 font-semibold">{duration}</span>
                </div>
              )}

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone *
                </label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="Asia/Dubai">🇦🇪 Dubai (GST) - UTC+4:00</option>
                  <option value="Asia/Kolkata">🇮🇳 India (IST) - UTC+5:30</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Current {formData.timezone === 'Asia/Kolkata' ? 'Indian' : 'Dubai'} time: {getCurrentTimeInTimezone()}
                </p>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity (Optional)
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Unlimited if empty"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Per User (Optional)
                  </label>
                  <input
                    type="number"
                    name="maxPerUser"
                    value={formData.maxPerUser}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                    placeholder="e.g., 2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Purchase (Optional)
                </label>
                <input
                  type="number"
                  name="minPurchase"
                  value={formData.minPurchase}
                  onChange={handleInputChange}
                  min="0"
                  step="any"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  placeholder="AED 0"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum order value to apply this deal</p>
              </div>

              {/* Terms & Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  name="termsAndConditions"
                  value={formData.termsAndConditions}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Terms and conditions apply..."
                />
              </div>

              {/* Images Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flash Deal Images (Max 3)
                </label>

                {existingImages.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Current Images:</p>
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((img, idx) => (
                        <div key={img.publicId || idx} className="relative group">
                          <img
                            src={img.url}
                            alt={`Flash deal ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <FaTrash className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newImages.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">New Images:</p>
                    <div className="flex flex-wrap gap-2">
                      {newImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`Preview ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <FaTrash className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {existingImages.length + newImages.length < 3 && (
                  <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <FaImage className="mr-2 text-gray-600" />
                    <span className="text-sm text-gray-600">Add Images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {3 - (existingImages.length + newImages.length)} slots remaining
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  ⚡ Flash deals with images get 3x more visibility
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin h-4 w-4" />
                  Updating...
                </>
              ) : (
                <>
                  <FaBolt className="h-4 w-4" />
                  Update Flash Deal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditFlashDealModal;