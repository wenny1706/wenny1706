import Link from 'next/link';
import { Logo } from './Logo';
import { SignOutButton } from './SignOutButton';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/clients', label: 'Clients' },
  { href: '/hooks', label: 'Hook library' },
  { href: '/how-to', label: 'How to use' },
];

/** The frame every logged-in page sits inside: brand header + main nav. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-40 border-b border-ink-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-[15px] font-semibold tracking-tight text-white">
              DG <span className="text-gold">Content Engine</span>
            </span>
          </Link>
          <div className="flex-1" />
          <SignOutButton />
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 pb-2 sm:px-5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-ink-muted transition hover:bg-ink-soft hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
