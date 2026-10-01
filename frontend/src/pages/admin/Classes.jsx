import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import CrudPage from '../../components/CrudPage';
import PageLoader from '../../components/PageLoader';
import ClassStudentsModal from '../../components/ClassStudentsModal';

export default function AdminClasses() {
  // Overlay loader singkat saat pertama kali halaman dibuka
  // (CrudPage sudah handle loading internal saat fetch data)
  const [showLoader, setShowLoader] = useState(true);
  const [kelasDipilih, setKelasDipilih] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setShowLoader(false), 400);
    return () => clearTimeout(t);
  }, []);

  if (showLoader) return <PageLoader text="Memuat data kelas…" />;

  return (
    <>
      <CrudPage
        title="Manajemen Kelas"
        endpoint="classes"
        columns={[
          { label: 'Nama Kelas', key: 'name' },
          { label: 'Jumlah Murid', key: 'students_count' },
        ]}
        fields={[{ name: 'name', label: 'Nama Kelas' }]}
        rowActions={(row) => (
          <button className="crud-btn crud-btn-edit crud-btn-sm" onClick={() => setKelasDipilih(row)}>
            <Users size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Lihat Murid
          </button>
        )}
      />
      <ClassStudentsModal kelas={kelasDipilih} onClose={() => setKelasDipilih(null)} />
    </>
  );
}