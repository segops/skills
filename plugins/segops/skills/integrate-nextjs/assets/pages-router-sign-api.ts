/**
 * Pages Router signing endpoint → copy to `pages/api/segops/sign.ts`.
 *
 * Signs the *authenticated* user's id with the public key's HMAC secret. The
 * secret is server-only; never expose it to the browser.
 *
 * SECURITY: sign only the logged-in user's id from your session — never an id
 * taken from the request. Replace `getAuthenticatedUserId()` with your auth.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { signUserId } from '@segops/sdk/server';

async function getAuthenticatedUserId(_req: NextApiRequest): Promise<string | null> {
  // TODO: replace with your real session lookup.
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = process.env.SEGOPS_HMAC_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'SEGOPS_HMAC_SECRET not set' });
  }

  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'not authenticated' });
  }

  const signed = await signUserId(secret, userId);
  return res.status(200).json(signed); // { user_id, user_id_sig, user_id_ts }
}
