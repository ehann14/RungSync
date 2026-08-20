import { useCallback, useEffect, useState } from 'react';
import { X, AlertTriangle, Search } from 'lucide-react';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';

const emptyForm = { name: '', email: '', password: '', nip: '', subject_ids: [] };

/* ✅ FUNGSI GENERATE EMAIL YANG LEBIH PINTAR (VERSI FINAL) */
const generateEmailFromName = (name) => {
  if (!name || name.trim() === '') return '';

  // 1. Pecah nama menjadi array kata-kata
  let words = name.trim().split(/\s+/);

  // 2. Daftar gelar depan yang harus diabaikan
  const prefixTitles = ['dr.', 'dr', 'prof.', 'prof', 'ir.', 'ir', 'h.', 'h', 'hj.', 'hj', 'sdr.', 'sdri.', 'drg.', 'drg'];
  
  // 3. Hapus gelar di depan nama
  while (words.length > 0 && prefixTitles.includes(words[0].toLowerCase())) {
    words.shift();
  }

  // 4. Daftar gelar belakang yang harus diabaikan
  const suffixTitles = [
    's.pd', 's.pd.', 'm.pd', 'm.pd.', 
    's.kom', 's.kom.', 'm.kom', 'm.kom.', 
    's.t', 's.t.', 'm.t', 'm.t.', 
    's.e', 's.e.', 'm.m', 'm.m.',
    'dr.', 'ph.d', 'ph.d.'
  ];

  // 5. Hapus gelar di belakang nama
  while (words.length > 0 && suffixTitles.includes(words[words.length - 1].toLowerCase())) {
    words.pop();
  }

  // 6. Ambil maksimal 2 kata pertama dari nama yang sudah bersih
  const cleanNameWords = words.slice(0, 2);
  
  // ✅ 7. Hapus semua tanda baca (koma, titik, dll) dari setiap kata, gabungkan, huruf kecil
  const emailPrefix = cleanNameWords
    .map(word => word.replace(/[^a-zA-Z0-9]/g, '')) // Hapus semua karakter kecuali huruf & angka
    .join('')
    .toLowerCase();
  
  return `${emailPrefix}@rungsync.sch.id`;
};
function useAppTheme() {
  const detect = () => {
    const nodes = [document.documentElement, document.body];
    for (const el of nodes) {
      const attr = (el.getAttribute('data-theme') || '').toLowerCase();
      if (attr.includes('light')) return 'light';
      if (attr.includes('dark')) return 'dark';
      const cls = typeof el.className === 'string' ? el.className : '';
      if (/(^|\s)(light|light-mode|theme-light)(\s|$)/.test(cls)) return 'light';
      if (/(^|\s)(dark|dark-mode|theme-dark)(\s|$)/.test(cls)) return 'dark';
    }
    const stored = (localStorage.getItem('theme') || '').toLowerCase();
    if (stored.includes('light')) return 'light';
    if (stored.includes('dark')) return 'dark';
    return 'light';
  };
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    const update = () => setTheme(detect());
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'], subtree: true });
    window.addEventListener('storage', update);
    return () => { mo.disconnect(); window.removeEventListener('storage', update); };
  }, []);
  return theme;
}

const css = `
.rsx-page{padding:8px 4px;
--card:#0d1930;--card-border:#1c2b45;--text:#e2e8f0;--text-strong:#f1f5f9;
--muted:#64748b;--label:#94a3b8;--th-bg:#132340;--th-text:#8ab4f8;
--row-line:#16263f;--row-hover:rgba(37,99,235,.06);
--input-bg:#12203a;--input-border:#24344f;
--edit-bg:rgba(37,99,235,.15);--edit-text:#93c5fd;--edit-border:rgba(37,99,235,.4);
--overlay:rgba(2,6,23,.72);}
.rsx-page.rsx-light{--card:#ffffff;--card-border:#e2e8f0;--text:#334155;--text-strong:#0f172a;
--muted:#64748b;--label:#475569;--th-bg:#f1f5f9;--th-text:#1d4ed8;
--row-line:#e2e8f0;--row-hover:rgba(37,99,235,.05);
--input-bg:#ffffff;--input-border:#cbd5e1;
--edit-bg:rgba(37,99,235,.08);--edit-text:#1d4ed8;--edit-border:rgba(37,99,235,.35);
--overlay:rgba(15,23,42,.45);}
.rsx-page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px;}
.rsx-page-header h2{font-size:22px;font-weight:800;color:var(--text-strong);margin:0;}
.rsx-btn{border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:.2s;}
.rsx-btn-primary{background:linear-gradient(90deg,#2563eb,#06b6d4);color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.35);}
.rsx-btn-primary:hover{filter:brightness(1.1);}
.rsx-btn-primary:disabled{opacity:.6;cursor:wait;}
.rsx-btn-edit{background:var(--edit-bg);color:var(--edit-text);border:1px solid var(--edit-border);}
.rsx-btn-danger{background:linear-gradient(90deg,#f97316,#ef4444);color:#fff;}
.rsx-btn-warning{background:linear-gradient(90deg,#eab308,#f59e0b);color:#111;}
.rsx-btn-sm{padding:6px 11px;font-size:12px;border-radius:6px;margin-right:6px;}
.rsx-table-card{background:var(--card);border:1px solid var(--card-border);border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.08);}
.rsx-table-wrap{overflow-x:auto;}
.rsx-table{width:100%;border-collapse:collapse;}
.rsx-table th{background:var(--th-bg);color:var(--th-text);text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;}
.rsx-table td{padding:13px 16px;border-top:1px solid var(--row-line);color:var(--text);font-size:13.5px;}
.rsx-table tr:hover td{background:var(--row-hover);}
.rsx-empty{text-align:center;color:var(--muted);padding:24px 0 !important;}
.rsx-overlay{position:fixed;inset:0;background:var(--overlay);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;}
.rsx-modal{width:480px;max-width:100%;max-height:88vh;overflow:auto;background:var(--card);border:1px solid var(--card-border);border-radius:16px;padding:22px;}
.rsx-modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
.rsx-modal-header h3{color:var(--text-strong);font-size:17px;font-weight:700;margin:0;}
.rsx-close{background:transparent;border:none;color:var(--muted);cursor:pointer;display:flex;align-items:center;padding:4px;border-radius:6px;transition:.2s;}
.rsx-close:hover{background:rgba(100,116,139,.15);color:var(--text-strong);}
.rsx-form-group{margin-bottom:12px;}
.rsx-form-group label{display:block;font-size:12px;color:var(--label);margin-bottom:6px;font-weight:600;}
.rsx-input{width:100%;background:var(--input-bg);border:1px solid var(--input-border);color:var(--text);border-radius:8px;padding:9px 12px;font-size:13px;outline:none;}
.rsx-input:focus{border-color:#2563eb;}
.rsx-error{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.5);color:#fca5a5;border-radius:8px;padding:10px 12px;font-size:12.5px;margin-bottom:12px;}
.rsx-light .rsx-error{background:rgba(239,68,68,.08);color:#b91c1c;}
.rsx-chips{display:flex;flex-wrap:wrap;gap:6px;}
.rsx-chip-btn{border:1px solid var(--input-border);background:var(--input-bg);color:var(--text);
border-radius:999px;padding:6px 13px;font-size:11.5px;font-weight:700;cursor:pointer;transition:.15s;}
.rsx-chip-btn:hover:not(:disabled){border-color:#2563eb;color:#2563eb;}
.rsx-chip-btn.on{background:linear-gradient(90deg,#2563eb,#06b6d4);border-color:transparent;color:#fff;}
.rsx-chip-btn:disabled{opacity:.4;cursor:not-allowed;}
.rsx-reset-modal{width:420px;max-width:100%;background:var(--card);border:1px solid var(--card-border);border-radius:16px;padding:24px;text-align:center;}
.rsx-reset-modal h3{color:var(--text-strong);font-size:17px;font-weight:700;margin:0 0 6px;}
.rsx-reset-modal .rsx-reset-sub{color:var(--label);font-size:12px;margin:0 0 14px;}
.rsx-reset-password{font-family:monospace;font-size:26px;letter-spacing:3px;background:var(--input-bg);border:1px dashed #2563eb;color:#22d3ee;padding:16px;border-radius:10px;margin:0 0 12px;user-select:all;}
.rsx-reset-note{color:var(--muted);font-size:11px;margin:0 0 16px;}
.rsx-reset-actions{display:flex;gap:10px;}
.rsx-reset-actions .rsx-btn{flex:1;}

/* ✅ FITUR PENCARIAN */
.rsx-search-bar{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
.rsx-search-wrap{position:relative;flex:1;min-width:240px;}
.rsx-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none;}
.rsx-search-input{width:100%;background:var(--input-bg);border:1px solid var(--input-border);color:var(--text);
border-radius:10px;padding:10px 36px 10px 38px;font-size:13px;outline:none;transition:.2s;}
.rsx-search-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.15);}
.rsx-search-input::placeholder{color:var(--muted);}
.rsx-search-clear{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:transparent;
border:none;color:var(--muted);cursor:pointer;display:flex;align-items:center;padding:4px;border-radius:6px;transition:.2s;}
.rsx-search-clear:hover{color:var(--text-strong);background:rgba(100,116,139,.15);}
.rsx-search-count{font-size:12px;color:var(--muted);white-space:nowrap;}
.rsx-search-count b{color:var(--text-strong);}
`;

export default function Teachers() {
  const theme = useAppTheme();
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [resetInfo, setResetInfo] = useState(null);
  const [resetting, setResetting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([api.get('/admin/teachers'), api.get('/admin/subjects')]);
      setTeachers(t.data.data || t.data);
      setSubjects(s.data.data || s.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader text="Memuat data guru…" />;

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setModalOpen(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.user?.name || '', email: t.user?.email || '', password: '',
      nip: t.nip || '',
      subject_ids: t.subjects?.length
        ? t.subjects.map((s) => s.id)
        : (t.subject_id ? [t.subject_id] : []),
    });
    setError(''); setModalOpen(true);
  };

  const toggleSubject = (id) => {
    setForm((f) => {
      const has = f.subject_ids.includes(id);
      if (!has && f.subject_ids.length >= 3) return f;
      return { ...f, subject_ids: has ? f.subject_ids.filter((x) => x !== id) : [...f.subject_ids, id] };
    });
  };

  /* ✅ Handler Nama: Auto generate email saat mengetik */
  const handleNameChange = (e) => {
    const newName = e.target.value;
    const newEmail = generateEmailFromName(newName);
    setForm({ ...form, name: newName, email: newEmail });
  };

  /* ✅ Handler Email: Tetap bisa diedit manual jika perlu */
  const handleEmailChange = (e) => {
    setForm({ ...form, email: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { setError('Nama dan email wajib diisi.'); return; }
    if (!editing && form.password && form.password.length < 8) { setError('Password minimal 8 karakter.'); return; }
    setSaving(true); setError('');
    const payload = {
      name: form.name, email: form.email, nip: form.nip,
      subject_ids: form.subject_ids,
      subject_id: form.subject_ids[0] ?? null,
    };
    if (form.password) payload.password = form.password;
    try {
      if (editing) await api.put(`/admin/teachers/${editing.id}`, payload);
      else await api.post('/admin/teachers', payload);
      setModalOpen(false); load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Gagal menyimpan.'));
    } finally { setSaving(false); }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Hapus guru ${t.user?.name}?`)) return;
    try { await api.delete(`/admin/teachers/${t.id}`); load(); }
    catch { alert('Gagal menghapus guru.'); }
  };

  const handleResetPassword = async (t) => {
    if (!window.confirm(`Reset password untuk ${t.user?.name}?\nPassword lama tidak akan berlaku lagi.`)) return;
    setResetting(true);
    try {
      const res = await api.post(`/admin/teachers/${t.id}/reset-password`);
      setResetInfo(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal reset password.');
    } finally { setResetting(false); }
  };

  const copyPassword = async () => {
    if (!resetInfo?.password) return;
    try {
      await navigator.clipboard.writeText(resetInfo.password);
      alert('Password berhasil disalin!');
    } catch {
      window.prompt('Salin password ini secara manual:', resetInfo.password);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (t.user?.name || '').toLowerCase();
    const email = (t.user?.email || '').toLowerCase();
    const nip = (t.nip || '').toLowerCase();
    return name.includes(q) || email.includes(q) || nip.includes(q);
  });

  return (
    <div className={`rsx-page ${theme === 'light' ? 'rsx-light' : ''}`}>
      <style>{css}</style>

      <div className="rsx-page-header">
        <h2>Manajemen Guru</h2>
        <button className="rsx-btn rsx-btn-primary" onClick={openCreate}>+ Tambah Guru</button>
      </div>

      <div className="rsx-search-bar">
        <div className="rsx-search-wrap">
          <Search size={16} className="rsx-search-icon" />
          <input
            className="rsx-search-input"
            type="text"
            placeholder="Cari guru berdasarkan nama, email, atau NIP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="rsx-search-clear" onClick={() => setSearchQuery('')} title="Hapus pencarian">
              <X size={16} />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="rsx-search-count">
            Ditemukan <b>{filteredTeachers.length}</b> dari <b>{teachers.length}</b> guru
          </div>
        )}
      </div>

      <div className="rsx-table-card">
        <div className="rsx-table-wrap">
          <table className="rsx-table">
            <thead>
              <tr><th>Nama</th><th>Email</th><th>NIP</th><th>Tugas Mapel (maks 3)</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {filteredTeachers.length === 0 ? (
                <tr><td className="rsx-empty" colSpan="5">
                  {searchQuery ? `Tidak ada guru yang cocok dengan "${searchQuery}".` : 'Tidak ada guru.'}
                </td></tr>
              ) : (
                filteredTeachers.map((t) => (
                  <tr key={t.id}>
                    <td>{t.user?.name}</td>
                    <td>{t.user?.email}</td>
                    <td>{t.nip || '-'}</td>
                    <td>
                      {t.subjects?.length
                        ? t.subjects.map((s) => s.name).join(', ')
                        : (t.subject?.name || <em>belum ada</em>)}
                    </td>
                    <td>
                      <button className="rsx-btn rsx-btn-edit rsx-btn-sm" onClick={() => openEdit(t)}>Edit</button>
                      <button className="rsx-btn rsx-btn-warning rsx-btn-sm" onClick={() => handleResetPassword(t)} disabled={resetting}>
                        Reset Password
                      </button>
                      <button className="rsx-btn rsx-btn-danger rsx-btn-sm" onClick={() => handleDelete(t)}>Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="rsx-overlay" onMouseDown={() => setModalOpen(false)}>
          <div className="rsx-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="rsx-modal-header">
              <h3>{editing ? 'Edit Guru' : 'Tambah Guru'}</h3>
              <button className="rsx-close" onClick={() => setModalOpen(false)} type="button"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="rsx-form-group">
                <label>Nama</label>
                <input 
                  className="rsx-input" 
                  value={form.name} 
                  onChange={handleNameChange}
                  placeholder="Contoh: Dr. Muhamad Ferhan Pratama S.Pd"
                />
              </div>
              <div className="rsx-form-group">
                <label>Email</label>
                <input 
                  className="rsx-input" 
                  type="email" 
                  value={form.email} 
                  onChange={handleEmailChange}
                  placeholder="auto-generated@rungsync.sch.id"
                />
              </div>
              {!editing && (
                <div className="rsx-form-group">
                  <label>Password (kosongkan = default guru12345)</label>
                  <input className="rsx-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              )}
              <div className="rsx-form-group">
                <label>NIP</label>
                <input className="rsx-input" value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} />
              </div>

              <div className="rsx-form-group">
                <label>Keahlian Mapel — {form.subject_ids.length}/3 terpilih</label>
                <div className="rsx-chips">
                  {subjects.map((s) => {
                    const on = form.subject_ids.includes(s.id);
                    const disabled = !on && form.subject_ids.length >= 3;
                    return (
                      <button
                        type="button"
                        key={s.id}
                        disabled={disabled}
                        className={`rsx-chip-btn ${on ? 'on' : ''}`}
                        onClick={() => toggleSubject(s.id)}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && <div className="rsx-error">{error}</div>}

              <button className="rsx-btn rsx-btn-primary" type="submit" disabled={saving}>
                {saving ? 'Menyimpan…' : 'Simpan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {resetInfo && (
        <div className="rsx-overlay">
          <div className="rsx-reset-modal">
            <h3>Password Baru: {resetInfo.name}</h3>
            <p className="rsx-reset-sub">Beritahukan password ini kepada guru bersangkutan:</p>
            <div className="rsx-reset-password">{resetInfo.password}</div>
            <p className="rsx-reset-note">
              <AlertTriangle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
              Password lama sudah tidak berlaku. Setelah modal ini ditutup,
              password tidak dapat dilihat lagi — admin hanya bisa me-reset ulang.
            </p>
            <div className="rsx-reset-actions">
              <button className="rsx-btn rsx-btn-primary" onClick={copyPassword}>Salin</button>
              <button className="rsx-btn rsx-btn-danger" onClick={() => setResetInfo(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}