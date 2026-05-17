import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Target, CheckSquare, Users, Settings, BarChart2, FileText, Shield,
  LogOut, Menu, X, ChevronRight, Activity, Layers, Flag, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Badge } from './ui';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const employeeNav: NavItem[] = [
  { path: '/employee/goals', label: 'My Goals', icon: <Target size={16} /> },
  { path: '/employee/checkins', label: 'Check-ins', icon: <CheckSquare size={16} /> },
];

const managerNav: NavItem[] = [
  { path: '/manager/team', label: 'Team Approvals', icon: <Flag size={16} /> },
  { path: '/manager/team/all', label: 'All Team Goals', icon: <Layers size={16} /> },
  { path: '/manager/checkins', label: 'Team Check-ins', icon: <Activity size={16} /> },
  { path: '/analytics', label: 'Analytics', icon: <TrendingUp size={16} /> },
];

const adminNav: NavItem[] = [
  { path: '/admin/users', label: 'Users', icon: <Users size={16} /> },
  { path: '/admin/cycles', label: 'Cycles', icon: <Settings size={16} /> },
  { path: '/admin/goals', label: 'All Goals', icon: <Target size={16} /> },
  { path: '/admin/reports', label: 'Reports', icon: <BarChart2 size={16} /> },
  { path: '/analytics', label: 'Analytics', icon: <TrendingUp size={16} /> },
  { path: '/admin/audit', label: 'Audit Log', icon: <FileText size={16} /> },
];

const roleVariant = { EMPLOYEE: 'info', MANAGER: 'warning', ADMIN: 'danger' } as const;

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = user?.role === 'EMPLOYEE' ? employeeNav
    : user?.role === 'MANAGER' ? managerNav
    : adminNav;

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  const sidebar = (
    <aside className="flex flex-col h-full bg-bg-surface border-r border-bg-border w-60 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-bg-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Shield size={14} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-text-primary tracking-tight text-sm">AtomQuest</span>
            <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Goal Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-2 pb-2 text-[10px] font-semibold text-text-muted uppercase tracking-widest">
          {user?.role}
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-primary transition-colors'}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={12} className="text-primary" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-bg-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-bg-elevated transition-colors group">
          <div className="w-7 h-7 bg-bg-elevated rounded-full flex items-center justify-center text-xs font-bold text-primary shrink-0 border border-bg-border">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">{user?.name}</p>
            <Badge variant={roleVariant[user?.role ?? 'EMPLOYEE']} className="mt-0.5">{user?.role}</Badge>
          </div>
          <button onClick={handleLogout} className="text-text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100" title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">{sidebar}</div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">{sidebar}</div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-bg-surface border-b border-bg-border px-5 py-3 flex items-center gap-4 shrink-0">
          <button className="md:hidden text-text-muted hover:text-text-primary" onClick={() => setSidebarOpen(true)}>
            <Menu size={18} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted hidden sm:block">{user?.name}</span>
            <Badge variant={roleVariant[user?.role ?? 'EMPLOYEE']}>{user?.role}</Badge>
            <button onClick={handleLogout} className="text-text-muted hover:text-danger transition-colors p-1.5 hover:bg-bg-elevated rounded-lg" title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-bg-base bg-grid">
          <div className="p-6 animate-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
