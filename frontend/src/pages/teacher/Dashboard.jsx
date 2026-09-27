import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Circle, Clock, Calendar, Coffee, CalendarDays,
  Sun, GraduationCap, DoorOpen, ArrowLeftRight, Hand, BarChart3, PieChart
} from 'lucide-react';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';

const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const fmtTime = (t) => (t ? String(t).slice(0, 5).replace(':', '.') : '');
const toMin = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + m; };
const todayISO = () => new Date().toISOString().slice(0, 10);
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
.tsd{padding:0;
--card:#ffffff;--border:#eef0f8;--text:#5b5e73;--strong:#151327;--muted:#9698ab;--line:#f1f2f9;
--th-bg:#f6f6fc;--th-text:#2563eb;--soft:#f6f6fc;--hover:#f6f6fc;--primary:#2563eb;--primary2:#2563eb;}
.tsd.tsd-dark{--card:#161a30;--border:#242a48;--text:#c2c5dd;--strong:#f1f2fb;--muted:#7d81a3;
--th-bg:#1d2340;--th-text:#a5b4fc;--soft:#1b2036;--hover:#1b2036;--line:#232948;}
.tsd-greet{font-size:19px;font-weight:800;color:var(--strong);margin:0 0 4px;display:flex;align-items:center;gap:6px;}
.tsd-date{font-size:12.5px;color:var(--muted);margin:0 0 18px;}
.tsd-banner{display:flex;align-items:center;gap:14px;border-radius:18px;padding:16px 18px;
margin-bottom:20px;border:1px solid;animation:tsdIn .35s ease;}
@keyframes tsdIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.tsd-banner .ic{flex:none;display:flex;align-items:center;}
.tsd-banner .body{flex:1;min-width:0;}
.tsd-banner .title{font-size:15px;font-weight:800;display:flex;align-items:center;}
.tsd-banner .sub{font-size:12.5px;margin-top:3px;line-height:1.6;}
.tsd-banner .when{flex:none;font-weight:800;font-size:12px;border-radius:999px;padding:8px 14px;white-space:nowrap;}
.tsd-ongoing{background:rgba(34,197,94,.09);border-color:rgba(34,197,94,.32);}
.tsd-ongoing .title{color:#15803d;} .tsd-ongoing .sub{color:#166534;}
.tsd-ongoing .when{background:#22c55e;color:#fff;}
.tsd-today{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.35);}
.tsd-today .title{color:#b45309;} .tsd-today .sub{color:#92400e;}
.tsd-today .when{background:#f59e0b;color:#fff;}
.tsd-future{background:rgba(37,99,235,.08);border-color:rgba(37,99,235,.28);}
.tsd-future .title{color:#4338ca;} .tsd-future .sub{color:#4338ca;}
.tsd-future .when{background:var(--primary);color:#fff;}
.tsd-dark .tsd-ongoing .title{color:#4ade80;} .tsd-dark .tsd-ongoing .sub{color:#86efac;}
.tsd-dark .tsd-today .title{color:#fbbf24;} .tsd-dark .tsd-today .sub{color:#fde68a;}
.tsd-dark .tsd-future .title{color:#a5b4fc;} .tsd-dark .tsd-future .sub{color:#c7d2fe;}
.tsd-pulse{display:inline-block;width:8px;height:8px;border-radius:50%;background:#16a34a;
margin-right:6px;animation:tsdPulse 1.2s infinite;}
@keyframes tsdPulse{0%{box-shadow:0 0 0 0 rgba(22,163,74,.5)}70%{box-shadow:0 0 0 8px rgba(22,163,74,0)}100%{box-shadow:0 0 0 0 rgba(22,163,74,0)}}

.tsd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;}
@media (max-width:1000px){ .tsd-stats{grid-template-columns:repeat(2,1fr);} }
@media (max-width:520px){ .tsd-stats{grid-template-columns:1fr;} }
.tsd-stat{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:16px;
display:flex;align-items:center;gap:12px;box-shadow:0 1px 2px rgba(20,20,50,.03);}
.tsd-stat.featured{background:var(--primary);border-color:transparent;color:#fff;}
.tsd-stat .emo{width:42px;height:42px;border-radius:12px;display:flex;
align-items:center;justify-content:center;flex:none;background:var(--soft);color:var(--primary);}
.tsd-stat.featured .emo{background:rgba(255,255,255,.2);color:#fff;}
.tsd-stat .num{font-size:20px;font-weight:800;color:var(--strong);}
.tsd-stat.featured .num{color:#fff;}
.tsd-stat .lbl{font-size:11px;color:var(--muted);font-weight:700;}
.tsd-stat.featured .lbl{color:rgba(255,255,255,.85);}

.tsd-grid2{display:grid;grid-template-columns:1.65fr 1fr;gap:16px;margin-bottom:20px;}
@media (max-width:980px){ .tsd-grid2{grid-template-columns:1fr;} }

.tsd-card{background:var(--card);border:1px solid var(--border);border-radius:18px;overflow:hidden;margin-bottom:20px;}
.tsd-card-h{padding:16px 20px;border-bottom:1px solid var(--line);font-weight:800;color:var(--strong);font-size:14.5px;display:flex;align-items:center;gap:8px;}

.tsd-bars{display:flex;align-items:flex-end;gap:14px;height:180px;padding:16px 20px 8px;}
.tsd-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;height:100%;justify-content:flex-end;}
.tsd-bar-track{width:100%;max-width:34px;flex:1;display:flex;align-items:flex-end;position:relative;}
.tsd-bar-fill{width:100%;border-radius:10px 10px 4px 4px;background:var(--soft);transition:height .6s cubic-bezier(.2,.8,.2,1);position:relative;}
.tsd-bar-fill.hi{background:var(--primary);}
.tsd-bar-fill .tip{position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-size:10.5px;font-weight:800;color:var(--strong);}
.tsd-bar-lbl{font-size:11px;color:var(--muted);font-weight:700;}
.tsd-bar-lbl.hi{color:var(--primary);}

.tsd-donut-wrap{display:flex;flex-direction:column;align-items:center;padding:18px 20px 6px;}
.tsd-donut{width:140px;height:140px;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;}
.tsd-donut::before{content:'';position:absolute;inset:15px;border-radius:50%;background:var(--card);}
.tsd-donut-mid{position:relative;text-align:center;}
.tsd-donut-mid b{display:block;font-size:20px;color:var(--strong);}
.tsd-donut-mid span{font-size:10px;color:var(--muted);font-weight:700;}
.tsd-legend{width:100%;padding:14px 20px 20px;display:flex;flex-direction:column;gap:10px;}
.tsd-legend-row{display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--text);}
.tsd-legend-row .dot{width:9px;height:9px;border-radius:3px;flex:none;}
.tsd-legend-row .nm{flex:1;font-weight:700;color:var(--strong);}
.tsd-legend-row .val{font-weight:800;color:var(--strong);}

.tsd-today-list{display:flex;flex-direction:column;gap:10px;padding:16px 20px;}
.tsd-item{display:flex;align-items:center;gap:14px;border:1px solid var(--border);
border-radius:14px;padding:12px 14px;background:var(--hover);flex-wrap:wrap;}
.tsd-item.done{opacity:.55;}
.tsd-item.live{border-color:rgba(34,197,94,.45);}
.tsd-time{font-weight:800;color:var(--primary);font-size:13px;min-width:110px;}
.tsd-detail{display:flex;flex-direction:column;gap:2px;flex:1;min-width:180px;}
.tsd-detail b{color:var(--strong);font-size:13.5px;}
.tsd-detail span{color:var(--muted);font-size:12px;}
.tsd-st{flex:none;border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:800;}
.tsd-st.done{background:rgba(150,152,171,.15);color:var(--muted);}
.tsd-st.live{background:rgba(34,197,94,.13);color:#15803d;}
.tsd-st.next{background:rgba(37,99,235,.1);color:var(--primary);}
.tsd-dark .tsd-st.live{color:#4ade80;} .tsd-dark .tsd-st.next{color:#a5b4fc;}
.tsd-move{font-size:11px;color:#b45309;background:rgba(245,158,11,.14);border-radius:999px;padding:3px 10px;display:flex;align-items:center;}
.tsd-table-wrap{overflow-x:auto;}
.tsd-table{width:100%;border-collapse:collapse;}
.tsd-table th{background:var(--th-bg);color:var(--th-text);text-align:left;font-size:11px;
letter-spacing:.07em;text-transform:uppercase;padding:12px 20px;}
.tsd-table td{padding:12px 20px;border-top:1px solid var(--line);color:var(--text);font-size:13.5px;}
.tsd-table tr:hover td{background:var(--hover);}
.tsd-empty{text-align:center;color:var(--muted);padding:22px 0 !important;}
.tsd-error{background:rgba(239,68,68,.09);border:1px solid rgba(239,68,68,.35);color:#dc2626;
border-radius:14px;padding:12px 16px;font-size:13px;margin-bottom:16px;}
.tsd-dark .tsd-error{color:#fca5a5;}

.tsd-grow-list{display:flex;flex-direction:column;gap:14px;padding:16px 20px 20px;}
.tsd-grow-item{display:flex;align-items:center;gap:12px;}
.tsd-grow-circle{width:38px;height:38px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;}
.tsd-grow-body{flex:1;min-width:0;}
.tsd-grow-body .nm{font-weight:700;color:var(--strong);font-size:13px;}
.tsd-grow-body .bar{height:5px;border-radius:99px;background:var(--line);margin-top:6px;overflow:hidden;}
.tsd-grow-body .bar i{display:block;height:100%;border-radius:99px;background:var(--primary);}
.tsd-grow-num{font-weight:800;color:var(--strong);font-size:13px;}
`;

export default function TeacherDashboard() {
  const theme = useAppTheme();
  const [me, setMe] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [meR, schR, trR] = await Promise.allSettled([
      api.get('/me'),
      api.get('/teacher/schedule'),
      api.get('/teacher/room-transfers'),
    ]);
    if (meR.status === 'fulfilled') setMe(meR.value.data?.data || meR.value.data?.user || meR.value.data);
    if (schR.status === 'fulfilled') setSchedules(schR.value.data?.data || schR.value.data || []);
    else setError('Gagal memuat jadwal.');
    if (trR.status === 'fulfilled') setTransfers(trR.value.data?.data || trR.value.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const today = todayName();

  const roomOverride = useMemo(() => {
    const map = {};
    transfers.forEach((t) => {
      const st = String(t.status || '').toLowerCase();
      const date = String(t.date || t.transfer_date || t.effective_date || '').slice(0, 10);
      if ((st === 'approved' || st === 'disetujui') && date === todayISO()) {
        map[t.schedule_id] = t.room?.name || t.to_room?.name;
      }
    });
    return map;
  }, [transfers]);

  const enriched = useMemo(
    () => schedules.map((s) => ({ ...s, roomName: roomOverride[s.id] || s.room?.name || '-' })),
    [schedules, roomOverride]
  );

  const todayList = useMemo(
    () =>
      enriched
        .filter((s) => s.day === today)
        .sort((a, b) => toMin(a.start_time) - toMin(b.start_time))
        .map((s) => ({
          ...s,
          st: toMin(s.end_time) <= nowM ? 'done' : toMin(s.start_time) <= nowM ? 'live' : 'next',
        })),
    [enriched, today, nowM]
  );

  const reminder = useMemo(() => {
    const live = todayList.find((s) => s.st === 'live');
    if (live) return { type: 'ongoing', item: live };
    const up = todayList.find((s) => s.st === 'next');
    if (up) return { type: 'today', item: up, diff: 0 };
    const tIdx = DAY_ORDER.indexOf(today);
    for (let d = 1; d <= 7; d++) {
      const day = DAY_ORDER[(tIdx + d) % 7];
      const list = enriched.filter((s) => s.day === day);
      if (list.length) {
        const first = [...list].sort((a, b) => toMin(a.start_time) - toMin(b.start_time))[0];
        return { type: 'future', item: first, diff: d };
      }
    }
    return null;
  }, [todayList, enriched, today]);

  const sortedWeek = useMemo(
    () => [...enriched].sort((a, b) =>
      a.day === b.day ? toMin(a.start_time) - toMin(b.start_time) : DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)),
    [enriched]
  );

  if (loading) return <PageLoader text="Menyiapkan dashboard mengajar…" />;

  const uniqueClasses = [...new Set(enriched.map((s) => s.class?.name).filter(Boolean))];
  const uniqueRooms = [...new Set(enriched.map((s) => s.roomName).filter(Boolean))];

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

  const bannerContent = (r) => {
    const s = r.item;
    const move = roomOverride[s.id] ? ` · pindah ke ${roomOverride[s.id]}` : '';
    const sub = `${s.day}, ${fmtTime(s.start_time)}–${fmtTime(s.end_time)} · ${s.subject?.name || 'Mapel'} · ` +
      `Kelas ${s.class?.name || '-'} · Ruangan ${s.roomName}${move}`;
    if (r.type === 'ongoing') return {
      icon: <Circle size={24} fill="#22c55e" color="#22c55e" />,
      title: `Sedang berlangsung: ${s.subject?.name} — Kelas ${s.class?.name}`,
      sub
    };
    if (r.type === 'today') return {
      icon: <Clock size={24} color="#f59e0b" />,
      title: `Jangan lupa! Mengajar ${fmtTime(s.start_time)} di Kelas ${s.class?.name}`,
      sub
    };
    return {
      icon: <Calendar size={24} color="#2563eb" />,
      title: `Jadwal berikutnya: ${s.day} — Kelas ${s.class?.name} (${s.roomName})`,
      sub
    };
  };

  /* ===== chart: slot per hari (Senin-Jumat) ===== */
  const weeklyCounts = DAY_ORDER.map((d) => ({ d, n: enriched.filter((s) => s.day === d).length }));
  const maxWeekly = Math.max(1, ...weeklyCounts.map((w) => w.n));

  /* ===== donat: status jadwal hari ini ===== */
  const liveCount = todayList.filter((s) => s.st === 'live').length;
  const nextCount = todayList.filter((s) => s.st === 'next').length;
  const doneCount = todayList.filter((s) => s.st === 'done').length;
  const totalToday = todayList.length || 1;
  const pLive = Math.round((liveCount / totalToday) * 100);
  const pNext = Math.round((nextCount / totalToday) * 100);
  const donutStyle = todayList.length === 0
    ? { background: 'var(--soft)' }
    : { background: `conic-gradient(#22c55e 0 ${pLive}%, #2563eb ${pLive}% ${pLive + pNext}%, #9698ab ${pLive + pNext}% 100%)` };

  /* ===== list: kelas diampu berdasar jumlah slot ===== */
  const classCounts = {};
  enriched.forEach((s) => {
    const nm = s.class?.name;
    if (nm) classCounts[nm] = (classCounts[nm] || 0) + 1;
  });
  const topClasses = Object.entries(classCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxClassCount = Math.max(1, ...topClasses.map(([, n]) => n));
  const circleColors = ['#2563eb', '#06b6d4', '#f59e0b', '#ec4899'];

  return (
    <div className={`tsd ${theme === 'dark' ? 'tsd-dark' : ''}`}>
      <style>{css}</style>

      <h2 className="tsd-greet">
        {greeting}, {me?.name ? me.name.split(',')[0] : 'Bapak/Ibu Guru'} <Hand size={18} />
      </h2>
      <p className="tsd-date">
        {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} — semoga harimu menyenangkan!
      </p>

      {error && <div className="tsd-error">{error}</div>}

      {reminder && (
        <div className={`tsd-banner tsd-${reminder.type}`}>
          <div className="ic">{bannerContent(reminder).icon}</div>
          <div className="body">
            <div className="title">
              {reminder.type === 'ongoing' && <span className="tsd-pulse" />}
              {bannerContent(reminder).title}
            </div>
            <div className="sub">{bannerContent(reminder).sub}</div>
          </div>
          <div className="when">{whenText(reminder)}</div>
        </div>
      )}
      {!reminder && (
        <div className="tsd-banner tsd-future">
          <div className="ic"><Coffee size={24} color="#9698ab" /></div>
          <div className="body">
            <div className="title">Tidak ada jadwal mengajar minggu ini.</div>
            <div className="sub">Waktu yang pas untuk menyiapkan materi berikutnya!</div>
          </div>
        </div>
      )}

      <div className="tsd-stats">
        <div className="tsd-stat featured">
          <div className="emo"><CalendarDays size={20} /></div>
          <div><div className="num">{schedules.length}</div><div className="lbl">Slot Jadwal Minggu Ini</div></div>
        </div>
        <div className="tsd-stat">
          <div className="emo"><Sun size={20} /></div>
          <div><div className="num">{todayList.length}</div><div className="lbl">Jadwal Hari Ini</div></div>
        </div>
        <div className="tsd-stat">
          <div className="emo"><GraduationCap size={20} /></div>
          <div><div className="num">{uniqueClasses.length}</div><div className="lbl">Kelas Diampu</div></div>
        </div>
        <div className="tsd-stat">
          <div className="emo"><DoorOpen size={20} /></div>
          <div><div className="num">{uniqueRooms.length}</div><div className="lbl">Ruangan Dipakai</div></div>
        </div>
      </div>

      <div className="tsd-grid2">
        <div className="tsd-card">
          <div className="tsd-card-h"><BarChart3 size={16} /> Slot Mengajar per Hari</div>
          <div className="tsd-bars">
            {weeklyCounts.map((w) => {
              const h = Math.max(6, Math.round((w.n / maxWeekly) * 140));
              const isToday = w.d === today;
              return (
                <div className="tsd-bar-col" key={w.d}>
                  <div className="tsd-bar-track">
                    <div className={`tsd-bar-fill ${isToday ? 'hi' : ''}`} style={{ height: `${h}px` }}>
                      {w.n > 0 && <span className="tip">{w.n}</span>}
                    </div>
                  </div>
                  <span className={`tsd-bar-lbl ${isToday ? 'hi' : ''}`}>{w.d.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="tsd-card">
          <div className="tsd-card-h"><PieChart size={16} /> Status Jadwal Hari Ini</div>
          <div className="tsd-donut-wrap">
            <div className="tsd-donut" style={donutStyle}>
              <div className="tsd-donut-mid">
                <b>{todayList.length}</b>
                <span>SLOT</span>
              </div>
            </div>
          </div>
          <div className="tsd-legend">
            <div className="tsd-legend-row"><span className="dot" style={{ background: '#22c55e' }} /><span className="nm">Berlangsung</span><span className="val">{liveCount}</span></div>
            <div className="tsd-legend-row"><span className="dot" style={{ background: '#2563eb' }} /><span className="nm">Akan datang</span><span className="val">{nextCount}</span></div>
            <div className="tsd-legend-row"><span className="dot" style={{ background: '#9698ab' }} /><span className="nm">Selesai</span><span className="val">{doneCount}</span></div>
          </div>
        </div>
      </div>

      <div className="tsd-card">
        <div className="tsd-card-h"><Calendar size={16} /> Jadwal Hari Ini — {today}</div>
        {todayList.length === 0 ? (
          <div className="tsd-empty">Tidak ada jadwal untuk hari ini. {reminder?.type === 'future' ? `Jadwal berikutnya: ${reminder.item.day}.` : ''}</div>
        ) : (
          <div className="tsd-today-list">
            {todayList.map((s) => (
              <div className={`tsd-item ${s.st === 'done' ? 'done' : ''} ${s.st === 'live' ? 'live' : ''}`} key={s.id}>
                <div className="tsd-time">{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</div>
                <div className="tsd-detail">
                  <b>{s.subject?.name || 'Mata Pelajaran'} — Kelas {s.class?.name || '-'}</b>
                  <span>Ruangan {s.roomName}{roomOverride[s.id] ? ' (pindahan)' : ''}</span>
                </div>
                {roomOverride[s.id] && (
                  <span className="tsd-move">
                    <ArrowLeftRight size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
                    {roomOverride[s.id]}
                  </span>
                )}
                <span className={`tsd-st ${s.st}`}>
                  {s.st === 'done' ? 'Selesai' : s.st === 'live' ? 'Berlangsung' : 'Akan datang'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tsd-grid2">
        <div className="tsd-card" style={{ marginBottom: 0 }}>
          <div className="tsd-card-h"><CalendarDays size={16} /> Jadwal Minggu Ini</div>
          <div className="tsd-table-wrap">
            <table className="tsd-table">
              <thead>
                <tr><th>Hari</th><th>Jam</th><th>Kelas</th><th>Mata Pelajaran</th><th>Ruangan</th></tr>
              </thead>
              <tbody>
                {sortedWeek.length === 0 ? (
                  <tr><td className="tsd-empty" colSpan="5">Belum ada jadwal untuk Anda.</td></tr>
                ) : (
                  sortedWeek.map((s) => (
                    <tr key={s.id}>
                      <td>{s.day}</td>
                      <td>{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</td>
                      <td>{s.class?.name || '-'}</td>
                      <td>{s.subject?.name || '-'}</td>
                      <td>{s.roomName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tsd-card" style={{ marginBottom: 0 }}>
          <div className="tsd-card-h"><GraduationCap size={16} /> Kelas Diampu</div>
          <div className="tsd-grow-list">
            {topClasses.length === 0 ? (
              <div className="tsd-empty">Belum ada kelas.</div>
            ) : (
              topClasses.map(([name, count], i) => (
                <div className="tsd-grow-item" key={name}>
                  <div className="tsd-grow-circle" style={{ background: circleColors[i % circleColors.length] }}>
                    <GraduationCap size={15} />
                  </div>
                  <div className="tsd-grow-body">
                    <div className="nm">Kelas {name}</div>
                    <div className="bar"><i style={{ width: `${(count / maxClassCount) * 100}%` }} /></div>
                  </div>
                  <div className="tsd-grow-num">{count}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}