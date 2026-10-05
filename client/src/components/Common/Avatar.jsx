import React from 'react';

export const Avatar = ({ name = 'User', color = '#0D9488', size = 'md', className = '' }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : '';

  return (
    <div
      className={`avatar ${sizeClass} ${className}`}
      style={{ backgroundColor: color || '#0D9488' }}
      title={name}
    >
      {initial}
    </div>
  );
};
