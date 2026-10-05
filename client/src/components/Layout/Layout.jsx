import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Plus, Bell, User } from 'lucide-react';
import { Sidebar } from './Sidebar';

export const BottomNav = ({ onOpenAddExpense }) => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/dashboard" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Home size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink to="/groups" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Users size={20} />
        <span>Groups</span>
      </NavLink>

      <button className="fab-add-btn" onClick={onOpenAddExpense} title="Add Expense">
        <Plus size={24} />
      </button>

      <NavLink to="/activity" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Bell size={20} />
        <span>Activity</span>
      </NavLink>

      <NavLink to="/settings" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <User size={20} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};

export const Layout = ({ children, onOpenAddExpense }) => {
  return (
    <div className="app-container">
      <Sidebar onOpenAddExpense={onOpenAddExpense} />
      <main className="main-content">{children}</main>
      <BottomNav onOpenAddExpense={onOpenAddExpense} />
    </div>
  );
};
