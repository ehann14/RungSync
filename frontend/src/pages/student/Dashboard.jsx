import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Lock, Hand, Circle, Clock, Calendar, Coffee,
  CalendarDays, Sun, BookOpen, DoorOpen, BarChart3, PieChart
} from 'lucide-react';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';

const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
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
.ssd{padding:0;
--card:#ffffff;--border:#eef0f8;--text:#5b5e73;--strong:#151327;--muted:#9698ab;--line:#f1f2f9;
--th-bg:#f6f6fc;--th-text:#2563eb;--soft:#f6f6fc;--hover:#f6f6fc;--primary:#2563eb;--primary2:#2563eb;}
.ssd.ssd-dark{--card:#161a30;--border:#242a48;--text:#c2c5dd;--strong:#f1f2fb;--muted:#7d81a3;
--th-bg:#1d2340;--th-text:#a5b4fc;--soft:#1b2036;--hover:#1b2036;--line:#232948;}
.ssd-greet{font-size:19px;font-weight:800;color:var(--strong);margin:0 0 4px;display:flex;align-items:center;gap:6px;}
.ssd-sub{font-size:12.5px;color:var(--muted);margin:0 0 18px;}
.ssd-banner{display:flex;align-items:center;gap:14px;border-radius:18px;padding:16px 18px;
margin-bottom:20px;border:1px solid;animation:ssdIn .35s ease;}
@keyframes ssdIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.ssd-banner .ic{flex:none;display:flex;align-items:center;}
.ssd-banner .body{flex:1;min-width:0;}
.ssd-banner .title{font-size:15px;font-weight:800;display:flex;align-items:center;}
.ssd-banner .sub{font-size:12.5px;margin-top:3px;line-height:1.6;}
.ssd-banner .when{flex:none;font-weight:800;font-size:12px;border-radius:999px;padding:8px 14px;white-space:nowrap;}
.ssd-ongoing{background:rgba(34,197,94,.09);border-color:rgba(34,197,94,.32);}
.ssd-ongoing .title{color:#15803d;} .ssd-ongoing .sub{color:#166534;}
.ssd-ongoing .when{background:#22c55e;color:#fff;}
.ssd-today{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.35);}
.ssd-today .title{color:#b45309;} .ssd-today .sub{color:#92400e;}
.ssd-today .when{background:#f59e0b;color:#fff;}
.ssd-future{background:rgba(37,99,235,.08);border-color:rgba(37,99,235,.28);}
.ssd-future .title{color:#4338ca;} .ssd-future .sub{color:#4338ca;}
.ssd-future .when{background:var(--primary);color:#fff;}
.ssd-dark .ssd-ongoing .title{color:#4ade80;} .ssd-dark .ssd-ongoing .sub{color:#86efac;}
.ssd-dark .ssd-today .title{color:#fbbf24;} .ssd-dark .ssd-today .sub{color:#fde68a;}
.ssd-dark .ssd-future .title{color:#a5b4fc;} .ssd-dark .ssd-future .sub{color:#c7d2fe;}
.ssd-pulse{display:inline-block;width:8px;height:8px;border-radius:50%;background:#16a34a;
margin-right:6px;animation:ssdPulse 1.2s infinite;}
@keyframes ssdPulse{0%{box-shadow:0 0 0 0 rgba(22,163,74,.5)}70%{box-shadow:0 0 0 8px rgba(22,163,74,0)}100%{box-shadow:0 0 0 0 rgba(22,163,74,0)}}

.ssd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;}
@media (max-width:1000px){ .ssd-stats{grid-template-columns:repeat(2,1fr);} }
@media (max-width:520px){ .ssd-stats{grid-template-columns:1fr;} }
.ssd-stat{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:16px;
display:flex;align-items:center;gap:12px;box-shadow:0 1px 2px rgba(20,20,50,.03);}
.ssd-stat.featured{background:var(--primary);border-color:transparent;color:#fff;}
.ssd-stat .emo{width:42px;height:42px;border-radius:12px;display:flex;
align-items:center;justify-content:center;flex:none;background:var(--soft);color:var(--primary);}
.ssd-stat.featured .emo{background:rgba(255,255,255,.2);color:#fff;}
.ssd-stat .num{font-size:20px;font-weight:800;color:var(--strong);}
.ssd-stat.featured .num{color:#fff;}
.ssd-stat .lbl{font-size:11px;color:var(--muted);font-weight:700;}
.ssd-stat.featured .lbl{color:rgba(255,255,255,.85);}

.ssd-grid2{display:grid;grid-template-columns:1.65fr 1fr;gap:16px;margin-bottom:20px;}
@media (max-width:980px){ .ssd-grid2{grid-template-columns:1fr;} }

.ssd-card{background:var(--card);border:1px solid var(--border);border-radius:18px;overflow:hidden;margin-bottom:20px;}
.ssd-card-h{padding:16px 20px;border-bottom:1px solid var(--line);font-weight:800;color:var(--strong);font-size:14.5px;display:flex;align-items:center;gap:8px;}

.ssd-bars{display:flex;align-items:flex-end;gap:14px;height:180px;padding:16px 20px 8px;}
.ssd-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;height:100%;justify-content:flex-end;}
.ssd-bar-track{width:100%;max-width:34px;flex:1;display:flex;align-items:flex-end;position:relative;}
.ssd-bar-fill{width:100%;border-radius:10px 10px 4px 4px;background:var(--soft);transition:height .6s cubic-bezier(.2,.8,.2,1);position:relative;}
.ssd-bar-fill.hi{background:var(--primary);}
.ssd-bar-fill .tip{position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-size:10.5px;font-weight:800;color:var(--strong);}
.ssd-bar-lbl{font-size:11px;color:var(--muted);font-weight:700;}
.ssd-bar-lbl.hi{color:var(--primary);}

.ssd-donut-wrap{display:flex;flex-direction:column;align-items:center;padding:18px 20px 6px;}
.ssd-donut{width:140px;height:140px;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;}
.ssd-donut::before{content:'';position:absolute;inset:15px;border-radius:50%;background:var(--card);}
.ssd-donut-mid{position:relative;text-align:center;}
.ssd-donut-mid b{display:block;font-size:20px;color:var(--strong);}
.ssd-donut-mid span{font-size:10px;color:var(--muted);font-weight:700;}
.ssd-legend{width:100%;padding:14px 20px 20px;display:flex;flex-direction:column;gap:10px;}
.ssd-legend-row{display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--text);}
.ssd-legend-row .dot{width:9px;height:9px;border-radius:3px;flex:none;}
.ssd-legend-row .nm{flex:1;font-weight:700;color:var(--strong);}
.ssd-legend-row .val{font-weight:800;color:var(--strong);}

.ssd-list{display:flex;flex-direction:column;gap:10px;padding:16px 20px;}
.ssd-item{display:flex;align-items:center;gap:14px;border:1px solid var(--border);
border-radius:14px;padding:12px 14px;background:var(--hover);flex-wrap:wrap;}
.ssd-item.done{opacity:.55;}
.ssd-item.live{border-color:rgba(34,197,94,.45);}
.ssd-time{font-weight:800;color:var(--primary);font-size:13px;min-width:110px;}
.ssd-detail{display:flex;flex-direction:column;gap:2px;flex:1;min-width:180px;}
.ssd-detail b{color:var(--strong);font-size:13.5px;}
.ssd-detail span{color:var(--muted);font-size:12px;}
.ssd-st{flex:none;border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:800;}
.ssd-st.done{background:rgba(150,152,171,.15);color:var(--muted);}
.ssd-st.live{background:rgba(34,197,94,.13);color:#15803d;}
.ssd-st.next{background:rgba(37,99,235,.1);color:var(--primary);}
.ssd-dark .ssd-st.live{color:#4ade80;} .ssd-dark .ssd-st.next{color:#a5b4fc;}
.ssd-table-wrap{overflow-x:auto;}
.ssd-table{width:100%;border-collapse:collapse;}
.ssd-table th{background:var(--th-bg);color:var(--th-text);text-align:left;font-size:11px;
letter-spacing:.07em;text-transform:uppercase;padding:12px 20px;}
.ssd-table td{padding:12px 20px;border-top:1px solid var(--line);color:var(--text);font-size:13.5px;}
.ssd-table tr:hover td{background:var(--hover);}
.ssd-empty{text-align:center;color:var(--muted);padding:22px 0 !important;}
.ssd-error{background:rgba(239,68,68,.09);border:1px solid rgba(239,68,68,.35);color:#dc2626;
border-radius:14px;padding:12px 16px;font-size:13px;margin-bottom:16px;display:flex;align-items:center;}
.ssd-dark .ssd-error{color:#fca5a5;}

.ssd-grow-list{display:flex;flex-direction:column;gap:14px;padding:16px 20px 20px;}
.ssd-grow-item{display:flex;align-items:center;gap:12px;}
.ssd-grow-circle{width:38px;height:38px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;}
.ssd-grow-body{flex:1;min-width:0;}
.ssd-grow-body .nm{font-weight:700;color:var(--strong);font-size:13px;}
.ssd-grow-body .bar{height:5px;border-radius:99px;background:var(--line);margin-top:6px;overflow:hidden;}
.ssd-grow-body .bar i{display:block;height:100%;border-radius:99px;background:var(--primary);}
.ssd-grow-num{font-weight:800;color:var(--strong);font-size:13px;}
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
      icon: <Circle size={24} fill="#22c55e" color="#22c55e" />,
      title: `Sedang berlangsung: ${s.subject?.name}`,
      sub
    };
    if (r.type === 'today') return {
      icon: <Clock size={24} color="#f59e0b" />,
      title: `Jangan lupa! ${fmtTime(s.start_time)} pelajaran ${s.subject?.name}`,
      sub
    };
    return {
      icon: <Calendar size={24} color="#2563eb" />,
      title: `Pelajaran berikutnya: ${s.day} — ${s.subject?.name} (${s.room?.name})`,
      sub
    };
  };

  /* ===== chart: jumlah pelajaran per hari (Senin-Jumat) ===== */
  const weeklyCounts = DAY_ORDER.map((d) => ({ d, n: schedules.filter((s) => s.day === d).length }));
  const maxWeekly = Math.max(1, ...weeklyCounts.map((w) => w.n));

  /* ===== donat: status pelajaran hari ini ===== */
  const liveCount = todayList.filter((s) => s.st === 'live').length;
  const nextCount = todayList.filter((s) => s.st === 'next').length;
  const doneCount = todayList.filter((s) => s.st === 'done').length;
  const totalToday = todayList.length || 1;
  const pLive = Math.round((liveCount / totalToday) * 100);
  const pNext = Math.round((nextCount / totalToday) * 100);
  const donutStyle = (forbidden || todayList.length === 0)
    ? { background: 'var(--soft)' }
    : { background: `conic-gradient(#22c55e 0 ${pLive}%, #2563eb ${pLive}% ${pLive + pNext}%, #9698ab ${pLive + pNext}% 100%)` };

  /* ===== list: mata pelajaran berdasar jumlah slot ===== */
  const subjCounts = {};
  schedules.forEach((s) => {
    const nm = s.subject?.name;
    if (nm) subjCounts[nm] = (subjCounts[nm] || 0) + 1;
  });
  const topSubjects = Object.entries(subjCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxSubjCount = Math.max(1, ...topSubjects.map(([, n]) => n));
  const circleColors = ['#2563eb', '#06b6d4', '#f59e0b', '#ec4899'];

  return (
    <div className={`ssd ${theme === 'dark' ? 'ssd-dark' : ''}`}>
      <style>{css}</style>

      <h2 className="ssd-greet">
        {greeting}, {me?.name ? me.name.split(',')[0] : 'Siswa'} <Hand size={18} />
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
          <div className="ic"><Coffee size={24} color="#9698ab" /></div>
          <div className="body">
            <div className="title">Belum ada jadwal untuk kelas kamu.</div>
            <div className="sub">Jadwal akan muncul setelah admin mengisinya.</div>
          </div>
        </div>
      )}

      <div className="ssd-stats">
        <div className="ssd-stat featured">
          <div className="emo"><CalendarDays size={20} /></div>
          <div><div className="num">{forbidden ? '–' : schedules.length}</div><div className="lbl">Slot Jadwal Minggu Ini</div></div>
        </div>
        <div className="ssd-stat">
          <div className="emo"><Sun size={20} /></div>
          <div><div className="num">{forbidden ? '–' : todayList.length}</div><div className="lbl">Jadwal Hari Ini</div></div>
        </div>
        <div className="ssd-stat">
          <div className="emo"><BookOpen size={20} /></div>
          <div><div className="num">{forbidden ? '–' : uniqueSubjects.length}</div><div className="lbl">Mata Pelajaran</div></div>
        </div>
        <div className="ssd-stat">
          <div className="emo"><DoorOpen size={20} /></div>
          <div><div className="num">{forbidden ? '–' : uniqueRooms.length}</div><div className="lbl">Ruangan Dipakai</div></div>
        </div>
      </div>

      <div className="ssd-grid2">
        <div className="ssd-card">
          <div className="ssd-card-h"><BarChart3 size={16} /> Pelajaran per Hari</div>
          <div className="ssd-bars">
            {weeklyCounts.map((w) => {
              const h = Math.max(6, Math.round((w.n / maxWeekly) * 140));
              const isToday = w.d === today;
              return (
                <div className="ssd-bar-col" key={w.d}>
                  <div className="ssd-bar-track">
                    <div className={`ssd-bar-fill ${isToday ? 'hi' : ''}`} style={{ height: forbidden ? '6px' : `${h}px` }}>
                      {!forbidden && w.n > 0 && <span className="tip">{w.n}</span>}
                    </div>
                  </div>
                  <span className={`ssd-bar-lbl ${isToday ? 'hi' : ''}`}>{w.d.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ssd-card">
          <div className="ssd-card-h"><PieChart size={16} /> Status Hari Ini</div>
          <div className="ssd-donut-wrap">
            <div className="ssd-donut" style={donutStyle}>
              <div className="ssd-donut-mid">
                <b>{forbidden ? '–' : todayList.length}</b>
                <span>SLOT</span>
              </div>
            </div>
          </div>
          <div className="ssd-legend">
            <div className="ssd-legend-row"><span className="dot" style={{ background: '#22c55e' }} /><span className="nm">Berlangsung</span><span className="val">{forbidden ? '–' : liveCount}</span></div>
            <div className="ssd-legend-row"><span className="dot" style={{ background: '#2563eb' }} /><span className="nm">Akan datang</span><span className="val">{forbidden ? '–' : nextCount}</span></div>
            <div className="ssd-legend-row"><span className="dot" style={{ background: '#9698ab' }} /><span className="nm">Selesai</span><span className="val">{forbidden ? '–' : doneCount}</span></div>
          </div>
        </div>
      </div>

      <div className="ssd-card">
        <div className="ssd-card-h">
          <Calendar size={16} /> Jadwal Hari Ini — {today} {dateForDay(today) ? `(${fmtDateShort(dateForDay(today))})` : ''}
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

      <div className="ssd-grid2">
        <div className="ssd-card" style={{ marginBottom: 0 }}>
          <div className="ssd-card-h"><CalendarDays size={16} /> Jadwal Minggu Ini</div>
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

        <div className="ssd-card" style={{ marginBottom: 0 }}>
          <div className="ssd-card-h"><BookOpen size={16} /> Mata Pelajaran</div>
          <div className="ssd-grow-list">
            {topSubjects.length === 0 ? (
              <div className="ssd-empty">Belum ada mata pelajaran.</div>
            ) : (
              topSubjects.map(([name, count], i) => (
                <div className="ssd-grow-item" key={name}>
                  <div className="ssd-grow-circle" style={{ background: circleColors[i % circleColors.length] }}>
                    <BookOpen size={15} />
                  </div>
                  <div className="ssd-grow-body">
                    <div className="nm">{name}</div>
                    <div className="bar"><i style={{ width: `${(count / maxSubjCount) * 100}%` }} /></div>
                  </div>
                  <div className="ssd-grow-num">{count}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}