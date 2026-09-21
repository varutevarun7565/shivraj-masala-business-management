import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import useGlobalKeyboardNavigation from '../hooks/useGlobalKeyboardNavigation';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useGlobalKeyboardNavigation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile sidebar on desktop resize
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);


  return (
    <div className="app-shell">
      {/* Mobile backdrop — sits below sidebar (z-49), above content */}
      <div
        className={`nav-backdrop ${mobileOpen ? 'nav-backdrop-visible' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar — participates in flex layout on desktop, drawer on mobile */}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCollapseToggle={() => setCollapsed(c => !c)}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main area — takes remaining width */}
      <div className="app-main">
        <Topbar
          onMobileMenuOpen={() => setMobileOpen(true)}
        />
        <div className="app-content">
          <div className="page-wrap">
            <Outlet />
          </div>
        </div>
      </div>

    </div>
  );
}
