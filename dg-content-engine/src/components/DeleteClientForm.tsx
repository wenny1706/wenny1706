'use client';

import { deleteClientAction } from '@/app/clients/actions';

/** Asks out loud before removing a client and everything attached to them. */
export function DeleteClientForm({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteClientAction}
      onSubmit={(e) => {
        const ok = window.confirm(
          `Delete ${name}?\n\nThis permanently removes their notes, pillars, plan, drafts, feed plan, reports and hooks. This cannot be undone.`,
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="dg-btn-danger text-xs">Delete this client</button>
    </form>
  );
}
