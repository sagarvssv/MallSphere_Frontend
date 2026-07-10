import {
  FaHourglassHalf,
  FaCheckCircle,
  FaTimesCircle,
  FaStore,
  FaBarcode,
  FaArrowRight
} from 'react-icons/fa';

const colorStyles = {
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
    glow: 'from-amber-50',
    dot: 'bg-amber-500',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    glow: 'from-emerald-50',
    dot: 'bg-emerald-500',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100',
    glow: 'from-rose-50',
    dot: 'bg-rose-500',
  },
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
    glow: 'from-indigo-50',
    dot: 'bg-indigo-500',
  },
  purple: {
    iconBg: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    glow: 'from-purple-50',
    dot: 'bg-purple-500',
  },
};

const StatCard = ({ icon: Icon, label, value, color, trend }) => {
  const styles = colorStyles[color] || colorStyles.indigo;

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-6 overflow-hidden">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${styles.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="relative flex items-center">
        <div className={`p-3.5 rounded-2xl mr-4 shrink-0 transition-colors ${styles.iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
              {trend}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const StatsOverview = ({ pendingStalls, approvedStalls, rejectedStalls, allStalls, licenses }) => {
  const stats = [
    { 
      icon: FaHourglassHalf, 
      label: 'Pending Stalls', 
      value: pendingStalls, 
      color: 'amber',
      trend: 'Awaiting approval' 
    },
    { 
      icon: FaCheckCircle, 
      label: 'Approved Stalls', 
      value: approvedStalls, 
      color: 'emerald',
      trend: 'Active stalls' 
    },
    { 
      icon: FaTimesCircle, 
      label: 'Rejected Stalls', 
      value: rejectedStalls, 
      color: 'rose',
      trend: 'Need attention' 
    },
    { 
      icon: FaStore, 
      label: 'Total Stalls', 
      value: allStalls, 
      color: 'indigo',
      trend: 'All your stalls' 
    },
    { 
      icon: FaBarcode, 
      label: 'Licenses', 
      value: licenses, 
      color: 'purple',
      trend: 'Available licenses' 
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatsOverview;