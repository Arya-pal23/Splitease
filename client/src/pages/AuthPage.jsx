import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/Common/Avatar';

export const AuthPage = () => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(name);
      } else {
        await signup(name);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Try a different name.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '1.5rem' }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '60px', height: '60px', background: '#CCFBF1', color: '#0D9488', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', boxShadow: '0 4px 12px rgba(13,148,136,0.2)' }}>
            💸
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>SplitEase</h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Smart, simple expense sharing with friends.
          </p>
        </div>

        {/* Auth Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center', color: '#0F172A' }}>
            {isLogin ? '👋 Welcome back!' : '🚀 Create your account'}
          </h2>

          {error && (
            <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Your Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Arya, Rahul, Priya..."
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
                style={{ fontSize: '1rem', padding: '0.75rem 1rem' }}
              />
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.4rem' }}>
                {isLogin ? 'Enter the name you signed up with.' : 'Pick any name — no password needed!'}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || !name.trim()}
              style={{ marginTop: '1rem', padding: '0.85rem', fontSize: '1rem', fontWeight: 700 }}
            >
              {loading ? 'Please wait...' : isLogin ? 'Enter App →' : 'Create Account →'}
            </button>
          </form>

          {/* Switch */}
          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#64748B' }}>
            {isLogin ? "New here? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); setName(''); }}
              style={{ background: 'none', border: 'none', color: '#0D9488', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </div>

        {/* Tip */}
        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.78rem', color: '#94A3B8' }}>
          💡 Just enter your name — that's all you need to get started!
        </div>

      </div>
    </div>
  );
};
