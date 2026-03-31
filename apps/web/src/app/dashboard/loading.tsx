import { PageShell } from '@/components/page-shell';
import { Panel, SkeletonBlock } from '@/components/ui';

export default function DashboardLoading() {
  return (
    <PageShell eyebrow="Dashboard" title="Loading" description="Pulling the latest workspace state.">
      <div style={{ display: 'grid', gap: 16 }}>
        <Panel>
          <SkeletonBlock height={18} width="22%" />
          <div style={{ marginTop: 12 }}>
            <SkeletonBlock height={14} width="48%" />
          </div>
        </Panel>
        <Panel>
          <SkeletonBlock height={18} width="30%" />
          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            <SkeletonBlock height={16} />
            <SkeletonBlock height={16} width="92%" />
            <SkeletonBlock height={16} width="86%" />
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
