import React, { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { fetchApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../Common/Avatar';

export const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError('');
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const users = await fetchApi('/users/all');
      setAllUsers(users);
      // Select all demo users by default for easy group creation
      setSelectedUserIds(users.map(u => u.id));
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const handleToggleUser = (uid) => {
    if (uid === user?.id) return; // Cannot unselect self
    setSelectedUserIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);

    try {
      const newGroup = await fetchApi('/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          memberIds: selectedUserIds
        })
      });

      onClose();
      if (onGroupCreated) onGroupCreated(newGroup);
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">👥 Create New Group</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="badge-negative" style={{ padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'block', fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Group Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Goa Trip, Flat Expenses, Weekend Getaway"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Shared expenses for hotel & food"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Add Group Members ({selectedUserIds.length})</label>
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.5rem' }}>
                {allUsers.map(u => {
                  const isChecked = selectedUserIds.includes(u.id);
                  const isSelf = u.id === user?.id;

                  return (
                    <div key={u.id} className="split-member-row">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: isSelf ? 'default' : 'pointer', flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isSelf}
                          onChange={() => handleToggleUser(u.id)}
                          style={{ width: '18px', height: '18px', accentColor: '#0D9488' }}
                        />
                        <Avatar name={u.name} color={u.avatar_color} size="sm" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                          {isSelf ? `You (${u.name})` : u.name}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
