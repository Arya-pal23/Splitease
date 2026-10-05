import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Receipt, Bell, Settings, LogOut, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DemoUserSwitcher } from '../Common/DemoUserSwitcher';

export const Sidebar = ({ onOpenAddExpense }) => {
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-logo">💸</div>
        <div className="brand-title">SplitEase</div>
      </div>

      <div style={{ padding: '0.75rem 1rem 0 1rem' }}>
        <button
          className="btn btn-primary btn-block"
          onClick={onOpenAddExpense}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 2px 8px rgba(13,148,136,0.3)' }}
        >
          <PlusCircle size={18} />
          <span>Add Expense</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Home size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/groups" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Groups</span>
        </NavLink>

        <NavLink to="/expenses" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Receipt size={20} />
          <span>All Expenses</span>
        </NavLink>

        <NavLink to="/activity" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Bell size={20} />
          <span>Activity</span>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-user">
        <DemoUserSwitcher />
        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          title="Log out"
          style={{ padding: '0.4rem', borderRadius: '50%' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
