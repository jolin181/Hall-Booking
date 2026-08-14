import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  ShieldCheck,
  LogOut,
  Building2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import NotificationBell from './NotificationBell';
import { ChatbotWidget } from './ChatbotWidget';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isSuperAdmin } = useAuth();
  const { isConnected } = useWebSocket();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/my-bookings', label: 'My Bookings', icon: CalendarCheck },
    { to: '/admin-directory', label: 'Admin Directory', icon: Users },
    ...(isSuperAdmin
      ? [{ to: '/super-admin', label: 'Manage System', icon: ShieldCheck }]
      : []),
  ];

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-50 border-b border-surface-border bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 hidden sm:block">HallBooker</span>
          </Link>

          {/* Nav */}
          <nav className="flex-1 flex items-center justify-center gap-2 overflow-x-auto">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={isActive(to) ? 'nav-link-active' : 'nav-link'}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden md:block">{label}</span>
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            {/* WS status indicator */}
            <div
              title={isConnected ? 'Real-time connected' : 'Reconnecting...'}
              className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}
            >
              {isConnected ? (
                <Wifi className="w-3.5 h-3.5" />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:block">{isConnected ? 'Live' : 'Connecting'}</span>
            </div>

            <NotificationBell />

            {/* User badge */}
            <div className="flex items-center gap-2 pl-3 border-l border-surface-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-none">{user?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {user?.role === 'SUPERADMIN' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-brand-600 text-sm font-bold border border-slate-200">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        {children}
      </main>
      
      <ChatbotWidget />
    </div>
  );
}

