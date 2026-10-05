import React, { useState, useEffect } from 'react';
import { X, Check, Calculator, ArrowRight } from 'lucide-react';
import { Avatar } from '../Common/Avatar';
import { fetchApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const AddExpenseModal = ({ isOpen, onClose, defaultGroupId, expenseToEdit, onExpenseSaved }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(defaultGroupId || '');
  const [groupMembers, setGroupMembers] = useState([]);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(user?.id || '');
  const [splitType, setSplitType] = useState('equal'); // 'equal' | 'custom'

  // Selected members for split: { [userId]: boolean }
  const [selectedMembers, setSelectedMembers] = useState({});
  // Custom split amounts: { [userId]: string/number }
  const [customSplits, setCustomSplits] = useState({});

  // UI state
  const [step, setStep] = useState(1); // 1: Form, 2: Confirmation
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(expenseToEdit);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
      setStep(1);
      setError('');

      if (expenseToEdit) {
        setTitle(expenseToEdit.title || '');
        setAmount(expenseToEdit.amount || '');
        setPaidBy(expenseToEdit.paid_by || user?.id || '');
        setSplitType(expenseToEdit.split_type || 'equal');
        setSelectedGroupId(expenseToEdit.group_id);

        if (expenseToEdit.splits && expenseToEdit.splits.length > 0) {
          const sel = {};
          const cust = {};
          expenseToEdit.splits.forEach(s => {
            sel[s.user_id] = true;
            cust[s.user_id] = s.amount;
          });
          setSelectedMembers(sel);
          setCustomSplits(cust);
        }
      } else {
        setTitle('');
        setAmount('');
        setPaidBy(user?.id || '');
        setSplitType('equal');
      }
    }
  }, [isOpen, expenseToEdit]);

  useEffect(() => {
    if (user?.id && !paidBy && !expenseToEdit) {
      setPaidBy(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupMembers(selectedGroupId);
    }
  }, [selectedGroupId]);

  const loadGroups = async () => {
    try {
      const data = await fetchApi('/groups');
      setGroups(data);
      if (!selectedGroupId && data.length > 0 && !expenseToEdit) {
        setSelectedGroupId(defaultGroupId || data[0].id);
      }
    } catch (err) {
      console.error('Failed to load groups', err);
    }
  };

  const loadGroupMembers = async (gid) => {
    try {
      const data = await fetchApi(`/groups/${gid}`);
      const members = data.members || [];
      setGroupMembers(members);

      if (!expenseToEdit) {
        const initialSelected = {};
        const initialCustom = {};
        members.forEach(m => {
          initialSelected[m.id] = true;
          initialCustom[m.id] = '';
        });
        setSelectedMembers(initialSelected);
        setCustomSplits(initialCustom);
      }
    } catch (err) {
      console.error('Failed to load group members', err);
    }
  };

  const numAmount = parseFloat(amount) || 0;

  const selectedUserIds = Object.keys(selectedMembers).filter(id => selectedMembers[id]).map(Number);
  const selectedCount = selectedUserIds.length;
  const perPersonShare = selectedCount > 0 ? (numAmount / selectedCount).toFixed(2) : 0;

  const customTotal = Object.entries(customSplits).reduce((sum, [uid, val]) => {
    if (selectedMembers[uid]) {
      return sum + (parseFloat(val) || 0);
    }
    return sum;
  }, 0);

  const isCustomValid = Math.abs(customTotal - numAmount) < 0.05;

  const handleMemberToggle = (userId) => {
    setSelectedMembers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleCustomAmountChange = (userId, val) => {
    setCustomSplits(prev => ({
      ...prev,
      [userId]: val
    }));
  };

  const handleProceedToConfirm = (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('What did you spend on? (Description required)');
      return;
    }
    if (numAmount <= 0) {
      setError('Please enter a valid expense amount');
      return;
    }
    if (!paidBy) {
      setError('Please select who paid the expense');
      return;
    }
    if (selectedCount === 0) {
      setError('Select at least one member to share this expense');
      return;
    }

    if (splitType === 'custom' && !isCustomValid) {
      setError(`Custom amounts total ₹${customTotal.toLocaleString('en-IN')}, which must match the expense total ₹${numAmount.toLocaleString('en-IN')}`);
      return;
    }

    setStep(2);
  };

  const handleSubmitExpense = async () => {
    setSubmitting(true);
    setError('');

    try {
      const splitsPayload = {};
      if (splitType === 'custom') {
        selectedUserIds.forEach(uid => {
          splitsPayload[uid] = parseFloat(customSplits[uid]) || 0;
        });
      } else {
        selectedUserIds.forEach(uid => {
          splitsPayload[uid] = true;
        });
      }

      if (isEditing) {
        await fetchApi(`/expenses/${expenseToEdit.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: title.trim(),
            amount: numAmount,
            paid_by: paidBy,
            split_type: splitType,
            splits: splitsPayload
          })
        });
      } else {
        await fetchApi(`/expenses/group/${selectedGroupId}`, {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            amount: numAmount,
            paid_by: paidBy,
            split_type: splitType,
            splits: splitsPayload
          })
        });
      }

      setTitle('');
      setAmount('');
      setStep(1);
      onClose();
      if (onExpenseSaved) onExpenseSaved(selectedGroupId);
    } catch (err) {
      setError(err.message || 'Failed to save expense');
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const paidByMember = groupMembers.find(m => m.id === parseInt(paidBy));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isEditing ? '✏️ Edit Expense' : step === 1 ? '💸 Add an Expense' : '📋 Expense Summary'}
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleProceedToConfirm}>
            <div className="modal-body">
              {error && (
                <div className="badge-negative" style={{ padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'block', fontSize: '0.85rem' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Select Group */}
              <div className="form-group">
                <label className="form-label">Group</label>
                <select
                  className="form-control"
                  value={selectedGroupId}
                  disabled={isEditing}
                  onChange={e => setSelectedGroupId(e.target.value)}
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Title & Amount */}
              <div className="form-group">
                <label className="form-label">What did you spend on?</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dinner, Uber, Hotel, Groceries"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{ fontSize: '1.25rem', fontWeight: 700 }}
                />
              </div>

              {/* Paid By */}
              <div className="form-group">
                <label className="form-label">Paid by</label>
                <select
                  className="form-control"
                  value={paidBy}
                  onChange={e => setPaidBy(e.target.value)}
                >
                  {groupMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.id === user?.id ? `You (${m.name})` : m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Split Type Selector */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Split Between</label>
                  <div style={{ display: 'flex', gap: '0.25rem', background: '#F1F5F9', padding: '2px', borderRadius: '8px' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${splitType === 'equal' ? 'btn-primary' : ''}`}
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', background: splitType === 'equal' ? '' : 'transparent', color: splitType === 'equal' ? '' : '#64748B' }}
                      onClick={() => setSplitType('equal')}
                    >
                      Equal
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${splitType === 'custom' ? 'btn-primary' : ''}`}
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', background: splitType === 'custom' ? '' : 'transparent', color: splitType === 'custom' ? '' : '#64748B' }}
                      onClick={() => setSplitType('custom')}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                {/* Member checklist */}
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.5rem' }}>
                  {groupMembers.map(m => {
                    const isChecked = Boolean(selectedMembers[m.id]);
                    return (
                      <div key={m.id} className="split-member-row">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flex: 1 }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleMemberToggle(m.id)}
                            style={{ width: '18px', height: '18px', accentColor: '#0D9488' }}
                          />
                          <Avatar name={m.name} color={m.avatar_color} size="sm" />
                          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            {m.id === user?.id ? `You (${m.name})` : m.name}
                          </span>
                        </label>

                        {splitType === 'equal' ? (
                          <span style={{ fontSize: '0.85rem', color: isChecked ? '#0D9488' : '#94A3B8', fontWeight: 600 }}>
                            {isChecked ? `₹${perPersonShare}` : 'Excluded'}
                          </span>
                        ) : (
                          isChecked && (
                            <input
                              type="number"
                              className="form-control"
                              style={{ width: '90px', padding: '0.25rem 0.5rem', fontSize: '0.85rem', textAlign: 'right' }}
                              placeholder="₹0"
                              value={customSplits[m.id] || ''}
                              onChange={e => handleCustomAmountChange(m.id, e.target.value)}
                            />
                          )
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Split summary notice */}
                {splitType === 'equal' && selectedCount > 0 && numAmount > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#0D9488', fontWeight: 600 }}>
                    💡 ₹{numAmount.toLocaleString('en-IN')} ÷ {selectedCount} {selectedCount === 1 ? 'person' : 'people'} = ₹{perPersonShare} each.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Review & Confirm <ArrowRight size={16} />
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0D9488' }}>
                  ₹{numAmount.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '0.25rem' }}>
                  {title}
                </div>
                <div style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Paid by <strong style={{ color: '#0F172A' }}>{paidByMember?.name}</strong>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Split Breakdown ({splitType === 'equal' ? 'Equal' : 'Custom'})
                </div>
                {selectedUserIds.map(uid => {
                  const member = groupMembers.find(m => m.id === uid);
                  const share = splitType === 'equal' ? perPersonShare : customSplits[uid];
                  return (
                    <div key={uid} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.9rem' }}>
                      <span>{member?.name}</span>
                      <strong style={{ color: uid === parseInt(paidBy) ? '#059669' : '#0F172A' }}>
                        ₹{parseFloat(share).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} disabled={submitting}>
                Back
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSubmitExpense} disabled={submitting}>
                {submitting ? 'Saving...' : isEditing ? 'Update Expense' : 'Add Expense'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
