import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { fetchApi } from '../../api/client';
import { Avatar } from '../Common/Avatar';

export const SettleUpModal = ({ isOpen, onClose, group, initialFromUser, initialToUser, initialAmount, onSettled }) => {
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && group) {
      setFromUserId(initialFromUser ? initialFromUser.id : (group.members?.[0]?.id || ''));
      setToUserId(initialToUser ? initialToUser.id : (group.members?.[1]?.id || ''));
      setAmount(initialAmount ? String(initialAmount) : '');
      setError('');
    }
  }, [isOpen, group, initialFromUser, initialToUser, initialAmount]);

  if (!isOpen || !group) return null;

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid settlement amount');
      return;
    }

    if (!fromUserId || !toUserId || fromUserId === toUserId) {
      setError('Payer and recipient must be different members');
      return;
    }

    setLoading(true);

    try {
      await fetchApi(`/settlements/group/${group.id}`, {
        method: 'POST',
        body: JSON.stringify({
          from_user: fromUserId,
          to_user: toUserId,
          amount: numAmount
        })
      });

      onClose();
      if (onSettled) onSettled();
    } catch (err) {
      setError(err.message || 'Failed to record settlement');
    } finally {
      setLoading(false);
    }
  };

  const members = group.members || [];
  const fromMember = members.find(m => m.id === parseInt(fromUserId));
  const toMember = members.find(m => m.id === parseInt(toUserId));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">🤝 Settle Up Balance</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSettleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="badge-negative" style={{ padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'block', fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>RECORD A PAYMENT IN</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>{group.name}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', background: '#F8FAFC', padding: '1rem', borderRadius: '12px' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '0.25rem' }}>PAYER</div>
                <select
                  className="form-control"
                  style={{ textAlign: 'center', fontSize: '0.85rem' }}
                  value={fromUserId}
                  onChange={e => setFromUserId(e.target.value)}
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: '1.25rem' }}>➡️</div>

              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: '0.25rem' }}>RECIPIENT</div>
                <select
                  className="form-control"
                  style={{ textAlign: 'center', fontSize: '0.85rem' }}
                  value={toUserId}
                  onChange={e => setToUserId(e.target.value)}
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Settlement Amount (₹)</label>
              <input
                type="number"
                step="any"
                className="form-control"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}
                autoFocus
              />
            </div>

            {fromMember && toMember && amount && parseFloat(amount) > 0 && (
              <div style={{ textAlign: 'center', color: '#059669', background: '#ECFDF5', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                ✓ {fromMember.name} pays ₹{parseFloat(amount).toLocaleString('en-IN')} to {toMember.name}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
