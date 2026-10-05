import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/Common/Avatar';
import { User, Lock } from 'lucide-react';

export const AuthPage = () => {
  const { login, signup, switchDemoUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoUsers = [
    { id: 1, name: 'Arya', color: '#0D9488' },
    { id: 2, name: 'Rahul', color: '#3B82F6' },
    { id: 3, name: 'Priya', color: '#EC4899' },
    { id: 4, name: 'Neha', color: '#8B5CF6' },
    { id: 5, name: 'Arjun', color: '#F59E0B' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(name, password);
      } else {
        await signup(name, '', '', password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    alert('Google OAuth Integration: In this demo environment, click any demo user profile below to log in instantly!');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '1.5rem' }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '56px', height: '56px', background: '#CCFBF1', color: '#0D9488', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', boxShadow: '0 4px 12px rgba(13,148,136,0.2)' }}>
            💸
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>SplitEase</h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Smart, simple, real-time expense sharing with friends.
          </p>
        </div>

        {/* Auth Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', textAlign: 'center' }}>
            {isLogin ? 'Log In to SplitEase' : 'Create an Account'}
          </h2>

          {error && (
            <div className="badge-negative" style={{ padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', display: 'block', fontSize: '0.85rem' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Arya, Rahul, Priya"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Processing...' : isLogin ? 'Log In' : 'Create Account'}
            </button>
          </form>

          {/* Social login divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0', color: '#94A3B8', fontSize: '0.8rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
            <span>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
          </div>

          {/* Google login button */}
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={handleGoogleClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Switch login/signup */}
          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#64748B' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#0D9488', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </div>

        {/* Quick Demo Login Switcher Card */}
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center', background: '#ECFDF5', borderColor: '#A7F3D0' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
            ⚡ QUICK DEMO LOG IN (1-CLICK)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {demoUsers.map(u => (
              <button
                key={u.id}
                onClick={() => switchDemoUser(u.id)}
                className="btn btn-secondary btn-sm"
                style={{ background: 'white', borderColor: '#6EE7B7' }}
              >
                <Avatar name={u.name} color={u.color} size="sm" />
                <span>{u.name}</span>
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#065F46', marginTop: '0.5rem' }}>
            (Pre-seeded password for all accounts: <code>password123</code>)
          </div>
        </div>
      </div>
    </div>
  );
};
