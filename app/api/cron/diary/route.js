import {bot} from '../../../../lib/bot.mjs';
import {scheduleToday,flushOutbox} from '../../../../lib/db.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request) {
  const secret=process.env.CRON_SECRET;
  if(!secret)return new Response('Scheduler not configured',{status:503});
  if(request.headers.get('authorization')!==`Bearer ${secret}`)return new Response('Unauthorized',{status:401});
  const started=await scheduleToday();
  const attempted=await flushOutbox(bot,120);
  return Response.json({started,attempted});
}
