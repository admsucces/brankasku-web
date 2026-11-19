import React, { useState } from 'react';
import { panggilApiGas } from '../api/gasClient';

export default function SecurityGateModal({ namaMenu, onClose, onSukses, onSesiHabis }) {
  const [kodeRahasia, setKodeRahasia] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lockedTemp, setLockedTemp] = useState(false);

  const handleVerifikasi = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!kodeRahasia.trim()) {
      setErrorMsg('Masukkan Kode Rahasia terlebih dahulu.');
      return;
    }

    setLoading(true);
    const res = await panggilApiGas(
      'verifikasiKodeRahasia',
      { kodeRahasia: kodeRahasia.trim() },
      onSesiHabis
    );
    setLoading(false);

    if (!res.ok) {
      if (res.terkunciSementara) {
        setLockedTemp(true);
      }
      setErrorMsg(res.pesan || 'Kode Rahasia tidak valid.');
      setKodeRahasia('');
      return;
    }

    setKodeRahasia('');
    onSukses(res.data?.batasWaktuKunci);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="modal-card">
        <div className="modal-header">
          <h2 id="gate-title" className="modal-title">Verifikasi Kode Rahasia</h2>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Tutup
          </button>
        </div>

        <p style={{ marginTop: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
          Menu <strong>{namaMenu}</strong> memuat data sensitif. Masukkan <strong>Kode Rahasia</strong> Anda untuk membuka akses.
        </p>

        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        <form onSubmit={handleVerifikasi}>
          <div className="form-group">
            <label className="form-label" htmlFor="kode-rahasia-input">Kode Rahasia</label>
            <input
              id="kode-rahasia-input"
              type="password"
              className="form-input mono"
              style={{ fontSize: '16px', letterSpacing: '0.18em' }}
              placeholder="••••••"
              value={kodeRahasia}
              onChange={(e) => setKodeRahasia(e.target.value)}
              disabled={loading || lockedTemp}
              autoFocus
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || lockedTemp}
            >
              {loading ? 'Memeriksa...' : 'Buka Kunci'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}