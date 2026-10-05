import React from 'react';
import { FolderPlus, Receipt, BellOff } from 'lucide-react';

export const EmptyState = ({ type = 'group', title, message, actionLabel, onAction }) => {
  const renderIcon = () => {
    switch (type) {
      case 'group':
        return <FolderPlus size={28} />;
      case 'expense':
        return <Receipt size={28} />;
      default:
        return <BellOff size={28} />;
    }
  };

  return (
    <div className="empty-state">
      <div className="empty-icon">{renderIcon()}</div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-text">{message}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const LoadingSpinner = ({ fullPage = false }) => {
  if (fullPage) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner">Loading SplitEase...</div>
      </div>
    );
  }
  return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading...</div>;
};
