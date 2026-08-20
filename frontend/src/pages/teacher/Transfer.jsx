import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Info, Calendar } from 'lucide-react';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const fmtTime = (t) => (t ? String(t).slice(0, 5).replace(':', '.') : '');
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

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
function nextOccurrence(day) {
  const d = dateForDay(day);
  if (!d) return new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) d.setDate(d.getDate() + 7);
  return d;
}
const fmtDateShort = (d) =>
  d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const fmtDateLong = (d) =>
  d ? d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

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
.trf{padding:8px 4px;
--card:#ffffff;--border:#e2e8f0;--text:#334155;--strong:#0f172a;--muted:#64748b;
--label:#475569;--inp-bg:#ffffff;--inp-border:#cbd5e1;--th-bg:#f1f5f9;--th-text:#1d4ed8;--line:#e2e8f0;}
.trf.trf-dark{--card:#0d1930;--border:#1c2b45;--text:#e2e8f0;--strong:#f1f5f9;--muted:#64748b;
--label:#94a3b8;--inp-bg:#12203a;--inp-border:#24344f;--th-bg:#132340;--th-text:#8ab4f8;--line:#16263f;}
.trf h2{font-size:24px;font-weight:800;color:var(--strong);margin:0 0 16px;display:flex;align-items:center;}
.trf-info{background:var(--card);border:1px solid var(--border);border-radius:14px;
padding:14px 18px;font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:20px;display:flex;align-items:flex-start;}
.trf-info b{color:var(--strong);}
.trf-card{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:20px;}
.trf-card-h{padding:13px 18px;border-bottom:1px solid var(--line);font-weight:800;color:var(--strong);
font-size:12px;letter-spacing:.08em;text-transform:uppercase;}
.trf-table-wrap{overflow-x:auto;}
.trf-table{width:100%;border-collapse:collapse;}
.trf-table th{background:var(--th-bg);color:var(--th-text);text-align:left;font-size:11px;
letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;}
.trf-table td{padding:12px 16px;border-top:1px solid var(--line);color:var(--text);font-size:13.5px;}
.trf-table tr:hover td{background:rgba(37,99,235,.05);}
.trf-day-cell b{display:block;color:var(--strong);}
.trf-day-cell span{font-size:11px;color:var(--muted);display:flex;align-items:center;gap:4px;}
.trf-empty{text-align:center;color:var(--muted);padding:22px 0 !important;}
.trf-btn{border:none;border-radius:8px;padding:8px 14px;font-size:12.5px;font-weight:700;cursor:pointer;}
.trf-btn-primary{background:linear-gradient(90deg,#2563eb,#06b6d4);color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.35);}
.trf-btn-primary:hover{filter:brightness(1.1);}
.trf-btn-primary:disabled{opacity:.6;cursor:wait;}
.trf-btn-ghost{background:transparent;box-shadow:inset 0 0 0 1px var(--border);color:var(--muted);}
.trf-badge{border-radius:999px;padding:4px 12px;font-size:11px;font-weight:800;}
.trf-badge.pending{background:rgba(234,179,8,.15);color:#a16207;}
.trf-badge.approved{background:rgba(34,197,94,.15);color:#15803d;}
.trf-badge.rejected{background:rgba(239,68,68,.15);color:#b91c1c;}
.trf-dark .trf-badge.pending{color:#facc15;}
.trf-dark .trf-badge.approved{color:#4ade80;}
.trf-dark .trf-badge.rejected{color:#fca5a5;}
.trf-error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.45);color:#fca5a5;
border-radius:12px;padding:12px 16px;font-size:13px;margin-bottom:16px;}
.trf-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(2px);
display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;}
.trf-modal{width:460px;max-width:100%;max-height:88vh;overflow:auto;background:var(--card);
border:1px solid var(--border);border-radius:14px;padding:20px 22px;}
.trf-modal h3{margin:0 0 4px;font-size:17px;font-weight:700;color:var(--strong);}
.trf-modal .trf-sub{font-size:12.5px;color:var(--muted);margin:0 0 14px;}
.trf-group{margin-bottom:12px;}
.trf-group label{display:block;font-size:12px;font-weight:600;color:var(--label);margin-bottom:6px;}
.trf-select,.trf-input{width:100%;background:var(--inp-bg);border:1px solid var(--inp-border);
color:var(--text);border-radius:8px;padding:9px 12px;font-size:13px;outline:none;font-family:inherit;}
.trf-select:focus,.trf-input:focus{border-color:#2563eb;}
.trf-hint{font-size:11px;color:var(--muted);margin-top:4px;}
.trf-date-auto{background:var(--inp-bg);border:1px dashed #2563eb;border-radius:8px;
padding:10px 12px;font-size:13px;font-weight:700;color:var(--strong);display:flex;align-items:center;}
.trf-actions{display:flex;gap:10px;margin-top:14px;}
.trf-actions .trf-btn{flex:1;}
`;

const STATUS_MAP = {
  pending: { label: 'Menunggu', cls: 'pending' },
  menunggu: { label: 'Menunggu', cls: 'pending' },
  approved: { label: 'Disetujui', cls: 'approved' },
  disetujui: { label: 'Disetujui', cls: 'approved' },
  rejected: { label: 'Ditolak', cls: 'rejected' },
  ditolak: { label: 'Ditolak', cls: 'rejected' },
};

export default function TeacherTransfer() {
  const theme = useAppTheme();
  const [schedules, setSchedules] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ room_id: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [schR, trR] = await Promise.allSettled([
      api.get('/teacher/schedule'),
      api.get('/teacher/room-transfers'),
    ]);
    if (schR.status === 'fulfilled') setSchedules(schR.value.data?.data || schR.value.data || []);
    else setError('Gagal memuat jadwal mengajar.');
    if (trR.status === 'fulfilled') setTransfers(trR.value.data?.data || trR.value.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadRooms = useCallback(async (schedule, date) => {
    setRoomsLoading(true);
    setRoomsError('');
    try {
      const res = await api.get('/teacher/rooms', {
        params: {
          schedule_id: schedule?.id,
          date,
          day: schedule?.day,
          start_time: schedule?.start_time,
          end_time: schedule?.end_time,
        },
      });
      setRooms(res.data?.data || res.data || []);
    } catch (err) {
      setRooms([]);
      const errors = err.response?.data?.errors;
      setRoomsError(errors ? Object.values(errors).flat().join(' ') : 'Gagal memuat ruangan yang tersedia.');
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  if (loading) return <PageLoader text="Memuat perpindahan ruangan…" />;

  const openModal = (s) => {
    setModal(s);
    setForm({ room_id: '', reason: '' });
    setFormError('');
    loadRooms(s, toISO(nextOccurrence(s.day)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modal) return;
    if (!form.room_id) {
      setFormError('Pilih ruangan tujuan terlebih dahulu.');
      return;
    }
    const dateISO = toISO(nextOccurrence(modal.day));
    setSaving(true);
    setFormError('');
    try {
      await api.post('/teacher/room-transfer', {
        schedule_id: modal.id,
        room_id: Number(form.room_id),
        to_room_id: Number(form.room_id),
        date: dateISO,
        transfer_date: dateISO,
        effective_date: dateISO,
        reason: form.reason || null,
      });
      setModal(null);
      load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setFormError(
        errors
          ? Object.values(errors).flat().join(' ')
          : (err.response?.data?.message || 'Gagal mengirim permintaan perpindahan.')
      );
    } finally {
      setSaving(false);
    }
  };

  const statusOf = (t) =>
    STATUS_MAP[String(t.status || '').toLowerCase()] || { label: t.status || '-', cls: 'pending' };
  const dateOf = (t) => t.date || t.transfer_date || t.effective_date;

  const sortedSchedules = [...schedules].sort((a, b) =>
    a.day === b.day
      ? (a.start_time || '').localeCompare(b.start_time || '')
      : DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
  );

  return (
    <div className={`trf ${theme === 'dark' ? 'trf-dark' : ''}`}>
      <style>{css}</style>

      <h2>
        Pindah Ruangan <RefreshCw size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 6 }} />
      </h2>

      {error && <div className="trf-error">{error}</div>}

      <div className="trf-info">
        <Info size={18} style={{ flexShrink: 0, marginTop: 2, marginRight: 10, color: 'var(--strong)' }} />
        <div>
          Perpindahan hanya berlaku <b>1 kali pada tanggal yang dipilih</b>. Minggu
          berikutnya jadwal otomatis kembali ke ruangan awal.
          <br />
          <span style={{ fontSize: '11px' }}>
            Minggu aktif: {fmtDateShort(dateForDay('Senin'))} — {fmtDateShort(dateForDay('Sabtu'))}
            {new Date().getDay() === 0 ? ' (otomatis minggu depan)' : ''}
          </span>
        </div>
      </div>

      <div className="trf-card">
        <div className="trf-card-h">Jadwal Mengajar Saya</div>
        <div className="trf-table-wrap">
          <table className="trf-table">
            <thead>
              <tr><th>Hari / Tanggal</th><th>Jam</th><th>Kelas</th><th>Ruangan Awal</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {sortedSchedules.length === 0 ? (
                <tr><td className="trf-empty" colSpan="5">Belum ada jadwal mengajar.</td></tr>
              ) : (
                sortedSchedules.map((s) => (
                  <tr key={s.id}>
                    <td className="trf-day-cell">
                      <b>{s.day}</b>
                      <span>
                        <Calendar size={12} /> {fmtDateShort(dateForDay(s.day))}
                      </span>
                    </td>
                    <td>{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</td>
                    <td>{s.class?.name || '-'}</td>
                    <td>{s.room?.name || '-'}</td>
                    <td>
                      <button className="trf-btn trf-btn-primary" onClick={() => openModal(s)}>
                        Pindah Ruangan
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="trf-card">
        <div className="trf-card-h">Riwayat Perpindahan</div>
        <div className="trf-table-wrap">
          <table className="trf-table">
            <thead>
              <tr><th>Tanggal Berlaku</th><th>Kelas</th><th>Dari</th><th>Ke</th><th>Status</th></tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? (
                <tr><td className="trf-empty" colSpan="5">Belum ada riwayat perpindahan.</td></tr>
              ) : (
                transfers.map((t) => {
                  const st = statusOf(t);
                  return (
                    <tr key={t.id}>
                      <td>{fmtDate(dateOf(t))}</td>
                      <td>{t.schedule?.class?.name || t.class?.name || '-'}</td>
                      <td>{t.schedule?.room?.name || t.from_room?.name || '-'}</td>
                      <td>{t.room?.name || t.to_room?.name || '-'}</td>
                      <td><span className={`trf-badge ${st.cls}`}>{st.label}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="trf-overlay" onMouseDown={() => setModal(null)}>
          <div className="trf-modal" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Pindah Ruangan</h3>
            <p className="trf-sub">
              {modal.day} · {fmtTime(modal.start_time)}–{fmtTime(modal.end_time)} ·{' '}
              {modal.subject?.name} · Kelas {modal.class?.name} · Ruangan saat ini:{' '}
              {modal.room?.name}
            </p>

            <form onSubmit={handleSubmit}>
              <div className="trf-group">
                <label>Tanggal Berlaku (otomatis)</label>
                <div className="trf-date-auto">
                  <Calendar size={16} style={{ marginRight: 8 }} /> {fmtDateLong(nextOccurrence(modal.day))}
                </div>
                <div className="trf-hint">
                  Mengikuti hari mengajar terdekat dari jadwal ini — tidak perlu dipilih manual.
                </div>
              </div>

              <div className="trf-group">
                <label>Ruangan Tujuan{roomsLoading ? ' (memuat…)' : ''}</label>
                <select
                  className="trf-select"
                  value={form.room_id}
                  onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                  disabled={roomsLoading}
                >
                  <option value="">— pilih ruangan —</option>
                  {rooms
                    .filter((r) => String(r.id) !== String(modal.room_id))
                    .map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
                {roomsError && <div className="trf-error" style={{ marginTop: 8 }}>{roomsError}</div>}
              </div>

              <div className="trf-group">
                <label>Alasan (opsional)</label>
                <textarea
                  className="trf-input"
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Misal: proyektor di ruangan saat ini rusak"
                />
              </div>

              {formError && <div className="trf-error">{formError}</div>}

              <div className="trf-actions">
                <button className="trf-btn trf-btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Mengirim…' : 'Kirim Permintaan'}
                </button>
                <button className="trf-btn trf-btn-ghost" type="button" onClick={() => setModal(null)}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}