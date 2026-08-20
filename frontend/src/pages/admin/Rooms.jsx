import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Circle, X, Calendar, Check } from 'lucide-react';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAY_NAMES = ['Minggu', ...DAYS]; // index = new Date().getDay()
const fmtTime = (t) => (t ? String(t).slice(0, 5).replace(':', '.') : '');
const toMin = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + m; };

const JP_MIN = 40;
const DAY_START = 6 * 60 + 30;
const DAY_END = (day) => (day === 'Senin' ? 15 * 60 + 40 : 15 * 60);
const TOTAL_SLOTS = (day) => (day === 'Senin' ? 11 : 10);

const BREAKS = [
  { start: 9 * 60 + 10, end: 9 * 60 + 30 },
  { start: 11 * 60 + 30, end: 13 * 60 },
];

function coveredSlots(sMin, eMin, day) {
  const end = DAY_END(day);
  const s = Math.max(sMin, DAY_START);
  const e = Math.min(eMin, end);
  if (e <= s) return 0;
  let total = 0, t = s;
  while (t < e) {
    const br = BREAKS.find((b) => t >= b.start && t < b.end);
    if (br) { t = br.end; continue; }
    const nb = BREAKS.find((b) => b.start > t);
    const limit = Math.min(e, nb ? nb.start : e);
    total += limit - t;
    t = nb && nb.start < e ? nb.end : e;
  }
  return Math.round(total / JP_MIN);
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
.rsx-legend{font-size:11.5px;color:var(--muted);margin-bottom:14px;}
.rsx-legend b{font-weight:800;}
.rsx-legend .g{color:#4ade80;} .rsx-legend .y{color:#facc15;} .rsx-legend .r{color:#f87171;}
.rsx-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center;}
.rsx-search-wrap{flex:1;min-width:220px;position:relative;}
.rsx-search-wrap .ic{position:absolute;left:12px;top:50%;transform:translateY(-50%);opacity:.6;color:var(--muted);}
.rsx-search{width:100%;background:var(--input-bg);border:1px solid var(--input-border);color:var(--text);
border-radius:10px;padding:10px 12px 10px 38px;font-size:13px;outline:none;}
.rsx-search:focus{border-color:#2563eb;}
.rsx-select{background:var(--input-bg);border:1px solid var(--input-border);color:var(--text);
border-radius:10px;padding:10px 12px;font-size:13px;outline:none;min-width:160px;}
.rsx-select:focus{border-color:#2563eb;}
.rsx-count{font-size:11.5px;color:var(--muted);width:100%;}
.rsx-btn{border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:.2s;}
.rsx-btn-primary{background:linear-gradient(90deg,#2563eb,#06b6d4);color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.35);}
.rsx-btn-primary:hover{filter:brightness(1.1);}
.rsx-btn-edit{background:var(--edit-bg);color:var(--edit-text);border:1px solid var(--edit-border);}
.rsx-btn-danger{background:linear-gradient(90deg,#f97316,#ef4444);color:#fff;}
.rsx-btn-sched{background:rgba(34,197,94,.12);color:#4ade80;border:1px solid rgba(34,197,94,.4);}
.rsx-light .rsx-btn-sched{color:#15803d;}
.rsx-btn-sm{padding:6px 11px;font-size:12px;border-radius:6px;margin-right:6px;}
.rsx-table-card{background:var(--card);border:1px solid var(--card-border);border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.08);}
.rsx-table-wrap{overflow-x:auto;}
.rsx-table{width:100%;border-collapse:collapse;}
.rsx-table th{background:var(--th-bg);color:var(--th-text);text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;}
.rsx-table td{padding:13px 16px;border-top:1px solid var(--row-line);color:var(--text);font-size:13.5px;vertical-align:middle;}
.rsx-table tr:hover td{background:var(--row-hover);}
.rsx-empty{text-align:center;color:var(--muted);padding:24px 0 !important;}
.badge{border-radius:999px;padding:4px 12px;font-size:10.5px;font-weight:800;}
.badge.free{background:rgba(34,197,94,.15);color:#4ade80;}
.badge.used{background:rgba(239,68,68,.15);color:#f87171;}
.rsx-light .badge.free{color:#15803d;} .rsx-light .badge.used{color:#b91c1c;}
.rm-chips{display:flex;gap:6px;flex-wrap:wrap;}
.rm-chip{min-width:40px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;
gap:4px;font-size:10px;font-weight:800;border:1px solid transparent;padding:0 8px;cursor:help;}
.rm-chip .d{opacity:.75;font-size:9px;}
.rm-chip.free{background:rgba(34,197,94,.14);color:#4ade80;border-color:rgba(34,197,94,.35);}
.rm-chip.part{background:rgba(234,179,8,.14);color:#facc15;border-color:rgba(234,179,8,.4);}
.rm-chip.full{background:rgba(239,68,68,.14);color:#f87171;border-color:rgba(239,68,68,.4);}
.rsx-light .rm-chip.free{color:#15803d;} .rsx-light .rm-chip.part{color:#a16207;} .rsx-light .rm-chip.full{color:#b91c1c;}
.rsx-overlay{position:fixed;inset:0;background:var(--overlay);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;}
.rsx-modal{width:560px;max-width:100%;max-height:88vh;overflow:auto;background:var(--card);border:1px solid var(--card-border);border-radius:16px;padding:22px;}
.rsx-modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
.rsx-modal-header h3{color:var(--text-strong);font-size:17px;font-weight:700;margin:0;display:flex;align-items:center;}
.rsx-close{background:transparent;border:none;color:var(--muted);cursor:pointer;display:flex;align-items:center;padding:4px;border-radius:6px;transition:.2s;}
.rsx-close:hover{background:rgba(100,116,139,.15);color:var(--text-strong);}
.rsx-form-group{margin-bottom:12px;}
.rsx-form-group label{display:block;font-size:12px;color:var(--label);margin-bottom:6px;font-weight:600;}
.rsx-input{width:100%;background:var(--input-bg);border:1px solid var(--input-border);color:var(--text);border-radius:8px;padding:9px 12px;font-size:13px;outline:none;}
.rsx-input:focus{border-color:#2563eb;}
.rsx-error{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.5);color:#fca5a5;border-radius:8px;padding:10px 12px;font-size:12.5px;margin-bottom:12px;}
.rsx-light .rsx-error{background:rgba(239,68,68,.08);color:#b91c1c;}
.rm-day{margin-bottom:16px;}
.rm-day-h{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.rm-day-h b{color:var(--text-strong);font-size:13.5px;}
.rm-day-h .sub{color:var(--muted);font-size:11px;font-weight:500;}
.rm-badge{border-radius:999px;padding:3px 11px;font-size:10px;font-weight:800;}
.rm-badge.free{background:rgba(34,197,94,.15);color:#4ade80;}
.rm-badge.part{background:rgba(234,179,8,.15);color:#facc15;}
.rm-badge.full{background:rgba(239,68,68,.15);color:#f87171;}
.rsx-light .rm-badge.free{color:#15803d;} .rsx-light .rm-badge.part{color:#a16207;} .rsx-light .rm-badge.full{color:#b91c1c;}
.rm-slot{display:flex;align-items:center;gap:12px;border:1px solid var(--row-line);border-radius:10px;
padding:9px 12px;margin-bottom:6px;font-size:12.5px;color:var(--text);flex-wrap:wrap;}
.rm-slot .t{font-weight:800;color:#2563eb;min-width:100px;}
.rm-slot .what{flex:1;min-width:180px;}
.rm-slot .what b{color:var(--text-strong);}
.rm-slot .what span{color:var(--muted);font-size:11.5px;display:block;}
.rm-free{color:var(--muted);font-size:12.5px;padding:4px 2px 0;}
`;

export default function AdminRooms() {
  const theme = useAppTheme();
  const [rooms, setRooms] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [statusFilter, setStatusFilter] = useState('');
  const [roomModal, setRoomModal] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [viewRoom, setViewRoom] = useState(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([api.get('/admin/rooms'), api.get('/admin/schedules')]);
      setRooms(r.data.data || r.data);
      setSchedules(s.data.data || s.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadOf = (roomId, day) =>
    schedules
      .filter((s) => s.room_id === roomId && s.day === day)
      .reduce((acc, s) => acc + coveredSlots(toMin(s.start_time), toMin(s.end_time), day), 0);
  const totalLoad = (roomId) => DAYS.reduce((a, d) => a + loadOf(roomId, d), 0);
  const dayBadge = (n, day) => {
    const total = TOTAL_SLOTS(day);
    if (n <= 0) return { cls: 'free', txt: 'Kosong' };
    if (n >= total) return { cls: 'full', txt: 'Penuh' };
    return { cls: 'part', txt: `${n}/${total}` };
  };

  const getCurrentStatus = (roomId) => {
    const currentDay = DAY_NAMES[now.getDay()];
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const used = schedules.some((s) => {
      if (s.room_id !== roomId || s.day !== currentDay) return false;
      return currentMin >= toMin(s.start_time) && currentMin < toMin(s.end_time);
    });
    return used ? 'dipakai' : 'kosong';
  };

  const visibleRooms = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = rooms.filter((r) => (r.name || '').toLowerCase().includes(q));
    if (statusFilter) list = list.filter((r) => getCurrentStatus(r.id) === statusFilter);
    const cmpName = (a, b) => (a.name || '').localeCompare(b.name || '', 'id', { numeric: true, sensitivity: 'base' });
    switch (sortBy) {
      case 'name-desc': list = [...list].sort((a, b) => cmpName(b, a)); break;
      case 'load-asc':  list = [...list].sort((a, b) => totalLoad(a.id) - totalLoad(b.id) || cmpName(a, b)); break;
      case 'load-desc': list = [...list].sort((a, b) => totalLoad(b.id) - totalLoad(a.id) || cmpName(a, b)); break;
      default:          list = [...list].sort(cmpName);
    }
    return list;
  }, [rooms, schedules, query, sortBy, statusFilter, now]);

  if (loading) return <PageLoader text="Memuat data ruangan…" />;

  const openCreate = () => { setRoomModal({ mode: 'create' }); setName(''); setError(''); };
  const openEdit = (room) => { setRoomModal({ mode: 'edit', room }); setName(room.name); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Nama ruangan wajib diisi.'); return; }
    setSaving(true); setError('');
    try {
      if (roomModal.mode === 'edit') await api.put(`/admin/rooms/${roomModal.room.id}`, { name });
      else await api.post('/admin/rooms', { name });
      setRoomModal(null); load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Gagal menyimpan.'));
    } finally { setSaving(false); }
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Hapus ruangan ${room.name}?`)) return;
    try { await api.delete(`/admin/rooms/${room.id}`); load(); }
    catch { alert('Gagal menghapus ruangan.'); }
  };

  return (
    <div className={`rsx-page ${theme === 'light' ? 'rsx-light' : ''}`}>
      <style>{css}</style>

      <div className="rsx-page-header">
        <h2>Manajemen Ruangan</h2>
        <button className="rsx-btn rsx-btn-primary" onClick={openCreate}>+ Tambah</button>
      </div>

      <div className="rsx-legend">
        Kepadatan per hari:{' '}
        <b className="g" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Circle size={12} fill="currentColor" /> kosong
        </b>{' '}
        ·{' '}
        <b className="y" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Circle size={12} fill="currentColor" /> sebagian
        </b>{' '}
        ·{' '}
        <b className="r" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Circle size={12} fill="currentColor" /> penuh
        </b>{' '}
        — klik <b>Jadwal</b> untuk rincian.
        <br />
        <span style={{ fontSize: '10.5px' }}>Senin = 11 slot (s.d. 15.40) · Sel–Jum = 10 slot (s.d. 15.00)</span>
      </div>

      <div className="rsx-toolbar">
        <div className="rsx-search-wrap">
          <Search size={16} className="ic" />
          <input
            className="rsx-search"
            placeholder="Cari ruangan… mis. RPL 1, Teori 12"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="rsx-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="name-asc">Urutkan: Nama A→Z</option>
          <option value="name-desc">Urutkan: Nama Z→A</option>
          <option value="load-asc">Urutkan: Paling kosong</option>
          <option value="load-desc">Urutkan: Paling penuh</option>
        </select>
        <select className="rsx-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Semua status</option>
          <option value="kosong">Kosong</option>
          <option value="dipakai">Dipakai</option>
        </select>
        <div className="rsx-count">
          {visibleRooms.length} dari {rooms.length} ruangan ditampilkan
        </div>
      </div>

      <div className="rsx-table-card">
        <div className="rsx-table-wrap">
          <table className="rsx-table">
            <thead>
              <tr><th>Nama</th><th>Status Saat Ini</th><th>Kepadatan Minggu Ini</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {visibleRooms.length === 0 ? (
                <tr><td className="rsx-empty" colSpan="4">
                  Tidak ada ruangan yang cocok{query ? ` untuk "${query}"` : ''}.
                </td></tr>
              ) : (
                visibleRooms.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>
                      <span className={`badge ${getCurrentStatus(r.id) === 'kosong' ? 'free' : 'used'}`}>
                        {getCurrentStatus(r.id)}
                      </span>
                    </td>
                    <td>
                      <div className="rm-chips">
                        {DAYS.map((d) => {
                          const n = loadOf(r.id, d);
                          const b = dayBadge(n, d);
                          const max = TOTAL_SLOTS(d);
                          return (
                            <span
                              key={d}
                              className={`rm-chip ${b.cls}`}
                              title={`${d} (s.d. ${d === 'Senin' ? '15.40' : '15.00'}): ${b.cls === 'free' ? 'kosong' : `${n}/${max} slot terisi`}`}
                            >
                              <span className="d">{d.slice(0, 2)}</span>
                              {b.cls === 'free' ? <Check size={12} /> : b.cls === 'full' ? <X size={12} /> : n}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <button className="rsx-btn rsx-btn-sched rsx-btn-sm" onClick={() => setViewRoom(r)}>Jadwal</button>
                      <button className="rsx-btn rsx-btn-edit rsx-btn-sm" onClick={() => openEdit(r)}>Edit</button>
                      <button className="rsx-btn rsx-btn-danger rsx-btn-sm" onClick={() => handleDelete(r)}>Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {roomModal && (
        <div className="rsx-overlay" onMouseDown={() => setRoomModal(null)}>
          <div className="rsx-modal" style={{ width: 440 }} onMouseDown={(e) => e.stopPropagation()}>
            <div className="rsx-modal-header">
              <h3>{roomModal.mode === 'edit' ? 'Edit Ruangan' : 'Tambah'}</h3>
              <button className="rsx-close" onClick={() => setRoomModal(null)} type="button"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="rsx-form-group">
                <label>Nama Ruangan</label>
                <input className="rsx-input" value={name} onChange={(e) => e.target.value ? setName(e.target.value) : setName(e.target.value)} autoFocus />
              </div>
              {error && <div className="rsx-error">{error}</div>}
              <button className="rsx-btn rsx-btn-primary" type="submit" disabled={saving}>
                {saving ? 'Menyimpan…' : 'Simpan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {viewRoom && (
        <div className="rsx-overlay" onMouseDown={() => setViewRoom(null)}>
          <div className="rsx-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="rsx-modal-header">
              <h3>
                <Calendar size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />
                Jadwal Ruangan — {viewRoom.name}
              </h3>
              <button className="rsx-close" onClick={() => setViewRoom(null)} type="button"><X size={18} /></button>
            </div>

            {DAYS.map((d) => {
              const list = schedules
                .filter((s) => s.room_id === viewRoom.id && s.day === d)
                .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
              const n = loadOf(viewRoom.id, d);
              const b = dayBadge(n, d);
              const until = d === 'Senin' ? '15.40' : '15.00';
              return (
                <div className="rm-day" key={d}>
                  <div className="rm-day-h">
                    <b>{d}</b>
                    <span className={`rm-badge ${b.cls}`}>
                      {b.cls === 'free' ? 'Kosong' : b.cls === 'full' ? 'Penuh' : `Terisi ${b.txt}`}
                    </span>
                    <span className="sub">s.d. {until} WIB · {TOTAL_SLOTS(d)} slot</span>
                  </div>
                  {list.length === 0 ? (
                    <div className="rm-free">Tidak ada jadwal — ruangan kosong sepanjang hari.</div>
                  ) : (
                    list.map((s) => (
                      <div className="rm-slot" key={s.id}>
                        <span className="t">{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</span>
                        <span className="what">
                          <b>{s.subject?.name || 'Mapel'}</b> — Kelas {s.class?.name || '-'}
                          <span>{s.teacher?.user?.name || '-'}</span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}