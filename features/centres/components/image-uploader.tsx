'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { registerListingImage } from '../actions';
import { Button } from '@/components/ui/button';

/**
 * Uploads an image to the `listing-images` Storage bucket under `<centreId>/…`
 * (Storage RLS enforces the owner can only write to their own centre folder),
 * then registers the object as a `listing_images` row. Client validation:
 * type + size; server + Storage policies are the real gate.
 */
export function ImageUploader({ centreId }: { centreId: string }) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);

    if (!file.type.startsWith('image/')) { setStatus('error'); setMessage('Please choose an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setStatus('error'); setMessage('Image must be under 5 MB.'); return; }

    setStatus('uploading');
    const supabase = createClient();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${centreId}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage.from('listing-images').upload(path, file, { upsert: false });
    if (upErr) { setStatus('error'); setMessage('Upload failed. Please try again.'); return; }

    const res = await registerListingImage({ centreId, storagePath: path });
    if (!res.ok) { setStatus('error'); setMessage(res.error.message); return; }

    setStatus('done'); setMessage('Image uploaded.');
  };

  return (
    <div className="rounded-lg border border-dashed p-4">
      <label className="block text-sm font-medium">Add a photo</label>
      <input type="file" accept="image/*" onChange={onChange} disabled={status === 'uploading'} className="mt-2 block text-sm" />
      {status === 'uploading' && <p className="mt-2 text-xs text-muted-foreground">Uploading…</p>}
      {message && <p className={`mt-2 text-xs ${status === 'error' ? 'text-destructive' : 'text-brand-green'}`} role="status">{message}</p>}
    </div>
  );
}
