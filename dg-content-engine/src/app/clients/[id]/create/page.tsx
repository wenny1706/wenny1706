import { ComingSoon } from '@/components/ComingSoon';
export default function Page() {
  return <ComingSoon stage="CREATE" phase={2}
    what="The kanban board: Idea → Drafted → Sent for approval → Approved, with the full draft text and client feedback on every card." />;
}
