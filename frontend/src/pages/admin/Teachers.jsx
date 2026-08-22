import { useCallback, useEffect, useState } from 'react';
import { X, AlertTriangle, Search, UserPlus, Filter, BookOpen } from 'lucide-react';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';

/* ==========================================================================
   HELPER FUNCTIONS & HOOKS
   ========================================================================== */

const generateEmailFromName = (name) => {
  if (!name || name.trim() === '') return '';
  let words = name.trim().split(/\s+/);
  const prefixTitles = ['dr.', 'dr', 'prof.', 'prof', 'ir.', 'ir', 'h.', 'h', 'hj.', 'hj', 'sdr.', 'sdri.', 'drg.', 'drg'];
  const suffixTitles = ['s.pd', 's.pd.', 'm.pd', 'm.pd.', 's.kom', 's.kom.', 'm.kom', 'm.kom.', 's.t', 's.t.', 'm.t', 'm.t.', 's.e', 's.e.', 'm.m', 'm.m.', 'dr.', 'ph.d', 'ph.d.'];
  while (words.length > 0 && prefixTitles.includes(words[0].toLowerCase())) words.shift();
  while (words.length > 0 && suffixTitles.includes(words[words.length - 1].toLowerCase())) words.pop();
  return words.slice(0, 2).map((word) => word.replace(/[^a-zA-Z0-9]/g, '')).join('').toLowerCase() + '@rungsync.sch.id';
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
    return stored.includes('dark') ? 'dark' : 'light';
  };
  
  const [theme, setTheme] = useState(detect);
  useEffect(() => {
    const update = () => setTheme(detect());
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'], subtree: true });
    window.addEventListener('storage', update);
    return () => { 
      mo.disconnect(); 
      window.removeEventListener('storage', update); 
    };
  }, []);
  return theme;
}

/* ==========================================================================
   KOMPONEN UTAMA
   ========================================================================== */

const emptyForm = { name: '', email: '', password: '', nip: '', subject_ids: [] };

export default function Teachers() {
  const theme = useAppTheme();
  
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [resetInfo, setResetInfo] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBySubject, setGroupBySubject] = useState(''); 
  const [viewMode, setViewMode] = useState('list'); 

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([api.get('/admin/teachers'), api.get('/admin/subjects')]);
      setTeachers(t.data?.data || t.data || []);
      setSubjects(s.data?.data || s.data || []);
    } catch {
      setError('Gagal memuat data. Silakan muat ulang halaman.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.user?.name || '',
      email: t.user?.email || '',
      password: '',
      nip: t.nip || '',
      subject_ids: t.subjects?.length ? t.subjects.map((s) => s.id) : (t.subject_id ? [t.subject_id] : []),
    });
    setError('');
    setModalOpen(true);
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    const newEmail = generateEmailFromName(newName);
    setForm((prev) => ({ ...prev, name: newName, email: newEmail }));
  };

  const handleEmailChange = (e) => {
    setForm((prev) => ({ ...prev, email: e.target.value }));
  };

  const toggleSubject = (id) => {
    setForm((prev) => {
      const has = prev.subject_ids.includes(id);
      if (!has && prev.subject_ids.length >= 3) return prev;
      return {
        ...prev,
        subject_ids: has ? prev.subject_ids.filter((x) => x !== id) : [...prev.subject_ids, id],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setError('Nama dan email wajib diisi.');
      return;
    }
    if (!editing && form.password && form.password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setSaving(true);
    setError('');
    
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      nip: form.nip.trim(),
      subject_ids: form.subject_ids,
      subject_id: form.subject_ids[0] ?? null,
    };
    if (!editing && form.password) payload.password = form.password;

    try {
      if (editing) {
        await api.put(`/admin/teachers/${editing.id}`, payload);
      } else {
        await api.post('/admin/teachers', payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Gagal menyimpan data.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Yakin ingin menghapus guru "${t.user?.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.delete(`/admin/teachers/${t.id}`);
      load();
    } catch {
      alert('Gagal menghapus guru.');
    }
  };

  const handleResetPassword = async (t) => {
    if (!window.confirm(`Reset password untuk "${t.user?.name}"?\nPassword lama akan hangus.`)) return;
    setResetting(true);
    try {
      const res = await api.post(`/admin/teachers/${t.id}/reset-password`);
      setResetInfo(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal reset password.');
    } finally {
      setResetting(false);
    }
  };

  const copyPassword = async () => {
    if (!resetInfo?.password) return;
    try {
      await navigator.clipboard.writeText(resetInfo.password);
      alert('Password berhasil disalin ke clipboard!');
    } catch {
      window.prompt('Salin password ini secara manual:', resetInfo.password);
    }
  };

  /* ==========================================================================
     ✅ PERBAIKAN LOGIKA FILTER
     1. Menggunakan String() agar pencocokan ID (number vs string) berhasil
     2. groupedData sekarang juga menghormati searchQuery
     ========================================================================== */
  const filteredTeachers = teachers.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (t.user?.name || '').toLowerCase();
    const email = (t.user?.email || '').toLowerCase();
    const nip = (t.nip || '').toLowerCase();
    return name.includes(q) || email.includes(q) || nip.includes(q);
  });

  const teachersBySubject = groupBySubject
    ? filteredTeachers.filter((t) => {
        const teacherSubjects = t.subjects?.map((s) => String(s.id)) || [];
        return teacherSubjects.includes(String(groupBySubject));
      })
    : filteredTeachers;

  const groupedData = subjects
    .map((subj) => ({
      subject: subj,
      teachers: filteredTeachers.filter((t) => {
        const teacherSubjects = t.subjects?.map((s) => String(s.id)) || [];
        return teacherSubjects.includes(String(subj.id));
      }),
    }))
    .filter((group) => group.teachers.length > 0);

  if (loading) return <PageLoader text="Memuat data guru…" />;

  return (
    <div className={`rsx-page ${theme === 'light' ? 'rsx-light' : ''}`}>
      <style>{css}</style>

      <div className="rsx-page-header">
        <h2>Manajemen Guru</h2>
        <button className="rsx-btn rsx-btn-primary" onClick={openCreate}>
          <UserPlus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Tambah Guru
        </button>
      </div>

      <div className="rsx-filter-bar">
        <div className="rsx-search-wrap">
          <Search size={16} className="rsx-search-icon" />
          <input
            className="rsx-search-input"
            type="text"
            placeholder="Cari berdasarkan nama, email, atau NIP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="rsx-search-clear" onClick={() => setSearchQuery('')} title="Hapus pencarian">
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="rsx-filter-controls">
          <select
            className="rsx-select"
            value={groupBySubject}
            onChange={(e) => setGroupBySubject(e.target.value)}
            title="Filter berdasarkan mata pelajaran"
          >
            <option value="">Semua Mata Pelajaran</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          
          <button
            className={`rsx-btn rsx-btn-ghost ${viewMode === 'group' ? 'active' : ''}`}
            onClick={() => setViewMode(viewMode === 'list' ? 'group' : 'list')}
            title={viewMode === 'list' ? 'Lihat per kelompok mapel' : 'Lihat daftar semua guru'}
          >
            {viewMode === 'list' ? <BookOpen size={16} /> : <Filter size={16} />}
            {viewMode === 'list' ? 'Kelompokkan' : 'Daftar'}
          </button>
        </div>
      </div>

      {groupBySubject && (
        <div className="rsx-active-filter">
          Filter: <b>{subjects.find((s) => String(s.id) === String(groupBySubject))?.name || '-'}</b>
          <button onClick={() => setGroupBySubject('')} className="rsx-clear-filter"><X size={14} /></button>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="rsx-table-card">
          <div className="rsx-table-wrap">
            <table className="rsx-table">
              <thead>
                <tr>
                  <th>Nama Lengkap</th>
                  <th>Email</th>
                  <th>NIP</th>
                  <th>Tugas Mapel (Maks 3)</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {teachersBySubject.length === 0 ? (
                  <tr>
                    <td className="rsx-empty" colSpan="5">
                      {searchQuery || groupBySubject ? 'Tidak ada guru yang cocok dengan filter.' : 'Belum ada data guru.'}
                    </td>
                  </tr>
                ) : (
                  teachersBySubject.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.user?.name}</td>
                      <td>{t.user?.email}</td>
                      <td>{t.nip || '-'}</td>
                      <td>
                        {t.subjects?.length ? (
                          t.subjects.map((s) => s.name).join(', ')
                        ) : (
                          <em style={{ color: 'var(--muted)' }}>belum ada</em>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button className="rsx-btn rsx-btn-edit rsx-btn-sm" onClick={() => openEdit(t)}>Edit</button>
                        <button className="rsx-btn rsx-btn-warning rsx-btn-sm" onClick={() => handleResetPassword(t)} disabled={resetting}>Reset</button>
                        <button className="rsx-btn rsx-btn-danger rsx-btn-sm" onClick={() => handleDelete(t)}>Hapus</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'group' && (
        <div className="rsx-grouped-view">
          {groupedData.length === 0 ? (
            <div className="rsx-empty-state">
              <BookOpen size={48} style={{ color: 'var(--muted)', marginBottom: 12 }} />
              <p>Belum ada data guru yang cocok dengan filter pencarian atau belum memiliki mata pelajaran.</p>
            </div>
          ) : (
            groupedData.map((group) => (
              <div key={group.subject.id} className="rsx-group-card">
                <div className="rsx-group-header">
                  <BookOpen size={18} />
                  <h3>{group.subject.name}</h3>
                  <span className="rsx-group-count">{group.teachers.length} guru</span>
                </div>
                <div className="rsx-group-list">
                  {group.teachers.map((t) => (
                    <div key={t.id} className="rsx-group-item">
                      <div className="rsx-group-item-info">
                        <div className="rsx-group-item-name">{t.user?.name}</div>
                        <div className="rsx-group-item-meta">{t.user?.email} {t.nip && `• ${t.nip}`}</div>
                      </div>
                      <div className="rsx-group-item-actions">
                        <button className="rsx-btn rsx-btn-edit rsx-btn-sm" onClick={() => openEdit(t)}>Edit</button>
                        <button className="rsx-btn rsx-btn-danger rsx-btn-sm" onClick={() => handleDelete(t)}>Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modalOpen && (
        <div className="rsx-overlay" onMouseDown={() => setModalOpen(false)}>
          <div className="rsx-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="rsx-modal-header">
              <h3>{editing ? 'Edit Data Guru' : 'Tambah Guru Baru'}</h3>
              <button className="rsx-close" onClick={() => setModalOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="rsx-form-group">
                <label>Nama Lengkap <span style={{color: 'var(--muted)', fontWeight: 400}}>(termasuk gelar)</span></label>
                <input 
                  className="rsx-input" 
                  value={form.name} 
                  onChange={handleNameChange}
                  placeholder="Contoh: Dr. Muhamad Ferhan Pratama S.Pd"
                  autoFocus
                />
              </div>
              
              <div className="rsx-form-group">
                <label>Email <span style={{color: 'var(--muted)', fontWeight: 400}}>(otomatis dibuat, bisa diedit)</span></label>
                <input 
                  className="rsx-input" 
                  type="email" 
                  value={form.email} 
                  onChange={handleEmailChange}
                  placeholder="email@rungsync.sch.id"
                />
              </div>

              {!editing && (
                <div className="rsx-form-group">
                  <label>Password <span style={{color: 'var(--muted)', fontWeight: 400}}>(kosongkan = default: guru12345)</span></label>
                  <input 
                    className="rsx-input" 
                    type="password" 
                    value={form.password} 
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} 
                    placeholder="Minimal 8 karakter"
                  />
                </div>
              )}

              <div className="rsx-form-group">
                <label>NIP</label>
                <input 
                  className="rsx-input" 
                  value={form.nip} 
                  onChange={(e) => setForm((prev) => ({ ...prev, nip: e.target.value }))} 
                  placeholder="Nomor Induk Pegawai"
                />
              </div>

              <div className="rsx-form-group">
                <label>Keahlian Mapel — <span style={{ color: '#2563eb' }}>{form.subject_ids.length}/3</span> terpilih</label>
                <div className="rsx-chips">
                  {subjects.map((s) => {
                    const isSelected = form.subject_ids.includes(s.id);
                    const isDisabled = !isSelected && form.subject_ids.length >= 3;
                    return (
                      <button
                        type="button"
                        key={s.id}
                        disabled={isDisabled}
                        className={`rsx-chip-btn ${isSelected ? 'on' : ''}`}
                        onClick={() => toggleSubject(s.id)}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && <div className="rsx-error">{error}</div>}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="rsx-btn rsx-btn-primary" type="submit" disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Menyimpan…' : 'Simpan Data'}
                </button>
                <button className="rsx-btn rsx-btn-ghost" type="button" onClick={() => setModalOpen(false)}>
                  Batal
                </button>
              </div>
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
              Password lama sudah tidak berlaku. Setelah modal ini ditutup, password tidak dapat dilihat lagi.
            </p>
            <div className="rsx-reset-actions">
              <button className="rsx-btn rsx-btn-primary" onClick={copyPassword}>Salin Password</button>
              <button className="rsx-btn rsx-btn-ghost" onClick={() => setResetInfo(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   CSS STYLES
   ========================================================================== */
const css = `
.rsx-page {
  padding: 8px 4px;
  --card: #0d1930; 
  --card-border: #1c2b45; 
  --text: #e2e8f0; 
  --text-strong: #f1f5f9;
  --muted: #94a3b8; 
  --label: #94a3b8; 
  --th-bg: #132340; 
  --th-text: #8ab4f8;
  --row-line: #16263f; 
  --row-hover: rgba(37,99,235,.06);
  --input-bg: #12203a; 
  --input-border: #24344f;
  --edit-bg: rgba(37,99,235,.15); 
  --edit-text: #93c5fd; 
  --edit-border: rgba(37,99,235,.4);
  --overlay: rgba(2,6,23,.72);
  --group-bg: rgba(37,99,235,.1); 
  --group-border: rgba(37,99,235,.3);
}

.rsx-page.rsx-light {
  --card: #ffffff; 
  --card-border: #e2e8f0; 
  --text: #334155; 
  --text-strong: #0f172a;
  --muted: #64748b; 
  --label: #475569; 
  --th-bg: #f1f5f9; 
  --th-text: #1d4ed8;
  --row-line: #e2e8f0; 
  --row-hover: rgba(37,99,235,.05);
  --input-bg: #ffffff; 
  --input-border: #cbd5e1;
  --edit-bg: rgba(37,99,235,.08); 
  --edit-text: #1d4ed8; 
  --edit-border: rgba(37,99,235,.35);
  --overlay: rgba(15,23,42,.45);
  --group-bg: rgba(37,99,235,.05); 
  --group-border: rgba(37,99,235,.2);
}

.rsx-page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
.rsx-page-header h2 { font-size: 22px; font-weight: 800; color: var(--text-strong); margin: 0; }

.rsx-btn { border: none; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer; transition: .2s; display: inline-flex; align-items: center; justify-content: center; }
.rsx-btn-primary { background: linear-gradient(90deg, #2563eb, #06b6d4); color: #fff; box-shadow: 0 4px 14px rgba(37,99,235,.35); }
.rsx-btn-primary:hover { filter: brightness(1.1); }
.rsx-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.rsx-btn-edit { background: var(--edit-bg); color: var(--edit-text); border: 1px solid var(--edit-border); }
.rsx-btn-edit:hover { background: rgba(37,99,235,.25); }
.rsx-btn-danger { background: linear-gradient(90deg, #f97316, #ef4444); color: #fff; }
.rsx-btn-danger:hover { filter: brightness(1.1); }
.rsx-btn-warning { background: linear-gradient(90deg, #eab308, #f59e0b); color: #111; }
.rsx-btn-warning:hover { filter: brightness(1.1); }
.rsx-btn-warning:disabled { opacity: .6; cursor: not-allowed; }
.rsx-btn-ghost { background: transparent; box-shadow: inset 0 0 0 1px var(--card-border); color: var(--muted); }
.rsx-btn-ghost:hover { color: var(--text-strong); border-color: var(--text-strong); }
.rsx-btn-ghost.active { background: var(--group-bg); border-color: #2563eb; color: #2563eb; }
.rsx-btn-sm { padding: 6px 11px; font-size: 12px; border-radius: 6px; margin-right: 4px; }

.rsx-filter-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.rsx-search-wrap { position: relative; flex: 1; min-width: 240px; }
.rsx-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
.rsx-search-input { width: 100%; background: var(--input-bg); border: 1px solid var(--input-border); color: var(--text);
  border-radius: 10px; padding: 10px 36px 10px 38px; font-size: 13px; outline: none; transition: .2s; }
.rsx-search-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
.rsx-search-input::placeholder { color: var(--muted); }
.rsx-search-clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: transparent;
  border: none; color: var(--muted); cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 6px; transition: .2s; }
.rsx-search-clear:hover { color: var(--text-strong); background: rgba(100,116,139,.15); }

.rsx-filter-controls { display: flex; gap: 8px; align-items: center; }
.rsx-select { background: var(--input-bg); border: 1px solid var(--input-border); color: var(--text);
  border-radius: 8px; padding: 9px 12px; font-size: 13px; outline: none; cursor: pointer; }
.rsx-select:focus { border-color: #2563eb; }

.rsx-active-filter { 
  background: var(--group-bg); border: 1px solid var(--group-border); 
  border-radius: 8px; padding: 8px 12px; margin-bottom: 14px; 
  display: flex; align-items: center; gap: 8px; font-size: 13px;
}
.rsx-active-filter b { color: #2563eb; }
.rsx-clear-filter { 
  background: transparent; border: none; color: var(--muted); 
  cursor: pointer; display: flex; align-items: center; padding: 2px; 
  border-radius: 4px; margin-left: auto;
}
.rsx-clear-filter:hover { color: var(--text-strong); background: rgba(100,116,139,.15); }

.rsx-table-card { background: var(--card); border: 1px solid var(--card-border); border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(15,23,42,.08); }
.rsx-table-wrap { overflow-x: auto; }
.rsx-table { width: 100%; border-collapse: collapse; }
.rsx-table th { background: var(--th-bg); color: var(--th-text); text-align: left; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; padding: 12px 16px; }
.rsx-table td { padding: 13px 16px; border-top: 1px solid var(--row-line); color: var(--text); font-size: 13.5px; word-wrap: break-word; max-width: 250px; }
.rsx-table tr:hover td { background: var(--row-hover); }
.rsx-empty { text-align: center; color: var(--muted); padding: 32px 0 !important; font-size: 14px; }

.rsx-grouped-view { display: flex; flex-direction: column; gap: 16px; }
.rsx-group-card { 
  background: var(--card); border: 1px solid var(--card-border); 
  border-radius: 12px; overflow: hidden; 
  box-shadow: 0 1px 3px rgba(15,23,42,.08);
}
.rsx-group-header { 
  background: var(--group-bg); border-bottom: 1px solid var(--group-border);
  padding: 14px 18px; display: flex; align-items: center; gap: 10px;
}
.rsx-group-header h3 { 
  font-size: 15px; font-weight: 700; color: var(--text-strong); margin: 0; flex: 1;
}
.rsx-group-count { 
  background: var(--card); color: #2563eb; 
  padding: 3px 10px; border-radius: 999px; 
  font-size: 11px; font-weight: 700;
}
.rsx-group-list { padding: 8px; }
.rsx-group-item { 
  display: flex; align-items: center; justify-content: space-between; 
  padding: 10px 14px; border-bottom: 1px solid var(--row-line);
  transition: background .15s;
}
.rsx-group-item:last-child { border-bottom: none; }
.rsx-group-item:hover { background: var(--row-hover); }
.rsx-group-item-info { flex: 1; min-width: 0; }
.rsx-group-item-name { 
  font-weight: 600; color: var(--text-strong); 
  font-size: 13.5px; margin-bottom: 2px;
}
.rsx-group-item-meta { 
  font-size: 11.5px; color: var(--muted);
}
.rsx-group-item-actions { display: flex; gap: 6px; margin-left: 12px; }

.rsx-empty-state { 
  text-align: center; padding: 48px 20px; 
  background: var(--card); border: 1px dashed var(--card-border); 
  border-radius: 14px; color: var(--muted);
}

.rsx-overlay { position: fixed; inset: 0; background: var(--overlay); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.rsx-modal { width: 520px; max-width: 100%; max-height: 90vh; overflow-y: auto; background: var(--card); border: 1px solid var(--card-border); border-radius: 16px; padding: 24px; }
.rsx-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
.rsx-modal-header h3 { color: var(--text-strong); font-size: 18px; font-weight: 700; margin: 0; }
.rsx-close { background: transparent; border: none; color: var(--muted); cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 6px; transition: .2s; }
.rsx-close:hover { background: rgba(100,116,139,.15); color: var(--text-strong); }

.rsx-form-group { margin-bottom: 14px; }
.rsx-form-group label { display: block; font-size: 12px; color: var(--label); margin-bottom: 6px; font-weight: 600; }
.rsx-input { width: 100%; background: var(--input-bg); border: 1px solid var(--input-border); color: var(--text); border-radius: 8px; padding: 10px 12px; font-size: 13.5px; outline: none; transition: .2s; }
.rsx-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
.rsx-error { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.45); color: #fca5a5; border-radius: 8px; padding: 10px 12px; font-size: 12.5px; margin-bottom: 12px; }

.rsx-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.rsx-chip-btn { border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text);
  border-radius: 999px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; transition: .15s; }
.rsx-chip-btn:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; }
.rsx-chip-btn.on { background: linear-gradient(90deg, #2563eb, #06b6d4); border-color: transparent; color: #fff; }
.rsx-chip-btn:disabled { opacity: .4; cursor: not-allowed; }

.rsx-reset-modal { width: 420px; max-width: 100%; background: var(--card); border: 1px solid var(--card-border); border-radius: 16px; padding: 28px 24px; text-align: center; }
.rsx-reset-modal h3 { color: var(--text-strong); font-size: 18px; font-weight: 700; margin: 0 0 8px; }
.rsx-reset-modal .rsx-reset-sub { color: var(--label); font-size: 13px; margin: 0 0 16px; }
.rsx-reset-password { font-family: monospace; font-size: 24px; letter-spacing: 2px; background: var(--input-bg); border: 1px dashed #2563eb; color: #22d3ee; padding: 16px; border-radius: 10px; margin: 0 0 16px; user-select: all; word-break: break-all; }
.rsx-reset-note { color: var(--muted); font-size: 12px; margin: 0 0 20px; line-height: 1.5; }
.rsx-reset-actions { display: flex; gap: 10px; }
.rsx-reset-actions .rsx-btn { flex: 1; }

@media (max-width: 768px) {
  .rsx-filter-bar { flex-direction: column; align-items: stretch; }
  .rsx-filter-controls { justify-content: space-between; }
  .rsx-group-item { flex-direction: column; align-items: flex-start; gap: 8px; }
  .rsx-group-item-actions { margin-left: 0; width: 100%; justify-content: flex-end; }
}
`;