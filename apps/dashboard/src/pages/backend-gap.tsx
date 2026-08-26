import { Alert, EmptyState } from '@niagantara/ui';
import { Server } from 'lucide-react';

export function BackendGap({ module, endpoint }: { module: string; endpoint: string }) {
  return (
    <section className="panel">
      <EmptyState
        icon={<Server size={28} />}
        title={`${module} belum tersedia`}
        description={`Modul ini menunggu endpoint bisnis ${endpoint}. Tidak ada data contoh atau aksi palsu yang ditampilkan.`}
      />
      <Alert tone="info">BACKEND_GAP · Hubungkan modul ini setelah API, permission, dan RLS tersedia.</Alert>
    </section>
  );
}
