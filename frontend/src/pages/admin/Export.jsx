import { useCallback, useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, FileSpreadsheet, Printer } from 'lucide-react';
import api from '../../services/api';
import PageLoader from '../../components/PageLoader';

const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const fmtTime = (t) => (t ? t.slice(0, 5) : '');

// Color mapping for subjects
const SUBJECT_COLORS = {
  'PAI': '#4ade80',
  'MTK': '#f87171',
  'B. Inggris': '#60a5fa',
  'B. Indonesia': '#fbbf24',
  'kons. RPL': '#a78bfa',
  'KIK': '#f472b6',
  'BK': '#34d399',
  'UPC': '#fbbf24',
  default: '#93c5fd'
};

function useAppTheme() {
  const detect = () => {
    const attr = (document.documentElement.getAttribute('data-theme') || '').toLowerCase();
    if (attr.includes('light')) return 'light';
    if (attr.includes('dark')) return 'dark';
    const stored = (localStorage.getItem('theme') || '').toLowerCase();
    return stored.includes('dark') ? 'dark' : 'light';
  };
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    const update = () => setTheme(detect());
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => mo.disconnect();
  }, []);
  return theme;
}

const css = `
.exp-page{padding:8px 4px;
--card:#0d1930;--card-border:#1c2b45;--text:#e2e8f0;--text-strong:#f1f5f9;
--muted:#64748b;--th-bg:#132340;--th-text:#8ab4f8;--row-line:#16263f;
--input-bg:#12203a;--input-border:#24344f;}
.exp-page.exp-light{--card:#ffffff;--card-border:#e2e8f0;--text:#334155;--text-strong:#0f172a;
--muted:#64748b;--th-bg:#f1f5f9;--th-text:#1d4ed8;--row-line:#e2e8f0;
--input-bg:#ffffff;--input-border:#cbd5e1;}
.exp-page-header{margin-bottom:18px;}
.exp-page-header h2{font-size:22px;font-weight:800;color:var(--text-strong);margin:0 0 4px;}
.exp-page-header p{font-size:13px;color:var(--muted);margin:0;}
.exp-card{background:var(--card);border:1px solid var(--card-border);border-radius:14px;padding:18px 20px;margin-bottom:18px;}
.exp-row{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;}
.exp-field{display:flex;flex-direction:column;gap:6px;min-width:200px;}
.exp-field label{font-size:11.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;}
.exp-select,.exp-input{background:var(--input-bg);border:1px solid var(--input-border);color:var(--text);
border-radius:8px;padding:9px 12px;font-size:13.5px;outline:none;min-width:200px;}
.exp-select:focus,.exp-input:focus{border-color:#2563eb;}
.exp-mode{display:flex;gap:8px;}
.exp-mode button{border:1px solid var(--input-border);background:var(--input-bg);color:var(--text);
padding:9px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:.15s;}
.exp-mode button.active{background:linear-gradient(90deg,#2563eb,#06b6d4);color:#fff;border-color:transparent;}
.exp-actions{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;}
.exp-btn{border:none;border-radius:8px;padding:10px 18px;font-size:13px;font-weight:700;cursor:pointer;
display:flex;align-items:center;gap:8px;transition:.2s;}
.exp-btn:disabled{opacity:.5;cursor:not-allowed;}
.exp-btn-pdf{background:linear-gradient(90deg,#ef4444,#f97316);color:#fff;}
.exp-btn-pdf:hover:not(:disabled){filter:brightness(1.08);}
.exp-btn-csv{background:linear-gradient(90deg,#16a34a,#22c55e);color:#fff;}
.exp-btn-csv:hover:not(:disabled){filter:brightness(1.08);}
.exp-btn-print{background:var(--input-bg);border:1px solid var(--input-border);color:var(--text);}

/* ✅ TAMPILAN JADWAL FORMAL SEKOLAH */
.exp-formal-header{background:linear-gradient(135deg,#166534,#15803d);color:#fff;padding:20px;border-radius:12px;margin-bottom:20px;text-align:center;}
.exp-formal-header h1{margin:0;font-size:20px;font-weight:800;letter-spacing:1px;}
.exp-formal-header h2{margin:8px 0 0;font-size:24px;font-weight:900;}
.exp-formal-header h3{margin:8px 0 0;font-size:18px;font-weight:700;background:rgba(255,255,255,0.2);display:inline-block;padding:6px 20px;border-radius:20px;}
.exp-school-info{background:var(--card);border:1px solid var(--card-border);border-radius:12px;padding:16px;margin-bottom:20px;}
.exp-school-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px;}
.exp-school-info-item{display:flex;gap:8px;}
.exp-school-info-label{font-weight:700;color:var(--muted);min-width:120px;}
.exp-school-info-value{color:var(--text-strong);}
.exp-weekly-table{width:100%;border-collapse:collapse;border:2px solid #166534;margin-bottom:20px;}
.exp-weekly-table th{background:#166534;color:#fff;padding:10px 8px;text-align:center;font-weight:700;font-size:12px;border:1px solid #15803d;}
.exp-weekly-table td{padding:8px;border:1px solid var(--row-line);vertical-align:top;font-size:11px;min-height:60px;}
.exp-weekly-table .time-col{background:var(--th-bg);font-weight:700;text-align:center;width:80px;}
.exp-schedule-box{padding:6px;border-radius:6px;margin-bottom:4px;}
.exp-schedule-box .subject{font-weight:700;font-size:11px;margin-bottom:2px;}
.exp-schedule-box .teacher{font-size:10px;color:var(--muted);}
.exp-schedule-box .room{font-size:10px;font-weight:600;margin-top:2px;padding-top:2px;border-top:1px dashed var(--row-line);}
.exp-footer{background:var(--card);border:1px solid var(--card-border);border-radius:12px;padding:16px;margin-top:20px;}
.exp-footer h4{margin:0 0 12px;font-size:13px;color:var(--text-strong);}
.exp-footer-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.exp-footer-list{font-size:11px;}
.exp-footer-item{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dotted var(--row-line);}
.exp-footer-code{font-weight:700;color:#2563eb;width:80px;}
.exp-footer-name{flex:1;color:var(--text);}
.exp-signature{margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:40px;}
.exp-signature-box{text-align:center;}
.exp-signature-title{font-size:11px;margin-bottom:60px;color:var(--muted);}
.exp-signature-name{font-weight:700;font-size:12px;margin-bottom:4px;}
.exp-signature-nip{font-size:10px;color:var(--muted);}

@media print {
  .exp-card, .exp-actions, .exp-page-header { display: none !important; }
  body { background: #fff; }
}

@media (max-width: 768px) {
  .exp-school-info-grid, .exp-footer-grid, .exp-signature { grid-template-columns: 1fr; }
  .exp-weekly-table { font-size: 9px; }
}
`;

export default function Export() {
  const theme = useAppTheme();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [mode, setMode] = useState('class');
  const [selectedId, setSelectedId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [error, setError] = useState('');

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const [cls, tch] = await Promise.all([
        api.get('/admin/classes'),
        api.get('/admin/teachers'),
      ]);
      setClasses(cls.data.data || cls.data);
      setTeachers(tch.data.data || tch.data);
    } catch {
      setError('Gagal memuat daftar kelas/guru.');
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => { loadOptions(); }, [loadOptions]);
  useEffect(() => { setSelectedId(''); setSchedules([]); }, [mode]);

  useEffect(() => {
    if (!selectedId) { setSchedules([]); return; }
    let cancelled = false;
    (async () => {
      setLoadingSchedules(true);
      setError('');
      try {
        const param = mode === 'class' ? 'class_id' : 'teacher_id';
        const { data } = await api.get(`/admin/schedules?${param}=${selectedId}`);
        const list = data.data || data;
        const sorted = [...list].sort((a, b) => {
          const d = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
          if (d !== 0) return d;
          return (a.start_time || '').localeCompare(b.start_time || '');
        });
        if (!cancelled) setSchedules(sorted);
      } catch {
        if (!cancelled) setError('Gagal memuat jadwal.');
      } finally {
        if (!cancelled) setLoadingSchedules(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId, mode]);

  const selectedLabel = () => {
    if (mode === 'class') {
      return classes.find((c) => String(c.id) === String(selectedId))?.name || '';
    }
    return teachers.find((t) => String(t.id) === String(selectedId))?.user?.name || '';
  };

  // Get unique time slots
  const allTimeSlots = [...new Set(schedules.map((s) => s.start_time))].sort();

  // Get subject color
  const getSubjectColor = (subject) => {
    const key = Object.keys(SUBJECT_COLORS).find((k) => subject?.includes(k)) || 'default';
    return SUBJECT_COLORS[key] || SUBJECT_COLORS.default;
  };

  const buildRows = () => schedules.map((s) => ([
    s.day || '-',
    `${fmtTime(s.start_time)}–${fmtTime(s.end_time)}`,
    mode === 'class' ? (s.subject?.name || '-') : (s.class?.name || '-'),
    mode === 'class' ? (s.teacher?.user?.name || '-') : (s.subject?.name || '-'),
    s.room?.name || '-',
  ]));

  const columns = mode === 'class'
    ? ['Hari', 'Jam', 'Mata Pelajaran', 'Guru', 'Ruangan']
    : ['Hari', 'Jam', 'Kelas', 'Mata Pelajaran', 'Ruangan'];

  const fileBaseName = () => {
    const label = selectedLabel().replace(/[^a-z0-9]+/gi, '_');
    const prefix = mode === 'class' ? 'Jadwal_Kelas' : 'Jadwal_Guru';
    return `${prefix}_${label || 'Export'}`;
  };

  // Get unique teachers with their subjects
  const teacherList = schedules.reduce((acc, s) => {
    const teacher = s.teacher?.user?.name;
    const subject = s.subject?.name;
    if (teacher && subject) {
      const code = `K${subject.substring(0, 2).toUpperCase()}`;
      const existing = acc.find((t) => t.name === teacher);
      if (!existing) {
        acc.push({ code, name: teacher, subject });
      }
    }
    return acc;
  }, []);

  const exportPdf = () => {
    if (!schedules.length) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const className = selectedLabel();

    // Header
    doc.setFontSize(10);
    doc.text('PEMERINTAH DAERAH PROVINSI JAWA BARAT', 105, 10, { align: 'center' });
    doc.text('DINAS PENDIDIKAN', 105, 15, { align: 'center' });
    doc.text('SMK NEGERI 11 BANDUNG', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('JADWAL PELAJARAN', 105, 28, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`KELAS ${className}`, 105, 35, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('TAHUN PELAJARAN 2026/2027', 105, 40, { align: 'center' });

    // Table
    const tableColumn = ['Jam', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const tableRows = [];

    allTimeSlots.forEach((time) => {
      const row = [fmtTime(time)];
      DAY_ORDER.slice(0, 5).forEach((day) => {
        const schedule = schedules.find((s) => s.day === day && s.start_time === time);
        if (schedule) {
          const subject = mode === 'class' ? schedule.subject?.name : schedule.class?.name;
          row.push(`${subject || ''}\n${mode === 'class' ? schedule.teacher?.user?.name : schedule.subject?.name}\n${schedule.room?.name || ''}`);
        } else {
          row.push('-');
        }
      });
      tableRows.push(row);
    });

    autoTable(doc, {
      startY: 45,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
      headStyles: { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { halign: 'center', fillColor: [241, 245, 249], fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index > 0) {
          const cellText = data.cell.text.join(' ');
          if (cellText !== '-') {
            const subject = mode === 'class' 
              ? schedules.find((s) => s.day === DAY_ORDER[data.column.index - 1] && s.start_time === allTimeSlots[data.row.index])?.subject?.name
              : schedules.find((s) => s.day === DAY_ORDER[data.column.index - 1] && s.start_time === allTimeSlots[data.row.index])?.class?.name;
            const color = getSubjectColor(subject);
            data.cell.styles.fillColor = color;
          }
        }
      },
    });

    doc.save(`${fileBaseName()}.pdf`);
  };

  const exportCsv = () => {
    if (!schedules.length) return;
    const lines = [columns.join(';')];
    buildRows().forEach((row) => lines.push(row.map((val) => {
      const str = String(val ?? '');
      if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    }).join(';')));
    const csvContent = '\uFEFF' + lines.join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileBaseName()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printPreview = () => window.print();

  if (loadingOptions) return <PageLoader text="Memuat data ekspor…" />;

  return (
    <div className={`exp-page ${theme === 'light' ? 'exp-light' : ''}`}>
      <style>{css}</style>

      <div className="exp-page-header">
        <h2>Ekspor Jadwal</h2>
        <p>Cetak jadwal dengan format formal seperti contoh gambar.</p>
      </div>

      <div className="exp-card">
        <div className="exp-row">
          <div className="exp-field">
            <label>Ekspor berdasarkan</label>
            <div className="exp-mode">
              <button className={mode === 'class' ? 'active' : ''} onClick={() => setMode('class')}>Per Kelas</button>
              <button className={mode === 'teacher' ? 'active' : ''} onClick={() => setMode('teacher')}>Per Guru</button>
            </div>
          </div>

          <div className="exp-field">
            <label>{mode === 'class' ? 'Pilih Kelas' : 'Pilih Guru'}</label>
            <select className="exp-select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">-- Pilih {mode === 'class' ? 'kelas' : 'guru'} --</option>
              {(mode === 'class' ? classes : teachers).map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {mode === 'class' ? opt.name : opt.user?.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="exp-actions">
          <button className="exp-btn exp-btn-pdf" disabled={!schedules.length} onClick={exportPdf}>
            <FileDown size={16} /> Unduh PDF
          </button>
          <button className="exp-btn exp-btn-csv" disabled={!schedules.length} onClick={exportCsv}>
            <FileSpreadsheet size={16} /> Unduh Excel (CSV)
          </button>
          <button className="exp-btn exp-btn-print" disabled={!schedules.length} onClick={printPreview}>
            <Printer size={16} /> Cetak
          </button>
        </div>

        {error && <div style={{ color: '#ef4444', marginTop: 10, fontSize: 13 }}>{error}</div>}
      </div>

      {/* ✅ TAMPILAN JADWAL FORMAL SEKOLAH */}
      {schedules.length > 0 && (
        <div className="exp-formal-view">
          {/* Header */}
          <div className="exp-formal-header">
            <h1>JADWAL PELAJARAN</h1>
            <h2>TAHUN PELAJARAN 2026/2027</h2>
            <h3>{mode === 'class' ? `KELAS ${selectedLabel()}` : `GURU ${selectedLabel()}`}</h3>
          </div>

          {/* School Info */}
          <div className="exp-school-info">
            <div className="exp-school-info-grid">
              <div className="exp-school-info-item">
                <span className="exp-school-info-label">Nama Sekolah</span>
                <span className="exp-school-info-value">: SMK NEGERI 11 BANDUNG</span>
              </div>
              <div className="exp-school-info-item">
                <span className="exp-school-info-label">Alamat</span>
                <span className="exp-school-info-value">: Jl. Buah Batu</span>
              </div>
              <div className="exp-school-info-item">
                <span className="exp-school-info-label">Telepon</span>
                <span className="exp-school-info-value">: (022) 6652442</span>
              </div>
              <div className="exp-school-info-item">
                <span className="exp-school-info-label">Email</span>
                <span className="exp-school-info-value">: official@smkn11bdg.sch.id</span>
              </div>
            </div>
          </div>

          {/* Weekly Table */}
          <table className="exp-weekly-table">
            <thead>
              <tr>
                <th>Jam</th>
                {DAY_ORDER.slice(0, 5).map((day) => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allTimeSlots.map((timeSlot, idx) => (
                <tr key={idx}>
                  <td className="time-col">{fmtTime(timeSlot)}</td>
                  {DAY_ORDER.slice(0, 5).map((day) => {
                    const schedule = schedules.find(
                      (s) => s.day === day && s.start_time === timeSlot
                    );
                    return (
                      <td key={`${day}-${timeSlot}`}>
                        {schedule ? (
                          <div className="exp-schedule-box" style={{ background: `${getSubjectColor(mode === 'class' ? schedule.subject?.name : schedule.class?.name)}20`, borderLeft: `3px solid ${getSubjectColor(mode === 'class' ? schedule.subject?.name : schedule.class?.name)}` }}>
                            <div className="subject">
                              {mode === 'class' ? schedule.subject?.name : schedule.class?.name}
                            </div>
                            <div className="teacher">
                              {mode === 'class' ? schedule.teacher?.user?.name : schedule.subject?.name}
                            </div>
                            <div className="room">{schedule.room?.name}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--muted)', opacity: 0.3 }}>-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer - Teacher List */}
          <div className="exp-footer">
            <h4>DAFTAR GURU DAN MATA PELAJARAN</h4>
            <div className="exp-footer-grid">
              <div className="exp-footer-list">
                {teacherList.slice(0, Math.ceil(teacherList.length / 2)).map((t, i) => (
                  <div key={i} className="exp-footer-item">
                    <span className="exp-footer-code">{t.code}</span>
                    <span className="exp-footer-name">{t.name} - {t.subject}</span>
                  </div>
                ))}
              </div>
              <div className="exp-footer-list">
                {teacherList.slice(Math.ceil(teacherList.length / 2)).map((t, i) => (
                  <div key={i} className="exp-footer-item">
                    <span className="exp-footer-code">{t.code}</span>
                    <span className="exp-footer-name">{t.name} - {t.subject}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature */}
            <div className="exp-signature">
              <div className="exp-signature-box">
                <div className="exp-signature-title">Mengetahui,<br/>Kepala Sekolah</div>
                <div className="exp-signature-name">___________________</div>
                <div className="exp-signature-nip">NIP. ........................</div>
              </div>
              <div className="exp-signature-box">
                <div className="exp-signature-title">Bandung, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Wakasek Kurikulum</div>
                <div className="exp-signature-name">___________________</div>
                <div className="exp-signature-nip">NIP. ........................</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!schedules.length && selectedId && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          Tidak ada jadwal untuk pilihan ini.
        </div>
      )}
    </div>
  );
}