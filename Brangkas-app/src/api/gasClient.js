const API_URL = import.meta.env.VITE_GAS_API_URL;
const TOKEN_KEY = 'brankasku_session_token';
const USER_KEY = 'brankasku_session_user';

export function simpanSesiLokal(token, user) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function ambilTokenLokal() {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

export function ambilUserLokal() {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function hapusSesiLokal() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

/**
 * Mengirim request ke Google Apps Script Web App menggunakan text/plain
 * agar terhindar dari preflight CORS yang tidak didukung Apps Script.
 */
export async function panggilApiGas(action, payload = {}, onSesiHabis = null) {
  if (!API_URL || API_URL.includes('GANTI_DENGAN_DEPLOYMENT_ID_ANDA')) {
    return {
      ok: false,
      pesan: 'URL API Google Apps Script (VITE_GAS_API_URL) belum diatur.'
    };
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action,
        token: ambilTokenLokal(),
        payload
      })
    });

    if (!response.ok) {
      return {
        ok: false,
        pesan: `Gagal menghubungi server (HTTP ${response.status}).`
      };
    }

    const result = await response.json();

    if (result && result.sesiHabis) {
      hapusSesiLokal();
      if (typeof onSesiHabis === 'function') {
        onSesiHabis(result.pesan || 'Sesi login telah berakhir.');
      }
    }

    return result;
  } catch (err) {
    return {
      ok: false,
      pesan: `Koneksi jaringan terganggu: ${err.message}`
    };
  }
}