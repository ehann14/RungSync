import { useState, useEffect } from 'react';
import CrudPage from '../../components/CrudPage';
import PageLoader from '../../components/PageLoader';

export default function AdminSubjects() {
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowLoader(false), 400);
    return () => clearTimeout(t);
  }, []);

  if (showLoader) return <PageLoader text="Memuat mata pelajaran…" />;

  return (
    <CrudPage
      title="Manajemen Mata Pelajaran"
      endpoint="subjects"
      columns={[{ label: 'Mata Pelajaran', key: 'name' }]}
      fields={[{ name: 'name', label: 'Nama Mapel' }]}
    />
  );
}