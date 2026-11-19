import React, { useState, useEffect, useCallback } from 'react';
import { panggilApiGas } from '../api/gasClient';

export default function DashboardPage({ onSesiHabis }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const muatDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    const res = await panggilApiGas('getDashboard', {}, onSesiHabis);
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(res.pesan || 'Gagal memuat data dashboard.');
      return;
    }
    setData(res.data);
  }, [onSesiHabis]);

  useEffect(() => {
    muatDashboard();
  }, [muatDashboard]);

  if (loading) {
    return <div className="card state-box">Memuat ringkasan brankas...</div>;
  }

  if (errorMsg) {
    return (
      <div className="card">
        <div className="alert alert-error">{errorMsg}</div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={muatDashboard}>
          Coba Lagi
        </button>
      </div>
    );
  }

  const ringkasan = data?.ringkasan || {
    totalKredensial: 0,
    totalCatatan: 0,
    totalKategori: 0
  };
  const logTerbaru = data?.logTerbaru || [];

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Kredensial Tersimpan</div>
          <div className="stat-value">{ringkasan.totalKredensial}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Catatan Rahasia</div>
          <div className="stat-value">{ringkasan.totalCatatan}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Kategori</div>
          <div className="stat-value">{ringkasan.totalKategori}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Riwayat Aktivitas Akses Terakhir</h2>
          <button type="button" className="btn btn-secondary btn-sm" onClick={muatDashboard}>
            Segarkan
          </button>
        </div>

        {logTerbaru.length === 0 ? (
          <div className="state-box">Belum ada aktivitas akses tercatat.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Dibuat</th>
                  <th>Username</th>
                  <th>Aktivitas</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logTerbaru.map((log) => (
                  <tr key={log.ID}>
                    <td className="mono" style={{ fontSize: '12px' }}>{log.Dibuat}</td>
                    <td>{log.Username}</td>
                    <td>{log.Aktivitas}</td>
                    <td>
                      <span
                        className={`badge ${
                          log.Status === 'Berhasil' ? 'badge-success' : 'badge-danger'
                        }`}
                      >
                        {log.Status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}