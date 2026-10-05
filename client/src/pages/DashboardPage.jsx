import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Plus, Users, Receipt, ChevronRight } from 'lucide-react';
import { fetchApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/Common/Avatar';
import { LoadingSpinner, EmptyState } from '../components/Common/EmptyState';

export const DashboardPage = ({ onOpenAddExpense, onOpenCreateGroup }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [user?.id]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/users/dashboard-summary');
      setSummary(data);

      // Load expenses from first group or overall
      if (data.groups && data.groups.length > 0) {
        const expData = await fetchApi(`/expenses/group/${data.groups[0].id}`);
        setRecentExpenses(expData.slice(0, 5));
      } else {
        setRecentExpenses([]);
      }
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const { totalBalance = 0, youAreOwed = 0, youOwe = 0, youAreOwedList = [], youOweList = [], groups = [] } = summary || {};

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Hello, {user?.name} 👋
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
            Here is your financial position across all groups.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onOpenCreateGroup}>
            <Plus size={18} /> New Group
          </button>
          <button className="btn btn-primary" onClick={onOpenAddExpense}>
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </div>

      {/* Main Balance Grid */}
      <div className="balance-grid">
        {/* Total Net Balance Card */}
        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)' }}>
          <div className="metric-label">Total Net Balance</div>
          <div className={`metric-value ${totalBalance >= 0 ? 'text-positive' : 'text-negative'}`}>
            {totalBalance >= 0 ? `+₹${totalBalance.toLocaleString('en-IN')}` : `-₹${Math.abs(totalBalance).toLocaleString('en-IN')}`}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>
            {totalBalance >= 0 ? 'Overall, people owe you money' : 'Overall, you owe money to friends'}
          </div>
        </div>

        {/* You Are Owed Card */}
        <div className="metric-card positive">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="metric-label">You Are Owed</div>
            <ArrowDownLeft size={20} color="#059669" />
          </div>
          <div className="metric-value text-positive">
            ₹{youAreOwed.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>
            {youAreOwedList.length === 0 ? 'No one owes you right now' : `From ${youAreOwedList.length} friend${youAreOwedList.length > 1 ? 's' : ''}`}
          </div>
        </div>

        {/* You Owe Card */}
        <div className="metric-card negative">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="metric-label">You Owe</div>
            <ArrowUpRight size={20} color="#DC2626" />
          </div>
          <div className="metric-value text-negative">
            ₹{youOwe.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>
            {youOweList.length === 0 ? 'You are completely settled up!' : `To ${youOweList.length} friend${youOweList.length > 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      {/* Breakdown Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* You are owed detailed list */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title text-positive" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>💚 You are owed</span>
            </h3>
            <span className="badge-positive">Total: ₹{youAreOwed.toLocaleString('en-IN')}</span>
          </div>

          {youAreOwedList.length === 0 ? (
            <div style={{ padding: '1rem 0', color: '#64748B', fontSize: '0.9rem', textAlign: 'center' }}>
              🎉 Nobody owes you money right now.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {youAreOwedList.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/groups/${item.groupId}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px solid #F1F5F9',
                    cursor: 'pointer'
                  }}
                  className="list-hover"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Avatar name={item.user.name} color={item.user.avatar_color} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.user.name} owes you</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>In {item.groupName}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#059669', fontSize: '1.05rem' }}>
                    +₹{item.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* You owe detailed list */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title text-negative" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>💔 You owe</span>
            </h3>
            <span className="badge-negative">Total: ₹{youOwe.toLocaleString('en-IN')}</span>
          </div>

          {youOweList.length === 0 ? (
            <div style={{ padding: '1rem 0', color: '#64748B', fontSize: '0.9rem', textAlign: 'center' }}>
              ✨ You don't owe anyone money.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {youOweList.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/groups/${item.groupId}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px solid #F1F5F9',
                    cursor: 'pointer'
                  }}
                  className="list-hover"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Avatar name={item.user.name} color={item.user.avatar_color} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>You owe {item.user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>In {item.groupName}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#DC2626', fontSize: '1.05rem' }}>
                    -₹{item.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Your Groups Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">👥 Your Shared Groups</h3>
          <Link to="/groups" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            View All <ChevronRight size={16} />
          </Link>
        </div>

        {groups.length === 0 ? (
          <EmptyState
            type="group"
            title="No groups yet"
            message="Create your first group and start sharing expenses with friends."
            actionLabel="+ Create Group"
            onAction={onOpenCreateGroup}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {groups.map(g => (
              <div
                key={g.id}
                onClick={() => navigate(`/groups/${g.id}`)}
                style={{
                  background: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
                className="group-card-hover"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>{g.name}</div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>
                    {g.memberCount} members
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '0.75rem', height: '2.5em', overflow: 'hidden' }}>
                  {g.description || 'Shared expense group'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Your balance:</span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: g.userNetBalance >= 0 ? '#059669' : '#DC2626' }}>
                    {g.userNetBalance === 0 ? 'Settled up' : g.userNetBalance > 0 ? `+₹${g.userNetBalance.toLocaleString('en-IN')}` : `-₹${Math.abs(g.userNetBalance).toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Expenses Section */}
      {recentExpenses.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🧾 Recent Expenses</h3>
            <Link to="/expenses" className="btn btn-secondary btn-sm">View All</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentExpenses.map(exp => (
              <div
                key={exp.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #F1F5F9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Avatar name={exp.paid_by_name} color={exp.paid_by_color} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{exp.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Paid by {exp.paid_by === user?.id ? 'You' : exp.paid_by_name} • {new Date(exp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
                    ₹{exp.amount.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: exp.paid_by === user?.id ? '#059669' : '#DC2626' }}>
                    Your share: ₹{exp.userShare.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
