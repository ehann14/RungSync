import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  Lock, Hand, Circle, Clock, Calendar, Coffee, 
  CalendarDays, Sun, BookOpen, DoorOpen 
} from 'lucide-react';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';

const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const fmtTime = (t) => (t ? String(t).slice(0, 5).replace(':', '.') : '');
const toMin = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + m; };
const todayName = () => new Date().toLocaleDateString('id-ID', { weekday: 'long' });

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
  const idx = DAY_ORDER.indexOf(day);
  if (idx < 0) return null;
  const d = new Date(weekMonday());
  d.setDate(d.getDate() + idx);
  return d;
};
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
.ssd{padding:8px 4px;
--card:#ffffff;--border:#e2e8f0;--text:#334155;--strong:#0f172a;--muted:#64748b;
--th-bg:#f1f5f9;--th-text:#1d4ed8;--line:#e2e8f0;--hover:rgba(37,99,235,.05);}
.ssd.ssd-dark{--card:#0d1930;--border:#1c2b45;--text:#e2e8f0;--strong:#f1f5f9;--muted:#64748b;
--th-bg:#132340;--th-text:#8ab4f8;--line:#16263f;--hover:rgba(37,99,235,.06);}
.ssd-greet{font-size:22px;font-weight:800;color:var(--strong);margin:0 0 4px;display:flex;align-items:center;}
.ssd-sub{font-size:12.5px;color:var(--muted);margin:0 0 18px;}
.ssd-banner{display:flex;align-items:center;gap:14px;border-radius:16px;padding:16px 18px;
margin-bottom:20px;border:1px solid;animation:ssdIn .35s ease;}
@keyframes ssdIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.ssd-banner .ic{flex:none;display:flex;align-items:center;}
.ssd-banner .body{flex:1;min-width:0;}
.ssd-banner .title{font-size:15px;font-weight:800;display:flex;align-items:center;}
.ssd-banner .sub{font-size:12.5px;margin-top:3px;line-height:1.6;}
.ssd-banner .when{flex:none;font-weight:800;font-size:12px;border-radius:999px;padding:8px 14px;white-space:nowrap;}
.ssd-ongoing{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.4);}
.ssd-ongoing .title{color:#15803d;} .ssd-ongoing .sub{color:#166534;}
.ssd-ongoing .when{background:#22c55e;color:#fff;}
.ssd-today{background:rgba(234,179,8,.12);border-color:rgba(234,179,8,.45);}
.ssd-today .title{color:#a16207;} .ssd-today .sub{color:#854d0e;}
.ssd-today .when{background:#eab308;color:#111;}
.ssd-future{background:rgba(37,99,235,.1);border-color:rgba(37,99,235,.35);}
.ssd-future .title{color:#1d4ed8;} .ssd-future .sub{color:#1e40af;}
.ssd-future .when{background:#2563eb;color:#fff;}
.ssd-dark .ssd-ongoing .title{color:#4ade80;} .ssd-dark .ssd-ongoing .sub{color:#86efac;}
.ssd-dark .ssd-today .title{color:#facc15;} .ssd-dark .ssd-today .sub{color:#fde68a;}
.ssd-dark .ssd-future .title{color:#93c5fd;} .ssd-dark .ssd-future .sub{color:#bfdbfe;}
.ssd-pulse{display:inline-block;width:8px;height:8px;border-radius:50%;background:#16a34a;
margin-right:6px;animation:ssdPulse 1.2s infinite;}
@keyframes ssdPulse{0%{box-shadow:0 0 0 0 rgba(22,163,74,.5)}70%{box-shadow:0 0 0 8px rgba(22,163,74,0)}100%{box-shadow:0 0 0 0 rgba(22,163,74,0)}}
.ssd-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:20px;}
.ssd-stat{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;
display:flex;align-items:center;gap:12px;box-shadow:0 1px 3px rgba(15,23,42,.08);}
.ssd-stat .emo{width:44px;height:44px;border-radius:12px;display:flex;
align-items:center;justify-content:center;flex:none;}
.ssd-stat .num{font-size:20px;font-weight:800;color:var(--strong);}
.ssd-stat .lbl{font-size:11px;color:var(--muted);font-weight:600;}
.ssd-card{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:20px;}
.ssd-card-h{padding:14px 18px;border-bottom:1px solid var(--line);font-weight:700;color:var(--strong);font-size:15px;display:flex;align-items:center;}
.ssd-list{display:flex;flex-direction:column;gap:10px;padding:16px 18px;}
.ssd-item{display:flex;align-items:center;gap:14px;border:1px solid var(--border);
border-radius:12px;padding:12px 14px;background:var(--hover);flex-wrap:wrap;}
.ssd-item.done{opacity:.55;}
.ssd-item.live{border-color:rgba(34,197,94,.5);}
.ssd-time{font-weight:800;color:#2563eb;font-size:13px;min-width:110px;}
.ssd-detail{display:flex;flex-direction:column;gap:2px;flex:1;min-width:180px;}
.ssd-detail b{color:var(--strong);font-size:13.5px;}
.ssd-detail span{color:var(--muted);font-size:12px;}
.ssd-st{flex:none;border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:800;}
.ssd-st.done{background:rgba(100,116,139,.15);color:#64748b;}
.ssd-st.live{background:rgba(34,197,94,.15);color:#15803d;}
.ssd-st.next{background:rgba(37,99,235,.12);color:#1d4ed8;}
.ssd-dark .ssd-st.live{color:#4ade80;} .ssd-dark .ssd-st.next{color:#93c5fd;}
.ssd-table-wrap{overflow-x:auto;}
.ssd-table{width:100%;border-collapse:collapse;}
.ssd-table th{background:var(--th-bg);color:var(--th-text);text-align:left;font-size:11px;
letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;}
.ssd-table td{padding:12px 16px;border-top:1px solid var(--line);color:var(--text);font-size:13.5px;}
.ssd-table tr:hover td{background:var(--hover);}
.ssd-empty{text-align:center;color:var(--muted);padding:22px 0 !important;}
.ssd-error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.45);color:#fca5a5;
border-radius:12px;padding:12px 16px;font-size:13px;margin-bottom:16px;display:flex;align-items:center;}
`;

export default function StudentDashboard() {
  const theme = useAppTheme();
  const [me, setMe] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setForbidden(false);
    const [meR, schR] = await Promise.allSettled([
      api.get('/me'),
      api.get('/student/schedule'),
    ]);
    if (meR.status === 'fulfilled') setMe(meR.value.data?.data || meR.value.data?.user || meR.value.data);
    if (schR.status === 'fulfilled') {
      setSchedules(schR.value.data?.data || schR.value.data || []);
    } else {
      const status = schR.reason?.response?.status;
      if (status === 403) {
        setForbidden(true);
        setError(
          <><Lock size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> 
          Halaman ini khusus akun SISWA. Akun kamu tidak memiliki akses ke jadwal siswa.</>
        );
      } else {
        setError('Gagal memuat jadwal kelas. Coba muat ulang.');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* semua hook useMemo SEBELUM early return */
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const today = todayName();

  const todayList = useMemo(
    () =>
      schedules
        .filter((s) => s.day === today)
        .sort((a, b) => toMin(a.start_time) - toMin(b.start_time))
        .map((s) => ({
          ...s,
          st: toMin(s.end_time) <= nowM ? 'done' : toMin(s.start_time) <= nowM ? 'live' : 'next',
        })),
    [schedules, today, nowM]
  );

  const reminder = useMemo(() => {
    const live = todayList.find((s) => s.st === 'live');
    if (live) return { type: 'ongoing', item: live };
    const up = todayList.find((s) => s.st === 'next');
    if (up) return { type: 'today', item: up, diff: 0 };
    const tIdx = DAY_ORDER.indexOf(today);
    for (let d = 1; d <= 7; d++) {
      const day = DAY_ORDER[(tIdx + d) % 7];
      const list = schedules.filter((s) => s.day === day);
      if (list.length) {
        const first = [...list].sort((a, b) => toMin(a.start_time) - toMin(b.start_time))[0];
        return { type: 'future', item: first, diff: d };
      }
    }
    return null;
  }, [todayList, schedules, today]);

  const sortedWeek = useMemo(
    () => [...schedules].sort((a, b) =>
      a.day === b.day ? toMin(a.start_time) - toMin(b.start_time) : DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)),
    [schedules]
  );

  /* baru early return */
  if (loading) return <PageLoader text="Menyiapkan dashboard kamu…" />;

  const className = schedules[0]?.class?.name || '';
  const uniqueSubjects = [...new Set(schedules.map((s) => s.subject?.name).filter(Boolean))];
  const uniqueRooms = [...new Set(schedules.map((s) => s.room?.name).filter(Boolean))];

  const greeting =
    now.getHours() < 11 ? 'Selamat pagi' : now.getHours() < 15 ? 'Selamat siang' :
    now.getHours() < 19 ? 'Selamat sore' : 'Selamat malam';

  const whenText = (r) => {
    if (r.type === 'ongoing') return <><Circle size={14} fill="#22c55e" color="#22c55e" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> Sekarang</>;
    if (r.type === 'today') {
      const m = toMin(r.item.start_time) - nowM;
      return <><Clock size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> {m <= 90 ? `${m} mnt lagi` : 'Hari ini'}</>;
    }
    return <><Calendar size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> {r.diff === 1 ? 'Besok' : `${r.diff} hari lagi`}</>;
  };

  const banner = (r) => {
    const s = r.item;
    const sub = `${s.day}, ${fmtTime(s.start_time)}–${fmtTime(s.end_time)} · ${s.subject?.name || 'Mapel'} · ` +
      `Kelas ${s.class?.name || '-'} · Ruangan ${s.room?.name || '-'}`;
    if (r.type === 'ongoing') return { 
      icon: <Circle size={26} fill="#22c55e" color="#22c55e" />, 
      title: `Sedang berlangsung: ${s.subject?.name}`, 
      sub 
    };
    if (r.type === 'today') return { 
      icon: <Clock size={26} color="#eab308" />, 
      title: `Jangan lupa! ${fmtTime(s.start_time)} pelajaran ${s.subject?.name}`, 
      sub 
    };
    return { 
      icon: <Calendar size={26} color="#2563eb" />, 
      title: `Pelajaran berikutnya: ${s.day} — ${s.subject?.name} (${s.room?.name})`, 
      sub 
    };
  };

  return (
    <div className={`ssd ${theme === 'dark' ? 'ssd-dark' : ''}`}>
      <style>{css}</style>

      <h2 className="ssd-greet">
        {greeting}, {me?.name ? me.name.split(',')[0] : 'Siswa'} <Hand size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 4 }} />
      </h2>
      <p className="ssd-sub">
        {className ? `Kelas ${className} · ` : ''}
        {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} — semangat belajarnya!
      </p>

      {error && <div className="ssd-error">{error}</div>}

      {!forbidden && reminder && (
        <div className={`ssd-banner ssd-${reminder.type}`}>
          <div className="ic">{banner(reminder).icon}</div>
          <div className="body">
            <div className="title">
              {reminder.type === 'ongoing' && <span className="ssd-pulse" />}
              {banner(reminder).title}
            </div>
            <div className="sub">{banner(reminder).sub}</div>
          </div>
          <div className="when">{whenText(reminder)}</div>
        </div>
      )}
      {!forbidden && !reminder && (
        <div className="ssd-banner ssd-future">
          <div className="ic"><Coffee size={26} color="#64748b" /></div>
          <div className="body">
            <div className="title">Belum ada jadwal untuk kelas kamu.</div>
            <div className="sub">Jadwal akan muncul setelah admin mengisinya.</div>
          </div>
        </div>
      )}

      <div className="ssd-stats">
        <div className="ssd-stat">
          <div className="emo" style={{ background: 'rgba(37,99,235,.12)' }}><CalendarDays size={22} color="#2563eb" /></div>
          <div><div className="num">{forbidden ? '–' : schedules.length}</div><div className="lbl">Slot Jadwal Minggu Ini</div></div>
        </div>
        <div className="ssd-stat">
          <div className="emo" style={{ background: 'rgba(34,197,94,.12)' }}><Sun size={22} color="#22c55e" /></div>
          <div><div className="num">{forbidden ? '–' : todayList.length}</div><div className="lbl">Jadwal Hari Ini</div></div>
        </div>
        <div className="ssd-stat">
          <div className="emo" style={{ background: 'rgba(234,179,8,.15)' }}><BookOpen size={22} color="#eab308" /></div>
          <div><div className="num">{forbidden ? '–' : uniqueSubjects.length}</div><div className="lbl">Mata Pelajaran</div></div>
        </div>
        <div className="ssd-stat">
          <div className="emo" style={{ background: 'rgba(168,85,247,.12)' }}><DoorOpen size={22} color="#a855f7" /></div>
          <div><div className="num">{forbidden ? '–' : uniqueRooms.length}</div><div className="lbl">Ruangan Dipakai</div></div>
        </div>
      </div>

      <div className="ssd-card">
        <div className="ssd-card-h">
          <Calendar size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} /> 
          Jadwal Hari Ini — {today} {dateForDay(today) ? `(${fmtDateShort(dateForDay(today))})` : ''}
        </div>
        {forbidden ? (
          <div className="ssd-empty">Akses ditolak — halaman ini hanya untuk akun siswa.</div>
        ) : todayList.length === 0 ? (
          <div className="ssd-empty">
            Tidak ada pelajaran hari ini. {reminder?.type === 'future' ? `Pelajaran berikutnya: ${reminder.item.day}.` : ''}
          </div>
        ) : (
          <div className="ssd-list">
            {todayList.map((s) => (
              <div className={`ssd-item ${s.st === 'done' ? 'done' : ''} ${s.st === 'live' ? 'live' : ''}`} key={s.id}>
                <div className="ssd-time">{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</div>
                <div className="ssd-detail">
                  <b>{s.subject?.name || 'Mata Pelajaran'} — {s.teacher?.user?.name || ''}</b>
                  <span>Ruangan {s.room?.name || '-'}</span>
                </div>
                <span className={`ssd-st ${s.st}`}>
                  {s.st === 'done' ? 'Selesai' : s.st === 'live' ? 'Berlangsung' : 'Akan datang'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ssd-card">
        <div className="ssd-card-h">
          <CalendarDays size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} /> 
          Jadwal Minggu Ini
        </div>
        <div className="ssd-table-wrap">
          <table className="ssd-table">
            <thead>
              <tr><th>Hari</th><th>Jam</th><th>Mata Pelajaran</th><th>Guru</th><th>Ruangan</th></tr>
            </thead>
            <tbody>
              {forbidden ? (
                <tr><td className="ssd-empty" colSpan="5">–</td></tr>
              ) : sortedWeek.length === 0 ? (
                <tr><td className="ssd-empty" colSpan="5">Belum ada jadwal untuk kelas kamu.</td></tr>
              ) : (
                sortedWeek.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.day}
                      <br />
                      <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> {fmtDateShort(dateForDay(s.day))}
                      </span>
                    </td>
                    <td>{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</td>
                    <td>{s.subject?.name || '-'}</td>
                    <td>{s.teacher?.user?.name || '-'}</td>
                    <td>{s.room?.name || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}