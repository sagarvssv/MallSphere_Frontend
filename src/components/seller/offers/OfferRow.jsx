import React from 'react';
import { Clock, Zap, Edit, Trash2, Timer, Eye } from 'lucide-react';
import { STATUS_CONFIG } from '../../utils/constants';

const OfferRow = ({ offer, onToggle, onEdit, onDelete, onView }) => {
  const isFlashDeal = offer.isFlashDeal || !!offer.flashDealTitle;
  const status = offer.offerStatus || offer.status || (offer.isEnabled ? 'active' : 'disabled');
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.disabled;
  
  const imageUrl = offer.offerImages?.[0]?.url || 
    offer.banners?.[0]?.url || 
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop";

  const title = offer.offerTitle || offer.title || offer.flashDealTitle || 'Untitled';
  const description = offer.offerDescription || offer.description || offer.flashDealDescription || '';
  const discountType = offer.offerType || offer.dealType || offer.flashDealType || 'percentage';
  const discountValue = offer.offerValue || offer.dealValue || offer.flashDealValue || 0;
  const endDate = offer.offerEndDate || offer.endTime || offer.flashDealEndTime;

  // Always use the Mongo _id for view/delete operations
  const getViewId = () => {
    return offer._id || offer.id;
  };

  const getDeleteId = () => {
    return offer._id || offer.id;
  };

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
    return d.toLocaleDateString();
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
    <tr className="hover:bg-stone-50 transition-colors cursor-pointer" onClick={handleView}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={imageUrl} 
              alt={title}
              className="w-10 h-10 rounded-lg object-cover"
            />
            {isFlashDeal && (
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                <Zap className="w-2.5 h-2.5 text-white fill-white" />
              </span>
            )}
          </div>
          <div>
            <p className="font-medium text-sm text-stone-900 flex items-center gap-1">
              {isFlashDeal && <Zap className="w-3 h-3 text-amber-500" />}
              {title}
            </p>
            <p className="text-xs text-stone-400 line-clamp-1">{description}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sc.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
          {sc.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-stone-900">
          {discountType === "percentage" && <>{discountValue}%</>}
          {discountType === "flat" && <>₹{discountValue}</>}
          {discountType === "bogo" && <>BOGO</>}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-stone-600">
        <div className="flex items-center gap-1">
          {isFlashDeal ? (
            <>
              <Timer className="w-3 h-3 text-amber-500" />
              <span className="text-amber-600 font-medium">
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
            </>
          ) : (
            formatDate(endDate)
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <button 
            onClick={handleView}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {!isFlashDeal && (
            <button 
              onClick={() => onToggle(offer)} 
              className={`p-1.5 rounded-lg ${
                offer.isEnabled 
                  ? "text-amber-400 hover:text-amber-600 hover:bg-amber-50" 
                  : "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50"
              }`}
              title={offer.isEnabled ? "Disable" : "Enable"}
            >
              {offer.isEnabled ? <Clock className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </button>
          )}
          <button 
            onClick={() => onEdit(offer)} 
            className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default OfferRow;