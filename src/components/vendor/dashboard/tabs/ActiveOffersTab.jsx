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
        return <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 rounded-full text-xs font-semibold">Percentage</span>;
      case 'flat':
        return <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 ring-1 ring-blue-200 rounded-full text-xs font-semibold">Flat Discount</span>;
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
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 text-center py-16">
        <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <FaSpinner className="animate-spin h-6 w-6 text-indigo-600" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Loading active items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 text-center py-16">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaExclamationTriangle className="h-8 w-8 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Error Loading Items</h3>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button
          onClick={onRefresh}
          className="px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium text-sm transition-colors"
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
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
        {/* Tab Navigation persists even when a sub-tab is empty */}
        <div className="border-b border-gray-100">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('offers')}
              className={`flex-1 sm:flex-none py-4 px-6 text-center border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'offers'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <FaTags className="inline mr-2 h-3.5 w-3.5" />
              Offers ({activeOffers.length})
            </button>
            <button
              onClick={() => setActiveTab('flashdeals')}
              className={`flex-1 sm:flex-none py-4 px-6 text-center border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'flashdeals'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <FaBolt className="inline mr-2 h-3.5 w-3.5" />
              Flash Deals ({activeFlashDeals.length})
            </button>
          </nav>
        </div>
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            {isOffersEmpty ? 
              <FaTags className="h-8 w-8 text-gray-400" /> : 
              <FaBolt className="h-8 w-8 text-gray-400" />
            }
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {isOffersEmpty ? 'No Active Offers' : 'No Active Flash Deals'}
          </h3>
          <p className="text-gray-500 text-sm">
            {isOffersEmpty 
              ? 'There are no active offers in the mall at the moment.' 
              : 'There are no active flash deals at the moment.'}
          </p>
        </div>
      </div>
    );
  }

  const currentItems = getCurrentItems();
  const currentPagination = getCurrentPagination();
  const isFlashTab = activeTab === 'flashdeals';

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
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-100">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('offers')}
              className={`flex-1 sm:flex-none py-4 px-6 text-center border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'offers'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <FaTags className="inline mr-2 h-3.5 w-3.5" />
              Offers ({activeOffers.length})
            </button>
            <button
              onClick={() => setActiveTab('flashdeals')}
              className={`flex-1 sm:flex-none py-4 px-6 text-center border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'flashdeals'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <FaBolt className="inline mr-2 h-3.5 w-3.5" />
              Flash Deals ({activeFlashDeals.length})
            </button>
          </nav>
        </div>

        <div className={`px-6 py-5 border-b border-gray-100 bg-gradient-to-r ${
          isFlashTab ? 'from-amber-50/70 via-white to-white' : 'from-indigo-50/70 via-white to-white'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className={`text-[11px] font-semibold tracking-wider uppercase mb-1 ${isFlashTab ? 'text-amber-500' : 'text-indigo-500'}`}>
                {isFlashTab ? 'Ending soon, act fast' : 'Currently running'}
              </p>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
                <span className={`p-2 rounded-lg ${isFlashTab ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {isFlashTab ? <FaBolt className="h-4 w-4" /> : <FaTags className="h-4 w-4" />}
                </span>
                Mall Active {isFlashTab ? 'Flash Deals' : 'Offers'}
              </h2>
              <p className="text-sm text-gray-500 mt-1.5">
                Showing {getStartIndex()}–{getEndIndex()} of {getTotalCount()} {isFlashTab ? 'flash deals' : 'offers'}
              </p>
            </div>
            
            <button
              onClick={onRefresh}
              className="px-4 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 ring-1 ring-gray-200 font-medium text-sm flex items-center whitespace-nowrap transition-colors self-start md:self-auto"
            >
              <FaSyncAlt className="mr-2 h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentItems.map((item) => {
              const isOffer = activeTab === 'offers';
              const itemData = item;
              const isExpiredFlash = !isOffer && new Date(itemData.endDate) <= new Date();
              
              return (
                <div 
                  key={itemData._id || itemData.offerId || itemData.flashDealId} 
                  className={`group border rounded-2xl p-5 hover:shadow-md transition-all duration-300 relative ${
                    isOffer
                      ? 'border-gray-100 hover:border-indigo-200'
                      : isExpiredFlash
                        ? 'border-gray-100'
                        : 'border-amber-100 hover:border-amber-300 bg-gradient-to-b from-amber-50/30 to-white'
                  }`}
                >
                  {/* Edit/Delete Actions */}
                  {canEdit && (
                    <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                      <button
                        onClick={() => isOffer ? handleEditOfferClick(itemData) : handleEditFlashDealClick(itemData)}
                        className="p-2 bg-white text-indigo-600 rounded-lg ring-1 ring-gray-200 hover:bg-indigo-50 hover:ring-indigo-200 transition-colors shadow-sm"
                        title={`Edit ${isOffer ? 'Offer' : 'Flash Deal'}`}
                      >
                        <FaEdit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(itemData, isOffer ? 'offer' : 'flashdeal')}
                        className="p-2 bg-white text-rose-600 rounded-lg ring-1 ring-gray-200 hover:bg-rose-50 hover:ring-rose-200 transition-colors shadow-sm"
                        title={`Delete ${isOffer ? 'Offer' : 'Flash Deal'}`}
                      >
                        <FaTimes className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  
                  {/* Flash Deal Badge */}
                  {!isOffer && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-amber-950 shadow-sm">
                        <FaBolt className="mr-1 h-2.5 w-2.5" />
                        Flash Deal
                      </span>
                    </div>
                  )}
                  
                  {/* Images Carousel */}
                  {(isOffer ? itemData.offerImages : itemData.banners) && 
                   (isOffer ? itemData.offerImages?.length > 0 : itemData.banners?.length > 0) && (
                    <div className={`mb-3 -mt-2 -mx-2 ${!isOffer ? 'pt-6' : ''}`}>
                      <div className="flex overflow-x-auto space-x-2 pb-2">
                        {(isOffer ? itemData.offerImages : itemData.banners).slice(0, 3).map((img, idx) => (
                          <img
                            key={idx}
                            src={img.url}
                            alt={`Item ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0 ring-1 ring-gray-100"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                            }}
                          />
                        ))}
                        {(isOffer ? itemData.offerImages : itemData.banners).length > 3 && (
                          <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ring-gray-100">
                            <span className="text-xs font-semibold text-gray-500">
                              +{(isOffer ? itemData.offerImages : itemData.banners).length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Item Title */}
                  {(isOffer ? itemData.offerTitle : itemData.title) && (
                    <h4 className={`font-bold text-gray-900 mb-2.5 line-clamp-1 ${!isOffer ? 'mt-1' : ''}`}>
                      {isOffer ? itemData.offerTitle : itemData.title}
                    </h4>
                  )}
                  
                  <div className="space-y-2.5">
                    {/* Discount Value */}
                    {(isOffer ? (itemData.offerValue || itemData.discount) : (itemData.discountValue || itemData.discount)) && (
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <FaPercent className={`h-3.5 w-3.5 ${isOffer ? 'text-indigo-500' : 'text-amber-500'}`} />
                        <span className="text-gray-800 font-semibold">
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
                          <div className="flex items-center text-sm gap-2">
                            <FaBox className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-gray-600">Stock: <span className="font-semibold text-gray-800">{itemData.stock}</span></span>
                          </div>
                        )}
                        {itemData.maxPerUser && (
                          <div className="flex items-center text-sm gap-2">
                            <FaUsers className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-gray-600">Max {itemData.maxPerUser} per user</span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Min Purchase */}
                    {itemData.minPurchase && (
                      <div className="flex items-center text-sm gap-2">
                        <FaShoppingCart className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-600">Min. Purchase: AED {itemData.minPurchase}</span>
                      </div>
                    )}
                    
                    {/* Max Discount */}
                    {itemData.maxDiscount && (
                      <div className="flex items-center text-sm gap-2">
                        <FaMoneyBillWave className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-600">Max Discount: AED {itemData.maxDiscount}</span>
                      </div>
                    )}
                    
                    {/* Date Range */}
                    {(isOffer 
                      ? (itemData.offerStartDate && itemData.offerEndDate)
                      : (itemData.startDate && itemData.endDate)) && (
                      <div className="flex items-center text-sm gap-2">
                        <FaRegClock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-600">
                          {new Date(isOffer ? itemData.offerStartDate : itemData.startDate).toLocaleDateString()} – {new Date(isOffer ? itemData.offerEndDate : itemData.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {/* Time remaining for flash deals — the signature element */}
                    {!isOffer && itemData.endDate && (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold ${
                        isExpiredFlash
                          ? 'bg-gray-50 text-gray-500'
                          : 'bg-rose-50 text-rose-600 ring-1 ring-rose-100'
                      }`}>
                        <FaClock className="h-3.5 w-3.5" />
                        {getTimeRemaining(itemData.endDate)}
                      </div>
                    )}
                    
                    {/* Description */}
                    {(isOffer ? (itemData.offerDescription || itemData.description) : (itemData.description)) && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {isOffer ? (itemData.offerDescription || itemData.description) : itemData.description}
                      </p>
                    )}
                    
                    {/* Terms & Conditions */}
                    {(isOffer ? (itemData.offerTermsAndConditions || itemData.terms) : (itemData.termsAndConditions)) && (
                      <div className="pt-1">
                        <p className="text-[11px] font-semibold tracking-wide uppercase text-gray-400 mb-0.5">Terms & Conditions</p>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {isOffer ? (itemData.offerTermsAndConditions || itemData.terms) : itemData.termsAndConditions}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isOffer
                        ? (itemData.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' :
                           itemData.status === 'scheduled' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' :
                           'bg-gray-100 text-gray-600')
                        : (new Date(itemData.endDate) > new Date() ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-gray-100 text-gray-500')
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        isOffer
                          ? (itemData.status === 'active' ? 'bg-emerald-500' : itemData.status === 'scheduled' ? 'bg-blue-500' : 'bg-gray-400')
                          : (new Date(itemData.endDate) > new Date() ? 'bg-emerald-500' : 'bg-gray-400')
                      }`} />
                      {isOffer 
                        ? (itemData.status === 'active' ? 'Active' : 
                           itemData.status === 'scheduled' ? 'Scheduled' : 
                           itemData.status || 'Active')
                        : (new Date(itemData.endDate) > new Date() ? 'Active' : 'Expired')}
                    </span>
                    
                    {!isOffer && itemData.stock !== undefined && itemData.stock <= 10 && itemData.stock > 0 && (
                      <span className="text-xs text-rose-600 font-bold">
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
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-5 border-t border-gray-100 gap-4">
              <div className="text-xs font-medium text-gray-500">
                Page <span className="text-gray-900 font-semibold">{currentPagination.page}</span> of{' '}
                <span className="text-gray-900 font-semibold">{currentPagination.totalPages}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPagination.page === 1}
                  className="p-2.5 ring-1 ring-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="First Page"
                >
                  <FaFastBackward className="h-3.5 w-3.5 text-gray-600" />
                </button>
                
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPagination.page === 1}
                  className="px-3.5 py-2.5 ring-1 ring-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center text-sm font-medium text-gray-600 transition-colors"
                >
                  <FaArrowLeft className="h-3 w-3 mr-1.5" />
                  Prev
                </button>
                
                <div className="flex gap-1">
                  {getPageNumbers().map((pageNum, index) => (
                    pageNum === '...' ? (
                      <span key={`dots-${index}`} className="px-2 py-2 text-gray-400 text-sm">
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange(activeTab, pageNum, currentPagination.limit)}
                        className={`w-9 h-9 rounded-xl font-semibold text-sm transition-colors ${
                          currentPagination.page === pageNum
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                            : 'ring-1 ring-gray-200 text-gray-600 hover:bg-gray-50'
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
                  className="px-3.5 py-2.5 ring-1 ring-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center text-sm font-medium text-gray-600 transition-colors"
                >
                  Next
                  <FaArrowRight className="h-3 w-3 ml-1.5" />
                </button>
                
                <button
                  onClick={goToLastPage}
                  disabled={currentPagination.page === currentPagination.totalPages}
                  className="p-2.5 ring-1 ring-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Last Page"
                >
                  <FaFastForward className="h-3.5 w-3.5 text-gray-600" />
                </button>
              </div>
              
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Show:</span>
                <select
                  value={currentPagination.limit}
                  onChange={(e) => {
                    const newLimit = parseInt(e.target.value);
                    onPageChange(activeTab, 1, newLimit);
                  }}
                  className="px-3 py-2 ring-1 ring-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
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

      {/* Edit Flash Deal Modal */}
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
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
            onClick={handleCancelDelete} 
          />
          
          <div className="relative bg-white rounded-2xl text-left overflow-hidden shadow-xl w-full max-w-lg z-10">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-11 w-11 rounded-xl bg-rose-50">
                  <FaExclamationTriangle className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Delete {itemTypeToDelete === 'offer' ? 'Offer' : 'Flash Deal'}
                  </h3>
                  <div className="mt-1.5">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this {itemTypeToDelete}? This action cannot be undone.
                    </p>
                    {itemToDelete && (
                      <p className="mt-2.5 text-sm font-semibold text-gray-800 bg-gray-50 rounded-lg px-3 py-2">
                        {itemTypeToDelete === 'offer' 
                          ? `Offer: ${itemToDelete.offerTitle || itemToDelete.offerId}`
                          : `Flash Deal: ${itemToDelete.title || itemToDelete.flashDealId}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-2.5">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex justify-center items-center rounded-xl px-4 py-2.5 bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-60 transition-colors"
              >
                {deleting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2 h-3.5 w-3.5" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
              <button
                type="button"
                onClick={handleCancelDelete}
                className="inline-flex justify-center rounded-xl px-4 py-2.5 bg-white text-sm font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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