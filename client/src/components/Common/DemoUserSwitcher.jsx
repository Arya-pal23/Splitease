import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../api/client';
import { Avatar } from './Avatar';
import { UserCheck } from 'lucide-react';

export const DemoUserSwitcher = () => {
  const { user, switchDemoUser } = useAuth();
  const [demoUsers, setDemoUsers] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchApi('/auth/demo-users')
      .then(setDemoUsers)
      .catch(() => {});
  }, []);

  if (!user || demoUsers.length === 0) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setOpen(!open)}
        title="Switch user profile to test balances"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <Avatar name={user.name} color={user.avatar_color} size="sm" />
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.name}</span>
        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>(Switch)</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: '0.5rem',
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            width: '220px',
            zIndex: 60,
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            DEMO USER SWITCHER
          </div>
          {demoUsers.map(u => (
            <div
              key={u.id}
              onClick={() => {
                switchDemoUser(u.id);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                background: u.id === user.id ? '#ECFDF5' : 'transparent'
              }}
              className="user-switch-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Avatar name={u.name} color={u.avatar_color} size="sm" />
                <span style={{ fontSize: '0.85rem', fontWeight: u.id === user.id ? 700 : 500 }}>
                  {u.name}
                </span>
              </div>
              {u.id === user.id && <UserCheck size={14} color="#059669" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
