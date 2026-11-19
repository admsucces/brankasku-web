import React, { useState, useEffect, useCallback } from 'react';
import {
  ambilTokenLokal,
  ambilUserLokal,
  simpanSesiLokal,
  hapusSesiLokal,
  panggilApiGas
} from './api/gasClient';
import LoginPage from './components/LoginPage';
import SecurityGateModal from './components/SecurityGateModal';
import DashboardPage from './components/DashboardPage';
import KredensialPage from './components/KredensialPage';
import CatatanRahasiaPage from './components/CatatanRahasiaPage';
import PengaturanKeamananPage from './components/PengaturanKeamananPage';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', requiresSecret: false },
  { id: 'kredensial', label: 'Data Kredensial', requiresSecret: true },
  { id: 'catatan', label: 'Catatan Rahasia', requiresSecret: true },
  { id: 'pengaturan', label: 'Kategori & Keamanan', requiresSecret: false }
];

export default function App() {
  const [token, setToken] = useState(() => ambilTokenLokal());
  const [user, setUser] = useState(() => ambilUserLokal());
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Status gerbang Kode Rahasia untuk menu sensitif (M3 & M4)
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingMenu, setPendingMenu] = useState(null);
  const [globalNotice, setGlobalNotice] = useState('');

  const handleSesiHabis = useCallback((pesan) => {
    hapusSesiLokal();
    setToken('');
    setUser(null);
    setVaultUnlocked(false);
    setGateOpen(false);
    setGlobalNotice(pesan || 'Sesi berakhir. Silakan login kembali.');
  }, []);

  const sinkronStatusBrankas = useCallback(async () => {
    if (!token) return;
    const res = await panggilApiGas('cekStatusBrankas', {}, handleSesiHabis);
    if (res.ok && res.data) {
      setVaultUnlocked(Boolean(res.data.terbuka));
    }
  }, [token, handleSesiHabis]);

  useEffect(() => {
    if (token) {
      sinkronStatusBrankas();
    }
  }, [token, sinkronStatusBrankas]);

  const handleLoginSukses = (data) => {
    simpanSesiLokal(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    setActiveMenu('dashboard');
    setVaultUnlocked(false);
    setGlobalNotice('');
  };

  const handleLogout = async () => {
    await panggilApiGas('logout', {}, handleSesiHabis);
    hapusSesiLokal();
    setToken('');
    setUser(null);
    setVaultUnlocked(false);
    setGateOpen(false);
    setMobileMenuOpen(false);
  };

  // Setiap masuk ke menu data rahasia (M3 atau M4) wajib melewati gerbang Kode Rahasia
  const handlePilihMenu = async (item) => {
    setMobileMenuOpen(false);
    if (item.requiresSecret) {
      const cek = await panggilApiGas('cekStatusBrankas', {}, handleSesiHabis);
      const terbuka = Boolean(cek.ok && cek.data && cek.data.terbuka);
      setVaultUnlocked(terbuka);
      if (!terbuka) {
        setPendingMenu(item.id);
        setGateOpen(true);
        return;
      }
    }
    setActiveMenu(item.id);
  };

  const handleVerifikasiSukses = (batasWaktuKunci) => {
    setVaultUnlocked(true);
    setGateOpen(false);
    if (batasWaktuKunci && user) {
      const updatedUser = { ...user, batasWaktuKunci };
      setUser(updatedUser);
      simpanSesiLokal(token, updatedUser);
    }
    if (pendingMenu) {
      setActiveMenu(pendingMenu);
      setPendingMenu(null);
    }
  };

  const handleKunciBrankas = async () => {
    const res = await panggilApiGas('kunciBrankas', {}, handleSesiHabis);
    if (res.ok) {
      setVaultUnlocked(false);
      if (activeMenu === 'kredensial' || activeMenu === 'catatan') {
        setPendingMenu(activeMenu);
        setGateOpen(true);
      }
    }
  };

  if (!token || !user) {
    return <LoginPage onLoginSukses={handleLoginSukses} initialError={globalNotice} />;
  }

  const currentMenuObj = MENU_ITEMS.find((m) => m.id === activeMenu) || MENU_ITEMS[0];

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <div className="drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div>
          <div className="brand-box">
            <div className="brand-badge">B</div>
            <div>
              <div className="brand-title">BrankasKu</div>
              <div className="brand-sub">Vault Keamanan Data</div>
            </div>
          </div>

          <nav className="nav-list" aria-label="Menu Utama">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-btn ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => handlePilihMenu(item)}
              >
                <span>{item.label}</span>
                {item.requiresSecret && (
                  <span className="lock-tag">
                    {vaultUnlocked ? 'Terbuka' : 'Kode'}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className={`vault-pill ${vaultUnlocked ? 'open' : 'locked'}`}>
            <span>Status Brankas</span>
            <span>{vaultUnlocked ? 'TERBUKA' : 'TERKUNCI'}</span>
          </div>

          {vaultUnlocked && (
            <button
              type="button"
              className="btn btn-warning btn-sm"
              onClick={handleKunciBrankas}
            >
              Kunci Brankas Sekarang
            </button>
          )}

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '2px 4px' }}>
            Login: <strong>{user.namaLengkap || user.username}</strong> ({user.role})
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Keluar (Logout)
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="menu-toggle-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              Menu
            </button>
            <h1 className="page-title">{currentMenuObj.label}</h1>
          </div>

          <div className="action-group">
            {currentMenuObj.requiresSecret && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setPendingMenu(activeMenu);
                  setGateOpen(true);
                }}
              >
                Verifikasi Ulang Kode
              </button>
            )}
          </div>
        </header>

        <main className="content-container">
          {activeMenu === 'dashboard' && (
            <DashboardPage onSesiHabis={handleSesiHabis} />
          )}

          {activeMenu === 'kredensial' && (
            <KredensialPage
              vaultUnlocked={vaultUnlocked}
              onButuhKode={() => {
                setPendingMenu('kredensial');
                setGateOpen(true);
              }}
              onKunciBrankas={handleKunciBrankas}
              onSesiHabis={handleSesiHabis}
            />
          )}

          {activeMenu === 'catatan' && (
            <CatatanRahasiaPage
              vaultUnlocked={vaultUnlocked}
              onButuhKode={() => {
                setPendingMenu('catatan');
                setGateOpen(true);
              }}
              onKunciBrankas={handleKunciBrankas}
              onSesiHabis={handleSesiHabis}
            />
          )}

          {activeMenu === 'pengaturan' && (
            <PengaturanKeamananPage
              user={user}
              onSesiHabis={handleSesiHabis}
              onKodeRahasiaDiubah={(batasBaru) => {
                setVaultUnlocked(false);
                if (user) {
                  const nextUser = { ...user, batasWaktuKunci: batasBaru };
                  setUser(nextUser);
                  simpanSesiLokal(token, nextUser);
                }
              }}
            />
          )}
        </main>
      </div>

      {gateOpen && (
        <SecurityGateModal
          namaMenu={
            pendingMenu === 'catatan' ? 'Catatan Rahasia' : 'Data Kredensial'
          }
          onClose={() => {
            setGateOpen(false);
            setPendingMenu(null);
          }}
          onSukses={handleVerifikasiSukses}
          onSesiHabis={handleSesiHabis}
        />
      )}
    </div>
  );
}