import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  iconBg?: string;
  bgColor?: string;   // alias accepted from older pages
  trend?: string;
  trendUp?: boolean;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = '#166534',
  iconBg,
  bgColor,
  trend,
  trendUp,
}: StatCardProps) {
  const bg = iconBg ?? bgColor ?? '#DCFCE7';

  return (
    <div className="stat-card">
      <div className="stat-icon-wrap" style={{ background: bg }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div className="stat-body">
        <p className="stat-label">{label}</p>
        <p className="stat-value" style={{ color: '#111827' }}>{value}</p>
        {trend && (
          <p className={`stat-trend ${trendUp ? 'stat-trend-up' : 'stat-trend-down'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
    </div>
  );
}
