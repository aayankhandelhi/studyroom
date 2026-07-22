'use client';
import { useState, useTransition } from 'react';
import { setUserRole } from '@/features/admin/actions';

/** Inline role selector for the admin users table. */
export function RoleSelect({ userId, current }: { userId: string; current: string }) {
  const [role, setRole] = useState(current);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const change = (next: string) => {
    const prev = role;
    setRole(next);
    setError(null);
    startTransition(async () => {
      const res = await setUserRole({ userId, role: next });
      if (!res.ok) {
        setRole(prev); // revert on failure
        setError(res.error?.message ?? 'Failed to update role');
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={role}
        disabled={pending}
        onChange={(e) => change(e.target.value)}
        className="rounded-lg border border-border bg-background px-2 py-1 text-sm capitalize disabled:opacity-50"
      >
        <option value="student">Student</option>
        <option value="owner">Owner</option>
        <option value="admin">Admin</option>
      </select>
      {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
