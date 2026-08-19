import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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
.sfm-overlay{position:fixed;inset:0;z-index:1000;padding:16px;
display:flex;align-items:center;justify-content:center;
background:rgba(15,23,42,.5);backdrop-filter:blur(2px);
--card:#ffffff;--border:#e2e8f0;--text:#0f172a;--muted:#64748b;--label:#475569;
--inp-bg:#ffffff;--inp-border:#cbd5e1;--inp-text:#0f172a;}
.sfm-overlay.sfm-dark{background:rgba(2,6,23,.72);
--card:#0d1930;--border:#1c2b45;--text:#f1f5f9;--muted:#94a3b8;--label:#94a3b8;
--inp-bg:#12203a;--inp-border:#24344f;--inp-text:#e2e8f0;}
.sfm-box{width:480px;max-width:100%;max-height:88vh;overflow:auto;
background:var(--card);border:1px solid var(--border);border-radius:14px;
padding:20px 22px;box-shadow:0 20px 60px rgba(2,6,23,.35);}
.sfm-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
.sfm-head h3{margin:0;font-size:17px;font-weight:700;color:var(--text);}
.sfm-close{background:transparent;border:none;color:var(--muted);font-size:16px;cursor:pointer;padding:4px;}
.sfm-close:hover{color:var(--text);}
.sfm-group{margin-bottom:12px;}
.sfm-group label{display:block;font-size:12px;font-weight:600;color:var(--label);margin-bottom:6px;}
.sfm-select{width:100%;background:var(--inp-bg);border:1px solid var(--inp-border);
color:var(--inp-text);border-radius:8px;padding:9px 12px;font-size:13px;outline:none;}
.sfm-select:focus{border-color:#2563eb;}
.sfm-hint{font-size:11px;color:var(--muted);margin-top:4px;}
.sfm-error{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.5);
color:#fca5a5;border-radius:8px;padding:10px 12px;font-size:12.5px;margin-bottom:12px;}
.sfm-overlay:not(.sfm-dark) .sfm-error{background:rgba(239,68,68,.08);color:#b91c1c;}
.sfm-submit{border:none;border-radius:8px;padding:10px 18px;font-size:13px;font-weight:600;
cursor:pointer;background:linear-gradient(90deg,#2563eb,#06b6d4);color:#fff;
box-shadow:0 4px 14px rgba(37,99,235,.35);}
.sfm-submit:hover{filter:brightness(1.1);}
.sfm-submit:disabled{opacity:.6;cursor:wait;}
`;

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/* grid jam: Senin s.d. 15.40 (11 slot), Sel–Jum s.d. 15.00 (10 slot) */
const JP_MIN = 40;
const DAY_START = 6 * 60 + 30;
const DAY_END = (day) => (day === 'Senin' ? 15 * 60 + 40 : 15 * 60);
const BREAKS = [
  { start: 9 * 60 + 10, end: 9 * 60 + 30 },
  { start: 11 * 60 + 30, end: 13 * 60 },
];

const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

function buildBoundaries(day) {
  const end = DAY_END(day);
  const pts = new Set();
  let t = DAY_START;
  pts.add(t);
  while (t < end) {
    const br = BREAKS.find((b) => t >= b.start && t < b.end);
    if (br) { t = br.end; pts.add(t); continue; }
    let next = t + JP_MIN;
    for (const b of BREAKS) if (t < b.start && next > b.start) next = b.start;
    if (next > end) break;
    pts.add(next);
    t = next;
  }
  return [...pts].sort((a, b) => a - b);
}

const toMin = (s) => {
  const [h, m] = (s || '0:0').split(':').map(Number);
  return h * 60 + m;
};

const emptyForm = {
  day: 'Senin',
  start_time: '06:30',
  end_time: '07:50',
  class_id: '',
  teacher_id: '',
  subject_id: '',
  room_id: '',
};

export default function ScheduleFormModal({
  open, initial, onClose, onSubmit,
  classes = [], teachers = [], subjects = [], rooms = [],
}) {
  const theme = useAppTheme();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (initial) {
      setForm({
        day: initial.day || 'Senin',
        start_time: (initial.start_time || '06:30').slice(0, 5),
        end_time: (initial.end_time || '07:50').slice(0, 5),
        class_id: initial.class_id ? String(initial.class_id) : '',
        teacher_id: initial.teacher_id ? String(initial.teacher_id) : '',
        subject_id: initial.subject_id ? String(initial.subject_id) : '',
        room_id: initial.room_id ? String(initial.room_id) : '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  /* ===== keahlian guru terpilih (maks 3 dari tabel teacher_subject) ===== */
  const selectedTeacher = teachers.find((t) => String(t.id) === String(form.teacher_id));
  const specialties = selectedTeacher
    ? (selectedTeacher.subjects?.length
        ? selectedTeacher.subjects
        : (selectedTeacher.subject ? [selectedTeacher.subject] : []))
    : [];

  /* dropdown mapel: HANYA keahlian guru; kalau guru belum punya keahlian → semua mapel */
  const subjectOptions = selectedTeacher && specialties.length ? specialties : subjects;

  /* pilih guru → reset mapel; kalau keahlian cuma 1, langsung terisi */
  const handleTeacherChange = (e) => {
    const tid = e.target.value;
    const t = teachers.find((x) => String(x.id) === tid);
    const specs = t
      ? (t.subjects?.length ? t.subjects : (t.subject ? [t.subject] : []))
      : [];
    setForm({
      ...form,
      teacher_id: tid,
      subject_id: specs.length === 1 ? String(specs[0].id) : '',
    });
  };

  const boundaries = buildBoundaries(form.day);
  const gridStr = boundaries.map(fmt);

  const startBase = gridStr.filter((t) => !BREAKS.some((b) => fmt(b.start) === t));
  const startOptions = startBase.includes(form.start_time)
    ? startBase
    : [...startBase, form.start_time].sort();

  const endBase = gridStr
    .filter((t) => t > form.start_time)
    .filter((t) => !BREAKS.some((b) => fmt(b.end) === t));
  const endOptions = endBase.includes(form.end_time)
    ? endBase
    : [...endBase, form.end_time].sort();

  const tLabel = (t) => `${t.replace(':', '.')} WIB`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.class_id || !form.teacher_id || !form.subject_id || !form.room_id) {
      setError('Kelas, guru, mata pelajaran, dan ruangan wajib dipilih.');
      return;
    }
    const s = toMin(form.start_time);
    const en = toMin(form.end_time);
    if (en <= s) { setError('Jam selesai harus setelah jam mulai.'); return; }
    const hitBreak = BREAKS.find((b) => s < b.end && en > b.start);
    if (hitBreak) {
      setError(`Jadwal tidak boleh melewati jam istirahat ${fmt(hitBreak.start).replace(':', '.')}–${fmt(hitBreak.end).replace(':', '.')}.`);
      return;
    }
    setSaving(true); setError('');
    try {
      await onSubmit({
        day: form.day,
        start_time: form.start_time,
        end_time: form.end_time,
        class_id: Number(form.class_id),
        teacher_id: Number(form.teacher_id),
        subject_id: Number(form.subject_id),
        room_id: Number(form.room_id),
      });
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Gagal menyimpan jadwal.'));
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className={`sfm-overlay ${theme === 'dark' ? 'sfm-dark' : ''}`} onMouseDown={onClose}>
      <style>{css}</style>
      <div className="sfm-box" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sfm-head">
          <h3>{initial ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3>
          <button className="sfm-close" onClick={onClose} type="button">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="sfm-group">
            <label>Hari</label>
            <select className="sfm-select" value={form.day} onChange={set('day')}>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="sfm-group">
            <label>Jam Mulai (WIB)</label>
            <select className="sfm-select" value={form.start_time} onChange={set('start_time')}>
              {startOptions.map((t) => <option key={t} value={t}>{tLabel(t)}</option>)}
            </select>
            <div className="sfm-hint">1 JP = 40 menit · Istirahat 09.10–09.30 & 11.30–13.00 · Senin s.d. 15.40, Sel–Jum s.d. 15.00</div>
          </div>

          <div className="sfm-group">
            <label>Jam Selesai (WIB)</label>
            <select className="sfm-select" value={form.end_time} onChange={set('end_time')}>
              {endOptions.map((t) => <option key={t} value={t}>{tLabel(t)}</option>)}
            </select>
          </div>

          <div className="sfm-group">
            <label>Kelas</label>
            <select className="sfm-select" value={form.class_id} onChange={set('class_id')}>
              <option value="">— pilih —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="sfm-group">
            <label>Guru</label>
            <select className="sfm-select" value={form.teacher_id} onChange={handleTeacherChange}>
              <option value="">— pilih —</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
            </select>
          </div>

          <div className="sfm-group">
            <label>Mata Pelajaran</label>
            <select className="sfm-select" value={form.subject_id} onChange={set('subject_id')}>
              <option value="">— pilih —</option>
              {subjectOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="sfm-hint">
              {selectedTeacher
                ? (specialties.length
                    ? `Keahlian ${selectedTeacher.user?.name}: ${specialties.map((s) => s.name).join(', ')} — pilih salah satu.`
                    : 'Guru ini belum punya keahlian terdaftar — semua mapel ditampilkan.')
                : 'Pilih guru terlebih dahulu — mapel akan menyesuaikan keahlian guru.'}
            </div>
          </div>

          <div className="sfm-group">
            <label>Ruangan</label>
            <select className="sfm-select" value={form.room_id} onChange={set('room_id')}>
              <option value="">— pilih —</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          {error && <div className="sfm-error">{error}</div>}

          <button className="sfm-submit" type="submit" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}