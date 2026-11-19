import React, { useState, useEffect, useCallback } from 'react';
import { panggilApiGas } from '../api/gasClient';

const FORM_KOSONG = {
  ID: '',
  JudulCatatan: '',
  KategoriID: '',
  IsiRahasia: '',
  Keterangan: ''
};

export default function CatatanRahasiaPage({
  vaultUnlocked,
  onButuhKode,
  onKunciBrankas,
  onSesiHabis
}) {
  const [items, setItems] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [cari, setCari] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const [revealedIds, setRevealedIds] = useState({});
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(FORM_KOSONG);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [targetHapus, setTargetHapus] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const muatKategori = useCallback(async () => {
    const res = await panggilApiGas('getKategori', {}, onSesiHabis);
    if (res.ok && Array.isArray(res.data)) {
      setKategoriList(res.data);
    }
  }, [onSesiHabis]);

  const muatCatatan = useCallback(async () => {
    if (!vaultUnlocked) return;
    setLoading(true);
    setErrorMsg('');
    const res = await panggilApiGas('getCatatanRahasia', { cari }, onSesiHabis);
    setLoading(false);

    if (!res.ok) {
      if (res.butuhKodeRahasia) {
        onButuhKode();
        return;
      }
      setErrorMsg(res.pesan || 'Gagal memuat catatan rahasia.');
      return;
    }

    setItems(Array.isArray(res.data) ? res.data : []);
  }, [vaultUnlocked, cari, onButuhKode, onSesiHabis]);

  useEffect(() => {
    muatKategori();
  }, [muatKategori]);

  useEffect(() => {
    if (vaultUnlocked) {
      muatCatatan();
    } else {
      setItems([]);
      setRevealedIds({});
    }
  }, [vaultUnlocked, muatCatatan]);

  const toggleReveal = (id) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const bukaTambah = () => {
    setFormData({
      ...FORM_KOSONG,
      KategoriID: kategoriList[0]?.ID || ''
    });
    setFormError('');
    setFormOpen(true);
  };

  const bukaUbah = (row) => {
    setFormData({
      ID: row.ID,
      JudulCatatan: row.JudulCatatan || '',
      KategoriID: row.KategoriID || '',
      IsiRahasia: row.IsiRahasia || '',
      Keterangan: row.Keterangan || ''
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.JudulCatatan.trim() || !formData.IsiRahasia.trim()) {
      setFormError('JudulCatatan dan IsiRahasia wajib diisi.');
      return;
    }

    setSaving(true);
    const res = await panggilApiGas('simpanCatatanRahasia', formData, onSesiHabis);
    setSaving(false);

    if (!res.ok) {
      if (res.butuhKodeRahasia) {
        setFormOpen(false);
        onButuhKode();
        return;
      }
      setFormError(res.pesan || 'Gagal menyimpan catatan rahasia.');
      return;
    }

    setFormOpen(false);
    setInfoMsg(res.data?.pesan || 'Catatan rahasia tersimpan.');
    muatCatatan();
  };

  const handleKonfirmasiHapus = async () => {
    if (!targetHapus) return;
    setDeleting(true);
    const res = await panggilApiGas(
      'hapusCatatanRahasia',
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
      setErrorMsg(res.pesan || 'Gagal menghapus catatan.');
      setTargetHapus(null);
      return;
    }

    setTargetHapus(null);
    setInfoMsg(res.data?.pesan || 'Catatan rahasia dihapus.');
    muatCatatan();
  };

  if (!vaultUnlocked) {
    return (
      <div className="card state-box">
        <p style={{ marginTop: 0 }}>Brankas sedang terkunci. Verifikasi Kode Rahasia untuk melihat catatan rahasia.</p>
        <button type="button" className="btn btn-primary" onClick={onButuhKode}>
          Masukkan Kode Rahasia
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Daftar Catatan Rahasia</h2>
        <div className="action-group">
          <button type="button" className="btn btn-warning btn-sm" onClick={onKunciBrankas}>
            Kunci Sekarang
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={bukaTambah}>
            + Tambah Catatan
          </button>
        </div>
      </div>

      {infoMsg && <div className="alert alert-info">{infoMsg}</div>}
      {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

      <div className="toolbar">
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: '280px' }}
          placeholder="Cari judul atau keterangan..."
          value={cari}
          onChange={(e) => setCari(e.target.value)}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={muatCatatan}>
          Cari / Segarkan
        </button>
      </div>

      {loading ? (
        <div className="state-box">Memuat catatan rahasia...</div>
      ) : items.length === 0 ? (
        <div className="state-box">Belum ada catatan rahasia tersimpan.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>JudulCatatan</th>
                <th>Kategori</th>
                <th>IsiRahasia</th>
                <th>Keterangan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const isRevealed = Boolean(revealedIds[row.ID]);
                return (
                  <tr key={row.ID}>
                    <td><strong>{row.JudulCatatan}</strong></td>
                    <td><span className="badge badge-neutral">{row.NamaKategori}</span></td>
                    <td>
                      <div className="secret-cell">
                        <span className="secret-text">
                          {isRevealed ? row.IsiRahasia : '••••••••••••'}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleReveal(row.ID)}
                        >
                          {isRevealed ? 'Sembunyi' : 'Lihat'}
                        </button>
                      </div>
                    </td>
                    <td>{row.Keterangan || '-'}</td>
                    <td>
                      <div className="action-group">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => bukaUbah(row)}
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
                {formData.ID ? 'Ubah Catatan Rahasia' : 'Tambah Catatan Rahasia'}
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
                <label className="form-label" htmlFor="ctn-judul">JudulCatatan *</label>
                <input
                  id="ctn-judul"
                  type="text"
                  className="form-input"
                  value={formData.JudulCatatan}
                  onChange={(e) => setFormData({ ...formData, JudulCatatan: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ctn-kategori">Kategori</label>
                <select
                  id="ctn-kategori"
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
                <label className="form-label" htmlFor="ctn-isi">IsiRahasia *</label>
                <textarea
                  id="ctn-isi"
                  className="form-textarea mono"
                  value={formData.IsiRahasia}
                  onChange={(e) => setFormData({ ...formData, IsiRahasia: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ctn-ket">Keterangan</label>
                <input
                  id="ctn-ket"
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
              <h3 className="modal-title">Konfirmasi Hapus Catatan</h3>
            </div>
            <p style={{ marginTop: 0, fontSize: '13.5px' }}>
              Apakah Anda yakin ingin menghapus catatan <strong>{targetHapus.JudulCatatan}</strong>?
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