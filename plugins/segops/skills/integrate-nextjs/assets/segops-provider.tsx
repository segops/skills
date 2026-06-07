'use client';

/**
 * Client-side SegOps provider for Next.js (App Router or Pages Router).
 *
 * Mounts the SDK's <SegOpsProvider> with the browser-safe public key. Wrap your
 * tree once — in `app/layout.tsx` (App Router) or `pages/_app.tsx` (Pages
 * Router). After login, call `useUser().setUser(...)` with a signed identity
 * from `/api/segops/sign`.
 */
import type { ReactNode } from 'react';
import { SegOpsProvider as BaseSegOpsProvider } from '@segops/sdk/react';

const apiUrl = process.env.NEXT_PUBLIC_SEGOPS_API_URL;
const apiKey = process.env.NEXT_PUBLIC_SEGOPS_PUBLIC_KEY; // pk_…

export function SegOpsProvider({ children }: { children: ReactNode }) {
  if (!apiUrl || !apiKey) {
    // Misconfigured env: render children so the app still works, but warn.
    if (typeof window !== 'undefined') {
      console.warn(
        '[segops] set NEXT_PUBLIC_SEGOPS_API_URL and NEXT_PUBLIC_SEGOPS_PUBLIC_KEY',
      );
    }
    return <>{children}</>;
  }

  return (
    <BaseSegOpsProvider apiUrl={apiUrl} apiKey={apiKey}>
      {children}
    </BaseSegOpsProvider>
  );
}
