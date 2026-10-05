import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, ChevronRight } from 'lucide-react';
import { fetchApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner, EmptyState } from '../components/Common/EmptyState';

export const GroupsPage = ({ onOpenCreateGroup }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, [user?.id]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/groups');
      setGroups(data);
    } catch (err) {
      console.error('Failed to load groups', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>👥 Your Groups</h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
            Select a group to see members, balances, and shared expenses.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenCreateGroup}>
          <Plus size={18} /> Create Group
        </button>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          type="group"
          title="No groups yet"
          message="Create your first group to share trip, apartment, or dinner expenses with friends."
          actionLabel="+ Create Group"
          onAction={onOpenCreateGroup}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {groups.map(g => (
            <div
              key={g.id}
              onClick={() => navigate(`/groups/${g.id}`)}
              style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '1.5rem',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              className="card-hover-effect"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>{g.name}</div>
                <span className="badge-positive" style={{ background: '#F1F5F9', color: '#475569' }}>
                  {g.member_count} members
                </span>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1.25rem', height: '2.5em', overflow: 'hidden' }}>
                {g.description || 'Shared expense group'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Your position:</span>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: g.userNetBalance >= 0 ? '#059669' : '#DC2626' }}>
                  {g.userNetBalance === 0 ? 'Settled up' : g.userNetBalance > 0 ? `+₹${g.userNetBalance.toLocaleString('en-IN')}` : `-₹${Math.abs(g.userNetBalance).toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
