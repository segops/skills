/**
 * App Router signing endpoint → copy to `app/api/segops/sign/route.ts`.
 *
 * Signs the *authenticated* user's id with the public key's HMAC secret so the
 * SegOps session minter can trust the identity. The HMAC secret is server-only
 * and must never be exposed to the browser.
 *
 * SECURITY: sign only the logged-in user's id from your session — never an id
 * taken from the request. Replace `getAuthenticatedUserId()` with your auth.
 */
import { NextResponse } from 'next/server';
import { signUserId } from '@segops/sdk/server';

export const runtime = 'nodejs';

async function getAuthenticatedUserId(): Promise<string | null> {
  // TODO: replace with your real session lookup (NextAuth, Clerk, cookies, …).
  // e.g. const session = await auth(); return session?.user?.id ?? null;
  return null;
}

export async function GET() {
  const secret = process.env.SEGOPS_HMAC_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'SEGOPS_HMAC_SECRET not set' }, { status: 500 });
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
  }

  const signed = await signUserId(secret, userId);
  return NextResponse.json(signed); // { user_id, user_id_sig, user_id_ts }
}
