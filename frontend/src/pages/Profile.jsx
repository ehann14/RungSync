import { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { Avatar, Toast, useProfile } from '../components/ProfileBase';
import PageLoader from '../components/PageLoader';
import './profile.css';

const ROLE_LABEL = {
  admin: 'Admin Kurikulum',
  guru: 'Guru',
  siswa: 'Siswa',
};

// Validasi nama di client-side dulu agar tidak perlu bolak-balik ke backend
const validateName = (name) => {
  const trimmed = (name || '').trim();
  if (trimmed.length === 0) return 'Nama tidak boleh kosong.';
  if (trimmed.length < 2) return 'Nama minimal 2 karakter.';
  if (trimmed.length > 100) return 'Nama maksimal 100 karakter.';
  return null;
};

export default function Profile({ role = 'admin' }) {
  const { name, loading, toast, saveName, changePassword } = useProfile();

  // Gunakan nama dari hook sebagai nilai default
  const [nama, setNama] = useState('');
  const [namaError, setNamaError] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confPwd, setConfPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  // ===== Loading screen saat data profil dimuat dari API =====
  if (loading) {
    return <PageLoader text="Memuat profil…" />;
  }

  // Sinkronkan input nama saat data dari server berubah
  // (mis. setelah berhasil disimpan, hook useProfile akan update `name`)
  const displayName = nama === '' ? name : nama;

  const handleSaveName = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    
    const error = validateName(displayName);
    if (error) {
      setNamaError(error);
      return;
    }
    setNamaError('');
    
    setSavingName(true);
    try {
      const ok = await saveName(displayName.trim());
      if (ok) {
        // Setelah sukses, reset input kosong agar tampil nama baru dari server
        setNama('');
      }
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePwd = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setSavingPwd(true);
    try {
      const ok = await changePassword(curPwd, newPwd, confPwd);
      if (ok) { setCurPwd(''); setNewPwd(''); setConfPwd(''); }
    } finally {
      setSavingPwd(false);
    }
  };

  const handleNamaChange = (e) => {
    setNama(e.target.value);
    if (namaError) setNamaError(''); // hilangkan error saat user mengetik
  };

  return (
    <div className="pf-page">
      <div className="pf-wrap">

        {/* Kartu identitas singkat */}
        <section className="pf-card">
          <div className="pf-head">
            <Avatar name={displayName} />
            <div>
              <div className="pf-name">{displayName || '—'}</div>
              <div className="pf-role">{ROLE_LABEL[role] || 'Pengguna'}</div>
            </div>
          </div>
        </section>

        {/* Ganti Nama */}
        <section className="pf-card">
          <div className="pf-title">
            <User size={16} /> Ganti Nama
          </div>
          <p className="pf-desc">Nama ini yang tampil di seluruh aplikasi RungSync.</p>
          <form onSubmit={handleSaveName}>
            <div className="pf-row">
              <label className="pf-field">
                <span>Nama Lengkap</span>
                <input
                  value={displayName}
                  onChange={handleNamaChange}
                  placeholder="Masukkan nama baru"
                  autoComplete="name"
                  disabled={savingName}
                />
                {namaError && (
                  <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {namaError}
                  </span>
                )}
              </label>
              <button className="pf-btn primary" type="submit" disabled={savingName}>
                {savingName ? 'Menyimpan…' : 'Simpan Nama'}
              </button>
            </div>
          </form>
        </section>

        {/* Ganti Kata Sandi */}
        <section className="pf-card">
          <div className="pf-title">
            <Lock size={16} /> Ganti Kata Sandi
          </div>
          <p className="pf-desc">Gunakan minimal 6 karakter. Jangan bagikan kata sandi kamu ke siapa pun.</p>
          <form onSubmit={handleChangePwd}>
            <div className="pf-row" style={{ marginBottom: 10 }}>
              <label className="pf-field">
                <span>Kata Sandi Lama</span>
                <input 
                  type="password" 
                  value={curPwd} 
                  onChange={(e) => setCurPwd(e.target.value)} 
                  placeholder="••••••••" 
                  autoComplete="current-password"
                  disabled={savingPwd}
                />
              </label>
            </div>
            <div className="pf-row">
              <label className="pf-field">
                <span>Kata Sandi Baru</span>
                <input 
                  type="password" 
                  value={newPwd} 
                  onChange={(e) => setNewPwd(e.target.value)} 
                  placeholder="Minimal 6 karakter"
                  autoComplete="new-password"
                  disabled={savingPwd}
                />
              </label>
              <label className="pf-field">
                <span>Konfirmasi Kata Sandi</span>
                <input 
                  type="password" 
                  value={confPwd} 
                  onChange={(e) => setConfPwd(e.target.value)} 
                  placeholder="Ulangi kata sandi baru"
                  autoComplete="new-password"
                  disabled={savingPwd}
                />
              </label>
            </div>
            <div className="pf-row" style={{ marginTop: 14 }}>
              <button className="pf-btn primary" type="submit" disabled={savingPwd}>
                {savingPwd ? 'Memproses…' : 'Ubah Kata Sandi'}
              </button>
            </div>
          </form>
        </section>

      </div>

      <Toast toast={toast} />
    </div>
  );
}