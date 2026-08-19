import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

export const initials = (name = '') =>
  (name || '').trim().split(' ').filter(Boolean).slice(0, 2)
    .map(w => w[0].toUpperCase()).join('') || '?';

// ambil objek user dari response API (toleran berbagai bentuk response)
function extractUser(res) {
  const d = res?.data;
  return d?.data || d?.user || d || {};
}

// ekstrak pesan error dari response axios / Laravel
function extractApiMessage(e, fallback) {
  const d = e?.response?.data;
  if (!d) return fallback;
  // Laravel 422: { errors: { name: ['pesan'] } }
  const firstErr = d.errors && typeof d.errors === 'object'
    ? Object.values(d.errors).flat()[0]
    : null;
  if (firstErr) return firstErr;
  if (typeof d.message === 'string' && d.message) return d.message;
  return fallback;
}

/**
 * Hook profil: load nama dari /me, simpan nama & password via API.
 */
export function useProfile() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const timer = useRef(null);

  const notify = (msg, ok = true) => {
    setToast({ msg, ok });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 3200);
  };

  // LOAD nama dari database
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get('/me');
        const u = extractUser(res);
        if (active) setName(u.name || u.nama || '');
      } catch (e) {
        if (active) notify(extractApiMessage(e, 'Gagal memuat profil'), false);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // SIMPAN nama — endpoint: PUT /profile, body: { name }
  const saveName = async (newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed) { notify('Nama tidak boleh kosong', false); return false; }
    try {
      await api.put('/profile', { name: trimmed });
      setName(trimmed);
      notify('Nama berhasil diubah ✓');
      return true;
    } catch (e) {
      notify(extractApiMessage(e, 'Gagal mengubah nama'), false);
      return false;
    }
  };

  // GANTI kata sandi
  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    if (!currentPassword) { notify('Kata sandi lama wajib diisi', false); return false; }
    if (!newPassword) { notify('Kata sandi baru wajib diisi', false); return false; }
    if (newPassword.length < 6) { notify('Kata sandi baru minimal 6 karakter', false); return false; }
    if (newPassword !== confirmPassword) { notify('Konfirmasi kata sandi tidak cocok', false); return false; }
    try {
      await api.put('/profile/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      notify('Kata sandi berhasil diubah ✓');
      return true;
    } catch (e) {
      notify(extractApiMessage(e, 'Gagal mengubah kata sandi'), false);
      return false;
    }
  };

  return { name, loading, toast, notify, saveName, changePassword };
}

export function Avatar({ name, size = 84 }) {
  return (
    <div className="pf-avatar" style={{ width: size, height: size }}>
      <span>{initials(name)}</span>
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return <div className={'pf-toast' + (toast.ok ? '' : ' err')}>{toast.msg}</div>;
}