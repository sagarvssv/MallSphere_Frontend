import {
  FaChartPie,
  FaHourglassHalf,
  FaCheckCircle,
  FaTimesCircle,
  FaStore,
  FaBarcode,
  FaCalendarAlt,
  FaTags
} from 'react-icons/fa';

const DashboardTabs = ({ 
  activeTab, 
  onTabChange, 
  pendingCount,
  approvedCount,
  rejectedCount,
  allStallsCount,
  licensesCount,
  eventsCount,
  offersCount
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaChartPie, count: null },
    { id: 'pending', label: 'Pending', icon: FaHourglassHalf, count: pendingCount, badge: 'amber' },
    { id: 'approved', label: 'Approved', icon: FaCheckCircle, count: approvedCount, badge: 'emerald' },
    { id: 'rejected', label: 'Rejected', icon: FaTimesCircle, count: rejectedCount, badge: 'rose' },
    { id: 'all-stalls', label: 'All Stalls', icon: FaStore, count: allStallsCount, badge: 'indigo' },
    { id: 'licenses', label: 'Licenses', icon: FaBarcode, count: licensesCount, badge: 'indigo' },
    { id: 'events', label: 'Events', icon: FaCalendarAlt, count: eventsCount, badge: 'indigo' },
    { id: 'offers', label: 'Active Offers', icon: FaTags, count: offersCount, badge: 'indigo' },
  ];

  const badgeStyles = {
    amber: { active: 'bg-white/25 text-white', inactive: 'bg-amber-50 text-amber-600' },
    emerald: { active: 'bg-white/25 text-white', inactive: 'bg-emerald-50 text-emerald-600' },
    rose: { active: 'bg-white/25 text-white', inactive: 'bg-rose-50 text-rose-600' },
    indigo: { active: 'bg-white/25 text-white', inactive: 'bg-indigo-50 text-indigo-600' },
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm shadow-sm ring-1 ring-gray-100 sticky top-20 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-2 overflow-x-auto py-3.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const styles = tab.badge ? badgeStyles[tab.badge] : null;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-sm shadow-indigo-600/25'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <tab.icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`min-w-[1.375rem] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center tabular-nums ${
                    isActive ? styles.active : styles.inactive
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DashboardTabs;