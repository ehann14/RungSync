import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const fmtTime = (t) => (t ? String(t).slice(0, 5).replace(':', '.') : '');

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
  d ? d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) : '';
const fmtDateShort = (d) =>
  d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

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
  const [theme, setTheme] = useState(detect);
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
.tsc{padding:8px 4px;
--card:#ffffff;--border:#e2e8f0;--text:#334155;--strong:#0f172a;--muted:#64748b;
--pill-bg:#ffffff;--pill-border:#cbd5e1;--pill-text:#334155;}
.tsc.tsc-dark{--card:#0d1930;--border:#1c2b45;--text:#e2e8f0;--strong:#f1f5f9;--muted:#64748b;
--pill-bg:#12203a;--pill-border:#24344f;--pill-text:#e2e8f0;}
.tsc h2{font-size:24px;font-weight:800;color:var(--strong);margin:0 0 6px;}
.tsc-week{font-size:12px;color:var(--muted);margin:0 0 16px;}
.tsc-pills{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;}
.tsc-pill{border:1px solid var(--pill-border);background:var(--pill-bg);color:var(--pill-text);
border-radius:999px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;transition:.2s;}
.tsc-pill small{display:block;font-size:9.5px;font-weight:600;opacity:.7;}
.tsc-pill:hover{border-color:#2563eb;color:#2563eb;}
.tsc-pill.active{background:linear-gradient(90deg,#2563eb,#06b6d4);border-color:transparent;
color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.35);}
.tsc-list{display:flex;flex-direction:column;gap:12px;}
.tsc-item{background:var(--card);border:1px solid var(--border);border-radius:14px;
padding:16px 18px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;
box-shadow:0 1px 3px rgba(15,23,42,.08);}
.tsc-when{min-width:170px;}
.tsc-day{display:inline-block;background:rgba(37,99,235,.12);color:#2563eb;border-radius:999px;
padding:4px 12px;font-size:11px;font-weight:800;margin-bottom:4px;}
.tsc-date{font-size:11px;color:var(--muted);margin-bottom:4px;}
.tsc-time{font-size:15px;font-weight:800;color:var(--strong);}
.tsc-what{flex:1;min-width:200px;}
.tsc-subject{font-size:15px;font-weight:700;color:var(--strong);}
.tsc-meta{font-size:12.5px;color:var(--muted);margin-top:3px;}
.tsc-empty{background:var(--card);border:1px solid var(--border);border-radius:14px;
color:var(--muted);padding:22px 18px;font-size:14px;}
.tsc-error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.45);color:#fca5a5;
border-radius:12px;padding:12px 16px;font-size:13px;margin-bottom:16px;}
`;

export default function TeacherSchedule() {
  const theme = useAppTheme();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [day, setDay] = useState('Semua');
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/teacher/schedule');
      setSchedules(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.response?.status === 403 ? 'Akun ini tidak memiliki akses ke jadwal.' : 'Gagal memuat jadwal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader text="Memuat jadwal mengajar…" />;

  const filtered = (day === 'Semua' ? schedules : schedules.filter((s) => s.day === day))
    .slice()
    .sort((a, b) =>
      a.day === b.day
        ? (a.start_time || '').localeCompare(b.start_time || '')
        : DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
    );

  return (
    <div className={`tsc ${theme === 'dark' ? 'tsc-dark' : ''}`}>
      <style>{css}</style>

      <h2>Jadwal Mengajar</h2>
      <p className="tsc-week">
        Minggu ini: {fmtDate(dateForDay('Senin'))} — {fmtDate(dateForDay('Sabtu'))}
      </p>

      {error && <div className="tsc-error">{error}</div>}

      <div className="tsc-pills">
        <button className={`tsc-pill ${day === 'Semua' ? 'active' : ''}`} onClick={() => setDay('Semua')}>
          Semua
        </button>
        {DAYS.map((d) => (
          <button
            key={d}
            className={`tsc-pill ${day === d ? 'active' : ''}`}
            onClick={() => setDay(d)}
            title={fmtDate(dateForDay(d))}
          >
            {d}
            <small>{fmtDateShort(dateForDay(d))}</small>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="tsc-empty">
          {day === 'Semua' ? 'Belum ada jadwal mengajar untuk Anda.' : `Tidak ada jadwal untuk hari ${day} (${fmtDateShort(dateForDay(day))}).`}
        </div>
      ) : (
        <div className="tsc-list">
          {filtered.map((s) => (
            <div className="tsc-item" key={s.id}>
              <div className="tsc-when">
                <span className="tsc-day">{s.day}</span>
                <div className="tsc-date">📅 {fmtDateShort(dateForDay(s.day))}</div>
                <div className="tsc-time">{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</div>
              </div>
              <div className="tsc-what">
                <div className="tsc-subject">{s.subject?.name || 'Mata Pelajaran'}</div>
                <div className="tsc-meta">
                  Kelas {s.class?.name || '-'} · Ruangan {s.room?.name || '-'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}