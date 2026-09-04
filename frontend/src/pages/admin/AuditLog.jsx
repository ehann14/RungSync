import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, ChevronDown, ChevronUp, Filter, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

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
  filterContainer: { 
    display: 'flex', 
    gap: '12px', 
    marginBottom: '24px', 
    flexWrap: 'wrap', 
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155'
  },
  select: { 
    padding: '10px 16px', 
    borderRadius: '8px', 
    border: '1px solid #475569', 
    fontSize: '14px',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    cursor: 'pointer',
    minWidth: '180px'
  },
  input: { 
    padding: '10px 16px', 
    borderRadius: '8px', 
    border: '1px solid #475569', 
    fontSize: '14px',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    minWidth: '160px'
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
  btnSecondary: { 
    backgroundColor: '#334155', 
    color: '#e2e8f0',
    border: '1px solid #475569'
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
    display: 'inline-block',
    textTransform: 'capitalize'
  },
  badgeCreated: { 
    backgroundColor: 'rgba(34, 197, 94, 0.2)', 
    color: '#4ade80',
    border: '1px solid rgba(34, 197, 94, 0.3)'
  },
  badgeUpdated: { 
    backgroundColor: 'rgba(59, 130, 246, 0.2)', 
    color: '#60a5fa',
    border: '1px solid rgba(59, 130, 246, 0.3)'
  },
  badgeDeleted: { 
    backgroundColor: 'rgba(239, 68, 68, 0.2)', 
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.3)'
  },
  expandBtn: { 
    background: 'none', 
    border: 'none', 
    cursor: 'pointer', 
    color: '#94a3b8', 
    padding: '6px',
    borderRadius: '6px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  changesList: { 
    margin: '12px 0 0 0', 
    padding: '16px', 
    backgroundColor: '#0f172a', 
    borderRadius: '8px', 
    fontSize: '13px', 
    color: '#cbd5e1',
    listStyleType: 'none',
    border: '1px solid #334155'
  },
  pagination: { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: '16px', 
    marginTop: '24px',
    padding: '20px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b'
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#94a3b8',
    fontSize: '15px'
  }
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [filters, setFilters] = useState({ model_type: '', action: '', date_from: '', date_to: '' });
  const [expandedRows, setExpandedRows] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const res = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(res.data.data);
      setPagination({ current_page: res.data.current_page, last_page: res.data.last_page });
    } catch (err) {
      console.error('Gagal memuat audit log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => fetchLogs(1);

  const resetFilters = () => {
    setFilters({ model_type: '', action: '', date_from: '', date_to: '' });
    setTimeout(() => fetchLogs(1), 0);
  };

  const toggleExpand = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getActionBadge = (action) => {
    if (action === 'created') return <span style={{...styles.badge, ...styles.badgeCreated}}>Dibuat</span>;
    if (action === 'updated') return <span style={{...styles.badge, ...styles.badgeUpdated}}>Diubah</span>;
    if (action === 'deleted') return <span style={{...styles.badge, ...styles.badgeDeleted}}>Dihapus</span>;
    return <span style={{...styles.badge, backgroundColor: '#334155', color: '#e2e8f0'}}>{action}</span>;
  };

  const getModelName = (type) => {
    const map = {
      'Schedule': 'Jadwal', 
      'Room': 'Ruangan', 
      'Teacher': 'Guru',
      'Student': 'Siswa', 
      'SchoolClass': 'Kelas', 
      'Subject': 'Mata Pelajaran'
    };
    return map[type] || type;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\./g, ':');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <History size={28} style={{ color: '#60a5fa' }} /> 
          Audit Log
        </h1>
      </div>

      <div style={styles.filterContainer}>
        <select 
          name="model_type" 
          value={filters.model_type} 
          onChange={handleFilterChange} 
          style={styles.select}
        >
          <option value="">Semua Jenis Data</option>
          <option value="Schedule">Jadwal</option>
          <option value="Room">Ruangan</option>
          <option value="Teacher">Guru</option>
          <option value="Student">Siswa</option>
          <option value="SchoolClass">Kelas</option>
          <option value="Subject">Mata Pelajaran</option>
        </select>
        
        <select 
          name="action" 
          value={filters.action} 
          onChange={handleFilterChange} 
          style={styles.select}
        >
          <option value="">Semua Aksi</option>
          <option value="created">Dibuat</option>
          <option value="updated">Diubah</option>
          <option value="deleted">Dihapus</option>
        </select>
        
        <input 
          type="date" 
          name="date_from" 
          value={filters.date_from} 
          onChange={handleFilterChange} 
          style={styles.input} 
        />
        
        <input 
          type="date" 
          name="date_to" 
          value={filters.date_to} 
          onChange={handleFilterChange} 
          style={styles.input} 
        />
        
        <button 
          onClick={applyFilters} 
          style={{...styles.btn, ...styles.btnPrimary}}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          <Filter size={16} /> Terapkan
        </button>
        
        <button 
          onClick={resetFilters} 
          style={{...styles.btn, ...styles.btnSecondary}}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#475569'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#334155'}
        >
          <RotateCcw size={16} /> Reset
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Waktu</th>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Aksi</th>
              <th style={styles.th}>Jenis Data</th>
              <th style={styles.th}>Detail Perubahan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={styles.loading}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '24px', 
                      height: '24px', 
                      border: '3px solid #334155', 
                      borderTopColor: '#3b82f6', 
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Memuat data audit log...
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="5" style={styles.emptyState}>
                  <History size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ fontSize: '16px', fontWeight: '500', color: '#94a3b8' }}>Tidak ada data audit log</p>
                  <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
                    Aktivitas akan muncul di sini setelah ada perubahan data
                  </p>
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <React.Fragment key={log.id}>
                  <tr style={{ transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{...styles.td, fontFamily: 'monospace', fontSize: '13px', color: '#94a3b8'}}>
                      {formatDate(log.created_at)}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: '700',
                          color: 'white'
                        }}>
                          {(log.user_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '500' }}>{log.user_name}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{getActionBadge(log.action)}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: '600', color: '#f1f5f9' }}>{getModelName(log.model_type)}</span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>ID: {log.model_id}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {log.changes && Object.keys(log.changes).length > 0 ? (
                        <button 
                          onClick={() => toggleExpand(log.id)} 
                          style={styles.expandBtn}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#334155';
                            e.currentTarget.style.color = '#60a5fa';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#94a3b8';
                          }}
                        >
                          {expandedRows[log.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '13px' }}>Tidak ada perubahan</span>
                      )}
                    </td>
                  </tr>
                  {expandedRows[log.id] && log.changes && (
                    <tr>
                      <td colSpan="5" style={{...styles.td, padding: '0 16px 16px 16px', backgroundColor: '#0f172a'}}>
                        <ul style={styles.changesList}>
                          {Object.entries(log.changes).map(([field, val]) => (
                            <li key={field} style={{
                              marginBottom: '12px',
                              paddingBottom: '12px',
                              borderBottom: '1px solid #1e293b',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                color: '#94a3b8',
                                fontSize: '12px',
                                textTransform: 'capitalize',
                                fontWeight: '600'
                              }}>
                                <span style={{ 
                                  backgroundColor: '#334155', 
                                  padding: '2px 8px', 
                                  borderRadius: '4px',
                                  color: '#e2e8f0'
                                }}>
                                  {field.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <span style={{ color: '#64748b', fontSize: '12px' }}>Sebelum:</span>
                                <span style={{ 
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                                  color: '#f87171',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  fontSize: '13px',
                                  border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}>
                                  {val.old !== null && val.old !== undefined ? String(val.old) : '-'}
                                </span>
                                <span style={{ color: '#94a3b8' }}>→</span>
                                <span style={{ 
                                  backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                                  color: '#4ade80',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  fontSize: '13px',
                                  border: '1px solid rgba(34, 197, 94, 0.2)'
                                }}>
                                  {val.new !== null && val.new !== undefined ? String(val.new) : '-'}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {logs.length > 0 && (
        <div style={styles.pagination}>
          <button 
            onClick={() => fetchLogs(pagination.current_page - 1)} 
            disabled={pagination.current_page <= 1}
            style={{
              ...styles.btn, 
              ...styles.btnSecondary, 
              opacity: pagination.current_page <= 1 ? 0.4 : 1,
              cursor: pagination.current_page <= 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          
          <span style={{ 
            color: '#94a3b8', 
            fontSize: '14px',
            padding: '8px 16px',
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            border: '1px solid #334155'
          }}>
            Halaman <strong style={{ color: '#f1f5f9' }}>{pagination.current_page}</strong> dari <strong style={{ color: '#f1f5f9' }}>{pagination.last_page}</strong>
          </span>
          
          <button 
            onClick={() => fetchLogs(pagination.current_page + 1)} 
            disabled={pagination.current_page >= pagination.last_page}
            style={{
              ...styles.btn, 
              ...styles.btnSecondary, 
              opacity: pagination.current_page >= pagination.last_page ? 0.4 : 1,
              cursor: pagination.current_page >= pagination.last_page ? 'not-allowed' : 'pointer'
            }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
        
        select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 40px;
        }
      `}</style>
    </div>
  );
}