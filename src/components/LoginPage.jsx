import React, { useState } from 'react';
import { panggilApiGas } from '../api/gasClient';

export default function LoginPage({ onLoginSukses, initialError = '' }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(initialError);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim() || !password) {
      setErrorMsg('Username dan password wajib diisi.');
      return;
    }

    setLoading(true);
    const res = await panggilApiGas('login', {
      username: username.trim(),
      password
    });
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(res.pesan || 'Login gagal.');
      return;
    }

    onLoginSukses(res.data);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div className="brand-badge">B</div>
          <div>
            <h1 className="page-title" style={{ fontSize: '18px' }}>BrankasKu</h1>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Masuk untuk mengakses brankas data rahasia
            </div>
          </div>
        </div>

        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              className="form-input"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input mono"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '6px' }}
            disabled={loading}
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Brankas'}
          </button>
        </form>
      </div>
    </div>
  );
}