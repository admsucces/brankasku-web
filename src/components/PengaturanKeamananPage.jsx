import React, { useState, useEffect, useCallback } from 'react';
import { panggilApiGas } from '../api/gasClient';

export default function PengaturanKeamananPage({ user, onSesiHabis, onKodeRahasiaDiubah }) {
  // Master Kategori
  const [kategoriList, setKategoriList] = useState([]);
  const [katForm, setKatForm] = useState({ ID: '', NamaKategori: '', Deskripsi: '' });
  const [katSaving, setKatSaving] = useState(false);
  const [katMsg, setKatMsg] = useState('');
  const [katErr, setKatErr] = useState('');
  const [hapusKatTarget, setHapusKatTarget] = useState(null);

  // Pengaturan Kode Rahasia & Batas Waktu Kunci
  const [kodeLama, setKodeLama] = useState('');
  const [kodeBaru, setKodeBaru] = useState('');
  const [konfirmasiKode, setKonfirmasiKode] = useState('');
  const [batasWaktuKunci, setBatasWaktuKunci] = useState(user?.batasWaktuKunci || 5);
  const [kodeSaving, setKodeSaving] = useState(false);
  const [kodeMsg, setKodeMsg] = useState('');
  const [kodeErr, setKodeErr] = useState('');

  const muatKategori = useCallback(async () => {
    const res = await panggilApiGas('getKategori', {}, onSesiHabis);
    if (res.ok && Array.isArray(res.data)) {
      setKategoriList(res.data);
    }
  }, [onSesiHabis]);

  useEffect(() => {
    muatKategori();
  }, [muatKategori]);

  const handleSimpanKategori = async (e) => {
    e.preventDefault();
    setKatMsg('');
    setKatErr('');
    if (!katForm.NamaKategori.trim()) {
      setKatErr('NamaKategori wajib diisi.');
      return;
    }

    setKatSaving(true);
    const res = await panggilApiGas('simpanKategori', katForm, onSesiHabis);
    setKatSaving(false);

    if (!res.ok) {
      setKatErr(res.pesan || 'Gagal menyimpan kategori.');
      return;
    }

    setKatForm({ ID: '', NamaKategori: '', Deskripsi: '' });
    setKatMsg(res.data?.pesan || 'Kategori tersimpan.');
    muatKategori();
  };

  const handleHapusKategori = async () => {
    if (!hapusKatTarget) return;
    setKatMsg('');
    setKatErr('');
    const res = await panggilApiGas('hapusKategori', { ID: hapusKatTarget.ID }, onSesiHabis);
    setHapusKatTarget(null);

    if (!res.ok) {
      setKatErr(res.pesan || 'Gagal menghapus kategori.');
      return;
    }
    setKatMsg(res.data?.pesan || 'Kategori dihapus.');
    muatKategori();
  };

  const handleSimpanKodeRahasia = async (e) => {
    e.preventDefault();
    setKodeMsg('');
    setKodeErr('');

    if (!kodeLama.trim() || !kodeBaru.trim()) {
      setKodeErr('Kode Rahasia lama dan Kode Rahasia baru wajib diisi.');
      return;
    }
    if (kodeBaru.trim() !== konfirmasiKode.trim()) {
      setKodeErr('Konfirmasi Kode Rahasia baru tidak sama.');
      return;
    }
    if (kodeBaru.trim().length < 4) {
      setKodeErr('Kode Rahasia baru minimal 4 karakter/digit.');
      return;
    }

    setKodeSaving(true);
    const res = await panggilApiGas(
      'ubahKodeRahasia',
      {
        kodeLama: kodeLama.trim(),
        kodeBaru: kodeBaru.trim(),
        batasWaktuKunci: Number(batasWaktuKunci) || 5
      },
      onSesiHabis
    );
    setKodeSaving(false);

    if (!res.ok) {
      setKodeErr(res.pesan || 'Gagal memperbarui Kode Rahasia.');
      return;
    }

    setKodeLama('');
    setKodeBaru('');
    setKonfirmasiKode('');
    setKodeMsg(res.data?.pesan || 'Kode Rahasia berhasil diperbarui.');
    if (typeof onKodeRahasiaDiubah === 'function') {
      onKodeRahasiaDiubah(res.data?.batasWaktuKunci || Number(batasWaktuKunci) || 5);
    }
  };

  return (
    <div className="two-col-grid">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Master Kategori</h2>
          {katForm.ID && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setKatForm({ ID: '', NamaKategori: '', Deskripsi: '' })}
            >
              Batal Ubah
            </button>
          )}
        </div>

        {katMsg && <div className="alert alert-success">{katMsg}</div>}
        {katErr && <div className="alert alert-error">{katErr}</div>}

        <form onSubmit={handleSimpanKategori} style={{ marginBottom: '18px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="kat-nama">NamaKategori *</label>
            <input
              id="kat-nama"
              type="text"
              className="form-input"
              value={katForm.NamaKategori}
              onChange={(e) => setKatForm({ ...katForm, NamaKategori: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="kat-desk">Deskripsi</label>
            <input
              id="kat-desk"
              type="text"
              className="form-input"
              value={katForm.Deskripsi}
              onChange={(e) => setKatForm({ ...katForm, Deskripsi: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={katSaving}>
            {katSaving ? 'Menyimpan...' : katForm.ID ? 'Perbarui Kategori' : 'Tambah Kategori'}
          </button>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>NamaKategori</th>
                <th>Deskripsi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {kategoriList.map((k) => (
                <tr key={k.ID}>
                  <td><strong>{k.NamaKategori}</strong></td>
                  <td>{k.Deskripsi || '-'}</td>
                  <td>
                    <div className="action-group">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          setKatForm({
                            ID: k.ID,
                            NamaKategori: k.NamaKategori,
                            Deskripsi: k.Deskripsi || ''
                          })
                        }
                      >
                        Ubah
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setHapusKatTarget(k)}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Pengaturan Kode Rahasia</h2>
        </div>

        <p style={{ marginTop: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Kode Rahasia wajib dimasukkan setiap membuka menu data sensitif. Anda juga dapat mengatur durasi kunci otomatis sesi brankas.
        </p>

        {kodeMsg && <div className="alert alert-success">{kodeMsg}</div>}
        {kodeErr && <div className="alert alert-error">{kodeErr}</div>}

        <form onSubmit={handleSimpanKodeRahasia}>
          <div className="form-group">
            <label className="form-label" htmlFor="kode-lama">Kode Rahasia Lama *</label>
            <input
              id="kode-lama"
              type="password"
              className="form-input mono"
              value={kodeLama}
              onChange={(e) => setKodeLama(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="kode-baru">Kode Rahasia Baru *</label>
            <input
              id="kode-baru"
              type="password"
              className="form-input mono"
              value={kodeBaru}
              onChange={(e) => setKodeBaru(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="kode-konfirm">Konfirmasi Kode Rahasia Baru *</label>
            <input
              id="kode-konfirm"
              type="password"
              className="form-input mono"
              value={konfirmasiKode}
              onChange={(e) => setKonfirmasiKode(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="batas-kunci">BatasWaktuKunci (Menit)</label>
            <input
              id="batas-kunci"
              type="number"
              min="1"
              max="60"
              className="form-input mono"
              value={batasWaktuKunci}
              onChange={(e) => setBatasWaktuKunci(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={kodeSaving}>
            {kodeSaving ? 'Menyimpan...' : 'Simpan Pengaturan Keamanan'}
          </button>
        </form>
      </div>

      {hapusKatTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Konfirmasi Hapus Kategori</h3>
            </div>
            <p style={{ marginTop: 0, fontSize: '13.5px' }}>
              Hapus kategori <strong>{hapusKatTarget.NamaKategori}</strong>? Kategori yang masih dipakai data kredensial atau catatan tidak dapat dihapus.
            </p>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setHapusKatTarget(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleHapusKategori}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}