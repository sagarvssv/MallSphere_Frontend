// ActiveOffersAndFlashDealsTab.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaTags, 
  FaSpinner, 
  FaSyncAlt, 
  FaStore, 
  FaPercent, 
  FaShoppingCart, 
  FaMoneyBillWave, 
  FaRegClock,
  FaExclamationTriangle,
  FaArrowLeft,
  FaArrowRight,
  FaEdit,
  FaTimes,
  FaFastBackward,
  FaFastForward,
  FaBolt,
  FaClock,
  FaBox,
  FaUsers
} from 'react-icons/fa';
import EditOfferModal from '../modals/EditOfferModal';
import EditFlashDealModal from '../modals/EditFlashDealModal';
import vendorApi from '../../../../hooks/vendorApi';

const ActiveOffersTab = ({
  activeOffers = [],
  activeFlashDeals = [],
  loading,
  error,
  pagination,
  onPageChange,
  onRefresh,
  getPaginatedItems,
  canEdit = false,
  onItemUpdated
}) => {
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedFlashDeal, setSelectedFlashDeal] = useState(null);
  const [showEditOfferModal, setShowEditOfferModal] = useState(false);
  const [showEditFlashDealModal, setShowEditFlashDealModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemTypeToDelete, setItemTypeToDelete] = useState(null); // 'offer' or 'flashdeal'
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('offers'); // 'offers' or 'flashdeals'

  const handleEditOfferClick = (offer) => {
    console.log('Opening edit modal for offer:', offer);
    setSelectedOffer(offer);
    setShowEditOfferModal(true);
  };

  const handleEditFlashDealClick = (flashDeal) => {
    console.log('Opening edit modal for flash deal:', flashDeal);
    setSelectedFlashDeal(flashDeal);
    setShowEditFlashDealModal(true);
  };

  const handleEditSuccess = (updatedItem, type) => {
    console.log(`${type} updated successfully:`, updatedItem);
    setShowEditOfferModal(false);
    setShowEditFlashDealModal(false);
    setSelectedOffer(null);
    setSelectedFlashDeal(null);
    if (onRefresh) {
      onRefresh();
    }
    if (onItemUpdated) {
      onItemUpdated(updatedItem, type);
    }
  };

  const handleDeleteClick = (item, type) => {
    setItemToDelete(item);
    setItemTypeToDelete(type);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleting(true);
    try {
      let response;
      if (itemTypeToDelete === 'offer') {
        response = await vendorApi.deleteOffer(itemToDelete._id);
      } else {
        response = await vendorApi.deleteFlashDeal(itemToDelete._id);
      }
      
      if (response.success) {
        setShowDeleteConfirm(false);
        setItemToDelete(null);
        setItemTypeToDelete(null);
        if (onRefresh) {
          onRefresh();
        }
      } else {
        alert(response.message || `Failed to delete ${itemTypeToDelete}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.message || `An error occurred while deleting the ${itemTypeToDelete}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    setItemTypeToDelete(null);
  };

  const getCurrentItems = () => {
    if (activeTab === 'offers') {
      return getPaginatedItems('offers');
    } else {
      return getPaginatedItems('flashdeals');
    }
  };

  const getCurrentPagination = () => {
    return pagination[activeTab] || { page: 1, limit: 6, total: 0, totalPages: 1 };
  };

  const getOfferTypeBadge = (type) => {
    switch(type) {
      case 'percentage':
        return <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Percentage</span>;
      case 'flat':
        return <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Flat Discount</span>;
      default:
        return null;
    }
  };

  const getOfferValueDisplay = (type, value) => {
    if (type === 'percentage') {
      return `${value}% off`;
    }
    return `AED ${value} off`;
  };

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} days left`;
    }
    
    return `${hours}h ${minutes}m left`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center py-12">
        <FaSpinner className="animate-spin h-8 w-8 text-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading active items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center py-12">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaExclamationTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Error Loading Items</h3>
        <p className="text-gray-500">{error}</p>
        <button
          onClick={onRefresh}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const hasNoItems = (activeTab === 'offers' && activeOffers.length === 0) ||
                     (activeTab === 'flashdeals' && activeFlashDeals.length === 0);

  if (hasNoItems) {
    const isOffersEmpty = activeTab === 'offers' && activeOffers.length === 0;
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          {isOffersEmpty ? 
            <FaTags className="h-10 w-10 text-gray-400" /> : 
            <FaBolt className="h-10 w-10 text-gray-400" />
          }
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {isOffersEmpty ? 'No Active Offers' : 'No Active Flash Deals'}
        </h3>
        <p className="text-gray-500">
          {isOffersEmpty 
            ? 'There are no active offers in the mall at the moment.' 
            : 'There are no active flash deals at the moment.'}
        </p>
      </div>
    );
  }

  const currentItems = getCurrentItems();
  const currentPagination = getCurrentPagination();

  // Pagination helper functions
  const goToFirstPage = () => {
    if (currentPagination.page !== 1) {
      onPageChange(activeTab, 1, currentPagination.limit);
    }
  };

  const goToLastPage = () => {
    if (currentPagination.page !== currentPagination.totalPages) {
      onPageChange(activeTab, currentPagination.totalPages, currentPagination.limit);
    }
  };

  const goToPreviousPage = () => {
    if (currentPagination.page > 1) {
      onPageChange(activeTab, currentPagination.page - 1, currentPagination.limit);
    }
  };

  const goToNextPage = () => {
    if (currentPagination.page < currentPagination.totalPages) {
      onPageChange(activeTab, currentPagination.page + 1, currentPagination.limit);
    }
  };

  const getPageNumbers = () => {
    const { page, totalPages } = currentPagination;
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const getTotalCount = () => {
    if (activeTab === 'offers') {
      return activeOffers.length;
    }
    return activeFlashDeals.length;
  };

  const getStartIndex = () => {
    return Math.min((currentPagination.page - 1) * currentPagination.limit + 1, getTotalCount());
  };

  const getEndIndex = () => {
    return Math.min(currentPagination.page * currentPagination.limit, getTotalCount());
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('offers')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'offers'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaTags className="inline mr-2" />
              Offers ({activeOffers.length})
            </button>
            <button
              onClick={() => setActiveTab('flashdeals')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'flashdeals'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaBolt className="inline mr-2" />
              Flash Deals ({activeFlashDeals.length})
            </button>
          </nav>
        </div>

        <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                {activeTab === 'offers' ? (
                  <FaTags className="mr-2 text-green-600" />
                ) : (
                  <FaBolt className="mr-2 text-yellow-600" />
                )}
                Mall Active {activeTab === 'offers' ? 'Offers' : 'Flash Deals'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Current active {activeTab === 'offers' ? 'offers' : 'flash deals'} in the mall ({getTotalCount()} total)
              </p>
              <p className="text-xs text-green-600 mt-1">
                Showing {getStartIndex()} to {getEndIndex()} of {getTotalCount()} {activeTab === 'offers' ? 'offers' : 'flash deals'}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={onRefresh}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 font-medium flex items-center"
              >
                <FaSyncAlt className="mr-2 h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentItems.map((item) => {
              const isOffer = activeTab === 'offers';
              const itemData = isOffer ? item : item;
              
              return (
                <div 
                  key={itemData._id || itemData.offerId || itemData.flashDealId} 
                  className="border-2 border-gray-100 rounded-2xl p-5 hover:border-green-200 hover:shadow-lg transition-all duration-300 relative"
                >
                  {/* Edit/Delete Actions */}
                  {canEdit && (
                    <div className="absolute top-3 right-3 flex space-x-2">
                      <button
                        onClick={() => isOffer ? handleEditOfferClick(itemData) : handleEditFlashDealClick(itemData)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title={`Edit ${isOffer ? 'Offer' : 'Flash Deal'}`}
                      >
                        <FaEdit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(itemData, isOffer ? 'offer' : 'flashdeal')}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title={`Delete ${isOffer ? 'Offer' : 'Flash Deal'}`}
                      >
                        <FaTimes className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  
                  {/* Flash Deal Badge */}
                  {!isOffer && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <FaBolt className="mr-1 h-3 w-3" />
                        Flash Deal
                      </span>
                    </div>
                  )}
                  
                  {/* Images Carousel */}
                  {(isOffer ? itemData.offerImages : itemData.banners) && 
                   (isOffer ? itemData.offerImages?.length > 0 : itemData.banners?.length > 0) && (
                    <div className="mb-3 -mt-2 -mx-2">
                      <div className="flex overflow-x-auto space-x-2 pb-2">
                        {(isOffer ? itemData.offerImages : itemData.banners).slice(0, 3).map((img, idx) => (
                          <img
                            key={idx}
                            src={img.url}
                            alt={`Item ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                            }}
                          />
                        ))}
                        {(isOffer ? itemData.offerImages : itemData.banners).length > 3 && (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-gray-500">
                              +{(isOffer ? itemData.offerImages : itemData.banners).length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* <div className="flex items-center mb-3">
                    <div className="p-2 rounded-xl bg-green-50 text-green-600 mr-3">
                      <FaStore className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{itemData.stallName || 'Unknown Stall'}</h3>
                      <p className="text-xs text-gray-500">{itemData.shopId}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 bg-gray-100 rounded-lg text-xs font-mono text-gray-600">
                      {isOffer ? itemData.offerId : itemData.flashDealId}
                    </span>
                  </div> */}
                  
                  {/* Item Title */}
                  {(isOffer ? itemData.offerTitle : itemData.title) && (
                    <h4 className="font-semibold text-gray-800 mb-2 line-clamp-1">
                      {isOffer ? itemData.offerTitle : itemData.title}
                    </h4>
                  )}
                  
                  <div className="space-y-2">
                    {/* Discount Value */}
                    {(isOffer ? (itemData.offerValue || itemData.discount) : (itemData.discountValue || itemData.discount)) && (
                      <div className="flex items-center text-sm">
                        <FaPercent className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-gray-700 font-medium">
                          {isOffer 
                            ? (itemData.offerValue 
                                ? getOfferValueDisplay(itemData.offerType, itemData.offerValue)
                                : itemData.discount 
                                  ? `${itemData.discount}% off` 
                                  : '')
                            : (itemData.discountValue
                                ? `${itemData.discountValue}% off`
                                : itemData.discount
                                  ? `${itemData.discount}% off`
                                  : '')
                          }
                        </span>
                        {isOffer && itemData.offerType && getOfferTypeBadge(itemData.offerType)}
                      </div>
                    )}
                    
                    {/* Flash Deal specific: Stock and Max per user */}
                    {!isOffer && (
                      <>
                        {itemData.stock !== undefined && (
                          <div className="flex items-center text-sm">
                            <FaBox className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="text-gray-600">Stock: {itemData.stock}</span>
                          </div>
                        )}
                        {itemData.maxPerUser && (
                          <div className="flex items-center text-sm">
                            <FaUsers className="h-4 w-4 text-purple-600 mr-2" />
                            <span className="text-gray-600">Max {itemData.maxPerUser} per user</span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Min Purchase */}
                    {itemData.minPurchase && (
                      <div className="flex items-center text-sm">
                        <FaShoppingCart className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="text-gray-600">Min. Purchase: AED {itemData.minPurchase}</span>
                      </div>
                    )}
                    
                    {/* Max Discount */}
                    {itemData.maxDiscount && (
                      <div className="flex items-center text-sm">
                        <FaMoneyBillWave className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-gray-600">Max Discount: AED {itemData.maxDiscount}</span>
                      </div>
                    )}
                    
                    {/* Date Range */}
                    {(isOffer 
                      ? (itemData.offerStartDate && itemData.offerEndDate)
                      : (itemData.startDate && itemData.endDate)) && (
                      <div className="flex items-center text-sm">
                        <FaRegClock className="h-4 w-4 text-orange-600 mr-2" />
                        <span className="text-gray-600">
                          {new Date(isOffer ? itemData.offerStartDate : itemData.startDate).toLocaleDateString()} - {new Date(isOffer ? itemData.offerEndDate : itemData.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {/* Time remaining for flash deals */}
                    {!isOffer && itemData.endDate && (
                      <div className="flex items-center text-sm">
                        <FaClock className="h-4 w-4 text-red-600 mr-2" />
                        <span className={`font-medium ${new Date(itemData.endDate) < new Date() ? 'text-red-600' : 'text-orange-600'}`}>
                          {getTimeRemaining(itemData.endDate)}
                        </span>
                      </div>
                    )}
                    
                    {/* Description */}
                    {(isOffer ? (itemData.offerDescription || itemData.description) : (itemData.description)) && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {isOffer ? (itemData.offerDescription || itemData.description) : itemData.description}
                      </p>
                    )}
                    
                    {/* Terms & Conditions */}
                    {(isOffer ? (itemData.offerTermsAndConditions || itemData.terms) : (itemData.termsAndConditions)) && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 font-medium">Terms & Conditions:</p>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {isOffer ? (itemData.offerTermsAndConditions || itemData.terms) : itemData.termsAndConditions}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      isOffer
                        ? (itemData.status === 'active' ? 'bg-green-100 text-green-800' :
                           itemData.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                           'bg-gray-100 text-gray-800')
                        : (new Date(itemData.endDate) > new Date() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')
                    }`}>
                      {isOffer 
                        ? (itemData.status === 'active' ? 'Active' : 
                           itemData.status === 'scheduled' ? 'Scheduled' : 
                           itemData.status || 'Active')
                        : (new Date(itemData.endDate) > new Date() ? 'Active' : 'Expired')}
                    </span>
                    
                    {!isOffer && itemData.stock !== undefined && itemData.stock <= 10 && itemData.stock > 0 && (
                      <span className="text-xs text-red-600 font-medium">
                        Only {itemData.stock} left!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enhanced Pagination */}
          {currentPagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 gap-4">
              <div className="text-sm text-gray-500">
                Page {currentPagination.page} of {currentPagination.totalPages}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPagination.page === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First Page"
                >
                  <FaFastBackward className="h-4 w-4" />
                </button>
                
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <FaArrowLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {getPageNumbers().map((pageNum, index) => (
                    pageNum === '...' ? (
                      <span key={`dots-${index}`} className="px-3 py-2 text-gray-500">
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange(activeTab, pageNum, currentPagination.limit)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPagination.page === pageNum
                            ? 'bg-green-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPagination.page === currentPagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Next
                  <FaArrowRight className="h-4 w-4 ml-1" />
                </button>
                
                <button
                  onClick={goToLastPage}
                  disabled={currentPagination.page === currentPagination.totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last Page"
                >
                  <FaFastForward className="h-4 w-4" />
                </button>
              </div>
              
              {/* Items per page selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Show:</span>
                <select
                  value={currentPagination.limit}
                  onChange={(e) => {
                    const newLimit = parseInt(e.target.value);
                    onPageChange(activeTab, 1, newLimit);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500"
                >
                  <option value={6}>6 per page</option>
                  <option value={9}>9 per page</option>
                  <option value={12}>12 per page</option>
                  <option value={18}>18 per page</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Offer Modal */}
      {showEditOfferModal && selectedOffer && (
        <EditOfferModal
          offer={selectedOffer}
          isOpen={showEditOfferModal}
          onClose={() => {
            setShowEditOfferModal(false);
            setSelectedOffer(null);
          }}
          onSuccess={(updated) => handleEditSuccess(updated, 'Offer')}
        />
      )}

      {/* Edit Flash Deal Modal - You'll need to create this component */}
      {showEditFlashDealModal && selectedFlashDeal && (
        <EditFlashDealModal
          flashDeal={selectedFlashDeal}
          isOpen={showEditFlashDealModal}
          onClose={() => {
            setShowEditFlashDealModal(false);
            setSelectedFlashDeal(null);
          }}
          onSuccess={(updated) => handleEditSuccess(updated, 'Flash Deal')}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
            onClick={handleCancelDelete} 
          />
          
          <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl w-full max-w-lg z-10">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-0 ml-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Delete {itemTypeToDelete === 'offer' ? 'Offer' : 'Flash Deal'}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this {itemTypeToDelete}? This action cannot be undone.
                    </p>
                    {itemToDelete && (
                      <p className="mt-2 text-sm font-medium text-gray-700">
                        {itemTypeToDelete === 'offer' 
                          ? `Offer: ${itemToDelete.offerTitle || itemToDelete.offerId}`
                          : `Flash Deal: ${itemToDelete.title || itemToDelete.flashDealId}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 flex flex-row-reverse gap-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 text-sm disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
              <button
                type="button"
                onClick={handleCancelDelete}
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActiveOffersTab;