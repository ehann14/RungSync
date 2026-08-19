import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import ScheduleFormModal from '../../components/ScheduleFormModal';
import PageLoader from '../../components/PageLoader';

const fmtTime = (t) => (t ? t.slice(0, 5).replace(':', '.') : '');
const toMin = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + m; };
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MAX_ROWS = 20;

function weekMonday() {
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - todayIdx);
  if (todayIdx === 6) start.setDate(start.getDate() + 7);
  start.setHours(0, 0, 0, 0);
  return start;
}
const dateForDay = (day) => {
  const idx = DAYS.indexOf(day);
  if (idx < 0) return null;
  const d = new Date(weekMonday());
  d.setDate(d.getDate() + idx);
  return d;
};
const fmtDate = (d) =>
  d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

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
.rsx-btn-edit{background:var(--edit-bg);color:var(--edit-text);border:1px solid var(--edit-border);}
.rsx-btn-danger{background:linear-gradient(90deg,#f97316,#ef4444);color:#fff;}
.rsx-btn-sm{padding:6px 11px;font-size:12px;border-radius:6px;margin-right:6px;}
.rsx-filter-bar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;}
.rsx-select{background:var(--input-bg);border:1px solid var(--input-border);color:var(--text);border-radius:8px;padding:9px 12px;font-size:13px;outline:none;min-width:150px;}
.rsx-select:focus{border-color:#2563eb;}
.rsx-note{font-size:11.5px;color:var(--muted);margin-bottom:12px;line-height:1.6;}
.rsx-note b{color:var(--text-strong);}
.rsx-live-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;
margin-right:6px;animation:rsxPulse 1.2s infinite;}
@keyframes rsxPulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}70%{box-shadow:0 0 0 7px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}
.rsx-live-chip{display:inline-block;border-radius:999px;padding:3px 10px;font-size:10px;font-weight:800;
background:rgba(34,197,94,.15);color:#4ade80;margin-left:8px;}
.rsx-light .rsx-live-chip{color:#15803d;}
.rsx-table-card{background:var(--card);border:1px solid var(--card-border);border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.08);}
.rsx-table-wrap{overflow-x:auto;}
.rsx-table{width:100%;border-collapse:collapse;}
.rsx-table th{background:var(--th-bg);color:var(--th-text);text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;}
.rsx-table td{padding:13px 16px;border-top:1px solid var(--row-line);color:var(--text);font-size:13.5px;}
.rsx-table tr:hover td{background:var(--row-hover);}
.rsx-table tr.rsx-live td{background:rgba(34,197,94,.07);}
.rsx-empty{text-align:center;color:var(--muted);padding:24px 0 !important;}
.rsx-date-cell{color:var(--muted);font-size:12px;white-space:nowrap;}
`;

export default function Schedules() {
  const theme = useAppTheme();
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0); // auto-refresh status tiap 30 detik
  const [filters, setFilters] = useState({ day: '', class_id: '', teacher_id: '', room_id: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sch, cls, tch, sub, rom] = await Promise.all([
        api.get('/admin/schedules'),
        api.get('/admin/classes'),
        api.get('/admin/teachers'),
        api.get('/admin/subjects'),
        api.get('/admin/rooms'),
      ]);
      setSchedules(sch.data.data || sch.data);
      setClasses(cls.data.data || cls.data);
      setTeachers(tch.data.data || tch.data);
      setSubjects(sub.data.data || sub.data);
      setRooms(rom.data.data || rom.data);
    } catch (e) {
      console.error('Gagal memuat data:', e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ===== semua hook dijalankan dulu, baru early return =====
  if (loading) return <PageLoader text="Memuat manajemen jadwal…" />;

  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const today = now.toLocaleDateString('id-ID', { weekday: 'long' });
  const tIdx = DAYS.indexOf(today); // -1 kalau Minggu

  const isLive = (s) => s.day === today && toMin(s.start_time) <= nowM && nowM < toMin(s.end_time);
  const isPastToday = (s) => s.day === today && toMin(s.end_time) <= nowM;

  /* urutan "terdekat": berlangsung → hari ini berikutnya → besok → dst. */
  const dayOffset = (name) => {
    const d = DAYS.indexOf(name);
    if (tIdx < 0) return d + 1;              // hari Minggu: semua dianggap mendatang
    return (d - tIdx + 7) % 7;
  };
  const rank = (s) => {
    const off = dayOffset(s.day);
    if (off === 0) return isLive(s) ? 0 : 1; // sedang berlangsung paling atas
    return 1 + off;
  };

  const baseFiltered = schedules.filter((s) => {
    if (filters.day && s.day !== filters.day) return false;
    if (filters.class_id && String(s.class_id) !== filters.class_id) return false;
    if (filters.teacher_id && String(s.teacher_id) !== filters.teacher_id) return false;
    if (filters.room_id && String(s.room_id) !== filters.room_id) return false;
    return true;
  });

  let view;
  if (!filters.day) {
    // mode "Semua hari": sembunyikan jam hari ini yang sudah selesai, urutkan terdekat, maks 20
    view = baseFiltered
      .filter((s) => !isPastToday(s))
      .sort((a, b) => rank(a) - rank(b) || (a.start_time || '').localeCompare(b.start_time || ''));
  } else {
    // mode hari tertentu: tampilkan penuh hari itu (termasuk yang sudah lewat), urut jam
    view = baseFiltered.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  }

  const shown = view.slice(0, MAX_ROWS);
  const hiddenCount = view.length - shown.length;

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (s) => { setEditing(s); setModalOpen(true); };

  const handleSave = async (payload) => {
    if (editing) await api.put(`/admin/schedules/${editing.id}`, payload);
    else await api.post('/admin/schedules', payload);
    setModalOpen(false); setEditing(null); load();
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Hapus jadwal ${s.subject?.name} - ${s.class?.name}?`)) return;
    try { await api.delete(`/admin/schedules/${s.id}`); load(); }
    catch { alert('Gagal menghapus jadwal.'); }
  };

  return (
    <div className={`rsx-page ${theme === 'light' ? 'rsx-light' : ''}`}>
      <style>{css}</style>

      <div className="rsx-page-header">
        <h2>Manajemen Jadwal</h2>
        <button className="rsx-btn rsx-btn-primary" onClick={openCreate}>+ Tambah Jadwal</button>
      </div>

      <div className="rsx-filter-bar">
        <select className="rsx-select" value={filters.day} onChange={(e) => setFilters({ ...filters, day: e.target.value })}>
          <option value="">Semua hari</option>
          {DAYS.map((d) => <option key={d} value={d}>{d} ({fmtDate(dateForDay(d))})</option>)}
        </select>
        <select className="rsx-select" value={filters.class_id} onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}>
          <option value="">Semua kelas</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="rsx-select" value={filters.teacher_id} onChange={(e) => setFilters({ ...filters, teacher_id: e.target.value })}>
          <option value="">Semua guru</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
        </select>
        <select className="rsx-select" value={filters.room_id} onChange={(e) => setFilters({ ...filters, room_id: e.target.value })}>
          <option value="">Semua ruangan</option>
          {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <div className="rsx-note">
        {filters.day
          ? <>Menampilkan jadwal <b>{filters.day}</b> lengkap (maks {MAX_ROWS} baris).</>
          : <>Menampilkan <b>maks {MAX_ROWS} jadwal terdekat</b> — jam hari ini yang sudah selesai
             otomatis disembunyikan, yang <b>sedang berlangsung</b> tampil paling atas.
             Diperbarui otomatis tiap 30 detik.</>}
        {hiddenCount > 0 && <> · {hiddenCount} jadwal lain tidak ditampilkan (gunakan filter untuk melihatnya).</>}
      </div>

      <div className="rsx-table-card">
        <div className="rsx-table-wrap">
          <table className="rsx-table">
            <thead>
              <tr>
                <th>Hari</th><th>Tanggal</th><th>Jam</th><th>Kelas</th><th>Mata Pelajaran</th><th>Guru</th><th>Ruangan</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr><td className="rsx-empty" colSpan="8">Tidak ada jadwal yang cocok.</td></tr>
              ) : (
                shown.map((s) => (
                  <tr key={s.id} className={isLive(s) ? 'rsx-live' : ''}>
                    <td>{s.day}</td>
                    <td className="rsx-date-cell">📅 {fmtDate(dateForDay(s.day))}</td>
                    <td>
                      {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                      {isLive(s) && <span className="rsx-live-chip"><span className="rsx-live-dot" />Berlangsung</span>}
                    </td>
                    <td>{s.class?.name}</td>
                    <td>{s.subject?.name}</td>
                    <td>{s.teacher?.user?.name}</td>
                    <td>{s.room?.name}</td>
                    <td>
                      <button className="rsx-btn rsx-btn-edit rsx-btn-sm" onClick={() => openEdit(s)}>Edit</button>
                      <button className="rsx-btn rsx-btn-danger rsx-btn-sm" onClick={() => handleDelete(s)}>Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ScheduleFormModal
        open={modalOpen}
        initial={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleSave}
        classes={classes}
        teachers={teachers}
        subjects={subjects}
        rooms={rooms}
      />
    </div>
  );
}