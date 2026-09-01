import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo size={44} />
      <p className="text-lg font-medium">That page does not exist.</p>
      <Link href="/" className="dg-btn-primary">Back to dashboard</Link>
    </div>
  );
}
