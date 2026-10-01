import { useState } from 'react';
import { Download } from 'lucide-react';
import ImportPanel from '../../components/ImportPanel';
import { useAppTheme } from '../../components/Modal';
import { unduhFile, pesanErrorBlob } from '../../services/unduh';

const kolomValid = [
  { label: 'Hari', render: (v) => v.hari },
  { label: 'Jam', render: (v) => `${v.mulai}–${v.selesai}` },
  { label: 'Kelas', render: (v) => v.kelas },
  { label: 'Mata Pelajaran', render: (v) => v.mapel },
  { label: 'Guru', render: (v) => `${v.guru} (${v.nip})` },
  { label: 'Ruangan', render: (v) => v.ruangan },
];

export default function ImportSchedules() {
  const theme = useAppTheme();
  const [tipe, setTipe] = useState('class');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const unduhTemplate = async (jenis) => {
    setBusy(jenis); setError('');
    try {
      await unduhFile('/admin/schedules/import/template', `template-jadwal-${jenis === 'class' ? 'kelas' : 'guru'}.xlsx`, { type: jenis });
    } catch (err) {
      setError(await pesanErrorBlob(err, 'Gagal mengunduh template.'));
    } finally { setBusy(''); }
  };

  return (
    <div className={`imp ${theme === 'dark' ? 'imp-dark' : ''}`} style={{ padding: '8px 4px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--strong)', margin: '0 0 16px' }}>Import Jadwal</h2>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button className="imp-btn imp-btn-ghost" onClick={() => unduhTemplate('class')} disabled={!!busy}>
          <Download size={14} /> {busy === 'class' ? 'Mengunduh…' : 'Template Jadwal Kelas'}
        </button>
        <button className="imp-btn imp-btn-ghost" onClick={() => unduhTemplate('teacher')} disabled={!!busy}>
          <Download size={14} /> {busy === 'teacher' ? 'Mengunduh…' : 'Template Jadwal Guru'}
        </button>
      </div>
      {error && <div className="imp-alert imp-alert-err">{error}</div>}

      <div className="imp-mode" style={{ flexDirection: 'row', gap: 20, marginBottom: 14 }}>
        <label>
          <input type="radio" name="jenis" checked={tipe === 'class'} onChange={() => setTipe('class')} />
          <span>Jadwal Kelas</span>
        </label>
        <label>
          <input type="radio" name="jenis" checked={tipe === 'teacher'} onChange={() => setTipe('teacher')} />
          <span>Jadwal Guru</span>
        </label>
      </div>

      {/* key=tipe: ganti jenis = reset file dan pratinjau */}
      <ImportPanel key={tipe} base="schedules/import" params={{ type: tipe }} kolomValid={kolomValid} />
    </div>
  );
}