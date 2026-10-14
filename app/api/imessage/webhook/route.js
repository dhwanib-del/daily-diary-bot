import {after} from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!process.env.DATABASE_URL || !process.env.IMESSAGE_PROJECT_ID ||
      !process.env.IMESSAGE_PROJECT_SECRET || !process.env.IMESSAGE_WEBHOOK_SECRET)
    return new Response('Messaging not configured', {status:503});
  // Only initialize the signed Photon adapter when a webhook is actually received.
  const {bot} = await import('../../../../lib/bot.mjs');
  return bot.webhooks.imessage(request, {waitUntil:(task)=>after(()=>task)});
}
