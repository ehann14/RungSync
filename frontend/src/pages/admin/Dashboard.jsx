import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const todayName = () => new Date().toLocaleDateString('id-ID', { weekday: 'long' });
const fmtTime = (t) => (t ? String(t).slice(0, 5).replace(':', '.') : '');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('id-ID') : '');
const toMin = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + m; };

/* ===== batas tampil dashboard (biar tidak membludak saat data banyak) ===== */
const MAX_ROOM_CARDS = 6;    // maksimal kartu ruangan yang ditampilkan
const MAX_SCHEDULE_ROWS = 7; // maksimal baris tabel jadwal hari ini
const MAX_TRANSFERS = 5;     // maksimal daftar perpindahan ruangan
const AUTO_REFRESH_MS = 60000; // auto-refresh data tiap 60 detik

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
.adm{padding:8px 4px;
--card:#0d1930;--border:#1c2b45;--text:#e2e8f0;--strong:#f1f5f9;--muted:#64748b;--line:#16263f;
--th-bg:#132340;--th-text:#8ab4f8;}
.adm.adm-light{--card:#ffffff;--border:#e2e8f0;--text:#334155;--strong:#0f172a;--muted:#64748b;--line:#e2e8f0;
--th-bg:#f1f5f9;--th-text:#1d4ed8;}
@keyframes admUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes admSpin{to{transform:rotate(360deg)}}
@keyframes admPulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}70%{box-shadow:0 0 0 8px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}
.adm-anim{animation:admUp .5s ease both;}
.adm-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px;}
.adm-head h2{font-size:22px;font-weight:800;color:var(--strong);margin:0;}
.adm-clock{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);flex-wrap:wrap;}
.adm-clock .chip{background:linear-gradient(90deg,#2563eb,#06b6d4);color:#fff;border-radius:999px;
padding:6px 14px;font-weight:800;font-size:12px;font-variant-numeric:tabular-nums;}
.adm-upd{font-size:11px;color:var(--muted);}
.adm-refresh{background:var(--card);border:1px solid var(--border);color:var(--muted);border-radius:10px;
padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:.2s;}
.adm-refresh:hover{color:var(--strong);border-color:#2563eb;}
.adm-refresh .ic{display:inline-block;font-size:13px;}
.adm-refresh.spin .ic{animation:admSpin .9s linear infinite;}

/* banner "now" */
.adm-hero{display:flex;gap:14px;align-items:flex-start;border:1px solid;border-radius:16px;
padding:14px 18px;margin-bottom:16px;}
.adm-hero.live{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.4);}
.adm-hero.next{background:rgba(37,99,235,.1);border-color:rgba(37,99,235,.35);}
.adm-hero.none{background:rgba(100,116,139,.08);border-color:rgba(100,116,139,.3);}
.adm-hero .ic{font-size:26px;flex:none;}
.adm-hero .t{font-weight:800;color:var(--strong);font-size:14.5px;}
.adm-hero .s{font-size:12.5px;color:var(--muted);margin-top:3px;line-height:1.7;}
.adm-pulse{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;
margin-right:6px;animation:admPulse 1.2s infinite;}

/* progress bar hari sekolah */
.adm-prog{margin-bottom:20px;}
.adm-prog .bar{height:8px;border-radius:99px;background:var(--line);overflow:hidden;}
.adm-prog .fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#2563eb,#06b6d4);
transition:width 1s linear;box-shadow:0 0 12px rgba(37,99,235,.5);}
.adm-prog .meta{display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:6px;}
.adm-prog .meta b{color:var(--strong);}

/* stat cards (klikabel) */
.adm-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:22px;}
a.adm-stat{display:block;text-decoration:none;}
.adm-stat{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;
box-shadow:0 1px 3px rgba(15,23,42,.08);transition:transform .2s,box-shadow .2s,border-color .2s;cursor:pointer;}
.adm-stat:hover{transform:translateY(-4px);box-shadow:0 10px 26px rgba(2,6,23,.28);border-color:#2563eb;}
.adm-stat .emo{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;
justify-content:center;font-size:20px;margin-bottom:10px;}
.adm-stat .num{font-size:24px;font-weight:800;color:#2563eb;font-variant-numeric:tabular-nums;}
.adm-stat .lbl{font-size:12px;color:var(--muted);font-weight:600;margin-top:2px;}

.adm-sec{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:800;color:var(--strong);margin:0 0 12px;flex-wrap:wrap;}
.adm-note{font-size:12px;color:var(--muted);font-weight:500;margin-left:auto;}
.adm-note a{color:#2563eb;font-weight:700;text-decoration:none;}

/* chips filter */
.adm-chips{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto;}
.adm-chip{border:1px solid var(--border);background:var(--card);color:var(--muted);border-radius:999px;
padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;transition:.2s;}
.adm-chip:hover{color:var(--strong);border-color:#2563eb;}
.adm-chip.on{background:rgba(37,99,235,.15);border-color:rgba(37,99,235,.5);color:#93c5fd;}
.adm-light .adm-chip.on{color:#1d4ed8;}

/* kartu ruangan (klikabel) */
.adm-rooms{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;margin-bottom:22px;}
.adm-room{background:var(--card);border:1px solid var(--border);border-top:3px solid #22c55e;
border-radius:12px;padding:14px 16px;box-shadow:0 1px 3px rgba(15,23,42,.08);
transition:transform .2s,border-color .2s;animation:admUp .5s ease both;cursor:pointer;}
.adm-room:hover{transform:translateY(-3px);border-color:#2563eb;}
.adm-room .nm{display:flex;align-items:center;gap:8px;font-weight:700;color:var(--strong);font-size:13.5px;}
.adm-room .dot{width:9px;height:9px;border-radius:50%;background:#4ade80;flex:none;animation:admPulse 2s infinite;}
.adm-room .badge{display:inline-block;margin-top:10px;border-radius:999px;padding:4px 12px;
font-size:10.5px;font-weight:800;background:rgba(34,197,94,.15);color:#4ade80;}
.adm-light .adm-room .badge{color:#15803d;}
.adm-room.busy{border-top-color:#ef4444;}
.adm-room.busy .dot{background:#f87171;animation:admPulse 1.2s infinite;}
.adm-room.busy .badge{background:rgba(239,68,68,.15);color:#f87171;}
.adm-light .adm-room.busy .badge{color:#b91c1c;}

.adm-card{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:20px;}
.adm-card-h{padding:14px 18px 10px;font-weight:800;color:var(--strong);font-size:15px;
display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.adm-card .sub{padding:0 18px 10px;color:var(--muted);font-size:12.5px;}
.adm-table-wrap{overflow-x:auto;}
.adm-table{width:100%;border-collapse:collapse;}
.adm-table th{background:var(--th-bg);color:var(--th-text);text-align:left;font-size:11px;
letter-spacing:.08em;text-transform:uppercase;padding:11px 16px;}
.adm-table td{padding:11px 16px;border-top:1px solid var(--line);color:var(--text);font-size:13.5px;}
.adm-table tbody tr{cursor:pointer;transition:background .15s;}
.adm-table tr:hover td{background:rgba(37,99,235,.05);}
.adm-table tr.adm-row-live td{background:rgba(34,197,94,.07);}
.adm-st{border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:800;white-space:nowrap;}
.adm-st.done{background:rgba(100,116,139,.15);color:#64748b;}
.adm-st.live{background:rgba(34,197,94,.15);color:#4ade80;}
.adm-st.next{background:rgba(37,99,235,.12);color:#93c5fd;}
.adm-light .adm-st.live{color:#15803d;} .adm-light .adm-st.next{color:#1d4ed8;}
.adm-more{display:block;text-align:center;padding:10px 16px 14px;font-size:12px;color:var(--muted);}
.adm-more a{color:#2563eb;font-weight:700;text-decoration:none;}
.adm-trf{padding:2px 18px 16px;display:flex;flex-direction:column;gap:9px;}
.adm-trf-item{font-size:13px;color:var(--muted);line-height:1.6;}
.adm-trf-item b{color:var(--strong);}
.adm-trf-item .arr{color:#2563eb;font-weight:800;}
.adm-trf-item .dt{font-size:11px;color:var(--muted);}
.adm-empty{background:var(--card);border:1px dashed var(--border);border-radius:14px;
padding:26px 18px;text-align:center;color:var(--muted);font-size:14px;margin-bottom:20px;}
.adm-empty .big{font-size:30px;margin-bottom:8px;}

/* modal detail ruangan */
.adm-overlay{position:fixed;inset:0;background:rgba(2,6,23,.72);backdrop-filter:blur(3px);
display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;}
.adm-light .adm-overlay{background:rgba(15,23,42,.45);}
.adm-modal{width:620px;max-width:100%;max-height:88vh;overflow:auto;background:var(--card);
border:1px solid var(--border);border-radius:16px;padding:22px;animation:admUp .25s ease both;}
.adm-modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:10px;}
.adm-modal-header h3{color:var(--strong);font-size:17px;font-weight:800;margin:0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.adm-close{background:transparent;border:none;color:var(--muted);font-size:16px;cursor:pointer;}
.adm-modal-sub{font-size:12px;color:var(--muted);margin-bottom:12px;}
.adm-badge{border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:800;}
.adm-badge.free{background:rgba(34,197,94,.15);color:#4ade80;}
.adm-badge.busy{background:rgba(239,68,68,.15);color:#f87171;}
.adm-light .adm-badge.free{color:#15803d;} .adm-light .adm-badge.busy{color:#b91c1c;}
.adm-days{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 14px;}
.adm-day{min-width:48px;border-radius:8px;padding:6px 8px;text-align:center;font-size:10px;font-weight:800;
border:1px solid var(--border);color:var(--muted);}
.adm-day b{display:block;font-size:13px;color:var(--strong);}
.adm-day.today{border-color:#2563eb;background:rgba(37,99,235,.12);color:#93c5fd;}
.adm-slot{display:flex;align-items:center;gap:12px;border:1px solid var(--line);border-radius:10px;
padding:9px 12px;margin-bottom:6px;font-size:12.5px;color:var(--text);flex-wrap:wrap;}
.adm-slot .t{font-weight:800;color:#2563eb;min-width:100px;}
.adm-slot .what{flex:1;min-width:180px;}
.adm-slot .what b{color:var(--strong);}
.adm-slot .what span{color:var(--muted);font-size:11.5px;display:block;}
.adm-free{color:var(--muted);font-size:12.5px;}
.adm-modal-foot{margin-top:12px;font-size:12px;color:var(--muted);}
.adm-modal-foot a{color:#2563eb;font-weight:700;text-decoration:none;}
`;

export default function AdminDashboard() {
  const theme = useAppTheme();
  const [stats, setStats] = useState({ classes: 0, teachers: 0, students: 0, rooms: 0, today: 0 });
  const [rooms, setRooms] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date()); // jam hidup
  const [roomFilter, setRoomFilter] = useState('kosong');   // kosong | dipakai | semua
  const [schedFilter, setSchedFilter] = useState('all');    // all | live | next | done
  const [viewRoom, setViewRoom] = useState(null);           // modal detail ruangan
  const [spinning, setSpinning] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  /* detak 1 detik: jam, status berlangsung, progress bar */
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

  /* auto-refresh senyap tiap 60 detik */
  useEffect(() => {
    const t = setInterval(() => load(true), AUTO_REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  /* tutup modal dengan tombol Escape */
  useEffect(() => {
    if (!viewRoom) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setViewRoom(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewRoom]);

  /* ===== semua hook dijalankan dulu, baru early return ===== */
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

  /* status per jadwal hari ini */
  const withStatus = todaySchedules.map((s) => ({
    ...s,
    st: toMin(s.end_time) <= nowF ? 'done' : toMin(s.start_time) <= nowF ? 'live' : 'next',
  }));
  const ongoing = withStatus.filter((s) => s.st === 'live');
  const upcoming = withStatus.filter((s) => s.st === 'next');
  const doneList = withStatus.filter((s) => s.st === 'done');
  const orderedAll = [...ongoing, ...upcoming, ...doneList];

  /* filter tabel jadwal sesuai tab aktif */
  const schedByFilter = schedFilter === 'all' ? orderedAll : orderedAll.filter((s) => s.st === schedFilter);
  const shownSchedules = schedByFilter.slice(0, MAX_SCHEDULE_ROWS);
  const hiddenSchedules = schedByFilter.length - shownSchedules.length;

  /* status ruangan dihitung REAL-TIME dari jadwal berlangsung (bukan dari kolom status DB) */
  const busyRoomIds = new Set(ongoing.map((s) => s.room_id));
  const roomNow = (r) => (busyRoomIds.has(r.id) ? 'dipakai' : 'kosong');
  const emptyRooms = rooms.filter((r) => roomNow(r) === 'kosong');
  const busyRooms = rooms.filter((r) => roomNow(r) === 'dipakai');

  const roomListByFilter =
    roomFilter === 'dipakai' ? busyRooms : roomFilter === 'semua' ? rooms : emptyRooms;
  const topRooms = roomListByFilter.slice(0, MAX_ROOM_CARDS);

  /* progress hari sekolah */
  const prog = nowF < dayStart ? 0 : nowF > dayEnd ? 100 : ((nowF - dayStart) / (dayEnd - dayStart)) * 100;
  const progLabel =
    nowF < dayStart ? 'Belum mulai' : nowF > dayEnd ? 'Sudah selesai' : 'Sedang berjalan';

  const greeting =
    now.getHours() < 11 ? 'Selamat pagi' : now.getHours() < 15 ? 'Selamat siang' :
    now.getHours() < 19 ? 'Selamat sore' : 'Selamat malam';

  const timeLabel = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const nextItem = upcoming[0];
  const minsToNext = nextItem ? Math.max(0, Math.round(toMin(nextItem.start_time) - nowF)) : 0;

  /* data modal detail ruangan */
  const viewRoomSchedules = viewRoom ? withStatus.filter((s) => s.room_id === viewRoom.id) : [];
  const viewRoomWeek = viewRoom
    ? DAYS.map((d) => ({ d, n: allSchedules.filter((s) => s.room_id === viewRoom.id && s.day === d).length }))
    : [];

  const statCards = [
    { emo: '🎓', bg: 'rgba(139,92,246,.15)', num: stats.classes, lbl: 'Kelas', to: '/admin/classes' },
    { emo: '👩‍🏫', bg: 'rgba(34,197,94,.15)', num: stats.teachers, lbl: 'Guru', to: '/admin/teachers' },
    { emo: '🧑‍🎓', bg: 'rgba(234,179,8,.15)', num: stats.students, lbl: 'Siswa', to: '/admin/students' },
    { emo: '🚪', bg: 'rgba(249,115,22,.15)', num: stats.rooms, lbl: 'Ruangan', to: '/admin/rooms' },
    { emo: '📅', bg: 'rgba(37,99,235,.15)', num: stats.today, lbl: 'Jadwal Hari Ini', to: '/admin/schedules' },
  ];

  return (
    <div className={`adm ${theme === 'light' ? 'adm-light' : ''}`}>
      <style>{css}</style>

      <div className="adm-head adm-anim">
        <h2>{greeting}, Admin Kurikulum 👋</h2>
        <div className="adm-clock">
          {lastUpdated && (
            <span className="adm-upd">
              Update {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button className={`adm-refresh ${spinning ? 'spin' : ''}`} onClick={manualRefresh} title="Muat ulang data sekarang">
            <span className="ic">⟳</span> Refresh
          </button>
          {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          <span className="chip">🕐 {timeLabel}</span>
        </div>
      </div>

      {/* ===== banner "sekarang" ===== */}
      {ongoing.length > 0 ? (
        <div className="adm-hero live adm-anim" style={{ animationDelay: '.05s' }}>
          <div className="ic">🟢</div>
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
          <div className="ic">⏰</div>
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
          <div className="ic">🌤️</div>
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

      {/* ===== statistik count-up (klik = buka halaman) ===== */}
      <div className="adm-stats">
        {statCards.map((c, i) => (
          <Link to={c.to} className="adm-stat adm-anim" key={c.lbl} style={{ animationDelay: `${.15 + i * .06}s` }} title={`Buka halaman ${c.lbl}`}>
            <div className="emo" style={{ background: c.bg }}>{c.emo}</div>
            <div className="num"><CountUp value={c.num} /></div>
            <div className="lbl">{c.lbl} →</div>
          </Link>
        ))}
      </div>

      {/* ===== status ruangan: filter chips + kartu klikabel ===== */}
      <div className="adm-sec adm-anim" style={{ animationDelay: '.2s' }}>
        🚪 Status Ruangan
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
        <span className="adm-note" style={{ marginLeft: 8 }}><Link to="/admin/rooms">lihat semua →</Link></span>
      </div>

      {topRooms.length === 0 ? (
        <div className="adm-empty">
          <div className="big">{roomFilter === 'dipakai' ? '🎉' : '😴'}</div>
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
              style={{ animationDelay: `${.25 + i * .04}s` }}
              onClick={() => setViewRoom(r)}
              title={`Klik untuk lihat jadwal ${r.name}`}
            >
              <div className="nm"><span className="dot" /> {r.name}</div>
              <span className="badge">{roomNow(r) === 'dipakai' ? 'Dipakai' : 'Kosong'}</span>
            </div>
          ))}
        </div>
      )}

      {/* ===== jadwal hari ini: tab filter + baris klikabel ===== */}
      <div className="adm-card adm-anim" style={{ animationDelay: '.3s' }}>
        <div className="adm-card-h">
          📅 Jadwal Hari Ini — {today}
          <div className="adm-chips">
            <button className={`adm-chip ${schedFilter === 'all' ? 'on' : ''}`} onClick={() => setSchedFilter('all')}>
              Semua · {withStatus.length}
            </button>
            <button className={`adm-chip ${schedFilter === 'live' ? 'on' : ''}`} onClick={() => setSchedFilter('live')}>
              ● Berlangsung · {ongoing.length}
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
                        {s.st === 'done' ? 'Selesai' : s.st === 'live' ? '● Berlangsung' : 'Akan datang'}
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

      {/* ===== perpindahan terbaru ===== */}
      <div className="adm-card adm-anim" style={{ animationDelay: '.35s' }}>
        <div className="adm-card-h">🔔 Perpindahan Ruangan Terbaru</div>
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
                  <span className="dt"> · {fmtDateTime(t.created_at)}</span>
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
                🚪 {viewRoom.name}
                <span className={`adm-badge ${roomNow(viewRoom) === 'dipakai' ? 'busy' : 'free'}`}>
                  {roomNow(viewRoom) === 'dipakai' ? 'Dipakai sekarang' : 'Kosong sekarang'}
                </span>
              </h3>
              <button className="adm-close" onClick={() => setViewRoom(null)} type="button">✕</button>
            </div>
            <div className="adm-modal-sub">Jumlah jadwal per hari minggu ini — hari ini disorot biru.</div>

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
                    {s.st === 'done' ? 'Selesai' : s.st === 'live' ? '● Berlangsung' : 'Akan datang'}
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