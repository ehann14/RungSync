import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';

const fmtTime = (t) => (t ? String(t).slice(0, 5).replace(':', '.') : '');
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

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
const fmtDateShort = (d) =>
  d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const todayName = () => new Date().toLocaleDateString('id-ID', { weekday: 'long' });

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
.tr{padding:8px 4px;
--card:#ffffff;--border:#e2e8f0;--text:#334155;--strong:#0f172a;--muted:#64748b;
--th-bg:#f1f5f9;--th-text:#1d4ed8;--line:#e2e8f0;}
.tr.tr-dark{--card:#0d1930;--border:#1c2b45;--text:#e2e8f0;--strong:#f1f5f9;--muted:#64748b;
--th-bg:#132340;--th-text:#8ab4f8;--line:#16263f;}
.tr h2{font-size:24px;font-weight:800;color:var(--strong);margin:0 0 6px;}
.tr-sub{font-size:12px;color:var(--muted);margin:0 0 18px;}
.tr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;}
.tr-card{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;
box-shadow:0 1px 3px rgba(15,23,42,.08);}
.tr-card-head{padding:12px 16px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px;}
.tr-card-head .dot{width:10px;height:10px;border-radius:50%;flex:none;}
.tr-card-head .dot.on{background:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.2);}
.tr-card-head .dot.off{background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.2);}
.tr-card-head .name{font-weight:800;color:var(--strong);font-size:14px;flex:1;}
.tr-card-head .st{font-size:10.5px;font-weight:800;padding:4px 10px;border-radius:999px;}
.tr-card-head .st.on{background:rgba(239,68,68,.12);color:#b91c1c;}
.tr-card-head .st.off{background:rgba(34,197,94,.12);color:#15803d;}
.tr-dark .tr-card-head .st.on{color:#fca5a5;} .tr-dark .tr-card-head .st.off{color:#4ade80;}
.tr-card-body{padding:12px 16px 14px;font-size:12.5px;color:var(--muted);line-height:1.7;}
.tr-card-body b{color:var(--strong);}
.tr-slot{display:flex;gap:10px;padding:7px 0;border-bottom:1px dashed var(--line);}
.tr-slot:last-child{border-bottom:none;}
.tr-slot .t{font-weight:700;color:#2563eb;min-width:100px;}
.tr-slot .w{flex:1;}
.tr-slot .w b{color:var(--strong);font-size:12.5px;}
.tr-empty{background:var(--card);border:1px dashed var(--border);border-radius:14px;padding:26px 18px;
text-align:center;color:var(--muted);font-size:14px;}
.tr-empty .big{font-size:30px;margin-bottom:8px;}
.tr-error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.45);color:#fca5a5;
border-radius:12px;padding:12px 16px;font-size:13px;margin-bottom:16px;}
`;

export default function TeacherRooms() {
  const theme = useAppTheme();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/teacher/schedule');
      setSchedules(res.data?.data || res.data || []);
    } catch {
      setError('Gagal memuat data ruangan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* semua hook dulu */
  const roomMap = useMemo(() => {
    const map = {};
    schedules.forEach((s) => {
      const id = s.room_id;
      const name = s.room?.name || 'Ruangan tanpa nama';
      if (!map[id]) map[id] = { id, name, days: {} };
      if (!map[id].days[s.day]) map[id].days[s.day] = [];
      map[id].days[s.day].push(s);
    });
    Object.values(map).forEach((r) => {
      Object.keys(r.days).forEach((d) => {
        r.days[d].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
      });
    });
    return Object.values(map).sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'id', { numeric: true })
    );
  }, [schedules]);

  const today = todayName();
  const nowM = new Date().getHours() * 60 + new Date().getMinutes();

  const roomStatus = useMemo(() => {
    const st = {};
    roomMap.forEach((r) => {
      const todaySlots = r.days[today] || [];
      const active = todaySlots.find((s) => {
        const [sh, sm] = (s.start_time || '0:0').split(':').map(Number);
        const [eh, em] = (s.end_time || '0:0').split(':').map(Number);
        return nowM >= sh * 60 + sm && nowM <= eh * 60 + em;
      });
      st[r.id] = { used: !!active };
    });
    return st;
  }, [roomMap, today, nowM]);

  /* baru early return */
  if (loading) return <PageLoader text="Memuat status ruangan…" />;

  return (
    <div className={`tr ${theme === 'dark' ? 'tr-dark' : ''}`}>
      <style>{css}</style>

      <h2>Status Ruangan Saya 🚪</h2>
      <p className="tr-sub">
        Daftar ruangan yang Anda pakai minggu ini · Hari ini: {today}, {fmtDateShort(dateForDay(today))}
      </p>

      {error && <div className="tr-error">{error}</div>}

      {roomMap.length === 0 ? (
        <div className="tr-empty">
          <div className="big">🚪</div>
          Belum ada jadwal mengajar yang terdaftar — tidak ada ruangan yang terpakai.
        </div>
      ) : (
        <div className="tr-grid">
          {roomMap.map((r) => {
            const st = roomStatus[r.id] || { used: false };
            const days = Object.keys(r.days).sort(
              (a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)
            );
            return (
              <div className="tr-card" key={r.id}>
                <div className="tr-card-head">
                  <span className={`dot ${st.used ? 'on' : 'off'}`} />
                  <span className="name">{r.name}</span>
                  <span className={`st ${st.used ? 'on' : 'off'}`}>
                    {st.used ? 'Sedang Dipakai' : 'Kosong'}
                  </span>
                </div>
                <div className="tr-card-body">
                  {days.map((d) => (
                    <div key={d}>
                      <b>{d}</b> <span style={{ fontSize: 11, opacity: .8 }}>({fmtDateShort(dateForDay(d))})</span>
                      {r.days[d].map((s) => (
                        <div className="tr-slot" key={s.id}>
                          <span className="t">{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</span>
                          <span className="w">
                            <b>{s.subject?.name || 'Mapel'}</b> — Kelas {s.class?.name || '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}