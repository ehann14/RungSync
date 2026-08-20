import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  Circle, Clock, Calendar, Coffee, CalendarDays, 
  Sun, GraduationCap, DoorOpen, ArrowLeftRight, Hand 
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
.tsd{padding:8px 4px;
--card:#ffffff;--border:#e2e8f0;--text:#334155;--strong:#0f172a;--muted:#64748b;
--th-bg:#f1f5f9;--th-text:#1d4ed8;--line:#e2e8f0;--hover:rgba(37,99,235,.05);}
.tsd.tsd-dark{--card:#0d1930;--border:#1c2b45;--text:#e2e8f0;--strong:#f1f5f9;--muted:#64748b;
--th-bg:#132340;--th-text:#8ab4f8;--line:#16263f;--hover:rgba(37,99,235,.06);}
.tsd-greet{font-size:22px;font-weight:800;color:var(--strong);margin:0 0 4px;display:flex;align-items:center;}
.tsd-date{font-size:12.5px;color:var(--muted);margin:0 0 18px;}
.tsd-banner{display:flex;align-items:center;gap:14px;border-radius:16px;padding:16px 18px;
margin-bottom:20px;border:1px solid;animation:tsdIn .35s ease;}
@keyframes tsdIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.tsd-banner .ic{flex:none;display:flex;align-items:center;}
.tsd-banner .body{flex:1;min-width:0;}
.tsd-banner .title{font-size:15px;font-weight:800;display:flex;align-items:center;}
.tsd-banner .sub{font-size:12.5px;margin-top:3px;line-height:1.6;}
.tsd-banner .when{flex:none;font-weight:800;font-size:12px;border-radius:999px;padding:8px 14px;white-space:nowrap;}
.tsd-ongoing{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.4);}
.tsd-ongoing .title{color:#15803d;} .tsd-ongoing .sub{color:#166534;}
.tsd-ongoing .when{background:#22c55e;color:#fff;}
.tsd-today{background:rgba(234,179,8,.12);border-color:rgba(234,179,8,.45);}
.tsd-today .title{color:#a16207;} .tsd-today .sub{color:#854d0e;}
.tsd-today .when{background:#eab308;color:#111;}
.tsd-future{background:rgba(37,99,235,.1);border-color:rgba(37,99,235,.35);}
.tsd-future .title{color:#1d4ed8;} .tsd-future .sub{color:#1e40af;}
.tsd-future .when{background:#2563eb;color:#fff;}
.tsd-dark .tsd-ongoing .title{color:#4ade80;} .tsd-dark .tsd-ongoing .sub{color:#86efac;}
.tsd-dark .tsd-today .title{color:#facc15;} .tsd-dark .tsd-today .sub{color:#fde68a;}
.tsd-dark .tsd-future .title{color:#93c5fd;} .tsd-dark .tsd-future .sub{color:#bfdbfe;}
.tsd-pulse{display:inline-block;width:8px;height:8px;border-radius:50%;background:#16a34a;
margin-right:6px;animation:tsdPulse 1.2s infinite;}
@keyframes tsdPulse{0%{box-shadow:0 0 0 0 rgba(22,163,74,.5)}70%{box-shadow:0 0 0 8px rgba(22,163,74,0)}100%{box-shadow:0 0 0 0 rgba(22,163,74,0)}}
.tsd-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:20px;}
.tsd-stat{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;
display:flex;align-items:center;gap:12px;box-shadow:0 1px 3px rgba(15,23,42,.08);}
.tsd-stat .emo{width:44px;height:44px;border-radius:12px;display:flex;
align-items:center;justify-content:center;flex:none;}
.tsd-stat .num{font-size:20px;font-weight:800;color:var(--strong);}
.tsd-stat .lbl{font-size:11px;color:var(--muted);font-weight:600;}
.tsd-card{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:20px;}
.tsd-card-h{padding:14px 18px;border-bottom:1px solid var(--line);font-weight:700;color:var(--strong);font-size:15px;display:flex;align-items:center;}
.tsd-today-list{display:flex;flex-direction:column;gap:10px;padding:16px 18px;}
.tsd-item{display:flex;align-items:center;gap:14px;border:1px solid var(--border);
border-radius:12px;padding:12px 14px;background:var(--hover);flex-wrap:wrap;}
.tsd-item.done{opacity:.55;}
.tsd-item.live{border-color:rgba(34,197,94,.5);}
.tsd-time{font-weight:800;color:#2563eb;font-size:13px;min-width:110px;}
.tsd-detail{display:flex;flex-direction:column;gap:2px;flex:1;min-width:180px;}
.tsd-detail b{color:var(--strong);font-size:13.5px;}
.tsd-detail span{color:var(--muted);font-size:12px;}
.tsd-st{flex:none;border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:800;}
.tsd-st.done{background:rgba(100,116,139,.15);color:#64748b;}
.tsd-st.live{background:rgba(34,197,94,.15);color:#15803d;}
.tsd-st.next{background:rgba(37,99,235,.12);color:#1d4ed8;}
.tsd-dark .tsd-st.live{color:#4ade80;} .tsd-dark .tsd-st.next{color:#93c5fd;}
.tsd-move{font-size:11px;color:#b45309;background:rgba(234,179,8,.15);border-radius:999px;padding:3px 10px;display:flex;align-items:center;}
.tsd-table-wrap{overflow-x:auto;}
.tsd-table{width:100%;border-collapse:collapse;}
.tsd-table th{background:var(--th-bg);color:var(--th-text);text-align:left;font-size:11px;
letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;}
.tsd-table td{padding:12px 16px;border-top:1px solid var(--line);color:var(--text);font-size:13.5px;}
.tsd-table tr:hover td{background:var(--hover);}
.tsd-empty{text-align:center;color:var(--muted);padding:22px 0 !important;}
.tsd-error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.45);color:#fca5a5;
border-radius:12px;padding:12px 16px;font-size:13px;margin-bottom:16px;}
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

  /* ===== SEMUA HOOK (useMemo) dijalankan SEBELUM early return ===== */
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

  /* ===== baru boleh return di sini (setelah semua hook) ===== */
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
      icon: <Circle size={26} fill="#22c55e" color="#22c55e" />, 
      title: `Sedang berlangsung: ${s.subject?.name} — Kelas ${s.class?.name}`, 
      sub 
    };
    if (r.type === 'today') return { 
      icon: <Clock size={26} color="#eab308" />, 
      title: `Jangan lupa! Mengajar ${fmtTime(s.start_time)} di Kelas ${s.class?.name}`, 
      sub 
    };
    return { 
      icon: <Calendar size={26} color="#2563eb" />, 
      title: `Jadwal berikutnya: ${s.day} — Kelas ${s.class?.name} (${s.roomName})`, 
      sub 
    };
  };

  return (
    <div className={`tsd ${theme === 'dark' ? 'tsd-dark' : ''}`}>
      <style>{css}</style>

      <h2 className="tsd-greet">
        {greeting}, {me?.name ? me.name.split(',')[0] : 'Bapak/Ibu Guru'} <Hand size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 4 }} />
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
          <div className="ic"><Coffee size={26} color="#64748b" /></div>
          <div className="body">
            <div className="title">Tidak ada jadwal mengajar minggu ini.</div>
            <div className="sub">Waktu yang pas untuk menyiapkan materi berikutnya!</div>
          </div>
        </div>
      )}

      <div className="tsd-stats">
        <div className="tsd-stat">
          <div className="emo" style={{ background: 'rgba(37,99,235,.12)' }}><CalendarDays size={22} color="#2563eb" /></div>
          <div><div className="num">{schedules.length}</div><div className="lbl">Slot Jadwal Minggu Ini</div></div>
        </div>
        <div className="tsd-stat">
          <div className="emo" style={{ background: 'rgba(34,197,94,.12)' }}><Sun size={22} color="#22c55e" /></div>
          <div><div className="num">{todayList.length}</div><div className="lbl">Jadwal Hari Ini</div></div>
        </div>
        <div className="tsd-stat">
          <div className="emo" style={{ background: 'rgba(234,179,8,.15)' }}><GraduationCap size={22} color="#eab308" /></div>
          <div><div className="num">{uniqueClasses.length}</div><div className="lbl">Kelas Diampu</div></div>
        </div>
        <div className="tsd-stat">
          <div className="emo" style={{ background: 'rgba(168,85,247,.12)' }}><DoorOpen size={22} color="#a855f7" /></div>
          <div><div className="num">{uniqueRooms.length}</div><div className="lbl">Ruangan Dipakai</div></div>
        </div>
      </div>

      <div className="tsd-card">
        <div className="tsd-card-h">
          <Calendar size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} /> 
          Jadwal Hari Ini — {today}
        </div>
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

      <div className="tsd-card">
        <div className="tsd-card-h">
          <CalendarDays size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} /> 
          Jadwal Minggu Ini
        </div>
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
    </div>
  );
}