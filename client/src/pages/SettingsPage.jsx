import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../api/client';
import { Avatar } from '../components/Common/Avatar';
import { User, Mail, Shield, Check, Save } from 'lucide-react';

export const SettingsPage = () => {
  const { user, refreshUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color || '#0D9488');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const colors = ['#0D9488', '#3B82F6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981', '#6366F1', '#EF4444'];

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      await fetchApi('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, avatar_color: avatarColor })
      });
      await refreshUser();
      setMsg('Profile updated successfully!');
    } catch (err) {
      setMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>⚙️ Account Settings</h1>
        <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
          Manage your personal details and avatar preferences.
        </p>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSave}>
          {msg && (
            <div className="badge-positive" style={{ padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'block' }}>
              {msg}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <Avatar name={name || user?.name} color={avatarColor} size="lg" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748B' }}>@{user?.username}</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={user?.email || ''}
              disabled
              style={{ background: '#F1F5F9', color: '#64748B' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Avatar Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              {colors.map(c => (
                <div
                  key={c}
                  onClick={() => setAvatarColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: avatarColor === c ? '0 0 0 2px #0D9488' : 'none'
                  }}
                >
                  {avatarColor === c && <Check size={16} color="white" />}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-danger btn-sm" onClick={logout}>
              Log Out
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
