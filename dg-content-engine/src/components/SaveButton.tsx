'use client';

import { useFormStatus } from 'react-dom';

/** Submit button that shows its own progress, so a save never looks frozen. */
export function SaveButton({ label = 'Save', className = '' }: { label?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`dg-btn-primary shadow-lg shadow-black/40 ${className}`}>
      {pending ? 'Saving…' : label}
    </button>
  );
}
