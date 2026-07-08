import React from 'react';
import { Calendar, Eye, Clock, Zap, Edit, Trash2, Timer } from 'lucide-react';
import { STATUS_CONFIG } from '../../utils/constants';

const OfferCard = ({ offer, onView, onToggle, onEdit, onDelete }) => {
  const isFlashDeal = offer.isFlashDeal || !!offer.flashDealTitle;
  const status = offer.offerStatus || offer.status || (offer.isEnabled ? 'active' : 'disabled');
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.disabled;
  
  // Get image from appropriate source
  const imageUrl = offer.offerImages?.[0]?.url || 
    offer.banners?.[0]?.url || 
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop";

  // Get title and description
  const title = offer.offerTitle || offer.title || offer.flashDealTitle || 'Untitled';
  const description = offer.offerDescription || offer.description || offer.flashDealDescription || '';

  // Get discount info
  const discountType = offer.offerType || offer.dealType || offer.flashDealType || 'percentage';
  const discountValue = offer.offerValue || offer.dealValue || offer.flashDealValue || 0;

  // Get dates
  const startDate = offer.offerStartDate || offer.startTime || offer.flashDealStartTime;
  const endDate = offer.offerEndDate || offer.endTime || offer.flashDealEndTime;

  // Get the correct ID for different operations
  const getViewId = () => {
    // For regular offers, use offerId (the business ID)
    if (!isFlashDeal && offer._id) return offer._id;
    // For flash deals or fallback, use _id
    return offer._id || offer.id;
  };

  const getDeleteId = () => {
    // For delete, always use _id (MongoDB ObjectId)
    return offer._id || offer.id;
  };

  // Format date display based on type
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isFlashDeal) {
      return d.toLocaleString("en-US", { 
        month: "short", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleView = () => {
    const viewId = getViewId();
    console.log('Viewing offer with ID:', viewId, 'isFlashDeal:', isFlashDeal);
    onView(viewId);
  };

  const handleDelete = () => {
    const deleteId = getDeleteId();
    console.log('Deleting offer with ID:', deleteId, 'isFlashDeal:', isFlashDeal);
    onDelete(deleteId);
  };

  return (
    <div className="group bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      {/* Image Container */}
      <div className="relative h-40 overflow-hidden bg-stone-100" onClick={handleView}>
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        {/* Flash Deal Badge */}
        {isFlashDeal && (
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-white">
              <Zap className="w-3 h-3 fill-white" />
              FLASH
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold ${sc.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
            {sc.label}
          </span>
        </div>

        {/* Discount Badge */}
        <div className="absolute bottom-2 left-2">
          <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold">
            {discountType === "percentage" && <>{discountValue}% OFF</>}
            {discountType === "flat" && <>₹{discountValue} OFF</>}
            {discountType === "bogo" && <>BOGO</>}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-stone-900 text-sm mb-1 line-clamp-1 cursor-pointer hover:text-amber-600" onClick={handleView}>
          {isFlashDeal && <Zap className="inline w-3 h-3 text-amber-500 mr-1" />}
          {title}
        </h3>
        <p className="text-stone-500 text-xs mb-3 line-clamp-2">{description}</p>
        
        {/* Date Range */}
        <div className="flex items-center gap-1 text-[10px] text-stone-400 mb-3">
          {isFlashDeal ? (
            <Timer className="w-3 h-3 text-amber-500" />
          ) : (
            <Calendar className="w-3 h-3" />
          )}
          <span>
            {formatDate(startDate)}
            {!isFlashDeal && " - " + formatDate(endDate)}
          </span>
          {isFlashDeal && (
            <span className="ml-auto text-amber-600 font-medium">
              {(() => {
                const end = new Date(endDate);
                const now = new Date();
                const diff = end - now;
                if (diff <= 0) return 'Ended';
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                return `${hours}h ${mins}m left`;
              })()}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1 pt-2 border-t border-stone-100">
          <button 
            onClick={handleView}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          
          {/* Only show toggle for regular offers, not flash deals */}
          {!isFlashDeal && (
            <button 
              onClick={() => onToggle(offer)}
              className={`p-1.5 rounded-lg transition-all ${
                offer.isEnabled 
                  ? "text-amber-400 hover:text-amber-600 hover:bg-amber-50" 
                  : "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50"
              }`}
              title={offer.isEnabled ? "Disable" : "Enable"}
            >
              {offer.isEnabled ? <Clock className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            </button>
          )}
          
          <button 
            onClick={() => onEdit(offer)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
            title="Edit"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferCard;