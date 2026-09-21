import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/TranslationContext';
import {
  LayoutDashboard, ShoppingCart, Users, Package, Wheat, Factory,
  Wrench, Receipt, BarChart3, Shield, ChevronLeft, ChevronRight,
  LogOut, X, IndianRupee, Calculator,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/shivraj-logo.png';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapseToggle: () => void;
  onMobileClose: () => void;
}

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/sales',      icon: ShoppingCart, label: 'Sales & Billing' },
      { to: '/customers',  icon: Users,        label: 'Customers' },
      { to: '/services',   icon: Wrench,       label: 'Services' },
      { to: '/price-management', icon: IndianRupee, label: 'Quick Price Update' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { to: '/products',       icon: Package,  label: 'Products' },
      { to: '/raw-materials',  icon: Wheat,    label: 'Raw Materials' },
      { to: '/production',     icon: Factory,  label: 'Production' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/expenses', icon: Receipt,  label: 'Expenses' },
      { to: '/reports',  icon: BarChart3, label: 'Reports' },
      { to: '/ca', icon: Calculator, label: 'CA Workspace' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/administration', icon: Shield, label: 'Administration' },
    ],
  },
];

export default function Sidebar({ collapsed, mobileOpen, onCollapseToggle, onMobileClose }: SidebarProps) {
  const { userName, role } = useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const navClass = [
    'app-nav',
    collapsed ? 'nav-collapsed' : '',
    mobileOpen ? 'nav-mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside className={navClass}>
      {/* Brand header */}
      <div className="brand-header" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
        <img src={brandLogo} alt="Shivraj Masala logo" className="brand-logo" />
        {!collapsed && (
          <div className="brand-copy">
            <p className="brand-name">Shivraj Masala's</p>
            <p className="brand-business">& Rice Mill</p>
            <p className="brand-slogan">कोल्हापुरी ठसका • चवीचा वारसा</p>
          </div>
        )}
        {/* Mobile close button */}
        <button
          className="lg:hidden text-gray-500 hover:text-gray-300 transition-colors ml-auto"
          onClick={onMobileClose}
          title="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        {navSections.map((section, si) => (
          <div key={si} className="mb-0.5">
            {/* Section label / divider */}
            {si > 0 && (
              collapsed
                ? <div className="nav-section-divider my-1" />
                : <p className="nav-section-label">{section.label}</p>
            )}
            {si === 0 && !collapsed && (
              <p className="nav-section-label">{section.label}</p>
            )}

            {section.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-active' : ''}`
                }
              >
                <Icon size={16} className="shrink-0" />
                <span className="nav-label">{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-3 py-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
              style={{ background: '#1E3A5F' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[12px] font-medium truncate leading-tight">{userName}</p>
              <p className="text-[10px] truncate leading-tight" style={{ color: '#64748B' }}>{role}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded"
              title={t('action.logout')}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div className="flex justify-center py-3">
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 rounded"
              title={t('action.logout')}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onCollapseToggle}
          className="collapse-toggle-btn w-full flex items-center justify-center py-2 transition-colors"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#4B5563' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94A3B8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
