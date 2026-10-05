import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/Common/Avatar';
import { LoadingSpinner, EmptyState } from '../components/Common/EmptyState';
import { Bell } from 'lucide-react';

export const ActivityPage = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/activities')
      .then(setActivities)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>🔔 Activity Feed</h1>
        <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
          Recent actions, new expenses, and settlements across your groups.
        </p>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          type="activity"
          title="No activity yet"
          message="When members add expenses or settle debts, updates will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {activities.map(act => (
            <div
              key={act.id}
              style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <Avatar name={act.user_name} color={act.user_color} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#0F172A' }}>
                  {act.description}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
                  In <strong>{act.group_name}</strong> • {new Date(act.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
