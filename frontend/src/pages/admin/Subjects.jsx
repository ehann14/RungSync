import { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';
import CrudPage from '../../components/CrudPage';
import PageLoader from '../../components/PageLoader';
import SubjectTeachersModal from '../../components/SubjectTeachersModal';

export default function AdminSubjects() {
  const [showLoader, setShowLoader] = useState(true);
  const [mapelDipilih, setMapelDipilih] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setShowLoader(false), 400);
    return () => clearTimeout(t);
  }, []);

  if (showLoader) return <PageLoader text="Memuat mata pelajaran…" />;

  return (
    <>
      <CrudPage
        title="Manajemen Mata Pelajaran"
        endpoint="subjects"
        columns={[{ label: 'Mata Pelajaran', key: 'name' }]}
        fields={[{ name: 'name', label: 'Nama Mapel' }]}
        rowActions={(row) => (
          <button className="crud-btn crud-btn-edit crud-btn-sm" onClick={() => setMapelDipilih(row)}>
            <UserCheck size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Lihat Guru
          </button>
        )}
      />
      <SubjectTeachersModal mapel={mapelDipilih} onClose={() => setMapelDipilih(null)} />
    </>
  );
}