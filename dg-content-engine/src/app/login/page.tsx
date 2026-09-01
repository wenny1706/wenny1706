import { LoginForm } from './LoginForm';
import { Logo } from '@/components/Logo';

export const metadata = { title: 'Sign in — DG Content Engine' };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo size={48} />
          <h1 className="text-xl font-semibold tracking-tight">
            DG <span className="text-gold">Content Engine</span>
          </h1>
          <p className="text-sm text-ink-muted">Private workspace. One account only.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
