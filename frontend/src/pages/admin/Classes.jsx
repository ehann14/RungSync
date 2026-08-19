import { useState, useEffect } from 'react';
import CrudPage from '../../components/CrudPage';
import PageLoader from '../../components/PageLoader';

export default function AdminClasses() {
  // Overlay loader singkat saat pertama kali halaman dibuka
  // (CrudPage sudah handle loading internal saat fetch data)
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowLoader(false), 400);
    return () => clearTimeout(t);
  }, []);

  if (showLoader) return <PageLoader text="Memuat data kelas…" />;

  return (
    <CrudPage
      title="Manajemen Kelas"
      endpoint="classes"
      columns={[{ label: 'Nama Kelas', key: 'name' }]}
      fields={[{ name: 'name', label: 'Nama Kelas' }]}
    />
  );
}