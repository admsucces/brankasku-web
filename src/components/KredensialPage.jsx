import React, { useState, useEffect, useCallback, useRef } from 'react';
import { panggilApiGas } from '../api/gasClient';

const FORM_KOSONG = {
  ID: '',
  NamaLayanan: '',
  KategoriID: '',
  UsernameAkun: '',
  EmailAkun: '',
  KataSandi: '',
  URL: '',
  Keterangan: ''
};

export default function KredensialPage({
  vaultUnlocked,
  onButuhKode,
  onKunciBrankas,
  onSesiHabis
}) {
  const [items, setItems] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [cari, setCari] = useState('');
  const [kategoriID, setKategoriID] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // ID baris yang sedang ditampilkan password-nya
  const [revealedIds, setRevealedIds] = useState({});
  const [copiedId, setCopiedId] = useState('');
  const clipboardTimerRef = useRef(null);

  // Modal Tambah / Ubah
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(FORM_KOSONG);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal Konfirmasi Hapus
  const [targetHapus, setTargetHapus] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const muatKategori = useCallback(async () => {
    const res = await panggilApiGas('getKategori', {}, onSesiHabis);
    if (res.ok && Array.isArray(res.data)) {
      setKategoriList(res.data);
    }
  }, [onSesiHabis]);

  const muatKredensial = useCallback(async () => {
    if (!vaultUnlocked) return;
    setLoading(true);
    setErrorMsg('');
    const res = await panggilApiGas(
      'getKredensial',
      { cari, kategoriID },
      onSesiHabis
    );
    setLoading(false);

    if (!res.ok) {
      if (res.butuhKodeRahasia) {
        onButuhKode();
        return;
      }
      setErrorMsg(res.pesan || 'Gagal memuat data kredensial.');
      return;
    }

    setItems(Array.isArray(res.data) ? res.data : []);
  }, [vaultUnlocked, cari, kategoriID, onButuhKode, onSesiHabis]);

  useEffect(() => {
    muatKategori();
  }, [muatKategori]);

  useEffect(() => {
    if (vaultUnlocked) {
      muatKredensial();
    } else {
      setItems([]);
      setRevealedIds({});
    }
  }, [vaultUnlocked, muatKredensial]);

  useEffect(() => {
    return () => {
      if (clipboardTimerRef.current) {
        clearTimeout(clipboardTimerRef.current);
      }
    };
  }, []);

  const toggleReveal = (id) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Salin ke clipboard dan bersihkan otomatis setelah 30 detik
  const handleSalin = async (id, teks, label) => {
    try {
      await navigator.clipboard.writeText(teks || '');
      setCopiedId(`${id}-${label}`);
      setInfoMsg(`${label} disalin ke clipboard (otomatis dibersihkan setelah 30 detik).`);

      if (clipboardTimerRef.current) {
        clearTimeout(clipboardTimerRef.current);
      }
      clipboardTimerRef.current = setTimeout(async () => {
        try {
          await navigator.clipboard.writeText('');
        } catch {
          // Abaikan jika browser membatasi penulisan ulang tanpa fokus
        }
        setCopiedId('');
      }, 30000);
    } catch {
      setErrorMsg('Browser tidak mengizinkan akses clipboard otomatis.');
    }
  };

  const bukaModalTambah = () => {
    setFormData({
      ...FORM_KOSONG,
      KategoriID: kategoriList[0]?.ID || ''
    });
    setFormError('');
    setFormOpen(true);
  };

  const bukaModalUbah = (row) => {
    setFormData({
      ID: row.ID,
      NamaLayanan: row.NamaLayanan || '',
      KategoriID: row.KategoriID || '',
      UsernameAkun: row.UsernameAkun || '',
      EmailAkun: row.EmailAkun || '',
      KataSandi: row.KataSandi || '',
      URL: row.URL || '',
      Keterangan: row.Keterangan || ''
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.NamaLayanan.trim() || !formData.KataSandi) {
      setFormError('Nama Layanan dan Kata Sandi wajib diisi.');
      return;
    }

    setSaving(true);
    const res = await panggilApiGas('simpanKredensial', formData, onSesiHabis);
    setSaving(false);

    if (!res.ok) {
      if (res.butuhKodeRahasia) {
        setFormOpen(false);
        onButuhKode();
        return;
      }
      setFormError(res.pesan || 'Gagal menyimpan kredensial.');
      return;
    }

    setFormOpen(false);
    setInfoMsg(res.data?.pesan || 'Data kredensial tersimpan.');
    muatKredensial();
  };

  const handleKonfirmasiHapus = async () => {
    if (!targetHapus) return;
    setDeleting(true);
    const res = await panggilApiGas(
      'hapusKredensial',
      { ID: targetHapus.ID },
      onSesiHabis
    );
    setDeleting(false);

    if (!res.ok) {
      if (res.butuhKodeRahasia) {
        setTargetHapus(null);
        onButuhKode();
        return;
      }
      setErrorMsg(res.pesan || 'Gagal menghapus kredensial.');
      setTargetHapus(null);
      return;
    }

    setTargetHapus(null);
    setInfoMsg(res.data?.pesan || 'Kredensial dihapus.');
    muatKredensial();
  };

  if (!vaultUnlocked) {
    return (
      <div className="card state-box">
        <p style={{ marginTop: 0 }}>Brankas sedang terkunci. Verifikasi Kode Rahasia untuk melihat data kredensial.</p>
        <button type="button" className="btn btn-primary" onClick={onButuhKode}>
          Masukkan Kode Rahasia
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Daftar Data Kredensial</h2>
        <div className="action-group">
          <button type="button" className="btn btn-warning btn-sm" onClick={onKunciBrankas}>
            Kunci Sekarang
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={bukaModalTambah}>
            + Tambah Data
          </button>
        </div>
      </div>

      {infoMsg && <div className="alert alert-info">{infoMsg}</div>}
      {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      <div className="toolbar">
        <div className="toolbar-filters">
          <input
            type="text"
            className="form-input"
            style={{ maxWidth: '260px' }}
            placeholder="Cari layanan, username, email..."
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
          <select
            className="form-select"
            style={{ maxWidth: '210px' }}
            value={kategoriID}
            onChange={(e) => setKategoriID(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            {kategoriList.map((k) => (
              <option key={k.ID} value={k.ID}>
                {k.NamaKategori}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={muatKredensial}>
          Cari / Segarkan
        </button>
      </div>

      {loading ? (
        <div className="state-box">Memuat data kredensial...</div>
      ) : items.length === 0 ? (
        <div className="state-box">Belum ada data kredensial yang sesuai filter.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>NamaLayanan</th>
                <th>Kategori</th>
                <th>UsernameAkun</th>
                <th>EmailAkun</th>
                <th>KataSandi</th>
                <th>URL</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const isRevealed = Boolean(revealedIds[row.ID]);
                return (
                  <tr key={row.ID}>
                    <td>
                      <strong>{row.NamaLayanan}</strong>
                      {row.Keterangan && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {row.Keterangan}
                        </div>
                      )}
                    </td>
                    <td><span className="badge badge-neutral">{row.NamaKategori}</span></td>
                    <td>
                      <div className="secret-cell">
                        <span className="mono">{row.UsernameAkun || '-'}</span>
                        {row.UsernameAkun && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleSalin(row.ID, row.UsernameAkun, 'UsernameAkun')}
                          >
                            {copiedId === `${row.ID}-UsernameAkun` ? 'Tersalin' : 'Salin'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>{row.EmailAkun || '-'}</td>
                    <td>
                      <div className="secret-cell">
                        <span className="secret-text">
                          {isRevealed ? row.KataSandi : '••••••••'}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleReveal(row.ID)}
                        >
                          {isRevealed ? 'Sembunyi' : 'Lihat'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleSalin(row.ID, row.KataSandi, 'KataSandi')}
                        >
                          {copiedId === `${row.ID}-KataSandi` ? 'Tersalin' : 'Salin'}
                        </button>
                      </div>
                    </td>
                    <td style={{ maxWidth: '160px', wordBreak: 'break-all', fontSize: '12.5px' }}>
                      {row.URL || '-'}
                    </td>
                    <td>
                      <div className="action-group">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => bukaModalUbah(row)}
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setTargetHapus(row)}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {formData.ID ? 'Ubah Data Kredensial' : 'Tambah Data Kredensial'}
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setFormOpen(false)}
              >
                Tutup
              </button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleSimpan}>
              <div className="form-group">
                <label className="form-label" htmlFor="krd-layanan">NamaLayanan *</label>
                <input
                  id="krd-layanan"
                  type="text"
                  className="form-input"
                  value={formData.NamaLayanan}
                  onChange={(e) => setFormData({ ...formData, NamaLayanan: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="krd-kategori">Kategori</label>
                <select
                  id="krd-kategori"
                  className="form-select"
                  value={formData.KategoriID}
                  onChange={(e) => setFormData({ ...formData, KategoriID: e.target.value })}
                >
                  <option value="">-- Pilih Kategori --</option>
                  {kategoriList.map((k) => (
                    <option key={k.ID} value={k.ID}>
                      {k.NamaKategori}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="krd-username">UsernameAkun</label>
                <input
                  id="krd-username"
                  type="text"
                  className="form-input mono"
                  value={formData.UsernameAkun}
                  onChange={(e) => setFormData({ ...formData, UsernameAkun: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="krd-email">EmailAkun</label>
                <input
                  id="krd-email"
                  type="email"
                  className="form-input"
                  value={formData.EmailAkun}
                  onChange={(e) => setFormData({ ...formData, EmailAkun: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="krd-sandi">KataSandi *</label>
                <input
                  id="krd-sandi"
                  type="text"
                  className="form-input mono"
                  value={formData.KataSandi}
                  onChange={(e) => setFormData({ ...formData, KataSandi: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="krd-url">URL</label>
                <input
                  id="krd-url"
                  type="text"
                  className="form-input"
                  placeholder="https://contoh.com"
                  value={formData.URL}
                  onChange={(e) => setFormData({ ...formData, URL: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="krd-ket">Keterangan</label>
                <input
                  id="krd-ket"
                  type="text"
                  className="form-input"
                  value={formData.Keterangan}
                  onChange={(e) => setFormData({ ...formData, Keterangan: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {targetHapus && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Konfirmasi Hapus Kredensial</h3>
            </div>
            <p style={{ marginTop: 0, fontSize: '13.5px' }}>
              Apakah Anda yakin ingin menghapus kredensial <strong>{targetHapus.NamaLayanan}</strong>?
            </p>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setTargetHapus(null)}
                disabled={deleting}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleKonfirmasiHapus}
                disabled={deleting}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}