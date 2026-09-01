import { AppShell } from '@/components/AppShell';
import { PageHeading } from '@/components/PageHeading';
import { ComingSoon } from '@/components/ComingSoon';

export default function HooksPage() {
  return (
    <AppShell>
      <PageHeading title="Hook library" subtitle="Every good hook becomes reusable ammunition." />
      <ComingSoon stage="HOOK LIBRARY" phase={4}
        what="A searchable list of hooks across all clients, filterable by client and channel, each tagged worked well / average / flopped." />
    </AppShell>
  );
}
