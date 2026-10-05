import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/Common/Avatar';
import { LoadingSpinner, EmptyState } from '../components/Common/EmptyState';
import { Plus, Edit3, Trash2, CheckCircle, Users } from 'lucide-react';
import { AddExpenseModal } from '../components/Expenses/AddExpenseModal';
import { SettleUpModal } from '../components/Settle/SettleUpModal';

export const ExpensesPage = ({ onOpenAddExpense }) => {
  const { user } = useAuth();
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupsMap, setGroupsMap] = useState({});

  // Edit / Settle modal state
  const [editExpenseModalOpen, setEditExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedGroupForSettle, setSelectedGroupForSettle] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');

  useEffect(() => {
    loadAllExpenses();
  }, [user?.id]);

  const loadAllExpenses = async () => {
    setLoading(true);
    try {
      const groups = await fetchApi('/groups');
      const gMap = {};
      groups.forEach(g => { gMap[g.id] = g; });
      setGroupsMap(gMap);

      const expensePromises = groups.map(g =>
        fetchApi(`/expenses/group/${g.id}`).then(exps => exps.map(e => ({ ...e, groupName: g.name, group: g })))
      );
      const results = await Promise.all(expensePromises);
      const flattened = results.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAllExpenses(flattened);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = (exp) => {
    setExpenseToEdit(exp);
    setEditExpenseModalOpen(true);
  };

  const handleDeleteExpense = async (expId, title) => {
    if (!window.confirm(`Delete expense "${title}"? Group balances will update automatically.`)) return;
    try {
      await fetchApi(`/expenses/${expId}`, { method: 'DELETE' });
      loadAllExpenses();
    } catch (err) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const handleOpenSettle = async (exp) => {
    try {
      const gData = await fetchApi(`/groups/${exp.group_id}`);
      setSelectedGroupForSettle({ id: exp.group_id, name: exp.groupName, members: gData.members || [] });
      setSettleAmount(exp.userShare > 0 ? String(exp.userShare) : String(exp.amount));
      setSettleModalOpen(true);
    } catch (err) {
      console.error('Failed to load group details for settlement', err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>🧾 All Expenses</h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
            Complete history of expenses. You can edit, delete, or settle any expense.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => onOpenAddExpense()}>
          <Plus size={18} /> Add Expense
        </button>
      </div>

      {allExpenses.length === 0 ? (
        <EmptyState
          type="expense"
          title="No expenses recorded"
          message="Record your first shared expense."
          actionLabel="+ Add Expense"
          onAction={() => onOpenAddExpense()}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {allExpenses.map(exp => (
            <div
              key={`${exp.group_id}-${exp.id}`}
              style={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '1rem 1.25rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Avatar name={exp.paid_by_name} color={exp.paid_by_color} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>{exp.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      Paid by <strong>{exp.paid_by === user?.id ? 'You' : exp.paid_by_name}</strong> in <strong>{exp.groupName}</strong> • {new Date(exp.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F172A' }}>
                    ₹{exp.amount.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: exp.paid_by === user?.id ? '#059669' : '#DC2626' }}>
                    Your share: ₹{exp.userShare.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={14} />
                  <span>Split between {exp.splits.length} members ({exp.split_type})</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenSettle(exp)}
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

      {/* Edit Expense Modal */}
      <AddExpenseModal
        isOpen={editExpenseModalOpen}
        onClose={() => {
          setEditExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        defaultGroupId={expenseToEdit?.group_id}
        expenseToEdit={expenseToEdit}
        onExpenseSaved={loadAllExpenses}
      />

      {/* Settle Up Modal */}
      <SettleUpModal
        isOpen={settleModalOpen}
        onClose={() => setSettleModalOpen(false)}
        group={selectedGroupForSettle}
        initialAmount={settleAmount}
        onSettled={loadAllExpenses}
      />
    </div>
  );
};
