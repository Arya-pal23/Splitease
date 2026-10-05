import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, CheckCircle, Trash2, Edit3, ArrowRightLeft, Users, Receipt, Calendar } from 'lucide-react';
import { fetchApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Avatar } from '../components/Common/Avatar';
import { LoadingSpinner, EmptyState } from '../components/Common/EmptyState';
import { SettleUpModal } from '../components/Settle/SettleUpModal';
import { AddExpenseModal } from '../components/Expenses/AddExpenseModal';

export const GroupDetailPage = ({ onOpenAddExpense }) => {
  const { id: groupId } = useParams();
  const { user } = useAuth();
  const { socket, joinGroupRoom, leaveGroupRoom } = useSocket();
  const navigate = useNavigate();

  const [groupData, setGroupData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState([]);

  // Edit Expense modal state
  const [editExpenseModalOpen, setEditExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  // Settle modal state
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settlePayer, setSettlePayer] = useState(null);
  const [settleRecipient, setSettleRecipient] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');

  useEffect(() => {
    loadGroupData();
    joinGroupRoom(groupId);

    if (socket) {
      const handleGroupUpdate = (data) => {
        console.log('⚡ Real-time group update received:', data);
        loadGroupData();
      };
      socket.on('group_updated', handleGroupUpdate);
      return () => {
        socket.off('group_updated', handleGroupUpdate);
        leaveGroupRoom(groupId);
      };
    }
  }, [groupId, socket]);

  const loadGroupData = async () => {
    setLoading(true);
    try {
      const gData = await fetchApi(`/groups/${groupId}`);
      const expData = await fetchApi(`/expenses/group/${groupId}`);
      const setlData = await fetchApi(`/settlements/group/${groupId}`);

      setGroupData(gData);
      setExpenses(expData);
      setSettlements(setlData);
    } catch (err) {
      console.error('Failed to load group details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = (exp) => {
    setExpenseToEdit(exp);
    setEditExpenseModalOpen(true);
  };

  const handleDeleteExpense = async (expId, title) => {
    if (!window.confirm(`Delete expense "${title}"? This will update group balances automatically.`)) return;
    try {
      await fetchApi(`/expenses/${expId}`, { method: 'DELETE' });
      loadGroupData();
    } catch (err) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const openSettleModal = (fromUser = null, toUser = null, amount = '') => {
    setSettlePayer(fromUser);
    setSettleRecipient(toUser);
    setSettleAmount(amount);
    setSettleModalOpen(true);
  };

  if (loading) return <LoadingSpinner />;
  if (!groupData) return <div style={{ padding: '2rem', textAlign: 'center' }}>Group not found.</div>;

  const { group, members = [], simplifiedDebts = [] } = groupData;
  const userMember = members.find(m => m.id === user?.id);
  const userNetBalance = userMember ? userMember.netBalance : 0;

  return (
    <div>
      {/* Group Banner Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)', color: 'white', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9, fontWeight: 600 }}>
              Group Dashboard
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.2rem' }}>{group.name}</h1>
            <p style={{ opacity: 0.9, fontSize: '0.95rem', marginTop: '0.25rem' }}>
              {group.description || `${members.length} members in this group`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => openSettleModal()}
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}
            >
              <ArrowRightLeft size={18} /> Settle Up
            </button>
            <button
              className="btn btn-primary"
              onClick={() => onOpenAddExpense(group.id)}
              style={{ background: 'white', color: '#0F766E' }}
            >
              <Plus size={18} /> Add Expense
            </button>
          </div>
        </div>

        {/* User's Net Position in this group */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Your Balance in this group:</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
            {userNetBalance === 0 ? '✨ Settled Up' : userNetBalance > 0 ? `You are owed ₹${userNetBalance.toLocaleString('en-IN')}` : `You owe ₹${Math.abs(userNetBalance).toLocaleString('en-IN')}`}
          </span>
        </div>
      </div>

      {/* Grid: Left column (Members & Debts), Right column (Expenses feed) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left Side: Members & Suggested Settlements */}
        <div>
          {/* Members Table Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">👥 Members & Balances</h3>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{members.length} members</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {members.map(m => {
                const isUser = m.id === user?.id;
                const bal = m.netBalance;
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: isUser ? '#F0FDF4' : '#F8FAFC',
                      borderRadius: '12px',
                      border: isUser ? '1px solid #BBF7D0' : '1px solid #F1F5F9'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar name={m.name} color={m.avatar_color} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          {isUser ? `You (${m.name})` : m.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Paid ₹{m.paid.toLocaleString('en-IN')} • Share ₹{m.share.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.95rem' }}>
                      {bal === 0 ? (
                        <span style={{ color: '#64748B', fontWeight: 500, fontSize: '0.85rem' }}>settled</span>
                      ) : bal > 0 ? (
                        <span className="text-positive">+₹{bal.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-negative">-₹{Math.abs(bal).toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Debt Simplification / Suggested Settlements Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">⚡ Suggested Settlements</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Min. transactions</span>
            </div>

            {simplifiedDebts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#059669', background: '#ECFDF5', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem' }}>
                🎉 Everyone in {group.name} is completely settled up!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {simplifiedDebts.map((d, idx) => {
                  const isYouPaying = d.fromUser.id === user?.id;
                  const isYouReceiving = d.toUser.id === user?.id;

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '0.85rem 1rem',
                        background: isYouPaying ? '#FEF2F2' : isYouReceiving ? '#ECFDF5' : '#F8FAFC',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>
                          <strong>{isYouPaying ? 'You' : d.fromUser.name}</strong> pays <strong>{isYouReceiving ? 'You' : d.toUser.name}</strong>
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isYouPaying ? '#DC2626' : isYouReceiving ? '#059669' : '#0F172A', marginTop: '0.1rem' }}>
                          ₹{d.amount.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openSettleModal(d.fromUser, d.toUser, d.amount)}
                        style={{ fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        Settle Up
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Settlement History */}
          {settlements.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📜 Settlement History</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {settlements.map(s => (
                  <div key={s.id} style={{ fontSize: '0.85rem', color: '#475569', padding: '0.5rem 0', borderBottom: '1px solid #F1F5F9' }}>
                    🟢 <strong>{s.from_name}</strong> paid ₹{s.amount.toLocaleString('en-IN')} to <strong>{s.to_name}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      {new Date(s.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Expense Feed Timeline */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🧾 Expense Timeline</h3>
              <button className="btn btn-primary btn-sm" onClick={() => onOpenAddExpense(group.id)}>
                <Plus size={16} /> Add Expense
              </button>
            </div>

            {expenses.length === 0 ? (
              <EmptyState
                type="expense"
                title="No expenses yet"
                message="Add your first shared expense for this group."
                actionLabel="+ Add Expense"
                onAction={() => onOpenAddExpense(group.id)}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {expenses.map(exp => (
                  <div
                    key={exp.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '1rem 1.25rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Avatar name={exp.paid_by_name} color={exp.paid_by_color} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
                            {exp.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                            Paid by <strong>{exp.paid_by === user?.id ? 'You' : exp.paid_by_name}</strong> • {new Date(exp.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F172A' }}>
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: exp.paid_by === user?.id ? '#059669' : '#DC2626' }}>
                          Your share: ₹{exp.userShare.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Action Toolbar: Edit, Delete, Settle Up */}
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Users size={14} />
                        <span>Split between {exp.splits.length} members ({exp.split_type})</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openSettleModal(null, null, exp.userShare > 0 ? exp.userShare : exp.amount)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: '#059669', borderColor: '#A7F3D0', background: '#ECFDF5' }}
                          title="Settle up this expense"
                        >
                          <CheckCircle size={13} /> Settle
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditExpense(exp)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          title="Edit expense"
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteExpense(exp.id, exp.title)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          title="Delete expense"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settle Up Modal */}
      <SettleUpModal
        isOpen={settleModalOpen}
        onClose={() => setSettleModalOpen(false)}
        group={{ id: group.id, name: group.name, members }}
        initialFromUser={settlePayer}
        initialToUser={settleRecipient}
        initialAmount={settleAmount}
        onSettled={loadGroupData}
      />

      {/* Edit Expense Modal */}
      <AddExpenseModal
        isOpen={editExpenseModalOpen}
        onClose={() => {
          setEditExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        defaultGroupId={group.id}
        expenseToEdit={expenseToEdit}
        onExpenseSaved={loadGroupData}
      />
    </div>
  );
};
