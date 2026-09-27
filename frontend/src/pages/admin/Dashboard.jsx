import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Hand, RefreshCw, Clock, Circle, Timer, Coffee,
  School, UserCheck, Users, DoorOpen, CalendarDays,
  Calendar, Bell, X, CheckCircle, Moon, BarChart3, PieChart
} from 'lucide-react';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const todayName = () => new Date().toLocaleDateString('id-ID', { weekday: 'long' });
const fmtTime = (t) => (t ? String(t).slice(0, 5).replace(':', '.') : '');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('id-ID') : '');
const toMin = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + m; };

/* ===== batas tampil dashboard (biar tidak membludak saat data banyak) ===== */
const MAX_ROOM_CARDS = 6;
const MAX_SCHEDULE_ROWS = 7;
const MAX_TRANSFERS = 5;
const MAX_TOP_ROOMS = 4;
const AUTO_REFRESH_MS = 60000;

/* angka statistik beranimasi count-up */
function CountUp({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = null, raf;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 900, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * ease));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display}</>;
}

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
.adm{padding:0;
--card:#ffffff;--border:#eef0f8;--text:#5b5e73;--strong:#151327;--muted:#9698ab;--line:#f1f2f9;
--th-bg:#f6f6fc;--th-text:#2563eb;--soft:#f6f6fc;--primary:#2563eb;--primary2:#2563eb;}
.adm.adm-dark{--card:#161a30;--border:#242a48;--text:#c2c5dd;--strong:#f1f2fb;--muted:#7d81a3;
--th-bg:#1d2340;--th-text:#a5b4fc;--soft:#1b2036;--line:#232948;}
@keyframes admUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes admSpin{to{transform:rotate(360deg)}}
@keyframes admPulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}70%{box-shadow:0 0 0 8px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}
.adm-anim{animation:admUp .45s ease both;}

.adm-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:18px;}
.adm-head h2{font-size:19px;font-weight:800;color:var(--strong);margin:0;display:flex;align-items:center;gap:6px;}
.adm-head .sub{font-size:12.5px;color:var(--muted);margin-top:3px;}
.adm-clock{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--muted);flex-wrap:wrap;}
.adm-upd{font-size:11px;color:var(--muted);}
.adm-refresh{background:var(--card);border:1px solid var(--border);color:var(--muted);border-radius:10px;
padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:.2s;}
.adm-refresh:hover{color:var(--primary);border-color:var(--primary);}
.adm-refresh.spin svg{animation:admSpin .9s linear infinite;}

/* banner "now" */
.adm-hero{display:flex;gap:14px;align-items:flex-start;border:1px solid;border-radius:18px;
padding:15px 18px;margin-bottom:18px;}
.adm-hero.live{background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.3);}
.adm-hero.next{background:rgba(37,99,235,.07);border-color:rgba(37,99,235,.25);}
.adm-hero.none{background:var(--soft);border-color:var(--border);}
.adm-hero .ic{flex:none;display:flex;align-items:center;}
.adm-hero .t{font-weight:800;color:var(--strong);font-size:14.5px;}
.adm-hero .s{font-size:12.5px;color:var(--muted);margin-top:3px;line-height:1.7;}
.adm-pulse{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;
margin-right:6px;animation:admPulse 1.2s infinite;}

/* progress bar hari sekolah */
.adm-prog{margin-bottom:22px;}
.adm-prog .bar{height:8px;border-radius:99px;background:var(--line);overflow:hidden;}
.adm-prog .fill{height:100%;border-radius:99px;background:var(--primary);
transition:width 1s linear;}
.adm-prog .meta{display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:6px;}
.adm-prog .meta b{color:var(--strong);}

/* ===== stat cards row (1 featured + 3 white, DealDeck style) ===== */
.adm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;}
@media (max-width:1100px){ .adm-stats{grid-template-columns:repeat(2,1fr);} }
@media (max-width:560px){ .adm-stats{grid-template-columns:1fr;} }
a.adm-stat{display:block;text-decoration:none;}
.adm-stat{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:18px;
box-shadow:0 1px 2px rgba(20,20,50,.03);transition:transform .2s,box-shadow .2s;position:relative;overflow:hidden;}
.adm-stat:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(20,20,60,.09);}
.adm-stat.featured{background:var(--primary);border-color:transparent;color:#fff;}
.adm-stat .top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.adm-stat .emo{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;
background:var(--soft);color:var(--primary);}
.adm-stat.featured .emo{background:rgba(255,255,255,.18);color:#fff;}
.adm-stat .tag{font-size:10.5px;font-weight:800;border-radius:999px;padding:4px 10px;
background:rgba(34,197,94,.12);color:#16a34a;display:flex;align-items:center;gap:4px;}
.adm-stat.featured .tag{background:rgba(255,255,255,.2);color:#fff;}
.adm-stat .lbl{font-size:12px;color:var(--muted);font-weight:700;margin-bottom:4px;}
.adm-stat.featured .lbl{color:rgba(255,255,255,.85);}
.adm-stat .num{font-size:25px;font-weight:800;color:var(--strong);font-variant-numeric:tabular-nums;}
.adm-stat.featured .num{color:#fff;}

/* ===== grid 2 kolom: chart kiri (lebar) + donat kanan ===== */
.adm-grid2{display:grid;grid-template-columns:1.65fr 1fr;gap:16px;margin-bottom:20px;align-items:stretch;}
@media (max-width:980px){ .adm-grid2{grid-template-columns:1fr;} }

.adm-card{background:var(--card);border:1px solid var(--border);border-radius:18px;overflow:hidden;margin-bottom:20px;}
.adm-card-h{padding:16px 20px 4px;font-weight:800;color:var(--strong);font-size:14.5px;
display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
.adm-card-h .ttl{display:flex;align-items:center;gap:8px;}
.adm-card .sub{padding:0 20px 8px;color:var(--muted);font-size:12px;}

/* chips filter */
.adm-chips{display:flex;gap:6px;flex-wrap:wrap;}
.adm-chip{border:1px solid var(--border);background:var(--soft);color:var(--muted);border-radius:999px;
padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;transition:.2s;display:flex;align-items:center;gap:4px;}
.adm-chip:hover{color:var(--primary);border-color:var(--primary);}
.adm-chip.on{background:rgba(37,99,235,.12);border-color:rgba(37,99,235,.4);color:var(--primary);}

/* ===== bar chart mingguan ===== */
.adm-bars{display:flex;align-items:flex-end;gap:14px;height:190px;padding:16px 20px 8px;}
.adm-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;height:100%;justify-content:flex-end;}
.adm-bar-track{width:100%;max-width:34px;flex:1;display:flex;align-items:flex-end;position:relative;}
.adm-bar-fill{width:100%;border-radius:10px 10px 4px 4px;background:var(--soft);
transition:height .6s cubic-bezier(.2,.8,.2,1);position:relative;}
.adm-bar-fill.hi{background:var(--primary);}
.adm-bar-fill .tip{position:absolute;top:-24px;left:50%;transform:translateX(-50%);
font-size:10.5px;font-weight:800;color:var(--strong);white-space:nowrap;}
.adm-bar-lbl{font-size:11px;color:var(--muted);font-weight:700;}
.adm-bar-lbl.hi{color:var(--primary);}

/* ===== donut ===== */
.adm-donut-wrap{display:flex;flex-direction:column;align-items:center;padding:10px 20px 6px;}
.adm-donut{width:150px;height:150px;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;}
.adm-donut::before{content:'';position:absolute;inset:16px;border-radius:50%;background:var(--card);}
.adm-donut-mid{position:relative;text-align:center;}
.adm-donut-mid b{display:block;font-size:22px;color:var(--strong);}
.adm-donut-mid span{font-size:10.5px;color:var(--muted);font-weight:700;}
.adm-legend{width:100%;padding:14px 20px 18px;display:flex;flex-direction:column;gap:10px;}
.adm-legend-row{display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--text);}
.adm-legend-row .dot{width:9px;height:9px;border-radius:3px;flex:none;}
.adm-legend-row .nm{flex:1;font-weight:700;color:var(--strong);}
.adm-legend-row .val{font-weight:800;color:var(--strong);}
.adm-legend-row .pct{font-size:10.5px;font-weight:800;border-radius:999px;padding:2px 8px;}

/* kartu ruangan (klikabel) */
.adm-rooms{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;padding:6px 20px 20px;}
.adm-room{background:var(--soft);border:1px solid var(--border);border-top:3px solid #22c55e;
border-radius:14px;padding:13px 15px;transition:transform .2s,border-color .2s;animation:admUp .5s ease both;cursor:pointer;}
.adm-room:hover{transform:translateY(-3px);border-color:var(--primary);}
.adm-room .nm{display:flex;align-items:center;gap:8px;font-weight:700;color:var(--strong);font-size:13.5px;}
.adm-room .dot{width:9px;height:9px;border-radius:50%;background:#4ade80;flex:none;animation:admPulse 2s infinite;}
.adm-room .badge{display:inline-block;margin-top:9px;border-radius:999px;padding:4px 12px;
font-size:10.5px;font-weight:800;background:rgba(34,197,94,.13);color:#16a34a;}
.adm-room.busy{border-top-color:#ef4444;}
.adm-room.busy .dot{background:#f87171;animation:admPulse 1.2s infinite;}
.adm-room.busy .badge{background:rgba(239,68,68,.13);color:#dc2626;}

.adm-table-wrap{overflow-x:auto;}
.adm-table{width:100%;border-collapse:collapse;}
.adm-table th{background:var(--th-bg);color:var(--th-text);text-align:left;font-size:11px;
letter-spacing:.07em;text-transform:uppercase;padding:12px 20px;}
.adm-table td{padding:12px 20px;border-top:1px solid var(--line);color:var(--text);font-size:13.5px;}
.adm-table tbody tr{cursor:pointer;transition:background .15s;}
.adm-table tr:hover td{background:var(--soft);}
.adm-table tr.adm-row-live td{background:rgba(34,197,94,.06);}
.adm-st{border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:800;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;}
.adm-st.done{background:rgba(150,152,171,.15);color:var(--muted);}
.adm-st.live{background:rgba(34,197,94,.13);color:#16a34a;}
.adm-st.next{background:rgba(37,99,235,.1);color:var(--primary);}
.adm-more{display:block;text-align:center;padding:12px 20px 16px;font-size:12px;color:var(--muted);}
.adm-more a{color:var(--primary);font-weight:700;text-decoration:none;}

/* ===== growth-style list: ruangan terpadat ===== */
.adm-grow-list{display:flex;flex-direction:column;gap:14px;padding:6px 20px 20px;}
.adm-grow-item{display:flex;align-items:center;gap:12px;}
.adm-grow-circle{width:40px;height:40px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;
color:#fff;font-weight:800;font-size:13px;}
.adm-grow-body{flex:1;min-width:0;}
.adm-grow-body .nm{font-weight:700;color:var(--strong);font-size:13px;display:flex;align-items:center;gap:6px;}
.adm-grow-body .bar{height:5px;border-radius:99px;background:var(--line);margin-top:6px;overflow:hidden;}
.adm-grow-body .bar i{display:block;height:100%;border-radius:99px;background:var(--primary);}
.adm-grow-num{font-weight:800;color:var(--strong);font-size:13px;flex:none;}

.adm-trf{padding:4px 20px 18px;display:flex;flex-direction:column;gap:11px;}
.adm-trf-item{font-size:13px;color:var(--muted);line-height:1.6;}
.adm-trf-item b{color:var(--strong);}
.adm-trf-item .arr{color:var(--primary);font-weight:800;}
.adm-trf-item .dt{font-size:11px;color:var(--muted);display:block;}

.adm-empty{background:var(--soft);border:1px dashed var(--border);border-radius:14px;
padding:26px 18px;text-align:center;color:var(--muted);font-size:13.5px;margin:6px 20px 20px;}
.adm-empty .big{display:flex;justify-content:center;margin-bottom:8px;}

/* modal detail ruangan */
.adm-overlay{position:fixed;inset:0;background:rgba(15,17,33,.55);backdrop-filter:blur(3px);
display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;}
.adm-modal{width:620px;max-width:100%;max-height:88vh;overflow:auto;background:var(--card);
border:1px solid var(--border);border-radius:20px;padding:24px;animation:admUp .25s ease both;}
.adm-modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:10px;}
.adm-modal-header h3{color:var(--strong);font-size:17px;font-weight:800;margin:0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.adm-close{background:var(--soft);border:none;color:var(--muted);font-size:16px;cursor:pointer;display:flex;align-items:center;padding:6px;border-radius:8px;transition:.2s;}
.adm-close:hover{color:var(--strong);}
.adm-modal-sub{font-size:12px;color:var(--muted);margin-bottom:12px;}
.adm-badge{border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:800;}
.adm-badge.free{background:rgba(34,197,94,.13);color:#16a34a;}
.adm-badge.busy{background:rgba(239,68,68,.13);color:#dc2626;}
.adm-days{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 14px;}
.adm-day{min-width:48px;border-radius:10px;padding:6px 8px;text-align:center;font-size:10px;font-weight:800;
border:1px solid var(--border);color:var(--muted);}
.adm-day b{display:block;font-size:13px;color:var(--strong);}
.adm-day.today{border-color:var(--primary);background:rgba(37,99,235,.1);color:var(--primary);}
.adm-slot{display:flex;align-items:center;gap:12px;border:1px solid var(--line);border-radius:12px;
padding:9px 12px;margin-bottom:6px;font-size:12.5px;color:var(--text);flex-wrap:wrap;}
.adm-slot .t{font-weight:800;color:var(--primary);min-width:100px;}
.adm-slot .what{flex:1;min-width:180px;}
.adm-slot .what b{color:var(--strong);}
.adm-slot .what span{color:var(--muted);font-size:11.5px;display:block;}
.adm-free{color:var(--muted);font-size:12.5px;}
.adm-modal-foot{margin-top:12px;font-size:12px;color:var(--muted);}
.adm-modal-foot a{color:var(--primary);font-weight:700;text-decoration:none;}
`;

export default function AdminDashboard() {
  const theme = useAppTheme();
  const [stats, setStats] = useState({ classes: 0, teachers: 0, students: 0, rooms: 0, today: 0 });
  const [rooms, setRooms] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [roomFilter, setRoomFilter] = useState('kosong');
  const [schedFilter, setSchedFilter] = useState('all');
  const [viewRoom, setViewRoom] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [clsR, tchR, stuR, romR, schR, trR] = await Promise.allSettled([
      api.get('/admin/classes'),
      api.get('/admin/teachers'),
      api.get('/admin/students'),
      api.get('/admin/rooms'),
      api.get('/admin/schedules'),
      api.get('/admin/room-transfers'),
    ]);

    const pick = (r) => (r.status === 'fulfilled' ? (r.value.data?.data || r.value.data || []) : []);
    const classes = pick(clsR);
    const teachers = pick(tchR);
    const students = pick(stuR);
    const roomsList = pick(romR);
    const schedules = pick(schR);
    const transfersList = pick(trR);

    const today = todayName();
    const todayList = schedules
      .filter((s) => s.day === today)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

    setRooms(roomsList);
    setAllSchedules(schedules);
    setTodaySchedules(todayList);
    setTransfers(
      [...transfersList]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, MAX_TRANSFERS)
    );
    setStats({
      classes: classes.length,
      teachers: teachers.length,
      students: students.length,
      rooms: roomsList.length,
      today: todayList.length,
    });
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setInterval(() => load(true), AUTO_REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!viewRoom) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setViewRoom(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewRoom]);

  if (loading) return <PageLoader text="Menyiapkan dashboard admin…" />;

  const manualRefresh = async () => {
    setSpinning(true);
    await load(true);
    setSpinning(false);
  };

  const nowF = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const today = todayName();
  const dayEnd = today === 'Senin' ? 15 * 60 + 40 : 15 * 60;
  const dayStart = 6 * 60 + 30;

  const withStatus = todaySchedules.map((s) => ({
    ...s,
    st: toMin(s.end_time) <= nowF ? 'done' : toMin(s.start_time) <= nowF ? 'live' : 'next',
  }));
  const ongoing = withStatus.filter((s) => s.st === 'live');
  const upcoming = withStatus.filter((s) => s.st === 'next');
  const doneList = withStatus.filter((s) => s.st === 'done');
  const orderedAll = [...ongoing, ...upcoming, ...doneList];

  const schedByFilter = schedFilter === 'all' ? orderedAll : orderedAll.filter((s) => s.st === schedFilter);
  const shownSchedules = schedByFilter.slice(0, MAX_SCHEDULE_ROWS);
  const hiddenSchedules = schedByFilter.length - shownSchedules.length;

  const busyRoomIds = new Set(ongoing.map((s) => s.room_id));
  const roomNow = (r) => (busyRoomIds.has(r.id) ? 'dipakai' : 'kosong');
  const emptyRooms = rooms.filter((r) => roomNow(r) === 'kosong');
  const busyRooms = rooms.filter((r) => roomNow(r) === 'dipakai');

  const roomListByFilter =
    roomFilter === 'dipakai' ? busyRooms : roomFilter === 'semua' ? rooms : emptyRooms;
  const topRooms = roomListByFilter.slice(0, MAX_ROOM_CARDS);

  const prog = nowF < dayStart ? 0 : nowF > dayEnd ? 100 : ((nowF - dayStart) / (dayEnd - dayStart)) * 100;
  const progLabel =
    nowF < dayStart ? 'Belum mulai' : nowF > dayEnd ? 'Sudah selesai' : 'Sedang berjalan';

  const greeting =
    now.getHours() < 11 ? 'Selamat pagi' : now.getHours() < 15 ? 'Selamat siang' :
    now.getHours() < 19 ? 'Selamat sore' : 'Selamat malam';

  const nextItem = upcoming[0];
  const minsToNext = nextItem ? Math.max(0, Math.round(toMin(nextItem.start_time) - nowF)) : 0;

  const viewRoomSchedules = viewRoom ? withStatus.filter((s) => s.room_id === viewRoom.id) : [];
  const viewRoomWeek = viewRoom
    ? DAYS.map((d) => ({ d, n: allSchedules.filter((s) => s.room_id === viewRoom.id && s.day === d).length }))
    : [];

  const statCards = [
    { icon: <CalendarDays size={18} />, num: stats.today, lbl: 'Jadwal Hari Ini', to: '/admin/schedules', featured: true, tag: today },
    { icon: <School size={18} />, num: stats.classes, lbl: 'Kelas', to: '/admin/classes' },
    { icon: <UserCheck size={18} />, num: stats.teachers, lbl: 'Guru', to: '/admin/teachers' },
    { icon: <Users size={18} />, num: stats.students, lbl: 'Siswa', to: '/admin/students' },
  ];

  /* ===== data chart: jadwal per hari (Senin-Sabtu) ===== */
  const weeklyCounts = DAYS.map((d) => ({ d, n: allSchedules.filter((s) => s.day === d).length }));
  const maxWeekly = Math.max(1, ...weeklyCounts.map((w) => w.n));

  /* ===== data donat: status ruangan ===== */
  const totalRooms = rooms.length || 1;
  const kosongPct = Math.round((emptyRooms.length / totalRooms) * 100);
  const dipakaiPct = 100 - kosongPct;
  const donutStyle = {
    background: `conic-gradient(#2563eb 0 ${kosongPct}%, #f59e0b ${kosongPct}% 100%)`,
  };

  /* ===== data list: ruangan terpadat (dari seluruh jadwal minggu ini) ===== */
  const roomCounts = {};
  allSchedules.forEach((s) => { roomCounts[s.room_id] = (roomCounts[s.room_id] || 0) + 1; });
  const topBusyRooms = rooms
    .map((r) => ({ ...r, count: roomCounts[r.id] || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_TOP_ROOMS);
  const maxRoomCount = Math.max(1, ...topBusyRooms.map((r) => r.count));
  const circleColors = ['#2563eb', '#06b6d4', '#f59e0b', '#ec4899'];

  return (
    <div className={`adm ${theme === 'dark' ? 'adm-dark' : ''}`}>
      <style>{css}</style>

      <div className="adm-head adm-anim">
        <div>
          <h2>{greeting}, Admin Kurikulum <Hand size={18} /></h2>
          <div className="sub">{now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <div className="adm-clock">
          {lastUpdated && (
            <span className="adm-upd">
              Update {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button className={`adm-refresh ${spinning ? 'spin' : ''}`} onClick={manualRefresh} title="Muat ulang data sekarang">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ===== banner "sekarang" ===== */}
      {ongoing.length > 0 ? (
        <div className="adm-hero live adm-anim" style={{ animationDelay: '.05s' }}>
          <Circle size={24} fill="#22c55e" color="#22c55e" className="ic" />
          <div>
            <div className="t"><span className="adm-pulse" />{ongoing.length} pelajaran sedang berlangsung sekarang</div>
            <div className="s">
              {ongoing.slice(0, 3).map((s) =>
                `${fmtTime(s.start_time)}–${fmtTime(s.end_time)} · ${s.subject?.name} · ${s.class?.name} · ${s.room?.name}`
              ).join('  •  ')}
              {ongoing.length > 3 ? `  •  +${ongoing.length - 3} lainnya` : ''}
            </div>
          </div>
        </div>
      ) : nextItem ? (
        <div className="adm-hero next adm-anim" style={{ animationDelay: '.05s' }}>
          <Timer size={24} color="#2563eb" className="ic" />
          <div>
            <div className="t">
              Berikutnya: {fmtTime(nextItem.start_time)} — {nextItem.subject?.name} ({nextItem.class?.name})
            </div>
            <div className="s">
              {minsToNext <= 60 ? `Mulai ${minsToNext} menit lagi` : `Mulai pukul ${fmtTime(nextItem.start_time)}`} · Ruangan {nextItem.room?.name} · Guru {nextItem.teacher?.user?.name || '-'}
            </div>
          </div>
        </div>
      ) : (
        <div className="adm-hero none adm-anim" style={{ animationDelay: '.05s' }}>
          <Coffee size={24} color="#9698ab" className="ic" />
          <div>
            <div className="t">Tidak ada jadwal hari ini.</div>
            <div className="s">Semua ruangan tersedia — waktu yang pas untuk penataan jadwal minggu depan.</div>
          </div>
        </div>
      )}

      {/* ===== progress hari sekolah ===== */}
      <div className="adm-prog adm-anim" style={{ animationDelay: '.1s' }}>
        <div className="bar"><div className="fill" style={{ width: `${prog}%` }} /></div>
        <div className="meta">
          <span>06.30</span>
          <b>{progLabel}{prog > 0 && prog < 100 ? ` · ${Math.round(prog)}%` : ''}</b>
          <span>{today === 'Senin' ? '15.40' : '15.00'}</span>
        </div>
      </div>

      {/* ===== stat cards ===== */}
      <div className="adm-stats">
        {statCards.map((c, i) => (
          <Link
            to={c.to}
            className={`adm-stat adm-anim ${c.featured ? 'featured' : ''}`}
            key={c.lbl}
            style={{ animationDelay: `${.15 + i * .06}s` }}
            title={`Buka halaman ${c.lbl}`}
          >
            <div className="top">
              <div className="emo">{c.icon}</div>
              {c.tag && <span className="tag">{c.tag}</span>}
            </div>
            <div className="lbl">{c.lbl}</div>
            <div className="num"><CountUp value={c.num} /></div>
          </Link>
        ))}
      </div>

      {/* ===== grid: bar chart mingguan + donat status ruangan ===== */}
      <div className="adm-grid2">
        <div className="adm-card adm-anim" style={{ animationDelay: '.22s' }}>
          <div className="adm-card-h">
            <div className="ttl"><BarChart3 size={16} /> Jadwal per Hari (Minggu Ini)</div>
          </div>
          <div className="sub">Jumlah slot jadwal terjadwal untuk setiap hari kerja.</div>
          <div className="adm-bars">
            {weeklyCounts.map((w) => {
              const h = Math.max(6, Math.round((w.n / maxWeekly) * 150));
              const isToday = w.d === today;
              return (
                <div className="adm-bar-col" key={w.d}>
                  <div className="adm-bar-track">
                    <div className={`adm-bar-fill ${isToday ? 'hi' : ''}`} style={{ height: `${h}px` }}>
                      {w.n > 0 && <span className="tip">{w.n}</span>}
                    </div>
                  </div>
                  <span className={`adm-bar-lbl ${isToday ? 'hi' : ''}`}>{w.d.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="adm-card adm-anim" style={{ animationDelay: '.27s' }}>
          <div className="adm-card-h">
            <div className="ttl"><PieChart size={16} /> Status Ruangan</div>
          </div>
          <div className="adm-donut-wrap">
            <div className="adm-donut" style={donutStyle}>
              <div className="adm-donut-mid">
                <b>{rooms.length}</b>
                <span>RUANGAN</span>
              </div>
            </div>
          </div>
          <div className="adm-legend">
            <div className="adm-legend-row">
              <span className="dot" style={{ background: '#2563eb' }} />
              <span className="nm">Kosong</span>
              <span className="val">{emptyRooms.length}</span>
              <span className="pct" style={{ background: 'rgba(37,99,235,.12)', color: '#2563eb' }}>{isFinite(kosongPct) ? kosongPct : 0}%</span>
            </div>
            <div className="adm-legend-row">
              <span className="dot" style={{ background: '#f59e0b' }} />
              <span className="nm">Dipakai</span>
              <span className="val">{busyRooms.length}</span>
              <span className="pct" style={{ background: 'rgba(245,158,11,.12)', color: '#d97706' }}>{isFinite(dipakaiPct) ? dipakaiPct : 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== jadwal hari ini: tab filter + baris klikabel ===== */}
      <div className="adm-card adm-anim" style={{ animationDelay: '.32s' }}>
        <div className="adm-card-h">
          <div className="ttl"><Calendar size={16} /> Jadwal Hari Ini — {today}</div>
          <div className="adm-chips">
            <button className={`adm-chip ${schedFilter === 'all' ? 'on' : ''}`} onClick={() => setSchedFilter('all')}>
              Semua · {withStatus.length}
            </button>
            <button className={`adm-chip ${schedFilter === 'live' ? 'on' : ''}`} onClick={() => setSchedFilter('live')}>
              Berlangsung · {ongoing.length}
            </button>
            <button className={`adm-chip ${schedFilter === 'next' ? 'on' : ''}`} onClick={() => setSchedFilter('next')}>
              Akan Datang · {upcoming.length}
            </button>
            <button className={`adm-chip ${schedFilter === 'done' ? 'on' : ''}`} onClick={() => setSchedFilter('done')}>
              Selesai · {doneList.length}
            </button>
          </div>
        </div>
        {withStatus.length === 0 && <div className="sub">Tidak ada jadwal hari ini.</div>}
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Jam</th><th>Kelas</th><th>Mapel</th><th>Guru</th><th>Ruangan</th><th>Status</th></tr>
            </thead>
            <tbody>
              {shownSchedules.length === 0 ? (
                <tr style={{ cursor: 'default' }}>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>
                    Tidak ada jadwal pada filter ini.
                  </td>
                </tr>
              ) : (
                shownSchedules.map((s) => (
                  <tr
                    key={s.id}
                    className={s.st === 'live' ? 'adm-row-live' : ''}
                    onClick={() => { const rm = rooms.find((x) => x.id === s.room_id); if (rm) setViewRoom(rm); }}
                    title="Klik untuk lihat jadwal ruangan ini"
                  >
                    <td>{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</td>
                    <td>{s.class?.name || '-'}</td>
                    <td>{s.subject?.name || '-'}</td>
                    <td>{s.teacher?.user?.name || '-'}</td>
                    <td>{s.room?.name || '-'}</td>
                    <td>
                      <span className={`adm-st ${s.st}`}>
                        {s.st === 'done' ? 'Selesai' : s.st === 'live' ? 'Berlangsung' : 'Akan datang'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {hiddenSchedules > 0 && (
          <div className="adm-more">
            Menampilkan {shownSchedules.length} dari {schedByFilter.length} jadwal (filter aktif) ·{' '}
            <Link to="/admin/schedules">buka Manajemen Jadwal →</Link>
          </div>
        )}
      </div>

      {/* ===== grid: status ruangan (kartu) + ruangan terpadat ===== */}
      <div className="adm-grid2">
        <div className="adm-card adm-anim" style={{ animationDelay: '.36s' }}>
          <div className="adm-card-h">
            <div className="ttl"><DoorOpen size={16} /> Status Ruangan</div>
            <div className="adm-chips">
              <button className={`adm-chip ${roomFilter === 'kosong' ? 'on' : ''}`} onClick={() => setRoomFilter('kosong')}>
                Kosong · {emptyRooms.length}
              </button>
              <button className={`adm-chip ${roomFilter === 'dipakai' ? 'on' : ''}`} onClick={() => setRoomFilter('dipakai')}>
                Dipakai · {busyRooms.length}
              </button>
              <button className={`adm-chip ${roomFilter === 'semua' ? 'on' : ''}`} onClick={() => setRoomFilter('semua')}>
                Semua · {rooms.length}
              </button>
            </div>
          </div>
          {topRooms.length === 0 ? (
            <div className="adm-empty">
              <div className="big">
                {roomFilter === 'dipakai' ? <CheckCircle size={30} color="#22c55e" /> : <Moon size={30} color="#9698ab" />}
              </div>
              {roomFilter === 'dipakai'
                ? 'Tidak ada ruangan yang sedang dipakai sekarang.'
                : roomFilter === 'kosong'
                  ? 'Tidak ada ruangan kosong — semua ruangan sedang terpakai.'
                  : 'Belum ada data ruangan.'}
            </div>
          ) : (
            <div className="adm-rooms">
              {topRooms.map((r, i) => (
                <div
                  className={`adm-room ${roomNow(r) === 'dipakai' ? 'busy' : ''}`}
                  key={r.id}
                  style={{ animationDelay: `${.4 + i * .04}s` }}
                  onClick={() => setViewRoom(r)}
                  title={`Klik untuk lihat jadwal ${r.name}`}
                >
                  <div className="nm"><span className="dot" /> {r.name}</div>
                  <span className="badge">{roomNow(r) === 'dipakai' ? 'Dipakai' : 'Kosong'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="adm-card adm-anim" style={{ animationDelay: '.4s' }}>
          <div className="adm-card-h">
            <div className="ttl"><Bell size={16} /> Ruangan Terpadat</div>
          </div>
          <div className="sub">Berdasarkan jumlah jadwal minggu ini.</div>
          <div className="adm-grow-list">
            {topBusyRooms.length === 0 ? (
              <div className="adm-trf-item">Belum ada data.</div>
            ) : (
              topBusyRooms.map((r, i) => (
                <div className="adm-grow-item" key={r.id}>
                  <div className="adm-grow-circle" style={{ background: circleColors[i % circleColors.length] }}>
                    <DoorOpen size={16} />
                  </div>
                  <div className="adm-grow-body">
                    <div className="nm">{r.name}</div>
                    <div className="bar"><i style={{ width: `${(r.count / maxRoomCount) * 100}%` }} /></div>
                  </div>
                  <div className="adm-grow-num">{r.count}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ===== perpindahan terbaru ===== */}
      <div className="adm-card adm-anim" style={{ animationDelay: '.44s' }}>
        <div className="adm-card-h">
          <div className="ttl"><Bell size={16} /> Perpindahan Ruangan Terbaru</div>
        </div>
        <div className="adm-trf">
          {transfers.length === 0 ? (
            <div className="adm-trf-item">Belum ada perpindahan ruangan.</div>
          ) : (
            transfers.map((t) => {
              const teacher = t.teacher?.user?.name || t.schedule?.teacher?.user?.name || '-';
              const cls = t.schedule?.class?.name || t.class?.name || '-';
              const from = t.schedule?.room?.name || t.from_room?.name || '-';
              const to = t.room?.name || t.to_room?.name || '-';
              return (
                <div className="adm-trf-item" key={t.id}>
                  <b>{teacher}</b> ({cls}) — {from} <span className="arr">→</span> <b>{to}</b>
                  <span className="dt">{fmtDateTime(t.created_at)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===== modal detail ruangan ===== */}
      {viewRoom && (
        <div className="adm-overlay" onMouseDown={() => setViewRoom(null)}>
          <div className="adm-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>
                <DoorOpen size={17} /> {viewRoom.name}
                <span className={`adm-badge ${roomNow(viewRoom) === 'dipakai' ? 'busy' : 'free'}`}>
                  {roomNow(viewRoom) === 'dipakai' ? 'Dipakai sekarang' : 'Kosong sekarang'}
                </span>
              </h3>
              <button className="adm-close" onClick={() => setViewRoom(null)} type="button" title="Tutup">
                <X size={17} />
              </button>
            </div>
            <div className="adm-modal-sub">Jumlah jadwal per hari minggu ini — hari ini disorot ungu.</div>

            <div className="adm-days">
              {viewRoomWeek.map((w) => (
                <div className={`adm-day ${w.d === today ? 'today' : ''}`} key={w.d} title={`${w.d}: ${w.n} jadwal`}>
                  {w.d.slice(0, 2)}<b>{w.n}</b>
                </div>
              ))}
            </div>

            <div className="adm-modal-sub" style={{ marginBottom: 8 }}>
              Jadwal hari ini ({today}):
            </div>
            {viewRoomSchedules.length === 0 ? (
              <div className="adm-free">Tidak ada jadwal — ruangan kosong sepanjang hari.</div>
            ) : (
              viewRoomSchedules.map((s) => (
                <div className="adm-slot" key={s.id}>
                  <span className="t">{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</span>
                  <span className="what">
                    <b>{s.subject?.name || 'Mapel'}</b> — {s.class?.name || '-'}
                    <span>{s.teacher?.user?.name || '-'}</span>
                  </span>
                  <span className={`adm-st ${s.st}`}>
                    {s.st === 'done' ? 'Selesai' : s.st === 'live' ? 'Berlangsung' : 'Akan datang'}
                  </span>
                </div>
              ))
            )}

            <div className="adm-modal-foot">
              Kelola ruangan ini di <Link to="/admin/rooms" onClick={() => setViewRoom(null)}>Manajemen Ruangan →</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}