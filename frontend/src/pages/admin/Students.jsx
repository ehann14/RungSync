import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';

const emptyForm = { name: '', email: '', password: '', nis: '', class_id: '' };

const gradeOf = (s) => {
  const m = String(s.class?.name || '').match(/^(1[0-2])/);
  return m ? m[1] : '';
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
.rsx-page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px;}
.rsx-page-header h2{font-size:22px;font-weight:800;color:var(--text-strong);margin:0;}
.rsx-btn{border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:.2s;}
.rsx-btn-primary{background:linear-gradient(90deg,#2563eb,#06b6d4);color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.35);}
.rsx-btn-primary:hover{filter:brightness(1.1);}
.rsx-btn-primary:disabled{opacity:.6;cursor:wait;}
.rsx-btn-edit{background:var(--edit-bg);color:var(--edit-text);border:1px solid var(--edit-border);}
.rsx-btn-danger{background:linear-gradient(90deg,#f97316,#ef4444);color:#fff;}
.rsx-btn-warning{background:linear-gradient(90deg,#eab308,#f59e0b);color:#111;}
.rsx-btn-sm{padding:6px 11px;font-size:12px;border-radius:6px;margin-right:6px;}
.rsx-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center;}
.rsx-search-wrap{flex:1;min-width:200px;position:relative;}
.rsx-search-wrap .ic{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:13px;opacity:.6;}
.rsx-search{width:100%;background:var(--input-bg);border:1px solid var(--input-border);color:var(--text);
border-radius:10px;padding:10px 12px 10px 34px;font-size:13px;outline:none;}
.rsx-search:focus{border-color:#2563eb;}
.rsx-select{background:var(--input-bg);border:1px solid var(--input-border);color:var(--text);
border-radius:10px;padding:10px 12px;font-size:13px;outline:none;min-width:160px;}
.rsx-select:focus{border-color:#2563eb;}
.rsx-grades{display:flex;gap:6px;flex-wrap:wrap;}
.rsx-grade{border:1px solid var(--input-border);background:var(--input-bg);color:var(--text);
border-radius:999px;padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;transition:.15s;}
.rsx-grade:hover{border-color:#2563eb;color:#2563eb;}
.rsx-grade.on{background:linear-gradient(90deg,#2563eb,#06b6d4);border-color:transparent;color:#fff;}
.rsx-count{font-size:11.5px;color:var(--muted);width:100%;}
.rsx-table-card{background:var(--card);border:1px solid var(--card-border);border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.08);}
.rsx-table-wrap{overflow-x:auto;}
.rsx-table{width:100%;border-collapse:collapse;}
.rsx-table th{background:var(--th-bg);color:var(--th-text);text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;}
.rsx-table td{padding:13px 16px;border-top:1px solid var(--row-line);color:var(--text);font-size:13.5px;}
.rsx-table tr:hover td{background:var(--row-hover);}
.rsx-empty{text-align:center;color:var(--muted);padding:24px 0 !important;}
.rsx-grade-badge{display:inline-block;border-radius:999px;padding:3px 10px;font-size:10.5px;font-weight:800;
background:rgba(37,99,235,.12);color:#93c5fd;margin-right:6px;}
.rsx-light .rsx-grade-badge{color:#1d4ed8;}
.rsx-overlay{position:fixed;inset:0;background:var(--overlay);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;}
.rsx-modal{width:440px;max-width:100%;max-height:88vh;overflow:auto;background:var(--card);border:1px solid var(--card-border);border-radius:16px;padding:22px;}
.rsx-modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
.rsx-modal-header h3{color:var(--text-strong);font-size:17px;font-weight:700;margin:0;}
.rsx-close{background:transparent;border:none;color:var(--muted);font-size:16px;cursor:pointer;}
.rsx-form-group{margin-bottom:12px;}
.rsx-form-group label{display:block;font-size:12px;color:var(--label);margin-bottom:6px;font-weight:600;}
.rsx-input,.rsx-select-full{width:100%;background:var(--input-bg);border:1px solid var(--input-border);color:var(--text);border-radius:8px;padding:9px 12px;font-size:13px;outline:none;}
.rsx-input:focus,.rsx-select-full:focus{border-color:#2563eb;}
.rsx-error{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.5);color:#fca5a5;border-radius:8px;padding:10px 12px;font-size:12.5px;margin-bottom:12px;}
.rsx-light .rsx-error{background:rgba(239,68,68,.08);color:#b91c1c;}
.rsx-reset-modal{width:420px;max-width:100%;background:var(--card);border:1px solid var(--card-border);border-radius:16px;padding:24px;text-align:center;}
.rsx-reset-modal h3{color:var(--text-strong);font-size:17px;font-weight:700;margin:0 0 6px;}
.rsx-reset-modal .rsx-reset-sub{color:var(--label);font-size:12px;margin:0 0 14px;}
.rsx-reset-password{font-family:monospace;font-size:26px;letter-spacing:3px;background:var(--input-bg);border:1px dashed #2563eb;color:#22d3ee;padding:16px;border-radius:10px;margin:0 0 12px;user-select:all;}
.rsx-reset-note{color:var(--muted);font-size:11px;margin:0 0 16px;}
.rsx-reset-actions{display:flex;gap:10px;}
.rsx-reset-actions .rsx-btn{flex:1;}
`;

export default function Students() {
  const theme = useAppTheme();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [resetInfo, setResetInfo] = useState(null);
  const [resetting, setResetting] = useState(false);

  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([api.get('/admin/students'), api.get('/admin/classes')]);
      setStudents(s.data.data || s.data);
      setClasses(c.data.data || c.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const gradeCounts = useMemo(() => {
    const c = { '10': 0, '11': 0, '12': 0 };
    students.forEach((s) => { const g = gradeOf(s); if (c[g] !== undefined) c[g]++; });
    return c;
  }, [students]);

  const visibleStudents = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = students.filter((s) => {
      const text = `${s.user?.name || ''} ${s.user?.email || ''} ${s.nis || ''} ${s.class?.name || ''}`.toLowerCase();
      if (q && !text.includes(q)) return false;
      if (grade && gradeOf(s) !== grade) return false;
      return true;
    });
    const cmpName = (a, b) =>
      (a.user?.name || '').localeCompare(b.user?.name || '', 'id', { numeric: true, sensitivity: 'base' });
    switch (sortBy) {
      case 'name-desc': list = [...list].sort((a, b) => cmpName(b, a)); break;
      case 'class-asc': list = [...list].sort((a, b) =>
        (a.class?.name || '99').localeCompare(b.class?.name || '99', 'id', { numeric: true }) || cmpName(a, b)); break;
      case 'grade-asc': list = [...list].sort((a, b) =>
        (gradeOf(a) || '99').localeCompare(gradeOf(b) || '99', 'id', { numeric: true }) || cmpName(a, b)); break;
      default: list = [...list].sort(cmpName);
    }
    return list;
  }, [students, query, grade, sortBy]);

  // ===== semua hook dijalankan, baru early return =====
  if (loading) return <PageLoader text="Memuat data siswa…" />;

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(''); setModalOpen(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.user?.name || '', email: s.user?.email || '', password: '',
      nis: s.nis || '', class_id: s.class_id ? String(s.class_id) : '',
    });
    setError(''); setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { setError('Nama dan email wajib diisi.'); return; }
    if (!editing && form.password && form.password.length < 8) { setError('Password minimal 8 karakter.'); return; }
    setSaving(true); setError('');
    const payload = {
      name: form.name, email: form.email, nis: form.nis,
      class_id: form.class_id ? Number(form.class_id) : null,
    };
    if (!editing && form.password) payload.password = form.password;
    try {
      if (editing) await api.put(`/admin/students/${editing.id}`, payload);
      else await api.post('/admin/students', payload);
      setModalOpen(false); load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Gagal menyimpan.'));
    } finally { setSaving(false); }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Hapus siswa ${s.user?.name}?`)) return;
    try { await api.delete(`/admin/students/${s.id}`); load(); }
    catch { alert('Gagal menghapus siswa.'); }
  };

  const handleResetPassword = async (s) => {
    if (!window.confirm(`Reset password untuk ${s.user?.name}?\nPassword lama tidak akan berlaku lagi.`)) return;
    setResetting(true);
    try {
      const res = await api.post(`/admin/students/${s.id}/reset-password`);
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

  return (
    <div className={`rsx-page ${theme === 'light' ? 'rsx-light' : ''}`}>
      <style>{css}</style>

      <div className="rsx-page-header">
        <h2>Manajemen Siswa</h2>
        <button className="rsx-btn rsx-btn-primary" onClick={openCreate}>+ Tambah Siswa</button>
      </div>

      <div className="rsx-toolbar">
        <div className="rsx-search-wrap">
          <span className="ic">🔍</span>
          <input
            className="rsx-search"
            placeholder="Cari siswa… nama / email / NIS / kelas"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="rsx-grades">
          <button className={`rsx-grade ${grade === '' ? 'on' : ''}`} onClick={() => setGrade('')}>
            Semua
          </button>
          {['10', '11', '12'].map((g) => (
            <button
              key={g}
              className={`rsx-grade ${grade === g ? 'on' : ''}`}
              onClick={() => setGrade(grade === g ? '' : g)}
            >
              Kelas {g} ({gradeCounts[g]})
            </button>
          ))}
        </div>

        <select className="rsx-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="name-asc">Urutkan: Nama A→Z</option>
          <option value="name-desc">Urutkan: Nama Z→A</option>
          <option value="grade-asc">Urutkan: Kelas 10→12</option>
          <option value="class-asc">Urutkan: Nama Kelas</option>
        </select>

        <div className="rsx-count">
          {visibleStudents.length} dari {students.length} siswa ditampilkan
        </div>
      </div>

      <div className="rsx-table-card">
        <div className="rsx-table-wrap">
          <table className="rsx-table">
            <thead>
              <tr><th>Nama</th><th>Email</th><th>NIS</th><th>Kelas</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {visibleStudents.length === 0 ? (
                <tr><td className="rsx-empty" colSpan="5">
                  Tidak ada siswa yang cocok{query ? ` untuk "${query}"` : ''}{grade ? ` di kelas ${grade}` : ''}.
                </td></tr>
              ) : (
                visibleStudents.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {gradeOf(s) && <span className="rsx-grade-badge">{gradeOf(s)}</span>}
                      {s.user?.name}
                    </td>
                    <td>{s.user?.email}</td>
                    <td>{s.nis || '-'}</td>
                    <td>{s.class?.name || <em>belum ada</em>}</td>
                    <td>
                      <button className="rsx-btn rsx-btn-edit rsx-btn-sm" onClick={() => openEdit(s)}>Edit</button>
                      <button className="rsx-btn rsx-btn-warning rsx-btn-sm" onClick={() => handleResetPassword(s)} disabled={resetting}>
                        Reset Password
                      </button>
                      <button className="rsx-btn rsx-btn-danger rsx-btn-sm" onClick={() => handleDelete(s)}>Hapus</button>
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
              <h3>{editing ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
              <button className="rsx-close" onClick={() => setModalOpen(false)} type="button">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="rsx-form-group">
                <label>Nama</label>
                <input className="rsx-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="rsx-form-group">
                <label>Email</label>
                <input className="rsx-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              {!editing && (
                <div className="rsx-form-group">
                  <label>Password (kosongkan = default siswa12345)</label>
                  <input className="rsx-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              )}
              <div className="rsx-form-group">
                <label>NIS</label>
                <input className="rsx-input" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} />
              </div>
              <div className="rsx-form-group">
                <label>Kelas</label>
                <select className="rsx-select-full" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
                  <option value="">— belum ditentukan —</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
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
            <p className="rsx-reset-sub">Beritahukan password ini kepada siswa bersangkutan:</p>
            <div className="rsx-reset-password">{resetInfo.password}</div>
            <p className="rsx-reset-note">
              ⚠️ Password lama sudah tidak berlaku. Setelah modal ini ditutup,
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