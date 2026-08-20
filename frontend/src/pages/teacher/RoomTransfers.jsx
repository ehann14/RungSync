import { useCallback, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import api from '../../services/api';

const fmtTime = (t) => (t ? String(t).slice(0, 5).replace(':', '.') : '');

/* ---------- Deteksi tema (light/dark) ---------- */
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
--label:#475569;--inp-bg:#ffffff;--inp-border:#cbd5e1;--line:#e2e8f0;}
.trf.trf-dark{--card:#0d1930;--border:#1c2b45;--text:#e2e8f0;--strong:#f1f5f9;--muted:#64748b;
--label:#94a3b8;--inp-bg:#12203a;--inp-border:#24344f;--line:#16263f;}
.trf-header{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px;}
.trf-header h2{font-size:22px;font-weight:800;color:var(--strong);margin:0;}
.trf-btn{border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;}
.trf-btn-primary{background:linear-gradient(90deg,#2563eb,#06b6d4);color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.35);}
.trf-btn-primary:hover{filter:brightness(1.1);}
.trf-btn-primary:disabled{opacity:.6;cursor:wait;}
.trf-list{display:flex;flex-direction:column;gap:12px;}
.trf-item{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px 18px;
box-shadow:0 1px 3px rgba(15,23,42,.08);}
.trf-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;}
.trf-subject{font-weight:800;color:var(--strong);font-size:14.5px;}
.trf-badge{border-radius:999px;padding:4px 12px;font-size:11px;font-weight:800;}
.trf-badge.pending{background:rgba(234,179,8,.15);color:#a16207;}
.trf-badge.approved{background:rgba(34,197,94,.15);color:#15803d;}
.trf-badge.rejected{background:rgba(239,68,68,.15);color:#b91c1c;}
.trf-dark .trf-badge.pending{color:#facc15;}
.trf-dark .trf-badge.approved{color:#4ade80;}
.trf-dark .trf-badge.rejected{color:#fca5a5;}
.trf-meta{font-size:12.5px;color:var(--muted);line-height:1.7;}
.trf-arrow{color:#2563eb;font-weight:800;display:inline-flex;align-items:center;}
.trf-empty{background:var(--card);border:1px solid var(--border);border-radius:14px;
color:var(--muted);padding:22px 18px;font-size:14px;}
.trf-error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.45);color:#fca5a5;
border-radius:12px;padding:12px 16px;font-size:13px;margin-bottom:16px;}
.trf-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(2px);
display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;}
.trf-modal{width:460px;max-width:100%;max-height:88vh;overflow:auto;background:var(--card);
border:1px solid var(--border);border-radius:14px;padding:20px 22px;}
.trf-modal h3{margin:0 0 14px;font-size:17px;font-weight:700;color:var(--strong);}
.trf-group{margin-bottom:12px;}
.trf-group label{display:block;font-size:12px;font-weight:600;color:var(--label);margin-bottom:6px;}
.trf-select,.trf-input{width:100%;background:var(--inp-bg);border:1px solid var(--inp-border);
color:var(--text);border-radius:8px;padding:9px 12px;font-size:13px;outline:none;font-family:inherit;}
.trf-select:focus,.trf-input:focus{border-color:#2563eb;}
.trf-actions{display:flex;gap:10px;margin-top:14px;}
.trf-actions .trf-btn{flex:1;}
.trf-btn-ghost{background:transparent;box-shadow:inset 0 0 0 1px var(--border);color:var(--muted);}
`;

const STATUS_MAP = {
  pending: { label: 'Menunggu', cls: 'pending' },
  menunggu: { label: 'Menunggu', cls: 'pending' },
  approved: { label: 'Disetujui', cls: 'approved' },
  disetujui: { label: 'Disetujui', cls: 'approved' },
  rejected: { label: 'Ditolak', cls: 'rejected' },
  ditolak: { label: 'Ditolak', cls: 'rejected' },
};

export default function TeacherRoomTransfers() {
  const theme = useAppTheme();
  const [transfers, setTransfers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ schedule_id: '', room_id: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tr, sch, rm] = await Promise.all([
        api.get('/teacher/room-transfers'),
        api.get('/teacher/schedule'),
        api.get('/teacher/rooms'),
      ]);
      setTransfers(tr.data?.data || tr.data || []);
      setSchedules(sch.data?.data || sch.data || []);
      setRooms(rm.data?.data || rm.data || []);
    } catch {
      setError('Gagal memuat data perpindahan ruangan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.schedule_id || !form.room_id) {
      setFormError('Pilih jadwal dan ruangan tujuan terlebih dahulu.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/teacher/room-transfer', {
        schedule_id: Number(form.schedule_id),
        room_id: Number(form.room_id),
        to_room_id: Number(form.room_id),
        reason: form.reason || null,
      });
      setModalOpen(false);
      setForm({ schedule_id: '', room_id: '', reason: '' });
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

  const statusOf = (t) => STATUS_MAP[String(t.status || '').toLowerCase()] || { label: t.status || '-', cls: 'pending' };

  return (
    <div className={`trf ${theme === 'dark' ? 'trf-dark' : ''}`}>
      <style>{css}</style>

      <div className="trf-header">
        <h2>Perpindahan Ruangan</h2>
        <button className="trf-btn trf-btn-primary" onClick={() => { setFormError(''); setModalOpen(true); }}>
          + Ajukan Perpindahan
        </button>
      </div>

      {error && <div className="trf-error">{error}</div>}

      {loading ? (
        <div className="trf-empty">Memuat…</div>
      ) : transfers.length === 0 ? (
        <div className="trf-empty">Belum ada permintaan perpindahan ruangan.</div>
      ) : (
        <div className="trf-list">
          {transfers.map((t) => {
            const st = statusOf(t);
            const from = t.schedule?.room?.name || t.from_room?.name || '-';
            const to = t.room?.name || t.to_room?.name || '-';
            return (
              <div className="trf-item" key={t.id}>
                <div className="trf-top">
                  <span className="trf-subject">
                    {t.schedule?.subject?.name || 'Mata Pelajaran'} — Kelas {t.schedule?.class?.name || '-'}
                  </span>
                  <span className={`trf-badge ${st.cls}`}>{st.label}</span>
                </div>
                <div className="trf-meta">
                  {t.schedule?.day} · {fmtTime(t.schedule?.start_time)}–{fmtTime(t.schedule?.end_time)}
                  <br />
                  {from}{' '}
                  <ArrowRight size={14} className="trf-arrow" style={{ display: 'inline-flex', verticalAlign: 'middle', margin: '0 4px' }} />{' '}
                  {to}
                  {t.reason ? <><br />Alasan: {t.reason}</> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="trf-overlay" onMouseDown={() => setModalOpen(false)}>
          <div className="trf-modal" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Ajukan Perpindahan Ruangan</h3>
            <form onSubmit={handleSubmit}>
              <div className="trf-group">
                <label>Jadwal (mata pelajaran yang akan dipindah)</label>
                <select
                  className="trf-select"
                  value={form.schedule_id}
                  onChange={(e) => setForm({ ...form, schedule_id: e.target.value })}
                >
                  <option value="">— pilih jadwal —</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.day} {fmtTime(s.start_time)}–{fmtTime(s.end_time)} · {s.subject?.name} · Kelas {s.class?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="trf-group">
                <label>Ruangan Tujuan</label>
                <select
                  className="trf-select"
                  value={form.room_id}
                  onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                >
                  <option value="">— pilih ruangan —</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="trf-group">
                <label>Alasan (opsional)</label>
                <textarea
                  className="trf-input"
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Misal: proyektor ruangan sebelumnya rusak"
                />
              </div>

              {formError && <div className="trf-error">{formError}</div>}

              <div className="trf-actions">
                <button className="trf-btn trf-btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Mengirim…' : 'Kirim Permintaan'}
                </button>
                <button className="trf-btn trf-btn-ghost" type="button" onClick={() => setModalOpen(false)}>
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