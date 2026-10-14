import {after} from 'next/server';
import {bot} from '../../../../lib/bot.mjs';
export const runtime='nodejs';
export async function POST(request) {
  // The Photon adapter verifies the Spectrum HMAC signature + timestamp.
  return bot.webhooks.imessage(request,{waitUntil:(task)=>after(()=>task)});
}
