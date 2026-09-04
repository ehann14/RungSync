import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Plus, Power, Copy, ChevronRight, X } from 'lucide-react';

const styles = {
  container: { 
    padding: '24px', 
    fontFamily: 'system-ui, -apple-system, sans-serif', 
    color: '#e2e8f0',
    minHeight: '100vh',
    backgroundColor: '#0b1220'
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #1e293b'
  },
  title: { 
    fontSize: '24px', 
    fontWeight: '700', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    margin: 0,
    color: '#f1f5f9'
  },
  btn: { 
    padding: '10px 20px', 
    borderRadius: '8px', 
    border: 'none', 
    cursor: 'pointer', 
    fontSize: '14px', 
    fontWeight: '600', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px',
    transition: 'all 0.2s'
  },
  btnPrimary: { 
    backgroundColor: '#3b82f6', 
    color: 'white',
    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
  },
  card: { 
    backgroundColor: '#1e293b', 
    borderRadius: '12px', 
    padding: '20px',
    border: '1px solid #334155',
    marginBottom: '16px'
  },
  table: { 
    width: '100%', 
    borderCollapse: 'collapse', 
    backgroundColor: '#1e293b', 
    borderRadius: '12px', 
    overflow: 'hidden', 
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    border: '1px solid #334155'
  },
  th: { 
    padding: '16px', 
    textAlign: 'left', 
    backgroundColor: '#0f172a', 
    borderBottom: '2px solid #334155', 
    fontSize: '13px', 
    fontWeight: '600', 
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  td: { 
    padding: '16px', 
    borderBottom: '1px solid #334155', 
    fontSize: '14px', 
    verticalAlign: 'top',
    color: '#e2e8f0'
  },
  badge: { 
    padding: '6px 12px', 
    borderRadius: '9999px', 
    fontSize: '12px', 
    fontWeight: '600', 
    display: 'inline-block'
  },
  badgeActive: { 
    backgroundColor: 'rgba(34, 197, 94, 0.2)', 
    color: '#4ade80',
    border: '1px solid rgba(34, 197, 94, 0.3)'
  },
  badgeInactive: { 
    backgroundColor: 'rgba(148, 163, 184, 0.2)', 
    color: '#94a3b8',
    border: '1px solid rgba(148, 163, 184, 0.3)'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '32px',
    width: '90%',
    maxWidth: '500px',
    border: '1px solid #334155',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #475569',
    fontSize: '14px',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    marginBottom: '16px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #475569',
    fontSize: '14px',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    marginBottom: '16px',
    boxSizing: 'border-box'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#cbd5e1'
  },
  btnGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px'
  }
};

export default function AcademicPeriods() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    year_start: '',
    year_end: '',
    semester: 'ganjil'
  });
  const [copyTargetId, setCopyTargetId] = useState('');

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const res = await api.get('/academic-periods');
      setPeriods(res.data);
    } catch (err) {
      console.error('Gagal memuat periode:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/academic-periods', formData);
      setShowModal(false);
      setFormData({ name: '', year_start: '', year_end: '', semester: 'ganjil' });
      fetchPeriods();
    } catch (err) {
      alert('Gagal membuat periode: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleActivate = async (id) => {
    if (!confirm('Aktifkan periode ini? Hanya satu periode yang bisa aktif dalam satu waktu.')) return;
    
    try {
      await api.post(`/academic-periods/${id}/activate`);
      fetchPeriods();
    } catch (err) {
      alert('Gagal mengaktifkan periode: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCopyClick = (period) => {
    setSelectedPeriod(period);
    setShowCopyModal(true);
  };

  const handleCopy = async () => {
    if (!copyTargetId) {
      alert('Pilih periode tujuan');
      return;
    }
    if (copyTargetId === selectedPeriod.id.toString()) {
      alert('Periode tujuan tidak boleh sama dengan periode sumber');
      return;
    }

    try {
      await api.post(`/academic-periods/${copyTargetId}/copy-schedules-from/${selectedPeriod.id}`);
      setShowCopyModal(false);
      setCopyTargetId('');
      alert('Jadwal berhasil disalin!');
    } catch (err) {
      alert('Gagal menyalin jadwal: ' + (err.response?.data?.message || err.message));
    }
  };

  const activePeriod = periods.find(p => p.is_active);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <Calendar size={28} style={{ color: '#60a5fa' }} /> 
          Tahun Ajaran & Semester
        </h1>
        <button 
          onClick={() => setShowModal(true)} 
          style={{...styles.btn, ...styles.btnPrimary}}
        >
          <Plus size={18} /> Buat Periode Baru
        </button>
      </div>

      {activePeriod && (
        <div style={{...styles.card, border: '1px solid rgba(34, 197, 94, 0.3)', backgroundColor: 'rgba(34, 197, 94, 0.05)'}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#4ade80' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80', boxShadow: '0 0 10px #4ade80' }} />
            <strong>Periode Aktif:</strong> 
            <span>{activePeriod.name}</span>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>({activePeriod.year_start}/{activePeriod.year_end} - {activePeriod.semester})</span>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nama Periode</th>
              <th style={styles.th}>Tahun</th>
              <th style={styles.th}>Semester</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{...styles.td, textAlign: 'center', padding: '40px'}}>
                  Memuat data...
                </td>
              </tr>
            ) : periods.length === 0 ? (
              <tr>
                <td colSpan="5" style={{...styles.td, textAlign: 'center', padding: '40px', color: '#64748b'}}>
                  Belum ada periode tahun ajaran. Klik "Buat Periode Baru" untuk memulai.
                </td>
              </tr>
            ) : (
              periods.map(period => (
                <tr key={period.id} style={{ transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={styles.td}>
                    <div style={{ fontWeight: '600', color: '#f1f5f9' }}>{period.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {period.id}</div>
                  </td>
                  <td style={styles.td}>
                    {period.year_start} / {period.year_end}
                  </td>
                  <td style={styles.td}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      backgroundColor: period.semester === 'ganjil' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                      color: period.semester === 'ganjil' ? '#60a5fa' : '#c084fc',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {period.semester}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      ...(period.is_active ? styles.badgeActive : styles.badgeInactive)
                    }}>
                      {period.is_active ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!period.is_active && (
                        <button 
                          onClick={() => handleActivate(period.id)}
                          style={{
                            ...styles.btn,
                            backgroundColor: '#10b981',
                            color: 'white',
                            padding: '8px 16px',
                            fontSize: '13px'
                          }}
                        >
                          <Power size={16} /> Aktifkan
                        </button>
                      )}
                      <button 
                        onClick={() => handleCopyClick(period)}
                        style={{
                          ...styles.btn,
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          padding: '8px 16px',
                          fontSize: '13px'
                        }}
                      >
                        <Copy size={16} /> Salin Jadwal
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Buat Periode Baru */}
      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '20px' }}>Buat Periode Baru</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <label style={styles.label}>Nama Periode</label>
              <input
                type="text"
                placeholder="Contoh: 2026/2027 Ganjil"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={styles.input}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={styles.label}>Tahun Mulai</label>
                  <input
                    type="number"
                    placeholder="2026"
                    value={formData.year_start}
                    onChange={(e) => setFormData({...formData, year_start: parseInt(e.target.value)})}
                    style={styles.input}
                    required
                    min="2000"
                  />
                </div>
                <div>
                  <label style={styles.label}>Tahun Selesai</label>
                  <input
                    type="number"
                    placeholder="2027"
                    value={formData.year_end}
                    onChange={(e) => setFormData({...formData, year_end: parseInt(e.target.value)})}
                    style={styles.input}
                    required
                    min={formData.year_start || 2000}
                  />
                </div>
              </div>

              <label style={styles.label}>Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({...formData, semester: e.target.value})}
                style={styles.select}
              >
                <option value="ganjil">Ganjil</option>
                <option value="genap">Genap</option>
              </select>

              <div style={styles.btnGroup}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{...styles.btn, ...styles.btnSecondary, backgroundColor: '#334155', color: '#e2e8f0'}}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  style={{...styles.btn, ...styles.btnPrimary}}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Salin Jadwal */}
      {showCopyModal && (
        <div style={styles.modal} onClick={() => setShowCopyModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '20px' }}>Salin Jadwal</h2>
              <button onClick={() => setShowCopyModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>Dari Periode:</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#f1f5f9' }}>
                {selectedPeriod?.name}
              </div>
            </div>

            <label style={styles.label}>Ke Periode Tujuan:</label>
            <select
              value={copyTargetId}
              onChange={(e) => setCopyTargetId(e.target.value)}
              style={styles.select}
            >
              <option value="">-- Pilih Periode Tujuan --</option>
              {periods.filter(p => p.id !== selectedPeriod?.id).map(period => (
                <option key={period.id} value={period.id}>
                  {period.name} {period.is_active && '(Aktif)'}
                </option>
              ))}
            </select>

            <div style={{...styles.card, backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', marginTop: '16px'}}>
              <div style={{ fontSize: '14px', color: '#fbbf24' }}>
                ⚠️ Semua jadwal dari periode sumber akan disalin ke periode tujuan. Jadwal yang sudah ada di periode tujuan tidak akan terhapus.
              </div>
            </div>

            <div style={styles.btnGroup}>
              <button 
                type="button" 
                onClick={() => setShowCopyModal(false)}
                style={{...styles.btn, ...styles.btnSecondary, backgroundColor: '#334155', color: '#e2e8f0'}}
              >
                Batal
              </button>
              <button 
                onClick={handleCopy}
                style={{...styles.btn, ...styles.btnPrimary}}
              >
                <Copy size={16} /> Salin Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}